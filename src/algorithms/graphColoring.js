import { detectConflicts } from '../utils/conflictDetection.js'

const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now())

/** Build the subject-conflict graph from student enrolments. */
export function buildConflictGraph(subjects, students) {
  return detectConflicts(subjects, students)
}

/**
 * Largest-degree-first ordering (ties broken alphabetically).
 * Colouring vertices with more constraints first prunes the search tree early.
 */
export function orderVertices(graph) {
  const vertices = graph.vertices || []
  return [...vertices].sort((a, b) => {
    const degreeA = (graph.adjacency?.[a] || []).length
    const degreeB = (graph.adjacency?.[b] || []).length
    if (degreeB !== degreeA) return degreeB - degreeA
    return String(a).localeCompare(String(b))
  })
}

/** True when no already-coloured neighbour uses `color`. */
export function isSafe(vertex, color, assignment, adjacency, indexOf) {
  const neighbours = adjacency?.[vertex] || []
  const positionOf = (id) => (indexOf instanceof Map ? indexOf.get(id) : indexOf?.[id])
  for (const neighbour of neighbours) {
    const neighbourPosition = positionOf(neighbour.id)
    if (neighbourPosition !== undefined && assignment[neighbourPosition] !== -1 && assignment[neighbourPosition] === color) {
      return false
    }
  }
  return true
}

/**
 * Exact backtracking search for a k-colouring.
 * Symmetry breaking: at each vertex only previously used colours plus one new
 * colour are tried, which preserves completeness while cutting duplicate work.
 */
export function graphColoring(graph, options = {}) {
  const vertices = graph.vertices || []
  const n = vertices.length
  const ordered = orderVertices(graph)
  const indexOf = new Map(ordered.map((vertex, index) => [vertex, index]))
  const maxColors = Math.max(1, options.maxColors ?? n)
  const nodeLimit = Math.max(1, options.nodeLimit ?? 250000)
  const timeLimitMs = options.timeLimitMs ?? 5000
  const startedAt = now()
  const deadline = startedAt + timeLimitMs

  if (n === 0) {
    return {
      success: true,
      assignment: {},
      colorsUsed: 0,
      nodesVisited: 0,
      backtracks: 0,
      conflictChecks: 0,
      executionMs: 0,
      limitExceeded: false,
      timedOut: false,
      maxColors,
    }
  }

  const colors = new Array(n).fill(-1)
  let nodesVisited = 0
  let backtracks = 0
  let conflictChecks = 0
  let limitExceeded = false
  let timedOut = false

  const usedColorCount = () => {
    let max = -1
    for (const color of colors) if (color > max) max = color
    return max + 1
  }

  function solve(position) {
    if (limitExceeded || timedOut) return false

    nodesVisited += 1
    if (nodesVisited > nodeLimit) {
      limitExceeded = true
      return false
    }
    if ((nodesVisited & 255) === 0 && now() > deadline) {
      timedOut = true
      return false
    }
    if (position === n) return true

    const vertex = ordered[position]
    const candidates = Math.min(usedColorCount() + 1, maxColors)

    for (let color = 0; color < candidates; color += 1) {
      conflictChecks += 1
      if (!isSafe(vertex, color, colors, graph.adjacency, indexOf)) continue

      colors[position] = color
      if (solve(position + 1)) return true
      colors[position] = -1
      backtracks += 1
      if (limitExceeded || timedOut) return false
    }
    return false
  }

  const success = solve(0)
  const assignment = {}
  if (success) {
    ordered.forEach((vertex, index) => {
      assignment[vertex] = colors[index]
    })
  }

  return {
    success,
    assignment,
    colorsUsed: success ? usedColorCount() : 0,
    nodesVisited,
    backtracks,
    conflictChecks,
    executionMs: now() - startedAt,
    limitExceeded,
    timedOut,
    maxColors,
    order: ordered,
  }
}

/**
 * Bounds for the optimal number of colours:
 * - lower bound from a greedily built clique (a clique needs distinct colours)
 * - upper bound from a greedy Welsh–Powell style colouring
 */
export function calculateMinimumColors(graph) {
  const vertices = graph.vertices || []
  if (!vertices.length) return { lowerBound: 0, upperBound: 0, clique: [], greedyAssignment: {} }

  const order = orderVertices(graph)
  const adjacency = graph.adjacency || {}
  const isAdjacent = (a, b) => (adjacency[a] || []).some((neighbour) => neighbour.id === b)

  const clique = []
  for (const vertex of order) {
    if (clique.every((member) => isAdjacent(member, vertex))) clique.push(vertex)
  }

  const greedyAssignment = {}
  for (const vertex of order) {
    const forbidden = new Set(
      (adjacency[vertex] || [])
        .map((neighbour) => greedyAssignment[neighbour.id])
        .filter((color) => color !== undefined),
    )
    let color = 0
    while (forbidden.has(color)) color += 1
    greedyAssignment[vertex] = color
  }

  return {
    lowerBound: Math.max(1, clique.length),
    upperBound: Math.max(...Object.values(greedyAssignment)) + 1,
    clique,
    greedyAssignment,
  }
}

/**
 * Tries k = lowerBound, lowerBound+1, ... until a valid colouring is found.
 * The first successful k is the minimum number of exam slots needed, unless a
 * search hit the configured node/time limit (then `optimal` is false).
 */
export function solveGraphColoring(graph, options = {}) {
  const vertices = graph.vertices || []
  const startedAt = now()
  const bounds = calculateMinimumColors(graph)
  const globalTimeLimit = options.timeLimitMs ?? 8000
  const nodeLimit = options.nodeLimit ?? 250000
  const maxColors = Math.min(options.maxColors ?? vertices.length, vertices.length)
  const ceiling = Math.min(maxColors, Math.max(bounds.upperBound, bounds.lowerBound))
  const trials = []

  if (!vertices.length) {
    return {
      success: true,
      assignment: {},
      colorsUsed: 0,
      attempts: 0,
      backtracks: 0,
      nodesVisited: 0,
      conflictChecks: 0,
      executionMs: now() - startedAt,
      lowerBound: 0,
      upperBound: 0,
      optimal: true,
      incompleteSearch: false,
      trials,
      order: [],
    }
  }

  let best = null
  let incompleteSearch = false

  for (let k = bounds.lowerBound; k <= ceiling; k += 1) {
    const remaining = globalTimeLimit - (now() - startedAt)
    if (remaining <= 0) {
      incompleteSearch = true
      break
    }

    const run = graphColoring(graph, {
      maxColors: k,
      nodeLimit,
      timeLimitMs: Math.max(1, remaining),
    })
    trials.push({
      k,
      success: run.success,
      nodesVisited: run.nodesVisited,
      backtracks: run.backtracks,
      executionMs: run.executionMs,
      limitExceeded: run.limitExceeded,
      timedOut: run.timedOut,
    })

    if (run.success) {
      best = run
      break
    }
    if (run.limitExceeded || run.timedOut) incompleteSearch = true
  }

  const total = (key) => trials.reduce((sum, trial) => sum + (trial[key] || 0), 0)
  return {
    success: !!best,
    assignment: best?.assignment || {},
    colorsUsed: best?.colorsUsed || 0,
    attempts: trials.length,
    backtracks: total('backtracks'),
    nodesVisited: total('nodesVisited'),
    conflictChecks: total('conflictChecks'),
    executionMs: now() - startedAt,
    lowerBound: bounds.lowerBound,
    upperBound: bounds.upperBound,
    optimal: !!best && !incompleteSearch,
    incompleteSearch,
    trials,
    order: best?.order || orderVertices(graph),
    greedyColors: bounds.upperBound,
  }
}

/** Independently verify that no edge connects two vertices of the same colour. */
export function validateColoring(graph, assignment = {}) {
  const violations = []
  for (const vertex of graph.vertices || []) {
    for (const neighbour of graph.adjacency?.[vertex] || []) {
      if (
        assignment[vertex] !== undefined &&
        assignment[neighbour.id] !== undefined &&
        assignment[vertex] === assignment[neighbour.id]
      ) {
        violations.push({ a: vertex, b: neighbour.id })
      }
    }
  }
  return { valid: violations.length === 0, violations }
}
