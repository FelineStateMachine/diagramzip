//go:build !d2_host_eval

package jsrunner

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/dop251/goja"
)

type gojaRunner struct {
	vm *goja.Runtime
}

type gojaValue struct {
	val goja.Value
	vm  *goja.Runtime
}

func NewJSRunner() JSRunner {
	return &gojaRunner{vm: goja.New()}
}

func (g *gojaRunner) MustGet(key string) (JSValue, error) {
	return nil, nil
}

func (g *gojaRunner) Engine() Engine {
	return Goja
}

func (g *gojaRunner) RunString(code string) (JSValue, error) {
	val, err := g.vm.RunString(code)
	if err != nil {
		return nil, err
	}
	return &gojaValue{val: val, vm: g.vm}, nil
}

func (v *gojaValue) String() string {
	return v.val.String()
}

func (v *gojaValue) Export() interface{} {
	return v.val.Export()
}

func (g *gojaRunner) NewObject() JSObject {
	return &gojaValue{val: g.vm.NewObject(), vm: g.vm}
}

func (g *gojaRunner) Set(name string, value interface{}) error {
	if name == "console" {
		console, err := g.createConsole()
		if err != nil {
			return err
		}
		return g.vm.Set(name, console)
	}
	return g.vm.Set(name, value)
}

func (g *gojaRunner) WaitPromise(ctx context.Context, val JSValue) (interface{}, error) {
	gVal := val.(*gojaValue)
	promise := gVal.val.Export().(*goja.Promise)
	for promise.State() == goja.PromiseStatePending {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
	}
	if promise.State() == goja.PromiseStateRejected {
		return nil, errors.New("promise rejected")
	}
	return promise.Result().Export(), nil
}

func (g *gojaRunner) createConsole() (*goja.Object, error) {
	console := g.vm.NewObject()
	if err := console.Set("log", g.vm.ToValue(func(call goja.FunctionCall) goja.Value {
		args := make([]interface{}, len(call.Arguments))
		for i, arg := range call.Arguments {
			args[i] = arg.Export()
		}
		fmt.Println(args...)
		return nil
	})); err != nil {
		return nil, err
	}
	if err := console.Set("error", g.vm.ToValue(func(call goja.FunctionCall) goja.Value {
		args := make([]interface{}, len(call.Arguments))
		for i, arg := range call.Arguments {
			args[i] = arg.Export()
		}
		fmt.Fprintln(os.Stderr, args...)
		return nil
	})); err != nil {
		return nil, err
	}
	return console, nil
}
