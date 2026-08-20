import yaml
import re

from wireviz.wireviz import parse

WIREVIZ_VERSION = '0.3.2'
MAX_NODES = 20_000
MAX_DEPTH = 32
MAX_RANGE = 4_096
MAX_COMPONENT_SIZE = 4_096


def _preflight(value, depth=0, seen=None, count=None):
    seen = set() if seen is None else seen
    count = [0] if count is None else count
    if depth > MAX_DEPTH:
        raise ValueError('WireViz YAML nesting is too deep')
    count[0] += 1
    if count[0] > MAX_NODES:
        raise ValueError('WireViz YAML document is too complex')
    if isinstance(value, (dict, list)):
        identity = id(value)
        if identity in seen:
            raise ValueError('recursive YAML aliases are not supported')
        seen.add(identity)
        values = value.values() if isinstance(value, dict) else value
        for item in values:
            _preflight(item, depth + 1, seen, count)
        seen.remove(identity)


def _expanded_connection_size(value):
    if isinstance(value, dict):
        return sum(_expanded_connection_size(item) for item in value.values())
    if isinstance(value, list):
        return sum(_expanded_connection_size(item) for item in value)
    if isinstance(value, str):
        match = re.fullmatch(r'\s*(\d+)\s*-\s*(\d+)\s*', value)
        if match:
            size = abs(int(match[2]) - int(match[1])) + 1
            if size > MAX_RANGE:
                raise ValueError('WireViz numeric ranges are too large')
            return size
    return 1


def _bounded_component_size(attributes, section, name):
    if not isinstance(attributes, dict):
        raise ValueError(f"WireViz {section} '{name}' must be a mapping")
    count_fields = ('pincount', 'pins', 'pinlabels', 'pincolors') if section == 'connector' else ('wirecount', 'colors', 'wirelabels')
    for field in count_fields:
        value = attributes.get(field)
        size = len(value) if isinstance(value, list) else value if field.endswith('count') else None
        if size is not None and (not isinstance(size, int) or isinstance(size, bool) or not 0 <= size <= MAX_COMPONENT_SIZE):
            raise ValueError(f"WireViz {section} '{name}' {field} is too large")


def render_dot(source: str) -> str:
    """Run the upstream WireViz parser/model, stopping before GraphViz."""
    document = yaml.safe_load(source)
    if not isinstance(document, dict):
        raise ValueError('WireViz document must be a mapping')
    _preflight(document)
    connectors = document.get('connectors') or {}
    cables = document.get('cables') or {}
    connections = document.get('connections') or []
    if not isinstance(connectors, dict) or not isinstance(cables, dict) or not isinstance(connections, list):
        raise ValueError('WireViz connectors and cables must be mappings and connections must be a list')
    if len(connectors) > 1024 or len(cables) > 1024:
        raise ValueError('WireViz has too many connectors or cables')
    if len(connections) > 4096 or _expanded_connection_size(connections) > MAX_NODES:
        raise ValueError('WireViz has too many connection sets')
    for name, attributes in connectors.items():
        _bounded_component_size(attributes, 'connector', name)
    for name, attributes in cables.items():
        _bounded_component_size(attributes, 'cable', name)
    if document.get('tweak'):
        raise ValueError('WireViz tweak directives are not supported by the edge translator')
    for section, values in (('connectors', connectors), ('cables', cables)):
        if isinstance(values, dict) and any(isinstance(value, dict) and value.get('image') for value in values.values()):
            raise ValueError('WireViz images are not supported by the edge translator')
    harness = parse(source, return_types='harness')
    if harness is None:
        raise ValueError('WireViz source did not produce a harness')
    return harness.create_graph().source
