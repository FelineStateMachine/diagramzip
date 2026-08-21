import { readdir, readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const rendererPath = new URL('../../node_modules/@softwaretechnik/dbml-renderer/lib/renderer.js', import.meta.url)
const upstreamRenderer = await readFile(rendererPath, 'utf8')
const rendererPattern = /const render = \(input, format\) => \{[\s\S]*?\n\};/
if (!rendererPattern.test(upstreamRenderer)) {
  throw new Error('DBML renderer layout changed; review the Viz-free repack before rebuilding.')
}
const dotOnlyRenderer = upstreamRenderer.replace(rendererPattern, `const render = (input, format) => {
    if (format !== "dot") throw new Error("The edge DBML bundle only supports DOT lowering.");
    return dot(input);
};`)
const parserPath = new URL('../../node_modules/@softwaretechnik/dbml-renderer/lib/parser.js', import.meta.url)
const upstreamParser = await readFile(parserPath, 'utf8')
if (!upstreamParser.includes('console.debug(peggyErr);')) {
  throw new Error('DBML parser layout changed; review the debug suppression before rebuilding.')
}
const quietParser = upstreamParser.replace('            console.debug(peggyErr);\n', '')

await build({
  entryPoints: [new URL('../../toolchains/dbml/entry.ts', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  minify: true,
  outfile: new URL('../../artifacts/dbml/dbml-backend.js', import.meta.url).pathname,
  plugins: [{
    name: 'dbml-dot-only',
    setup(plugin) {
      plugin.onLoad({ filter: /[\\/]@softwaretechnik[\\/]dbml-renderer[\\/]lib[\\/]renderer\.js$/ }, () => ({
        contents: dotOnlyRenderer,
        loader: 'js',
      }))
      plugin.onLoad({ filter: /[\\/]@softwaretechnik[\\/]dbml-renderer[\\/]lib[\\/]parser\.js$/ }, () => ({
        contents: quietParser,
        loader: 'js',
      }))
    },
  }],
})

const { dbmlToDot } = await import(new URL(`../../artifacts/dbml/dbml-backend.js?build=${Date.now()}`, import.meta.url))
const examplesPath = new URL('../../node_modules/@softwaretechnik/dbml-renderer/examples/', import.meta.url)
const examples = (await readdir(examplesPath)).filter(filename => filename.endsWith('.dbml')).sort()
if (examples.length < 20) throw new Error('DBML upstream example corpus is incomplete.')
for (const filename of examples) {
  const source = await readFile(new URL(filename, examplesPath), 'utf8')
  const expectedDot = await readFile(new URL(`${filename}.dot`, examplesPath), 'utf8')
  if (dbmlToDot(source) !== expectedDot) {
    throw new Error(`DBML edge bundle differs from upstream expected DOT for ${filename}.`)
  }
}
