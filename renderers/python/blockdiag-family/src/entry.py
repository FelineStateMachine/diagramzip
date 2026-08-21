import hashlib
import json
from urllib.parse import quote, urlparse

from workers import Request, Response, WorkerEntrypoint

from protocol import MAX_REQUEST_BYTES, ProtocolError, parse_render_input
from render import MODULES, render_svg
from svg import sanitize_and_decorate


UNIT_ID = "blockdiag-family"
CACHE_SCHEMA = "1"
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


def _engine(request: Request) -> str:
    hostname = urlparse(request.url).hostname or ""
    return hostname.split(".", 1)[0].lower()


def _json_response(value, status=200, cache_control="no-store") -> Response:
    return Response(
        json.dumps(value, separators=(",", ":")),
        status=status,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": cache_control,
            "Content-Type": "application/json; charset=utf-8",
        },
    )


def _error(error: ProtocolError) -> Response:
    return _json_response({"error": {"code": error.code, "message": str(error)}}, status=error.status)


async def _bounded_body(request: Request) -> str:
    declared_length = request.headers.get("Content-Length")
    if declared_length is not None:
        try:
            parsed_length = int(declared_length)
        except ValueError as error:
            raise ProtocolError(400, "invalid_request", "Content-Length is invalid.") from error
        if parsed_length < 0:
            raise ProtocolError(400, "invalid_request", "Content-Length is invalid.")
        if parsed_length > MAX_REQUEST_BYTES:
            raise ProtocolError(413, "request_too_large", "Render request is too large.")

    body = request.body
    if body is None:
        raise ProtocolError(400, "invalid_request", "A JSON request body is required.")
    reader = body.getReader()
    chunks: list[bytes] = []
    length = 0
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
    try:
        return b"".join(chunks).decode("utf-8")
    except UnicodeDecodeError as error:
        raise ProtocolError(400, "invalid_json", "Render request is not valid UTF-8 JSON.") from error


def _cache_url(engine: str, build: str, render_input) -> str:
    canonical = json.dumps({
        "engine": engine,
        "source": render_input.source,
        "options": render_input.options,
        "metadata": {"title": render_input.title, "description": render_input.description},
        "presentation": {
            "background": render_input.background,
            "padding": render_input.padding,
            "frame": render_input.frame,
        },
    }, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return f"https://diagramzip-blockdiag-cache.invalid/{CACHE_SCHEMA}/{quote(engine)}/{quote(build)}/{digest}"


def _with_cache_status(response: Response, status: str) -> Response:
    from js import Response as JSResponse

    updated = JSResponse.new(response.body, response.js_object)
    updated.headers.set("X-Diagram-Cache", status)
    return Response(updated)


class Default(WorkerEntrypoint):
    async def fetch(self, request: Request):
        if request.method == "OPTIONS":
            return Response(
                None,
                status=204,
                headers={
                    "Access-Control-Allow-Headers": "Accept, Content-Type",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Max-Age": "86400",
                },
            )

        engine = _engine(request)
        if engine not in MODULES:
            return _json_response({"error": {"code": "not_found", "message": "This renderer unit does not serve the requested engine."}}, status=404)
        path = urlparse(request.url).path
        build = self.env.RENDERER_BUILD
        if request.method == "GET" and path == "/v1/health":
            return _json_response({"ok": True, "unit": UNIT_ID, "id": engine})
        if request.method == "GET" and path == "/v1/capabilities":
            return _json_response({
                "unit": UNIT_ID,
                "id": engine,
                "kind": "render",
                "format": "svg",
                "runtime": "edge-python",
                "version": MODULES[engine].__version__,
                "build": build,
                "pipeline": [UNIT_ID],
                "knownLosses": [
                    "Remote and filesystem-backed images are rejected.",
                    "Only SVG output is supported.",
                ],
            }, cache_control="public, max-age=300")
        if request.method != "POST" or path != "/v1/svg":
            return _json_response({"error": {"code": "not_found", "message": "Route not found."}}, status=404)
        if not (request.headers.get("Content-Type") or "").lower().startswith("application/json"):
            return _error(ProtocolError(415, "unsupported_media_type", "Render requests must use application/json."))

        try:
            render_input = parse_render_input(await _bounded_body(request))
            cache_key = None
            try:
                from js import Request as JSRequest, caches

                cache_key = JSRequest.new(_cache_url(engine, build, render_input))
                cached = await caches.default.match(cache_key)
                if cached is not None:
                    return _with_cache_status(Response(cached), "HIT")
            except Exception as error:
                print(json.dumps({"message": "BlockDiag cache read failed", "unit": UNIT_ID, "engine": engine, "error": str(error)}))

            raw_svg, engine_version = render_svg(engine, render_input.source, render_input.options)
            svg = sanitize_and_decorate(raw_svg, render_input)
        except ProtocolError as error:
            return _error(error)
        except Exception as error:
            print(json.dumps({"message": "BlockDiag renderer failed", "unit": UNIT_ID, "engine": engine, "error": str(error)}))
            return _json_response({"error": {"code": "render_failed", "message": "The diagram source could not be rendered."}}, status=422)

        response = Response(
            svg,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": EXPOSED_HEADERS,
                "Cache-Control": "public, max-age=1800",
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "Content-Type": "image/svg+xml; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                "X-Diagram-Cache": "MISS",
                "X-Diagram-Engine": engine,
                "X-Diagram-Engine-Version": engine_version,
                "X-Diagram-Pipeline": UNIT_ID,
                "X-Diagram-Renderer": "edge-python",
                "X-Diagram-Unit": UNIT_ID,
                "X-Renderer-Build": build,
            },
        )
        if cache_key is not None:
            try:
                from js import caches
                from pyodide.ffi import create_proxy

                self.ctx.waitUntil(create_proxy(caches.default.put(cache_key, response.js_object.clone())))
            except Exception as error:
                print(json.dumps({"message": "BlockDiag cache write failed", "unit": UNIT_ID, "engine": engine, "error": str(error)}))
        return response
