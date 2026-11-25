import assert from 'node:assert/strict'
import { createSampleData, DEFAULT_SETTINGS } from '../src/data/sampleData.js'
import { buildConflictGraph, solveGraphColoring, validateColoring } from '../src/algorithms/graphColoring.js'
import { generateExamDates, generateTimetable } from '../src/utils/timetableGenerator.js'
import { generateRandomGraph } from '../src/utils/dataGenerator.js'

const { subjects, students } = createSampleData()
assert.equal(subjects.length, 10, 'sample subjects')
assert.equal(students.length, 20, 'sample students')

const graph = buildConflictGraph(subjects, students)
assert.ok(graph.edgeCount > 10, 'meaningful conflicts detected')
assert.equal(graph.vertices.length, subjects.length)

const solution = solveGraphColoring(graph, { maxColors: 8 })
assert.equal(solution.success, true, 'graph coloring succeeded')
assert.equal(validateColoring(graph, solution.assignment).valid, true, 'coloring valid')
assert.ok(solution.colorsUsed >= solution.lowerBound, 'colors respect lower bound')

const dates = generateExamDates('2026-12-01', 5)
assert.equal(dates.length, 5)
assert.deepEqual(generateExamDates('invalid', 5), [])

const generated = generateTimetable(subjects, students, DEFAULT_SETTINGS, { startDate: '2026-12-01', sessions: DEFAULT_SETTINGS.sessions })
assert.equal(generated.success, true, generated.error)
const scheduleMap = new Map(generated.timetable.entries.map((entry) => [entry.subjectId, `${entry.date}|${entry.session}`]))
for (const edge of graph.edges) {
  assert.notEqual(scheduleMap.get(edge.a), scheduleMap.get(edge.b), `conflict ${edge.a}-${edge.b} must not share a slot`)
}
assert.equal(generated.timetable.entries.length, subjects.length, 'every subject scheduled')
assert.ok(generated.timetable.metrics.colorsUsed >= solution.colorsUsed, 'timetable colours >= optimum')

for (const [size, density] of [[5, 0.2], [12, 0.35], [18, 0.6]]) {
  const testGraph = generateRandomGraph(size, density, 7)
  const result = solveGraphColoring(testGraph, { nodeLimit: 40000, timeLimitMs: 700 })
  assert.equal(result.success, true, `test graph ${size}/${density} solved`)
  assert.equal(validateColoring(testGraph, result.assignment).valid, true, `test graph ${size}/${density} valid`)
}

console.log(JSON.stringify({
  subjects: subjects.length,
  students: students.length,
  edges: graph.edgeCount,
  optimalColors: solution.colorsUsed,
  lowerBound: solution.lowerBound,
  attempts: solution.attempts,
  backtracks: solution.backtracks,
  nodesVisited: solution.nodesVisited,
  solverMs: Number(solution.executionMs.toFixed(3)),
  timetableEntries: generated.timetable.entries.length,
  slotsUsed: generated.timetable.usedSlots,
  timetableColors: generated.timetable.metrics.colorsUsed,
}, null, 2))
