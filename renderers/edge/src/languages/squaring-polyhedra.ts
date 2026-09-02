// Skeletons of common convex polyhedra as edge lists. Every one is a
// polyhedral (3-connected planar) graph, so any edge can serve as the battery.

export interface PolyhedronPreset {
  vertices: string[]
  edges: Array<[string, string]>
}

function cycleEdges(names: string[]): Array<[string, string]> {
  return names.map((name, index) => [name, names[(index + 1) % names.length] ?? name])
}

function fromFaces(faces: string[][]): PolyhedronPreset {
  const vertices: string[] = []
  const seen = new Set<string>()
  const edges: Array<[string, string]> = []
  for (const face of faces) {
    for (const vertex of face) {
      if (!vertices.includes(vertex)) vertices.push(vertex)
    }
    for (const [a, b] of cycleEdges(face)) {
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push([a, b])
    }
  }
  return { vertices, edges }
}

function ring(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`)
}

function prism(count: number): PolyhedronPreset {
  const top = ring('a', count)
  const bottom = ring('b', count)
  return {
    vertices: [...top, ...bottom],
    edges: [...cycleEdges(top), ...cycleEdges(bottom), ...top.map((name, index) => [name, bottom[index] ?? name] as [string, string])],
  }
}

function antiprism(count: number): PolyhedronPreset {
  const top = ring('a', count)
  const bottom = ring('b', count)
  const band = top.flatMap((name, index) => [[name, bottom[index] ?? name], [name, bottom[(index + 1) % count] ?? name]] as Array<[string, string]>)
  return { vertices: [...top, ...bottom], edges: [...cycleEdges(top), ...cycleEdges(bottom), ...band] }
}

function pyramid(count: number): PolyhedronPreset {
  const base = ring('b', count)
  return { vertices: ['apex', ...base], edges: [...cycleEdges(base), ...base.map(name => ['apex', name] as [string, string])] }
}

const DODECAHEDRON_FACES = [
  [0, 1, 2, 3, 4], [0, 5, 10, 6, 1], [1, 6, 11, 7, 2], [2, 7, 12, 8, 3], [3, 8, 13, 9, 4], [4, 9, 14, 5, 0],
  [15, 10, 5, 14, 19], [16, 11, 6, 10, 15], [17, 12, 7, 11, 16], [18, 13, 8, 12, 17], [19, 14, 9, 13, 18], [15, 16, 17, 18, 19],
].map(face => face.map(index => `v${index}`))

function icosahedron(): PolyhedronPreset {
  const upper = ring('u', 5)
  const lower = ring('l', 5)
  const band = upper.flatMap((name, index) => [[name, lower[index] ?? name], [name, lower[(index + 1) % 5] ?? name]] as Array<[string, string]>)
  return {
    vertices: ['top', ...upper, ...lower, 'bottom'],
    edges: [
      ...upper.map(name => ['top', name] as [string, string]),
      ...cycleEdges(upper),
      ...band,
      ...cycleEdges(lower),
      ...lower.map(name => ['bottom', name] as [string, string]),
    ],
  }
}

export const POLYHEDRA: Record<string, () => PolyhedronPreset> = {
  tetrahedron: () => fromFaces([['a', 'b', 'c'], ['a', 'c', 'd'], ['a', 'd', 'b'], ['b', 'd', 'c']]),
  cube: () => prism(4),
  octahedron: () => fromFaces([
    ['top', 'a', 'b'], ['top', 'b', 'c'], ['top', 'c', 'd'], ['top', 'd', 'a'],
    ['bottom', 'b', 'a'], ['bottom', 'c', 'b'], ['bottom', 'd', 'c'], ['bottom', 'a', 'd'],
  ]),
  dodecahedron: () => fromFaces(DODECAHEDRON_FACES),
  icosahedron,
  'triangular-prism': () => prism(3),
  'pentagonal-prism': () => prism(5),
  'hexagonal-prism': () => prism(6),
  'square-pyramid': () => pyramid(4),
  'pentagonal-pyramid': () => pyramid(5),
  'square-antiprism': () => antiprism(4),
  'tetragonal-antiwedge': () => fromFaces([['a', 'b', 'c', 'd'], ['a', 'd', 'e', 'f'], ['a', 'f', 'b'], ['b', 'f', 'e'], ['b', 'e', 'c'], ['c', 'e', 'd']]),
}

export const POLYHEDRON_NAMES = Object.keys(POLYHEDRA)
