import { buildConflictGraph, solveGraphColoring, validateColoring } from '../algorithms/graphColoring.js'
import { colorForSlot } from './constants.js'
import { isValidDate } from './validation.js'

export function generateExamDates(startDate, days) {
  if (!isValidDate(startDate)) return []
  const dates = []
  const date = new Date(`${startDate}T00:00:00`)
  for (let i = 0; i < days; i += 1) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    date.setDate(date.getDate() + 1)
  }
  return dates
}

export function formatDisplayDate(value) {
  if (!isValidDate(value)) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildSlots(examDates, sessions) {
  const slots = []
  examDates.forEach((date) => {
    sessions.forEach((session, sessionIndex) => {
      slots.push({
        id: `slot-${date}-${sessionIndex}`,
        date,
        session,
        index: slots.length,
      })
    })
  })
  return slots
}

/**
 * Convert colour classes into concrete date/session slots.
 * A colour class may be split over several slots when maxExamsPerSlot is set.
 * Because every conflict edge has different colours, no slot can ever contain
 * two conflicting subjects.
 */
export function buildSchedule(graph, assignment, subjects, config) {
  const slots = buildSlots(config.examDates, config.sessions)
  if (!slots.length) return { success: false, error: 'No exam slots available. Check the start date, days and sessions.' }

  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))
  const groups = new Map()
  graph.vertices.forEach((vertex) => {
    const color = assignment[vertex]
    if (color === undefined) return
    if (!groups.has(color)) groups.set(color, [])
    groups.get(color).push(vertex)
  })

  const maxPerSlot = Math.max(1, Math.floor(config.maxExamsPerSlot || 1))
  const requiredSlots = [...groups.values()].reduce((sum, group) => sum + Math.ceil(group.length / maxPerSlot), 0)
  if (requiredSlots > slots.length) {
    return {
      success: false,
      error: `Not enough exam slots: ${requiredSlots} required but only ${slots.length} configured. Add more dates or sessions.`,
    }
  }

  let nextSlot = 0
  const entries = []
  const slotUsage = slots.map((slot) => ({ ...slot, subjectIds: [], count: 0 }))

  const orderedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0] - b[0])
  for (const [color, group] of orderedGroups) {
    for (let i = 0; i < group.length; i += maxPerSlot) {
      const slot = slots[nextSlot]
      const palette = colorForSlot(color)
      for (const subjectId of group.slice(i, i + maxPerSlot)) {
        const subject = subjectMap.get(subjectId)
        if (!subject) continue
        entries.push({
          subjectId,
          name: subject.name,
          code: subject.code,
          department: subject.department,
          semester: subject.semester,
          date: slot.date,
          session: slot.session,
          slotId: slot.id,
          slotIndex: slot.index,
          color,
          colorName: palette.name,
          colorHex: palette.hex,
        })
        slotUsage[slot.index].subjectIds.push(subjectId)
        slotUsage[slot.index].count += 1
      }
      nextSlot += 1
    }
  }

  // Verify the concrete schedule against the conflict graph, not just the colours.
  const scheduledBySubject = Object.fromEntries(entries.map((entry) => [entry.subjectId, entry.slotId]))
  const violations = []
  for (const edge of graph.edges) {
    if (scheduledBySubject[edge.a] && scheduledBySubject[edge.a] === scheduledBySubject[edge.b]) {
      violations.push(edge)
    }
  }
  if (violations.length) return { success: false, error: 'Generated schedule failed constraint validation.' }

  entries.sort((a, b) => a.date.localeCompare(b.date) || a.session.localeCompare(b.session) || a.code.localeCompare(b.code))

  return {
    success: true,
    entries,
    slots,
    slotUsage: slotUsage.filter((slot) => slot.count > 0),
    totalSlots: slots.length,
    usedSlots: nextSlot,
  }
}

/**
 * End-to-end timetable generation: graph -> backtracking colouring -> slots.
 * Never returns a hardcoded timetable; every entry comes from the solver.
 */
export function generateTimetable(subjects, students, settings, config = {}) {
  if (!subjects.length) {
    return { success: false, error: 'Add at least one subject before generating a timetable.' }
  }
  if (!students.length) {
    return { success: false, error: 'Add students with enrolments so conflicts can be detected.' }
  }

  const examDates = config.examDates || generateExamDates(config.startDate || settings.defaultStartDate, settings.examDays)
  if (!examDates.length) {
    return { success: false, error: 'Select a valid start date to generate exam dates.' }
  }

  const sessions = (config.sessions || settings.sessions || []).map((session) => String(session).trim()).filter(Boolean)
  if (!sessions.length) {
    return { success: false, error: 'Configure at least one exam session.' }
  }

  const graph = buildConflictGraph(subjects, students)
  const slotCount = examDates.length * sessions.length
  const algorithm = solveGraphColoring(graph, {
    maxColors: Math.max(1, slotCount),
    nodeLimit: 300000,
    timeLimitMs: 8000,
  })

  if (!algorithm.success) {
    return {
      success: false,
      error: 'No valid colouring found within the configured limits. Try adding exam slots.',
      graph,
      algorithm,
    }
  }

  const coloringCheck = validateColoring(graph, algorithm.assignment)
  if (!coloringCheck.valid) {
    return { success: false, error: 'Algorithm produced an invalid colouring. Generation aborted.', graph, algorithm }
  }

  const schedule = buildSchedule(graph, algorithm.assignment, subjects, {
    examDates,
    sessions,
    maxExamsPerSlot: config.maxExamsPerSlot ?? settings.maxExamsPerSlot ?? 4,
  })
  if (!schedule.success) {
    return { ...schedule, graph, algorithm }
  }

  const timetable = {
    id: `TT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    startDate: examDates[0],
    examDates,
    sessions,
    examDuration: config.examDuration ?? settings.examDuration,
    maxExamsPerSlot: config.maxExamsPerSlot ?? settings.maxExamsPerSlot ?? 4,
    entries: schedule.entries,
    slotUsage: schedule.slotUsage,
    usedSlots: schedule.usedSlots,
    totalSlots: schedule.totalSlots,
    metrics: {
      vertices: graph.vertices.length,
      edges: graph.edgeCount,
      density: graph.vertices.length > 1
        ? (2 * graph.edgeCount) / (graph.vertices.length * (graph.vertices.length - 1))
        : 0,
      colorsUsed: algorithm.colorsUsed,
      lowerBound: algorithm.lowerBound,
      upperBound: algorithm.upperBound,
      optimal: algorithm.optimal,
      attempts: algorithm.attempts,
      backtracks: algorithm.backtracks,
      nodesVisited: algorithm.nodesVisited,
      conflictChecks: algorithm.conflictChecks,
      executionMs: algorithm.executionMs,
      valid: true,
    },
  }

  return { success: true, timetable, graph, algorithm }
}
