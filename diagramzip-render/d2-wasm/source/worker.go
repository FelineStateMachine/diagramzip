//go:build js && wasm

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"runtime/debug"
	"syscall/js"

	"oss.terrastruct.com/util-go/go2"

	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2lib"
	"oss.terrastruct.com/d2/d2renderers/d2animate"
	"oss.terrastruct.com/d2/d2renderers/d2svg"
	"oss.terrastruct.com/d2/lib/geo"
	"oss.terrastruct.com/d2/lib/label"
	d2log "oss.terrastruct.com/d2/lib/log"
	"oss.terrastruct.com/d2/lib/textmeasure"
)

func gridLayout(ctx context.Context, g *d2graph.Graph) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	for i, o := range g.Objects {
		if o == g.Root || o.Box == nil {
			continue
		}
		if o.HasLabel() && o.LabelPosition == nil {
			o.LabelPosition = go2.Pointer(label.InsideMiddleCenter.String())
		}
		if o.HasIcon() && o.IconPosition == nil {
			o.IconPosition = go2.Pointer(label.InsideMiddleCenter.String())
		}
		o.Box.TopLeft = geo.NewPoint(float64(i%4)*220, float64(i/4)*160)
	}
	for _, e := range g.Edges {
		if e.Src != nil && e.Dst != nil && e.Src.Box != nil && e.Dst.Box != nil {
			e.Route = []*geo.Point{e.Src.Box.Center(), e.Dst.Box.Center()}
			e.TraceToShape(e.Route, 0, len(e.Route)-1)
			if e.Label.Value != "" {
				e.LabelPosition = go2.Pointer(label.InsideMiddleCenter.String())
			}
		}
	}
	return nil
}

type response struct {
	SVG    string   `json:"svg"`
	Boards []string `json:"boards"`
}
type renderOptions struct { AnimateInterval int64 `json:"animateInterval"` }

func straightRouter(ctx context.Context, g *d2graph.Graph, edges []*d2graph.Edge) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	for _, e := range edges {
		if e.Src == nil || e.Dst == nil || e.Src.Box == nil || e.Dst.Box == nil {
			continue
		}
		e.Route = []*geo.Point{e.Src.Box.Center(), e.Dst.Box.Center()}
		e.TraceToShape(e.Route, 0, len(e.Route)-1)
		if e.Label.Value != "" {
			e.LabelPosition = go2.Pointer(label.InsideMiddleCenter.String())
		}
	}
	return nil
}

func render(this js.Value, args []js.Value) (result any) {
	defer func() {
		if recovered := recover(); recovered != nil {
			fmt.Printf("D2 renderer panic: %v\n%s\n", recovered, debug.Stack())
			result = js.ValueOf(fmt.Sprintf(`{"error":%q}`, fmt.Sprintf("D2 renderer panic: %v", recovered)))
		}
	}()
	if len(args) < 1 || len(args) > 2 {
		return js.ValueOf(`{"error":"expected source string"}`)
	}
	var inputOptions renderOptions
	if len(args) == 2 && args[1].String() != "" {
		if err := json.Unmarshal([]byte(args[1].String()), &inputOptions); err != nil { return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error())) }
	}
	ruler, err := textmeasure.NewRuler()
	if err != nil {
		return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
	}
	layout := "grid"
	pad := int64(100)
	ctx := d2log.WithDefault(context.Background())
	d, _, err := d2lib.Compile(ctx, args[0].String(), &d2lib.CompileOptions{
		Layout: &layout, Ruler: ruler,
		LayoutResolver: func(string) (d2graph.LayoutGraph, error) { return gridLayout, nil },
		RouterResolver: func(string) (d2graph.RouteEdges, error) { return straightRouter, nil },
	}, &d2svg.RenderOpts{Pad: &pad})
	if err != nil {
		return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
	}
	opts := &d2svg.RenderOpts{Pad: &pad}
	boards, err := d2svg.RenderMultiboard(d, opts)
	if err != nil {
		return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
	}
	base := boards[0]
	if inputOptions.AnimateInterval > 0 {
		base, err = d2animate.Wrap(d, boards, *opts, int(inputOptions.AnimateInterval))
		if err != nil { return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error())) }
		// The wrapper is itself the XML document; nested board declarations would
		// otherwise be rejected by the shared SVG sanitizer as extra roots.
		base = bytes.ReplaceAll(base, []byte(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`), nil)
		base = bytes.ReplaceAll(base, []byte(`<?xml version="1.0" encoding="utf-8"?>`), nil)
	}
	out := response{SVG: string(base)}
	for _, b := range boards {
		out.Boards = append(out.Boards, string(b))
	}
	b, _ := json.Marshal(out)
	return js.ValueOf(string(b))
}

func main() {
	js.Global().Set("d2CustomRender", js.FuncOf(render))
	select {}
}
