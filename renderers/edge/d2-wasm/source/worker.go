//go:build js && wasm

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"runtime/debug"
	"syscall/js"

	"oss.terrastruct.com/d2/d2graph"
	"oss.terrastruct.com/d2/d2layouts/d2dagrelayout"
	"oss.terrastruct.com/d2/d2lib"
	"oss.terrastruct.com/d2/d2renderers/d2animate"
	"oss.terrastruct.com/d2/d2renderers/d2svg"
	d2log "oss.terrastruct.com/d2/lib/log"
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

type response struct {
	SVG    string   `json:"svg"`
	Boards []string `json:"boards"`
}
type renderOptions struct {
	AnimateInterval int64 `json:"animateInterval"`
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
		if err := json.Unmarshal([]byte(args[1].String()), &inputOptions); err != nil {
			return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
		}
	}
	ruler, err := textmeasure.NewRuler()
	if err != nil {
		return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
	}
	layout := "dagre"
	pad := int64(100)
	ctx := d2log.WithDefault(context.Background())
	d, _, err := d2lib.Compile(ctx, args[0].String(), &d2lib.CompileOptions{
		Layout:         &layout,
		Ruler:          ruler,
		LayoutResolver: dagreLayoutResolver,
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
		if err != nil {
			return js.ValueOf(fmt.Sprintf(`{"error":%q}`, err.Error()))
		}
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
