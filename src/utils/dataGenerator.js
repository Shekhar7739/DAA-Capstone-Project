/** Deterministic PRNG so simulation results are repeatable. */
export function mulberry32(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Generate a simple undirected test graph with the requested edge density. */
export function generateRandomGraph(vertexCount, density, seed = 42) {
  const count = Math.max(2, Math.min(30, Math.floor(vertexCount)))
  const targetDensity = Math.max(0, Math.min(1, density))
  const random = mulberry32(seed)
  const vertices = Array.from({ length: count }, (_, index) => `V${index + 1}`)
  const adjacency = Object.fromEntries(vertices.map((vertex) => [vertex, []]))
  const edges = []
  const possible = (count * (count - 1)) / 2

  vertices.forEach((a, i) => {
    vertices.slice(i + 1).forEach((b) => {
      if (random() < targetDensity) {
        adjacency[a].push({ id: b, sharedCount: 1 })
        adjacency[b].push({ id: a, sharedCount: 1 })
        edges.push({ a, b, sharedCount: 1, key: `${a}::${b}` })
      }
    })
  })

  return {
    vertices,
    adjacency,
    edges,
    edgeCount: edges.length,
    density: possible ? (2 * edges.length) / (count * (count - 1)) : 0,
  }
}
