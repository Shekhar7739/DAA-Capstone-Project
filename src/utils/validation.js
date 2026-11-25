const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSubject(input, existing = []) {
  const errors = {}
  const name = (input.name || '').trim()
  const code = (input.code || '').trim()
  const department = (input.department || '').trim()
  const semester = Number(input.semester)

  if (!name) errors.name = 'Subject name is required.'
  else if (name.length < 3) errors.name = 'Subject name must be at least 3 characters.'

  if (!code) errors.code = 'Subject code is required.'
  else if (!/^[A-Za-z0-9-]{3,15}$/.test(code)) errors.code = 'Use 3–15 letters, numbers or hyphens.'

  if (existing.some((subject) => subject.code?.toUpperCase() === code.toUpperCase() && subject.id !== input.id)) {
    errors.code = 'A subject with this code already exists.'
  }
  if (!department) errors.department = 'Department is required.'
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) errors.semester = 'Enter a semester between 1 and 12.'

  return errors
}

export function validateStudent(input, existing = [], subjects = []) {
  const errors = {}
  const name = (input.name || '').trim()
  const email = (input.email || '').trim()
  const department = (input.department || '').trim()
  const semester = Number(input.semester)
  const subjectIds = input.subjectIds || []

  if (!name) errors.name = 'Student name is required.'
  else if (name.length < 3) errors.name = 'Student name must be at least 3 characters.'

  if (!email) errors.email = 'Email address is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  else if (existing.some((student) => student.email?.toLowerCase() === email.toLowerCase() && student.id !== input.id)) {
    errors.email = 'Another student already uses this email address.'
  }

  if (!input.id) errors.id = 'Student ID is required.'
  else if (existing.some((student) => student.id === input.id && student.id !== input._originalId)) {
    errors.id = 'A student with this ID already exists.'
  }

  if (!department) errors.department = 'Department is required.'
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) errors.semester = 'Enter a semester between 1 and 12.'
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    errors.subjectIds = 'Enrol the student in at least one subject.'
  } else {
    const validIds = new Set(subjects.map((subject) => subject.id))
    if (subjectIds.some((id) => !validIds.has(id))) errors.subjectIds = 'One or more enrolled subjects no longer exist.'
    if (new Set(subjectIds).size !== subjectIds.length) errors.subjectIds = 'Duplicate subject enrolments are not allowed.'
  }

  return errors
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return local === value
}
