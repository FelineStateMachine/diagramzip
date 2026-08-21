//go:build !js || !wasm

package main

import (
	"context"
	"fmt"
	"os"

	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2lib"
	"oss.terrastruct.com/d2/d2renderers/d2svg"
	"oss.terrastruct.com/d2/lib/geo"
	"oss.terrastruct.com/d2/lib/textmeasure"
)

func gridLayout(ctx context.Context, g *d2graph.Graph) error {
	if err := ctx.Err(); err != nil { return err }
	const cols = 4
	const gap = 80.0
	for i, o := range g.Objects {
		if o == g.Root || o.Box == nil { continue }
		o.Box.TopLeft = geo.NewPoint(float64(i%cols)*220, float64(i/cols)*160)
	}
	for _, e := range g.Edges {
		if e.Src != nil && e.Dst != nil && e.Src.Box != nil && e.Dst.Box != nil {
			e.Route = []*geo.Point{e.Src.Box.Center(), e.Dst.Box.Center()}
		}
	}
	return nil
}

func main() {
	input := "x -> y\nsteps: {\n  1: {\n    x -> z\n  }\n}"
	layout := "grid"
	pad := int64(50)
	ruler, err := textmeasure.NewRuler()
	if err != nil { panic(err) }
	d, graph, err := d2lib.Compile(context.Background(), input, &d2lib.CompileOptions{
		Layout: &layout,
		Ruler: ruler,
		LayoutResolver: func(engine string) (d2graph.LayoutGraph, error) {
			if engine != "grid" { return nil, fmt.Errorf("unexpected layout %q", engine) }
			return gridLayout, nil
		},
		RouterResolver: func(engine string) (d2graph.RouteEdges, error) {
			return func(ctx context.Context, g *d2graph.Graph, edges []*d2graph.Edge) error {
				for _, e := range edges {
					if e.Src == nil || e.Dst == nil || e.Src.Box == nil || e.Dst.Box == nil { continue }
					e.Route = []*geo.Point{e.Src.Box.Center(), e.Dst.Box.Center()}
				}
				return nil
			}, nil
		},
	}, &d2svg.RenderOpts{Pad: &pad})
	if err != nil { panic(err) }
	fmt.Printf("shapes=%d connections=%d\n", len(d.Shapes), len(d.Connections))
	for _, o := range graph.Objects { fmt.Printf("obj=%s box=%v\n", o.ID, o.Box) }
	for _, c := range d.Connections { fmt.Printf("route=%d src=%s dst=%s\n", len(c.Route), c.Src, c.Dst) }
	if err := os.WriteFile("/tmp/d2-custom.svg", func() []byte { b, e := d2svg.Render(d, &d2svg.RenderOpts{Pad: &pad}); if e != nil { panic(e) }; return b }(), 0644); err != nil { panic(err) }
	fmt.Printf("layers=%d scenarios=%d steps=%d\n", len(d.Layers), len(d.Scenarios), len(d.Steps))
}
