import json

import pytest

from protocol import ProtocolError, parse_render_input


def test_presentation_and_metadata_round_trip():
    result = parse_render_input(json.dumps({
        "source": "module m; endmodule",
        "metadata": {"title": "Title", "description": "Description"},
        "presentation": {"background": "#abcdef", "padding": 24, "frame": True},
    }))
    assert result.title == "Title"
    assert result.description == "Description"
    assert result.background == "#abcdef"
    assert result.padding == 24
    assert result.frame is True


@pytest.mark.parametrize("value", ["nan", "inf", "-inf", "0", "17"])
def test_scale_must_be_finite_and_bounded(value):
    with pytest.raises(ProtocolError, match="scale"):
        parse_render_input(json.dumps({"source": "module m; endmodule", "options": {"scale": value}}))
