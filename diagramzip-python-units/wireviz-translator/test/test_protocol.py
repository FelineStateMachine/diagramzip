import json

import pytest

from protocol import ProtocolError, parse_render_input


def _request(**updates):
    value = {'source': 'connectors: {}'}
    value.update(updates)
    return json.dumps(value)


def test_protocol_normalizes_bounded_scalar_options():
    parsed = parse_render_input(_request(options={'FLAG': True, 'count': 2}))
    assert parsed.options == {'flag': 'true', 'count': '2'}


def test_protocol_rejects_nested_or_unbounded_options():
    with pytest.raises(ProtocolError, match='must be a string, number, or boolean'):
        parse_render_input(_request(options={'bad': {'nested': True}}))
    with pytest.raises(ProtocolError, match='more than 64'):
        parse_render_input(_request(options={f'k{index}': index for index in range(65)}))
