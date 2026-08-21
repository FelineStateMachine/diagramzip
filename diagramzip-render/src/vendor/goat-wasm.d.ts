export interface GoatWasmExports {
  memory: WebAssembly.Memory
  _initialize(): void
  beginRender(): void
  alloc(size: number): number
  render(source: number, sourceLength: number, utf8: number, light: number, lightLength: number, dark: number, darkLength: number): number
  outputLen(): number
}
