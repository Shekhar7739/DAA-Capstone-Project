/**
 * Automatic conflict detection.
 * Two subjects conflict when at least one student is enrolled in both.
 * Returns edge list, adjacency list and adjacency matrix for graph algorithms.
 */
export function detectConflicts(subjects = [], students = []) {
  const validIds = new Set(subjects.map((subject) => subject.id))
  const pairMap = new Map()
  const enrollmentCount = Object.fromEntries(subjects.map((subject) => [subject.id, 0]))

  for (const student of students) {
    const ids = [...new Set(student.subjectIds || [])]
      .filter((id) => validIds.has(id))
      .sort()

    for (const id of ids) enrollmentCount[id] += 1

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const [a, b] = [ids[i], ids[j]].sort()
        const key = `${a}::${b}`
        if (!pairMap.has(key)) {
          pairMap.set(key, { a, b, studentIds: new Set() })
        }
        pairMap.get(key).studentIds.add(student.id)
      }
    }
  }

  const vertices = subjects.map((subject) => subject.id)
  const adjacency = Object.fromEntries(vertices.map((id) => [id, []]))
  const matrix = Object.fromEntries(
    vertices.map((row) => [row, Object.fromEntries(vertices.map((col) => [col, 0]))]),
  )

  const edges = [...pairMap.values()]
    .map(({ a, b, studentIds }) => ({
      a,
      b,
      key: `${a}::${b}`,
      sharedStudents: [...studentIds],
      sharedCount: studentIds.size,
    }))
    .sort((x, y) => y.sharedCount - x.sharedCount || x.a.localeCompare(y.a))

  const conflictCount = Object.fromEntries(vertices.map((id) => [id, 0]))
  for (const edge of edges) {
    adjacency[edge.a].push({ id: edge.b, sharedCount: edge.sharedCount })
    adjacency[edge.b].push({ id: edge.a, sharedCount: edge.sharedCount })
    matrix[edge.a][edge.b] = edge.sharedCount
    matrix[edge.b][edge.a] = edge.sharedCount
    conflictCount[edge.a] += 1
    conflictCount[edge.b] += 1
  }

  for (const id of vertices) {
    adjacency[id].sort((x, y) => y.sharedCount - x.sharedCount || x.id.localeCompare(y.id))
  }

  const degrees = Object.fromEntries(vertices.map((id) => [id, adjacency[id].length]))

  return {
    vertices,
    adjacency,
    matrix,
    edges,
    degrees,
    conflictCount,
    enrollmentCount,
    edgeCount: edges.length,
  }
}

export function getSubjectById(subjects, id) {
  return subjects.find((subject) => subject.id === id)
}

export function getSubjectLabel(subjects, id) {
  const subject = getSubjectById(subjects, id)
  return subject ? subject.code || subject.name : id
}
