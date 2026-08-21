package main

import (
	"bytes"
	"strings"
	"unsafe"

	"github.com/blampe/goat/ascii"
	"github.com/blampe/goat/svg"
	"github.com/blampe/goat/utf8"
)

var output []byte
var retainedInputs [][]byte

// beginRender releases input buffers from the previous request while keeping
// the current request alive until render returns. The host calls this before
// each sequence of alloc calls.
//go:export beginRender
func beginRender() {
	retainedInputs = retainedInputs[:0]
}

// alloc reserves a buffer for a UTF-8 source string.
//go:export alloc
func alloc(size uint32) uint32 {
	buf := make([]byte, size)
	retainedInputs = append(retainedInputs, buf)
	if len(buf) == 0 {
		return 0
	}
	return uint32(uintptr(unsafe.Pointer(&buf[0])))
}

// render converts the source at sourcePtr into SVG. The color strings are
// passed separately so the Worker can validate them before entering Wasm.
//go:export render
func render(sourcePtr, sourceLen, utf8Flag, lightPtr, lightLen, darkPtr, darkLen uint32) uint32 {
	source := string(unsafe.Slice((*byte)(unsafe.Pointer(uintptr(sourcePtr))), sourceLen))
	light := string(unsafe.Slice((*byte)(unsafe.Pointer(uintptr(lightPtr))), lightLen))
	dark := string(unsafe.Slice((*byte)(unsafe.Pointer(uintptr(darkPtr))), darkLen))

	var config svg.Config
	var canvas svg.AbstractCanvas
	if utf8Flag != 0 {
		config, _ = svg.NewConfig(utf8.ReservedSet, svg.MarkBindingMap{})
		canvas = utf8.NewCanvas(&config, strings.NewReader(source))
	} else {
		config, _ = svg.NewConfig(ascii.ReservedSet, svg.MarkBindingMap{})
		canvas = ascii.NewCanvas(&config, strings.NewReader(source))
	}

	var rendered bytes.Buffer
	svg.WriteCanvas(&config, canvas, true, svg.ColorsOnlyCssFileContent(light, dark), nil, &rendered)
	output = append(output[:0], rendered.Bytes()...)
	if len(output) == 0 {
		return 0
	}
	return uint32(uintptr(unsafe.Pointer(&output[0])))
}

// outputLen returns the byte length of the most recent render result.
//go:export outputLen
func outputLen() uint32 { return uint32(len(output)) }

func main() {}
