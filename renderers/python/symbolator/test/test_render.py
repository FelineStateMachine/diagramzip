import re

import pytest

import render
from protocol import ProtocolError, parse_render_input
from render import parse_components, render_svg


VERILOG = """module demo_device #(
parameter SIZE = 8
) (
//# {{clocks|Clocking}}
input wire clock,
//# {{control|Control signals}}
input wire reset,
input wire enable,
//# {{data|Data ports}}
input wire [SIZE-1:0] data_in,
output wire [SIZE-1:0] data_out
); endmodule"""


VHDL = """entity demo is
generic (
  SIZE : positive
);
port (
  clock : in std_logic;
  data_in : in std_logic_vector(7 downto 0);
  data_out : out std_logic_vector(7 downto 0)
);
end entity demo;"""


def test_verilog_ports_groups_and_svg():
    components = parse_components(VERILOG)
    assert components[-1].name == "demo_device"
    assert [port.name for port in components[-1].ports] == ["clock", "reset", "enable", "data_in", "data_out"]
    svg, version = render_svg(VERILOG, {"title": "", "scale": "1.5"})
    assert version.startswith("1.2.2")
    assert 'class="fnt1"' in svg
    assert "data_in" in svg and "Clocking" in svg
    assert "stroke-width=\"3\"" in svg
    assert 'x1="-35"' in svg
    # Inputs terminate at the component's left edge; outputs start at its
    # right edge. Avoid tying this to font metrics or a particular scale.
    assert 'x1="-35"' in svg and 'x2="0"' in svg
    assert re.search(r'<line x1="[\d.]+"[^>]+x2="[\d.]+"', svg)


def test_direction_bubbles_and_presentation_are_applied():
    source = """module m(
input wire reset_n,
output wire done
); endmodule"""
    svg, _ = render_svg(
        source,
        {"title": "", "library-name": "lib"},
        title_text="Hardware",
        description="A component",
        presentation_background="#112233",
        presentation_padding=24,
        presentation_frame=True,
    )
    assert 'cx="-35"' in svg
    assert 'fill="#112233"' in svg
    assert "Hardware" in svg and "A component" in svg
    assert "stroke=\"#000\"" in svg
    assert re.search(r'viewBox="-7[45] -59 ', svg)


def test_compact_ansi_header_keeps_both_directions():
    components = parse_components("module m(input wire reset_n, output wire done); endmodule")
    assert [(port.name, port.direction) for port in components[-1].ports] == [
        ("reset_n", "in"),
        ("done", "out"),
    ]


def test_protocol_rejects_unknown_and_invalid_options():
    def parse(options):
        import json
        return parse_render_input(json.dumps({"source": "module m; endmodule", "options": options}))

    with pytest.raises(ProtocolError, match="Unknown renderer option"):
        parse({"bogus": "1"})
    with pytest.raises(ProtocolError, match="finite"):
        parse({"scale": "nan"})
    with pytest.raises(ProtocolError, match="finite"):
        parse({"scale": "inf"})
    with pytest.raises(ProtocolError, match="requires"):
        parse({"library-name": "lib"})


def test_render_size_is_bounded(monkeypatch):
    monkeypatch.setattr(render, "MAX_SVG_LENGTH", 100)
    with pytest.raises(ProtocolError, match="too large"):
        render_svg("module m(input wire clock); endmodule")


def test_vhdl_generics_and_bus_types():
    components = parse_components(VHDL)
    assert components[-1].generics[0].name == "SIZE"
    svg, _ = render_svg(VHDL, {"no-type": "true", "transparent": "true"})
    assert "data_out" in svg
    assert "fill=\"white\"" not in svg


def test_component_filter_and_missing_component():
    svg, _ = render_svg(VERILOG, {"component": "demo_device"})
    assert "demo_device" not in svg or "data_out" in svg
    try:
        render_svg(VERILOG, {"component": "missing"})
    except Exception as error:
        assert "not found" in str(error)
