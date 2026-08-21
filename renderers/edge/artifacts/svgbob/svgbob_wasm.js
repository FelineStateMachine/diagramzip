/* @ts-self-types="./svgbob_wasm.d.ts" */
import wasmModule from "./svgbob_wasm_bg.wasm";
import * as wasmImports from "./svgbob_wasm_bg.js";
import { __wbg_set_wasm } from "./svgbob_wasm_bg.js";

const wasm = new WebAssembly.Instance(wasmModule, { "./svgbob_wasm_bg.js": wasmImports }).exports;
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    render
} from "./svgbob_wasm_bg.js";
