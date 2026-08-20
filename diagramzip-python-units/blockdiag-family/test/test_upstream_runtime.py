import importlib.metadata
import sys
from pathlib import Path

import pytest


SRC = Path(__file__).parents[1] / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def test_registers_all_static_renderers_and_svg_without_entry_points(monkeypatch):
    """The vendored registry must not depend on installed distribution metadata."""

    monkeypatch.setattr(
        importlib.metadata,
        "entry_points",
        lambda *args, **kwargs: pytest.fail("entry-point discovery was used"),
    )

    from blockdiag import imagedraw, noderenderer
    import upstream_runtime

    noderenderer.renderers.clear()
    imagedraw.drawers.clear()
    upstream_runtime.register()

    assert "svg" in imagedraw.drawers
    for shape in (
        "actor",
        "beginpoint",
        "box",
        "circle",
        "cloud",
        "diamond",
        "dots",
        "ellipse",
        "endpoint",
        "flowchart.database",
        "flowchart.input",
        "flowchart.loopin",
        "flowchart.loopout",
        "flowchart.terminator",
        "mail",
        "minidiamond",
        "none",
        "note",
        "roundedbox",
        "square",
        "textbox",
        "_packet_node",
    ):
        assert noderenderer.get(shape) is not None, shape


def test_static_plugin_loader_allowlists_builtins_without_entry_points(monkeypatch):
    monkeypatch.setattr(
        importlib.metadata,
        "entry_points",
        lambda *args, **kwargs: pytest.fail("entry-point discovery was used"),
    )

    from blockdiag import plugins
    import upstream_runtime

    upstream_runtime.register()
    plugins.loaded_plugins.clear()
    plugins.node_handlers.clear()

    class DiagramNode:
        desctable = []
        attrname = {}

    class Diagram:
        _DiagramNode = DiagramNode

    plugins.load(["attributes"], diagram=Diagram())
    assert plugins.loaded_plugins == ["attributes"]
    assert plugins.node_handlers

    with pytest.raises(AttributeError, match="unknown plugin: third_party"):
        plugins.load(["third_party"], diagram=Diagram())
