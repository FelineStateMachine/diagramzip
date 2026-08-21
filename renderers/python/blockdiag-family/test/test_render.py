from pathlib import Path

import pytest

from protocol import ProtocolError, RenderInput
from render import FONT_PATH, render_svg
from svg import sanitize_and_decorate


FIXTURES = Path(__file__).parents[4] / "examples" / "diagrams"
ENGINE_FIXTURES = {
    "blockdiag": "kroki.diag",
    "seqdiag": "sequence.diag",
    "actdiag": "actions.diag",
    "nwdiag": "network.diag",
    "packetdiag": "packet.diag",
    "rackdiag": "rack.diag",
}


@pytest.mark.parametrize(("engine", "filename"), ENGINE_FIXTURES.items())
def test_renders_each_family_member_without_a_process(engine, filename):
    source = (FIXTURES / filename).read_text()
    svg, version = render_svg(engine, source)

    assert "<svg " in svg
    assert "viewBox" in svg
    assert len(svg) > 500
    assert version


def test_sanitizes_and_applies_presentation():
    source = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><script>alert(1)</script><a href="https://example.com"><text>safe</text></a></svg>'
    request = RenderInput("source", {}, "Title", "Description", "#abcdef", 5, True)
    svg = sanitize_and_decorate(source, request)

    assert "<script" not in svg
    assert "https://example.com" not in svg
    assert 'viewBox="-5 -5 30 20"' in svg
    assert "Title" in svg
    assert "#abcdef" in svg


def test_uses_bundled_font_and_preserves_upstream_size_option():
    assert FONT_PATH.is_file()
    svg, _ = render_svg("blockdiag", "blockdiag { A -> B; }", {"size": "320x240"})

    assert 'width="320"' in svg
    assert 'height="240"' in svg
    assert "viewBox=" in svg


def test_preserves_upstream_svg_doctype_option():
    source = "blockdiag { A -> B; }"
    default_svg, _ = render_svg("blockdiag", source)
    no_doctype_svg, _ = render_svg("blockdiag", source, {"no-doctype": "true"})

    assert "<!DOCTYPE svg" in default_svg
    assert "<!DOCTYPE svg" not in no_doctype_svg


def test_png_only_options_do_not_change_svg_output():
    source = "blockdiag { A -> B; }"
    default_svg, _ = render_svg("blockdiag", source)
    antialias_svg, _ = render_svg("blockdiag", source, {"antialias": "true"})
    transparent_svg, _ = render_svg("blockdiag", source, {"no-transparency": "true"})

    assert antialias_svg == default_svg
    assert transparent_svg == default_svg


@pytest.mark.parametrize("value", ["320", "320x", "-1x20", "20x20x20"])
def test_rejects_invalid_size_option(value):
    with pytest.raises(ProtocolError, match="WIDTHxHEIGHT"):
        render_svg("blockdiag", "blockdiag { A -> B; }", {"size": value})


def test_rejects_remote_and_filesystem_images():
    with pytest.raises(ProtocolError, match="diagram images are not supported"):
        render_svg("blockdiag", 'blockdiag { A [background = "https://example.com/image.png"]; }')


def test_builtin_autoclass_plugin_is_statically_registered():
    svg, _ = render_svg("blockdiag", """blockdiag {
      plugin autoclass;
      class emphasis [style = dashed, color = red];
      A_emphasis -> B_emphasis;
    }""")

    assert "A" in svg
    assert "B" in svg
    assert "dasharray" in svg
