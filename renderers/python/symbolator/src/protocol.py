import json
import math
import re
from dataclasses import dataclass
from typing import Any

MAX_REQUEST_BYTES = 1_048_576
MAX_SOURCE_LENGTH = 524_288
MAX_OPTION_COUNT = 64
OPTION_NAME = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$", re.IGNORECASE)
BACKGROUND = re.compile(r"^#[0-9a-f]{6}$", re.IGNORECASE)
KNOWN_OPTIONS = {"component", "transparent", "title", "scale", "no-type", "library-name"}


class ProtocolError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code


@dataclass(frozen=True)
class RenderInput:
    source: str
    options: dict[str, str]
    title: str
    description: str
    background: str
    padding: int
    frame: bool


def _object(value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ProtocolError(400, "invalid_request", f"{name} must be an object.")
    return value


def _string(value: Any, name: str, maximum: int) -> str:
    if not isinstance(value, str):
        raise ProtocolError(400, "invalid_request", f"{name} must be a string.")
    if len(value) > maximum:
        raise ProtocolError(413, "request_too_large", f"{name} is too large.")
    return value


def parse_render_input(body: str) -> RenderInput:
    if len(body.encode("utf-8")) > MAX_REQUEST_BYTES:
        raise ProtocolError(413, "request_too_large", "Render request is too large.")
    try:
        value = _object(json.loads(body), "request")
    except ProtocolError:
        raise
    except (json.JSONDecodeError, UnicodeError) as error:
        raise ProtocolError(400, "invalid_json", "Render request is not valid JSON.") from error
    if "engine" in value:
        raise ProtocolError(400, "invalid_request", "Renderer unit requests must not select an engine.")
    if value.get("format", "svg") != "svg":
        raise ProtocolError(400, "unsupported_format", "The rendering plane currently supports SVG only.")
    source = _string(value.get("source"), "source", MAX_SOURCE_LENGTH)
    if not source.strip():
        raise ProtocolError(400, "empty_source", "Diagram source cannot be empty.")
    raw_options = _object(value.get("options", {}), "options")
    if len(raw_options) > MAX_OPTION_COUNT:
        raise ProtocolError(400, "invalid_options", "Too many renderer options.")
    options: dict[str, str] = {}
    for name, option in raw_options.items():
        if not isinstance(name, str) or not OPTION_NAME.fullmatch(name):
            raise ProtocolError(400, "invalid_options", f"Invalid renderer option: {name}.")
        if name.lower() not in KNOWN_OPTIONS:
            raise ProtocolError(400, "invalid_options", f"Unknown renderer option: {name}.")
        if not isinstance(option, (str, int, float, bool)) or isinstance(option, (dict, list)):
            raise ProtocolError(400, "invalid_options", f"Renderer option {name} must be scalar.")
        normalized = str(option).lower() if isinstance(option, bool) else str(option)
        if len(normalized) > 4096:
            raise ProtocolError(400, "invalid_options", f"Renderer option {name} is too large.")
        options[name.lower()] = normalized
    if "scale" in options:
        try:
            scale = float(options["scale"])
        except ValueError as error:
            raise ProtocolError(400, "invalid_options", "options.scale must be numeric.") from error
        if not math.isfinite(scale) or not 0 < scale <= 16:
            raise ProtocolError(400, "invalid_options", "options.scale must be finite and between 0 and 16.")
    if "library-name" in options and "title" not in options:
        raise ProtocolError(400, "invalid_options", "options.library-name requires the title option.")
    metadata = _object(value.get("metadata", {}), "metadata")
    title = _string(metadata.get("title", ""), "metadata.title", 200)
    description = _string(metadata.get("description", ""), "metadata.description", 2000)
    presentation = _object(value.get("presentation", {}), "presentation")
    background = _string(presentation.get("background", ""), "presentation.background", 7)
    if background and not BACKGROUND.fullmatch(background):
        raise ProtocolError(400, "invalid_presentation", "presentation.background must be an RGB hex color.")
    padding = presentation.get("padding", 0)
    frame = presentation.get("frame", False)
    if not isinstance(padding, int) or isinstance(padding, bool) or not 0 <= padding <= 256:
        raise ProtocolError(400, "invalid_presentation", "presentation.padding must be an integer from 0 to 256.")
    if not isinstance(frame, bool):
        raise ProtocolError(400, "invalid_presentation", "presentation.frame must be a boolean.")
    return RenderInput(source, options, title, description, background, padding, frame)
