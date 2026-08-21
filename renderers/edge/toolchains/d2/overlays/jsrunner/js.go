//go:build js && wasm && d2_host_eval

package jsrunner

// D2 normally selects a syscall/js runner for Wasm and evaluates Dagre in the
// host global scope. Workers prohibit that dynamic evaluation. The build
// overlay excludes the host runner so Dagre executes in the Goja runtime.
