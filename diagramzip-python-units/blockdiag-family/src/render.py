import re
from pathlib import Path
from types import ModuleType

import actdiag
import actdiag.builder
import actdiag.drawer
import actdiag.parser
import blockdiag
import blockdiag.builder
import blockdiag.drawer
import blockdiag.elements
import blockdiag.parser
import nwdiag
import nwdiag.builder
import nwdiag.drawer
import nwdiag.parser
import packetdiag
import packetdiag.builder
import packetdiag.drawer
import packetdiag.parser
import rackdiag
import rackdiag.builder
import rackdiag.drawer
import rackdiag.parser
import seqdiag
import seqdiag.builder
import seqdiag.drawer
import seqdiag.parser
from blockdiag import plugins
from blockdiag.utils import images
from blockdiag.utils.fontmap import FontMap

from protocol import ProtocolError
from upstream_runtime import register


MODULES: dict[str, ModuleType] = {
    "blockdiag": blockdiag,
    "seqdiag": seqdiag,
    "actdiag": actdiag,
    "nwdiag": nwdiag,
    "packetdiag": packetdiag,
    "rackdiag": rackdiag,
}

SIZE = re.compile(r"^(\d+)x(\d+)$")
FONT_PATH = Path(__file__).parent / "assets" / "DejaVuSerif.ttf"


def _deny_external_image(source, mode="Pillow"):
    if isinstance(source, (str, bytes)):
        raise OSError("External and filesystem images are not supported.")
    return _ORIGINAL_IMAGE_OPEN(source, mode)


def _deny_image_attribute(_node, _value):
    raise ProtocolError(422, "unsupported_resource", "Remote and filesystem-backed diagram images are not supported.")


_ORIGINAL_IMAGE_OPEN = images.open
images.open = _deny_external_image
blockdiag.elements.DiagramNode.set_icon = _deny_image_attribute
blockdiag.elements.DiagramNode.set_background = _deny_image_attribute
register()


def _output_size(options: dict[str, str]) -> list[int] | None:
    value = options.get("size")
    if value is None:
        return None
    matched = SIZE.fullmatch(value)
    if matched is None:
        raise ProtocolError(400, "invalid_options", "options.size must use WIDTHxHEIGHT decimal notation.")
    return [int(dimension) for dimension in matched.groups()]


def _fontmap() -> FontMap:
    if not FONT_PATH.is_file():
        raise RuntimeError("The bundled DejaVu Serif font is missing.")
    fontmap = FontMap()
    fontmap.set_default_font(str(FONT_PATH))
    return fontmap


def render_svg(engine: str, source: str, options: dict[str, str] | None = None) -> tuple[str, str]:
    module = MODULES[engine]
    options = options or {}
    try:
        tree = module.parser.parse_string(source)
        if engine == "blockdiag":
            diagram = module.builder.ScreenNodeBuilder.build(tree, None)
        else:
            diagram = module.builder.ScreenNodeBuilder.build(tree)
        drawer = module.drawer.DiagramDraw(
            "SVG",
            diagram,
            None,
            fontmap=_fontmap(),
            code=source,
            antialias="antialias" in options,
            nodoctype="no-doctype" in options,
            transparency=True,
        )
        drawer.draw()
        svg = drawer.save(size=_output_size(options))
        if not isinstance(svg, str):
            raise RuntimeError("The renderer did not return SVG text.")
        return svg, module.__version__
    finally:
        images.cleanup()
        plugins.cleanup()
