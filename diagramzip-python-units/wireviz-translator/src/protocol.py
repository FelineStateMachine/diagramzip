import json
import re
from dataclasses import dataclass
from typing import Any

MAX_REQUEST_BYTES = 1_048_576
MAX_SOURCE_LENGTH = 524_288
MAX_OPTION_COUNT = 64
OPTION_NAME = re.compile(r'^[a-z0-9][a-z0-9_-]{0,63}$', re.IGNORECASE)


class ProtocolError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status, self.code = status, code


@dataclass(frozen=True)
class RenderInput:
    source: str
    options: dict
    title: str
    description: str
    background: str
    padding: int
    frame: bool


def _object(value: Any, name: str) -> dict:
    if not isinstance(value, dict):
        raise ProtocolError(400, 'invalid_request', f'{name} must be an object.')
    return value


def _string(value: Any, name: str, maximum: int) -> str:
    if not isinstance(value, str):
        raise ProtocolError(400, 'invalid_request', f'{name} must be a string.')
    if len(value) > maximum:
        raise ProtocolError(413, 'request_too_large', f'{name} is too large.')
    return value


def parse_render_input(body: str) -> RenderInput:
    if len(body.encode()) > MAX_REQUEST_BYTES:
        raise ProtocolError(413, 'request_too_large', 'Render request is too large.')
    try:
        request = _object(json.loads(body), 'request')
    except (json.JSONDecodeError, UnicodeError) as error:
        raise ProtocolError(400, 'invalid_json', 'Render request is not valid JSON.') from error
    if 'engine' in request:
        raise ProtocolError(400, 'invalid_request', 'Renderer unit requests must not select an engine.')
    if request.get('format', 'svg') != 'svg':
        raise ProtocolError(400, 'unsupported_format', 'The rendering plane currently supports SVG only.')
    source = _string(request.get('source'), 'source', MAX_SOURCE_LENGTH)
    if not source.strip():
        raise ProtocolError(400, 'empty_source', 'Diagram source cannot be empty.')
    raw_options = _object(request.get('options', {}), 'options')
    if len(raw_options) > MAX_OPTION_COUNT:
        raise ProtocolError(400, 'invalid_options', f'options cannot contain more than {MAX_OPTION_COUNT} entries.')
    options = {}
    for name, value in raw_options.items():
        if not isinstance(name, str) or not OPTION_NAME.fullmatch(name):
            raise ProtocolError(400, 'invalid_options', f'Invalid renderer option: {name}.')
        if not isinstance(value, (str, int, float, bool)) or isinstance(value, (dict, list)):
            raise ProtocolError(400, 'invalid_options', f'Renderer option {name} must be a string, number, or boolean.')
        normalized = str(value).lower() if isinstance(value, bool) else str(value)
        if len(normalized) > 4_096:
            raise ProtocolError(400, 'invalid_options', f'Renderer option {name} is too large.')
        options[name.lower()] = normalized
    metadata = _object(request.get('metadata', {}), 'metadata')
    title = _string(metadata.get('title', ''), 'metadata.title', 200)
    description = _string(metadata.get('description', ''), 'metadata.description', 2_000)
    presentation = _object(request.get('presentation', {}), 'presentation')
    background = _string(presentation.get('background', ''), 'presentation.background', 7)
    if background and not (len(background) == 7 and background[0] == '#' and all(c in '0123456789abcdefABCDEF' for c in background[1:])):
        raise ProtocolError(400, 'invalid_presentation', 'presentation.background must be an RGB hex color.')
    padding = presentation.get('padding', 0)
    frame = presentation.get('frame', False)
    if not isinstance(padding, int) or isinstance(padding, bool) or not 0 <= padding <= 256:
        raise ProtocolError(400, 'invalid_presentation', 'presentation.padding must be an integer from 0 to 256.')
    if not isinstance(frame, bool):
        raise ProtocolError(400, 'invalid_presentation', 'presentation.frame must be a boolean.')
    return RenderInput(source, options, title, description, background, padding, frame)
