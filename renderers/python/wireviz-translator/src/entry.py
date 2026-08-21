import json
import hashlib
from urllib.parse import urlparse

from workers import Request, Response, WorkerEntrypoint

from protocol import MAX_REQUEST_BYTES, ProtocolError, parse_render_input
from render import WIREVIZ_VERSION, render_dot

UNIT_ID = 'wireviz'
EXPOSED_HEADERS = ', '.join([
    'Cache-Control', 'Content-Type', 'X-Diagram-Cache', 'X-Diagram-Engine',
    'X-Diagram-Engine-Version', 'X-Diagram-Pipeline', 'X-Diagram-Renderer',
    'X-Diagram-Unit', 'X-Renderer-Build',
])


def _json(value, status=200, cache='no-store'):
    return Response(json.dumps(value, separators=(',', ':')), status=status, headers={
        'Access-Control-Allow-Origin': '*', 'Cache-Control': cache,
        'Content-Type': 'application/json; charset=utf-8',
    })


def _error(error):
    return _json({'error': {'code': error.code, 'message': str(error)}}, error.status)


def _cache_url(build, render_input):
    canonical = json.dumps({
        'source': render_input.source, 'options': render_input.options,
        'metadata': [render_input.title, render_input.description],
        'presentation': [render_input.background, render_input.padding, render_input.frame],
    }, sort_keys=True, separators=(',', ':'))
    digest = hashlib.sha256(canonical.encode()).hexdigest()
    return f'https://diagramzip-wireviz-cache.invalid/1/{build}/{digest}'


def _cache_status(response, status):
    from js import Response as JSResponse
    updated = JSResponse.new(response.body, response.js_object)
    updated.headers.set('X-Diagram-Cache', status)
    return Response(updated)


async def _body(request):
    declared = request.headers.get('Content-Length')
    if declared is not None:
        try:
            length = int(declared)
        except ValueError as error:
            raise ProtocolError(400, 'invalid_request', 'Content-Length is invalid.') from error
        if length < 0:
            raise ProtocolError(400, 'invalid_request', 'Content-Length is invalid.')
        if length > MAX_REQUEST_BYTES:
            raise ProtocolError(413, 'request_too_large', 'Render request is too large.')
    if request.body is None:
        raise ProtocolError(400, 'invalid_request', 'A JSON request body is required.')
    reader = request.body.getReader()
    chunks, length = [], 0
    while True:
        result = await reader.read()
        if result.done:
            break
        chunk = result.value.to_bytes()
        length += len(chunk)
        if length > MAX_REQUEST_BYTES:
            await reader.cancel('request too large')
            raise ProtocolError(413, 'request_too_large', 'Render request is too large.')
        chunks.append(chunk)
    try:
        return b''.join(chunks).decode('utf-8')
    except UnicodeDecodeError as error:
        raise ProtocolError(400, 'invalid_json', 'Render request is not valid UTF-8 JSON.') from error


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        if request.method == 'OPTIONS':
            return Response(None, status=204, headers={
                'Access-Control-Allow-Headers': 'Accept, Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Max-Age': '86400',
            })
        path = urlparse(request.url).path
        if request.method == 'GET' and path == '/v1/health':
            return _json({'ok': True, 'unit': UNIT_ID, 'id': UNIT_ID})
        if request.method == 'GET' and path == '/v1/capabilities':
            return _json({
                'unit': UNIT_ID, 'id': UNIT_ID, 'kind': 'translate', 'format': 'svg',
                'runtime': 'edge-python', 'version': WIREVIZ_VERSION,
                'build': self.env.RENDERER_BUILD, 'pipeline': [UNIT_ID, 'graphviz-family', 'graphviz'],
                'license': 'GPL-3.0-only',
                'source': 'https://github.com/FelineStateMachine/diagramzip/tree/main/renderers/python/wireviz-translator',
                'knownLosses': [
                    'Only SVG is supported; BOM and HTML sidecars are not exposed.',
                    'Filesystem and remote images are rejected.',
                    'tweak.append and tweak.override are rejected.',
                    'GraphViz layout is provided by the shared GraphViz-Wasm unit; its 15.1.1 output may differ from the compatibility image GraphViz 14.1.3.',
                ],
            }, cache='public, max-age=300')
        if request.method != 'POST' or path != '/v1/svg':
            return _json({'error': {'code': 'not_found', 'message': 'Route not found.'}}, 404)
        try:
            render_input = parse_render_input(await _body(request))
            from js import Request as JSRequest, caches
            from pyodide.ffi import create_proxy

            cache_key = JSRequest.new(_cache_url(self.env.RENDERER_BUILD, render_input))
            try:
                cached = await caches.default.match(cache_key)
                if cached is not None:
                    return _cache_status(Response(cached), 'HIT')
            except Exception as error:
                print(json.dumps({'message': 'WireViz cache read failed', 'unit': UNIT_ID, 'error': str(error)}))

            dot = render_dot(render_input.source)
            downstream = Request('https://graphviz.render.diagram.zip/v1/svg', method='POST', headers={
                'Accept': 'image/svg+xml', 'Content-Type': 'application/json',
            }, body=json.dumps({
                'source': dot, 'format': 'svg', 'options': {},
                'metadata': {'title': render_input.title, 'description': render_input.description},
                'presentation': {
                    'background': render_input.background, 'padding': render_input.padding,
                    'frame': render_input.frame,
                },
            })).js_object
            try:
                rendered = await self.env.GRAPHVIZ.fetch(downstream)
            except Exception as error:
                print(json.dumps({'message': 'WireViz GraphViz binding failed', 'unit': UNIT_ID, 'error': str(error)}))
                raise ProtocolError(503, 'renderer_unavailable', 'The GraphViz renderer is unavailable.') from error
            if rendered.status < 300:
                headers = {
                    'Cache-Control': rendered.headers.get('Cache-Control') or 'public, max-age=1800',
                    'Content-Type': 'image/svg+xml; charset=utf-8',
                    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                    'X-Content-Type-Options': 'nosniff',
                    'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': EXPOSED_HEADERS,
                    'X-Diagram-Engine': UNIT_ID, 'X-Diagram-Engine-Version': WIREVIZ_VERSION,
                    'X-Diagram-Pipeline': 'wireviz,graphviz-family,graphviz', 'X-Diagram-Renderer': 'edge-python',
                    'X-Diagram-Unit': UNIT_ID, 'X-Renderer-Build': self.env.RENDERER_BUILD,
                    'X-Diagram-Cache': 'MISS',
                }
                response = Response(rendered.body, status=rendered.status, headers=headers)
                try:
                    self.ctx.waitUntil(create_proxy(caches.default.put(cache_key, response.js_object.clone())))
                except Exception as error:
                    print(json.dumps({'message': 'WireViz cache write failed', 'unit': UNIT_ID, 'error': str(error)}))
                return response
            return Response(rendered.body, status=rendered.status, headers={
                'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store',
                'Content-Type': rendered.headers.get('Content-Type') or 'application/json',
            })
        except ProtocolError as error:
            return _error(error)
        except Exception as error:
            print(json.dumps({'message': 'WireViz translator failed', 'unit': UNIT_ID, 'error': str(error)}))
            return _json({'error': {'code': 'render_failed', 'message': 'The WireViz source could not be rendered.'}}, 422)
