declare module './plantuml.js' {
  export function renderToString(
    lines: string[],
    onSuccess: (svg: string) => void,
    onError: (message: string) => void,
    options?: Record<string, unknown>,
  ): void
}

declare module './viz-global.cjs' {
  const viz: { instance: () => Promise<unknown> }
  export default viz
}
