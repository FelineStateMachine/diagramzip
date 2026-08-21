"""Tiny DOT builder implementing the subset used by WireViz.

WireViz imports the Python graphviz package only to construct DOT. The real
layout process is deliberately left to the shared GraphViz-Wasm renderer.
"""
import re

def _quote(value):
    value = str(value)
    return value if value.startswith('<') and value.endswith('>') else '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'

def _attrs(attributes):
    return ' '.join(f'{key}={_quote(value)}' for key, value in attributes.items())

def _endpoint(value):
    """Quote only the node portion of `node:port:compass` endpoints."""
    match = re.match(r'^(.*?)(?=:[^:]+(?::[a-z]+)?$)', str(value), re.IGNORECASE)
    if not match:
        return value if re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', str(value)) else _quote(value)
    node, suffix = str(value)[:match.end()], str(value)[match.end():]
    return (node if re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', node) else _quote(node)) + suffix

class Graph:
    def __init__(self, name='G', **_kwargs):
        self.name = name
        self.body = []
        self._graph = {}
        self._node = {}
        self._edge = {}

    def attr(self, kw=None, _attributes=None, **attrs):
        target = kw or 'graph'
        values = dict(_attributes or {})
        values.update(attrs)
        if target == 'graph': self._graph.update(values)
        elif target == 'node': self._node.update(values)
        elif target == 'edge': self._edge.update(values)

    def node(self, name, label=None, **attrs):
        values = dict(attrs)
        if label is not None: values['label'] = label
        self.body.append(f'{_quote(name)} [{_attrs(values)}]')

    def edge(self, tail, head, **attrs):
        values = dict(self._edge)
        values.update(attrs)
        self.body.append(f'{_endpoint(tail)} -- {_endpoint(head)}' + (f' [{_attrs(values)}]' if values else ''))

    @property
    def source(self):
        lines = ['graph {']
        if self._graph: lines.append(f'\tgraph [{_attrs(self._graph)}]')
        if self._node: lines.append(f'\tnode [{_attrs(self._node)}]')
        if self._edge: lines.append(f'\tedge [{_attrs(self._edge)}]')
        lines.extend(f'\t{entry}' for entry in self.body)
        lines.append('}')
        return '\n'.join(lines)
