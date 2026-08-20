from graphviz import Graph


def test_edge_endpoint_quotes_designators_but_preserves_ports():
    graph = Graph()
    graph.edge('Connector A:p1r:e', 'Cable 1:w1:w')
    assert '"Connector A":p1r:e -- "Cable 1":w1:w' in graph.source
