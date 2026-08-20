"""Static runtime registration for the vendored BlockDiag family.

The upstream distributions discover drawers, node renderers, and plugins via
``importlib.metadata`` entry points.  The Python Worker bundles source files,
not distribution metadata, so relying on that discovery makes the renderer
work locally and fail in the Worker.  This module is the small, explicit
replacement for that packaging convention.

Only the SVG drawer, the built-in node renderers, and the three built-in
plugins shipped by this family are installed here.  No third-party plugin
code is loaded.
"""

from __future__ import annotations

from importlib import import_module
from types import ModuleType
from typing import Iterable

from blockdiag import plugins


# Keep this list explicit.  It is also the audit list for the upstream
# blockdiag_noderenderer entry points; adding a renderer requires a deliberate
# source and compatibility review rather than importing arbitrary packages.
_NODE_RENDERER_MODULES = (
    "blockdiag.noderenderer.actor",
    "blockdiag.noderenderer.beginpoint",
    "blockdiag.noderenderer.box",
    "blockdiag.noderenderer.circle",
    "blockdiag.noderenderer.cloud",
    "blockdiag.noderenderer.diamond",
    "blockdiag.noderenderer.dots",
    "blockdiag.noderenderer.ellipse",
    "blockdiag.noderenderer.endpoint",
    "blockdiag.noderenderer.flowchart.database",
    "blockdiag.noderenderer.flowchart.input",
    "blockdiag.noderenderer.flowchart.loopin",
    "blockdiag.noderenderer.flowchart.loopout",
    "blockdiag.noderenderer.flowchart.terminator",
    "blockdiag.noderenderer.mail",
    "blockdiag.noderenderer.minidiamond",
    "blockdiag.noderenderer.none",
    "blockdiag.noderenderer.note",
    "blockdiag.noderenderer.roundedbox",
    "blockdiag.noderenderer.square",
    "blockdiag.noderenderer.textbox",
    "packetdiag.noderenderers",
)

_PLUGIN_MODULES = {
    "attributes": "blockdiag.plugins.attributes",
    "autoclass": "blockdiag.plugins.autoclass",
    "autolane": "actdiag.plugins.autolane",
}

def _load_static_plugins(names: Iterable[str], diagram, **kwargs) -> None:
    """Load only the allowlisted built-in plugins.

    This has the same public contract as ``blockdiag.plugins.load`` while
    deliberately omitting entry-point discovery.  The upstream plugin module
    is still responsible for installing its handlers into the shared plugin
    registry.
    """

    for name in names:
        if name in plugins.loaded_plugins:
            # Match upstream behavior: a repeated plugin request is ignored.
            return

        module_name = _PLUGIN_MODULES.get(name)
        if module_name is None:
            raise AttributeError("unknown plugin: %s" % name)

        module = import_module(module_name)
        plugins.loaded_plugins.append(name)
        if hasattr(module, "setup"):
            module.setup(module, diagram, **kwargs)


def _install_module_setup(module_name: str) -> ModuleType:
    module = import_module(module_name)
    setup = getattr(module, "setup", None)
    if setup is None:
        raise RuntimeError("vendored runtime module has no setup(): %s" % module_name)
    setup(module)
    return module


def register() -> None:
    """Install the vendored SVG drawer, renderers, and plugin loader.

    Registration is process-wide because the vendored upstream APIs expose
    process-wide registries.  The operation is idempotent, making it safe for
    the Worker entrypoint and tests to call more than once.
    """

    # ``SVGImageDraw.setup`` calls blockdiag.imagedraw.install_imagedrawer.
    _install_module_setup("blockdiag.imagedraw.svg")

    for module_name in _NODE_RENDERER_MODULES:
        _install_module_setup(module_name)

    # Replace the upstream metadata-backed loader before any diagram can
    # process a ``plugin`` statement.
    plugins.load = _load_static_plugins


# A descriptive alias for callers that prefer an imperative name.
install = register


__all__ = ["install", "register"]
