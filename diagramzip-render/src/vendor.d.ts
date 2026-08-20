declare module 'bytefield-svg' {
  const render: (source: string) => string
  export default render
}

declare module 'nomnoml' {
  export function renderSvg(source: string): string
}

declare module 'onml' {
  export function s(value: unknown): string
}

declare module 'wavedrom' {
  export function renderAny(index: number, source: unknown, skins: Record<string, unknown>): unknown
}

declare module 'wavedrom/skins/dark.js' { const skins: { dark: unknown }; export default skins }
declare module 'wavedrom/skins/default.js' { const skins: { default: unknown }; export default skins }
declare module 'wavedrom/skins/lowkey.js' { const skins: { lowkey: unknown }; export default skins }
declare module 'wavedrom/skins/narrow.js' { const skins: { narrow: unknown }; export default skins }
declare module 'wavedrom/skins/narrower.js' { const skins: { narrower: unknown }; export default skins }
declare module 'wavedrom/skins/narrowerer.js' { const skins: { narrowerer: unknown }; export default skins }

declare module '*.wasm' {
  const module: WebAssembly.Module
  export default module
}

declare module '*pikchr-backend.js' {
  const module: (moduleArg?: Record<string, unknown>) => Promise<any>
  export default module
}
