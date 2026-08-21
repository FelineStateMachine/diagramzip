import json

import pytest

from protocol import ProtocolError, parse_render_input


def test_parses_the_unit_contract():
    parsed = parse_render_input(json.dumps({
        "source": "blockdiag { A -> B; }",
        "format": "svg",
        "options": {"scale": 2, "safe": True},
        "metadata": {"title": "Example", "description": "Description"},
        "presentation": {"background": "#abcdef", "padding": 12, "frame": True},
    }))

    assert parsed.source.startswith("blockdiag")
    assert parsed.options == {"scale": "2", "safe": "true"}
    assert parsed.title == "Example"
    assert parsed.background == "#abcdef"
    assert parsed.padding == 12
    assert parsed.frame is True


def test_rejects_an_engine_selector():
    with pytest.raises(ProtocolError, match="must not select an engine"):
        parse_render_input(json.dumps({"engine": "rackdiag", "source": "rackdiag {}"}))


def test_rejects_invalid_presentation():
    with pytest.raises(ProtocolError, match="RGB hex color"):
        parse_render_input(json.dumps({"source": "blockdiag {}", "presentation": {"background": "white"}}))
