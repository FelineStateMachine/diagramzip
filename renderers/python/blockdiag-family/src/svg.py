import re
import xml.etree.ElementTree as ET

from defusedxml import ElementTree as SafeET

from protocol import ProtocolError, RenderInput


MAX_SVG_LENGTH = 4_194_304
SVG_NS = "http://www.w3.org/2000/svg"
XLINK_NS = "http://www.w3.org/1999/xlink"
BLOCKED_ELEMENTS = {"script", "iframe", "object", "embed", "audio", "video", "foreignobject"}
REFERENCE_ATTRIBUTES = {"href", f"{{{XLINK_NS}}}href", "src"}
STYLE_ATTRIBUTES = {"style", "filter", "fill", "stroke", "clip-path", "mask"}
SAFE_DATA_IMAGE = re.compile(r"^data:image/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$", re.IGNORECASE)
UNSAFE_CSS = re.compile(r"@import|expression\s*\(|javascript\s*:|data\s*:\s*text/html|behavior\s*:|-moz-binding", re.IGNORECASE)
CSS_URL = re.compile(r"url\s*\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE)
NUMBER = re.compile(r"^-?\d+(?:\.\d+)?(?:px)?$")

ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK_NS)


def _local_name(value: str) -> str:
    return value.rsplit("}", 1)[-1].lower()


def _unsafe_css(value: str) -> bool:
    if UNSAFE_CSS.search(value):
        return True
    for match in CSS_URL.finditer(value):
        reference = match.group(2).strip()
        if not reference.startswith("#") and not SAFE_DATA_IMAGE.fullmatch(reference):
            return True
    return "url(" in CSS_URL.sub("", value).lower().replace(" ", "")


def _safe_attribute(name: str, value: str) -> bool:
    local = _local_name(name)
    if local.startswith("on") or local == "base":
        return False
    if name in REFERENCE_ATTRIBUTES or local in {"href", "src"}:
        stripped = value.strip()
        return stripped.startswith("#") or SAFE_DATA_IMAGE.fullmatch(stripped) is not None
    if local in STYLE_ATTRIBUTES:
        return not _unsafe_css(value)
    return "javascript:" not in value.lower()


def _sanitize(parent: ET.Element) -> None:
    for name, value in list(parent.attrib.items()):
        if not _safe_attribute(name, value):
            del parent.attrib[name]
    for child in list(parent):
        if _local_name(child.tag) in BLOCKED_ELEMENTS:
            parent.remove(child)
        else:
            _sanitize(child)


def _number(value: str | None) -> float | None:
    if value is None or not NUMBER.fullmatch(value.strip()):
        return None
    parsed = float(value.removesuffix("px"))
    return parsed if parsed > 0 else None


def _bounds(root: ET.Element) -> tuple[float, float, float, float] | None:
    view_box = root.attrib.get("viewBox", "").replace(",", " ").split()
    if len(view_box) == 4:
        try:
            values = tuple(float(value) for value in view_box)
            if values[2] > 0 and values[3] > 0:
                return values
        except ValueError:
            pass
    width = _number(root.attrib.get("width"))
    height = _number(root.attrib.get("height"))
    return (0.0, 0.0, width, height) if width and height else None


def _format_number(value: float) -> str:
    return str(int(value)) if value.is_integer() else str(value)


def _white_fill(element: ET.Element) -> bool:
    fill = element.attrib.get("fill", "").replace(" ", "").lower()
    return fill in {"white", "#fff", "#ffffff", "rgb(255,255,255)"}


def _remove_backdrop(root: ET.Element, bounds: tuple[float, float, float, float]) -> None:
    x, y, width, height = bounds
    for child in list(root):
        if _local_name(child.tag) != "rect" or not _white_fill(child):
            continue
        try:
            child_x = float(child.attrib.get("x", "0"))
            child_y = float(child.attrib.get("y", "0"))
            child_width = float(child.attrib.get("width", "nan"))
            child_height = float(child.attrib.get("height", "nan"))
        except ValueError:
            continue
        if child_x <= x + 0.01 and child_y <= y + 0.01 and child_x + child_width >= x + width - 0.01 and child_y + child_height >= y + height - 0.01:
            root.remove(child)


def sanitize_and_decorate(source: str, request: RenderInput) -> str:
    if len(source) > MAX_SVG_LENGTH:
        raise ProtocolError(413, "render_too_large", "Rendered SVG is too large.")
    try:
        root = SafeET.fromstring(source)
    except Exception as error:
        raise ProtocolError(422, "invalid_svg", "Renderer returned invalid SVG.") from error
    if _local_name(root.tag) != "svg":
        raise ProtocolError(422, "invalid_svg", "Renderer returned invalid SVG.")
    _sanitize(root)

    bounds = _bounds(root)
    if (request.padding or request.background or request.frame) and bounds is None:
        raise ProtocolError(422, "missing_dimensions", "Renderer output has no usable SVG dimensions for presentation settings.")

    additions: list[ET.Element] = []
    if request.title:
        title = ET.Element(f"{{{SVG_NS}}}title")
        title.text = request.title
        additions.append(title)
    if request.description:
        description = ET.Element(f"{{{SVG_NS}}}desc")
        description.text = request.description
        additions.append(description)

    frame = None
    if bounds is not None:
        x, y, width, height = bounds
        padding = float(request.padding)
        next_bounds = (x - padding, y - padding, width + padding * 2, height + padding * 2)
        root.attrib["viewBox"] = " ".join(_format_number(value) for value in next_bounds)
        if "width" in root.attrib:
            root.attrib["width"] = _format_number(next_bounds[2])
        if "height" in root.attrib:
            root.attrib["height"] = _format_number(next_bounds[3])
        if request.background:
            _remove_backdrop(root, bounds)
            background = ET.Element(f"{{{SVG_NS}}}rect", {
                "x": _format_number(next_bounds[0]),
                "y": _format_number(next_bounds[1]),
                "width": _format_number(next_bounds[2]),
                "height": _format_number(next_bounds[3]),
                "fill": request.background,
            })
            additions.append(background)
            styles = [item.strip() for item in root.attrib.get("style", "").split(";") if item.strip() and not item.strip().lower().startswith(("background:", "background-color:"))]
            styles.append(f"background-color:{request.background}")
            root.attrib["style"] = ";".join(styles) + ";"
        if request.frame:
            frame = ET.Element(f"{{{SVG_NS}}}rect", {
                "x": _format_number(next_bounds[0] + 0.5),
                "y": _format_number(next_bounds[1] + 0.5),
                "width": _format_number(max(0.0, next_bounds[2] - 1)),
                "height": _format_number(max(0.0, next_bounds[3] - 1)),
                "fill": "none",
                "stroke": "#000000",
                "stroke-width": "1",
                "vector-effect": "non-scaling-stroke",
            })

    for index, element in enumerate(additions):
        root.insert(index, element)
    if frame is not None:
        root.append(frame)
    return ET.tostring(root, encoding="unicode", short_empty_elements=False)
