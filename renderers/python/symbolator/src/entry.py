from __future__ import annotations

import json
from urllib.parse import urlparse

from workers import Request, Response, WorkerEntrypoint

from protocol import MAX_REQUEST_BYTES, ProtocolError, parse_render_input
from render import render_svg


UNIT_ID = "symbolator"
EXPOSED_HEADERS = ", ".join([
    "Cache-Control",
    "Content-Type",
    "X-Diagram-Cache",
    "X-Diagram-Engine",
    "X-Diagram-Engine-Version",
    "X-Diagram-Pipeline",
    "X-Diagram-Renderer",
    "X-Diagram-Unit",
    "X-Renderer-Build",
])


def _json(value, status=200, cache_control="no-store") -> Response:
    return Response(json.dumps(value, separators=(",", ":")), status=status, headers={
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": cache_control,
        "Content-Type": "application/json; charset=utf-8",
    })


def _error(error: ProtocolError) -> Response:
    return _json({"error": {"code": error.code, "message": str(error)}}, status=error.status)


async def _bounded_text(request: Request) -> str:
    declared = request.headers.get("Content-Length")
    if declared is not None:
        try:
            length = int(declared)
        except ValueError as error:
            raise ProtocolError(400, "invalid_request", "Content-Length is invalid.") from error
        if length < 0:
            raise ProtocolError(400, "invalid_request", "Content-Length is invalid.")
        if length > MAX_REQUEST_BYTES:
            raise ProtocolError(413, "request_too_large", "Render request is too large.")
    if request.body is None:
        raise ProtocolError(400, "invalid_request", "A JSON request body is required.")
    reader = request.body.getReader()
    chunks: list[bytes] = []
    length = 0
    try:
        while True:
            result = await reader.read()
            if result.done:
                break
            chunk = result.value.to_bytes()
            length += len(chunk)
            if length > MAX_REQUEST_BYTES:
                await reader.cancel("request too large")
                raise ProtocolError(413, "request_too_large", "Render request is too large.")
            chunks.append(chunk)
    finally:
        # A complete stream only needs its reader lock released. If an error
        # occurred before cancellation, best-effort cancellation avoids keeping
        # a request body live after the response.
        try:
            reader.releaseLock()
        except Exception:
            pass
    try:
        return b"".join(chunks).decode("utf-8")
    except UnicodeDecodeError as error:
        raise ProtocolError(400, "invalid_request", "Request body must be UTF-8 JSON.") from error


class Default(WorkerEntrypoint):
    async def fetch(self, request: Request):
        path = urlparse(request.url).path
        if request.method == "OPTIONS":
            return Response(None, status=204, headers={
                "Access-Control-Allow-Headers": "Accept, Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Max-Age": "86400",
            })
        if request.method == "GET" and path == "/v1/health":
            return _json({"ok": True, "unit": UNIT_ID, "id": UNIT_ID})
        if request.method == "GET" and path == "/v1/capabilities":
            return _json({
                "unit": UNIT_ID,
                "id": UNIT_ID,
                "kind": "render",
                "format": "svg",
                "runtime": "edge-python",
                "version": "1.2.2-compatible-translation",
                "build": self.env.RENDERER_BUILD,
                "pipeline": [UNIT_ID],
                "knownLosses": [
                    "Native Pango font metrics and shaping are replaced by browser-font SVG estimates.",
                    "One request contains one HDL source; filesystem library scanning and persisted type caches are unavailable.",
                    "Only SVG output is supported.",
                ],
            }, cache_control="public, max-age=300")
        if request.method != "POST" or path != "/v1/svg":
            return _json({"error": {"code": "not_found", "message": "Route not found."}}, status=404)
        if not (request.headers.get("Content-Type") or "").lower().startswith("application/json"):
            return _error(ProtocolError(415, "unsupported_media_type", "Render requests must use application/json."))
        try:
            request_input = parse_render_input(await _bounded_text(request))
            svg, version = render_svg(
                request_input.source,
                request_input.options,
                title_text=request_input.title,
                description=request_input.description,
                presentation_background=request_input.background,
                presentation_padding=request_input.padding,
                presentation_frame=request_input.frame,
            )
        except ProtocolError as error:
            return _error(error)
        except Exception as error:
            print(json.dumps({"message": "Symbolator renderer failed", "unit": UNIT_ID, "error": str(error)}))
            return _json({"error": {"code": "render_failed", "message": "The HDL source could not be rendered."}}, status=422)
        return Response(svg, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": EXPOSED_HEADERS,
            "Cache-Control": "public, max-age=1800",
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            "Content-Type": "image/svg+xml; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
            "X-Diagram-Cache": "MISS",
            "X-Diagram-Engine": UNIT_ID,
            "X-Diagram-Engine-Version": version,
            "X-Diagram-Pipeline": UNIT_ID,
            "X-Diagram-Renderer": "edge-python",
            "X-Diagram-Unit": UNIT_ID,
            "X-Renderer-Build": self.env.RENDERER_BUILD,
        })
