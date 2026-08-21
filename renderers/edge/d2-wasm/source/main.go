//go:build !js || !wasm

package main

import (
	"context"
	"fmt"
	"os"

	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2layouts/d2dagrelayout"
	"oss.terrastruct.com/d2/d2lib"
	"oss.terrastruct.com/d2/d2renderers/d2svg"
	"oss.terrastruct.com/d2/lib/textmeasure"
)

func dagreLayoutResolver(engine string) (d2graph.LayoutGraph, error) {
	if engine != "dagre" {
		return nil, fmt.Errorf("unexpected layout %q", engine)
	}
	return func(ctx context.Context, graph *d2graph.Graph) error {
		return d2dagrelayout.Layout(ctx, graph, nil)
	}, nil
}

func main() {
	input := "x -> y\nsteps: {\n  1: {\n    x -> z\n  }\n}"
	layout := "dagre"
	pad := int64(50)
	ruler, err := textmeasure.NewRuler()
	if err != nil {
		panic(err)
	}
	d, graph, err := d2lib.Compile(context.Background(), input, &d2lib.CompileOptions{
		Layout:         &layout,
		Ruler:          ruler,
		LayoutResolver: dagreLayoutResolver,
	}, &d2svg.RenderOpts{Pad: &pad})
	if err != nil {
		panic(err)
	}
	fmt.Printf("shapes=%d connections=%d\n", len(d.Shapes), len(d.Connections))
	for _, o := range graph.Objects {
		fmt.Printf("obj=%s box=%v\n", o.ID, o.Box)
	}
	for _, c := range d.Connections {
		fmt.Printf("route=%d src=%s dst=%s\n", len(c.Route), c.Src, c.Dst)
	}
	if err := os.WriteFile("/tmp/d2-custom.svg", func() []byte {
		b, e := d2svg.Render(d, &d2svg.RenderOpts{Pad: &pad})
		if e != nil {
			panic(e)
		}
		return b
	}(), 0644); err != nil {
		panic(err)
	}
	fmt.Printf("layers=%d scenarios=%d steps=%d\n", len(d.Layers), len(d.Scenarios), len(d.Steps))
}
