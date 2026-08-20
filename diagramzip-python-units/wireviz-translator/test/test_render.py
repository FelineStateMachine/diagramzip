from pathlib import Path

import pytest

from render import render_dot


FIXTURE = Path(__file__).parents[3] / 'ci/tests/diagrams/wireviz.yaml'


def test_upstream_fixture_lowers_to_graphviz_dot():
    dot = render_dot(FIXTURE.read_text())
    assert dot.startswith('graph {')
    assert 'X1' in dot and 'X2' in dot and 'W1' in dot
    assert 'port="w1"' in dot
    assert 'port="p1r"' in dot
    assert '#00ff00' in dot


def test_images_are_rejected_before_upstream_graph_generation():
    with pytest.raises(ValueError, match='images'):
        render_dot('connectors:\n  X:\n    pincount: 1\n    image:\n      src: /etc/passwd\n')


def test_raw_tweaks_are_rejected():
    with pytest.raises(ValueError, match='tweak'):
        render_dot('tweak:\n  append: "evil [image=/etc/passwd]"\nconnectors: {}\n')


def test_large_ranges_are_rejected():
    with pytest.raises(ValueError, match='ranges'):
        render_dot('connectors:\n  X:\n    pincount: 1\ncables:\n  C:\n    wirecount: 1\nconnections:\n  - [X: 1-999999, C: 1]\n')


def test_yaml_templates_remain_supported_within_complexity_bounds():
    dot = render_dot('''
templates:
  - &connector
    type: Shared connector
    pincount: 1
connectors:
  X1: {<<: *connector}
  X2: {<<: *connector}
cables:
  W: {wirecount: 1}
connections:
  - [X1: 1, W: 1, X2: 1]
''')
    assert 'Shared connector' in dot


def test_recursive_aliases_and_oversized_component_counts_are_rejected():
    with pytest.raises(ValueError, match='recursive'):
        render_dot('connectors: &loop\n  X: *loop\n')
    with pytest.raises(ValueError, match='too large'):
        render_dot('connectors:\n  X:\n    pincount: 99999999\n')


def test_designators_with_spaces_remain_valid_dot_endpoints():
    dot = render_dot('''
connectors:
  Connector A:
    pincount: 1
cables:
  Cable 1:
    wirecount: 1
connections:
  -
    - Connector A: 1
    - Cable 1: 1
''')
    assert '"Connector A":p1r:e -- "Cable 1":w1:w' in dot
