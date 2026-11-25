import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSampleData, DEFAULT_SETTINGS } from '../data/sampleData'
import { detectConflicts } from '../utils/conflictDetection'
import { calculateMinimumColors, solveGraphColoring } from '../algorithms/graphColoring'
import { clearAllState, loadState, saveState, STORAGE_KEYS } from '../utils/storage'

const AppContext = createContext(null)

const nextId = (prefix, items) => {
  const highest = items.reduce((max, item) => {
    const numeric = Number(String(item.id).replace(/\D/g, ''))
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

const activity = (type, message) => ({
  id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  message,
  timestamp: new Date().toISOString(),
})

function initialState() {
  const storedSubjects = loadState(STORAGE_KEYS.subjects, null)
  const storedStudents = loadState(STORAGE_KEYS.students, null)

  if (storedSubjects === null && storedStudents === null) {
    const sample = createSampleData()
    saveState(STORAGE_KEYS.subjects, sample.subjects)
    saveState(STORAGE_KEYS.students, sample.students)
    saveState(STORAGE_KEYS.timetable, sample.timetable)
    saveState(STORAGE_KEYS.activities, sample.activities)
    saveState(STORAGE_KEYS.settings, sample.settings)
    return sample
  }

  return {
    subjects: Array.isArray(storedSubjects) ? storedSubjects : [],
    students: Array.isArray(storedStudents) ? storedStudents : [],
    timetable: loadState(STORAGE_KEYS.timetable, null),
    activities: loadState(STORAGE_KEYS.activities, []),
    settings: { ...DEFAULT_SETTINGS, ...(loadState(STORAGE_KEYS.settings, {}) || {}) },
  }
}

export function AppProvider({ children }) {
  const [initial] = useState(initialState)
  const [subjects, setSubjects] = useState(initial.subjects)
  const [students, setStudents] = useState(initial.students)
  const [timetable, setTimetable] = useState(initial.timetable)
  const [activities, setActivities] = useState(initial.activities)
  const [settings, setSettings] = useState(initial.settings)
  const [toasts, setToasts] = useState([])
  const toastTimers = useRef(new Map())

  useEffect(() => { saveState(STORAGE_KEYS.subjects, subjects) }, [subjects])
  useEffect(() => { saveState(STORAGE_KEYS.students, students) }, [students])
  useEffect(() => { saveState(STORAGE_KEYS.timetable, timetable) }, [timetable])
  useEffect(() => { saveState(STORAGE_KEYS.activities, activities) }, [activities])
  useEffect(() => { saveState(STORAGE_KEYS.settings, settings) }, [settings])

  useEffect(() => {
    document.documentElement.dataset.accent = settings.accent || 'indigo'
    document.documentElement.dataset.density = settings.density || 'comfortable'
  }, [settings.accent, settings.density])

  useEffect(() => () => {
    toastTimers.current.forEach((timer) => clearTimeout(timer))
    toastTimers.current.clear()
  }, [])

  const dismissToast = useCallback((id) => {
    const timer = toastTimers.current.get(id)
    if (timer) clearTimeout(timer)
    toastTimers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((current) => [...current.slice(-3), { id, message, type }])
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      toastTimers.current.delete(id)
    }, 4200)
    toastTimers.current.set(id, timer)
    return id
  }, [])

  const logActivity = useCallback((type, message) => {
    setActivities((current) => [activity(type, message), ...current].slice(0, 60))
  }, [])

  const conflictGraph = useMemo(() => detectConflicts(subjects, students), [subjects, students])

  const enrollments = useMemo(
    () => students.flatMap((student) => (student.subjectIds || []).map((subjectId) => ({ studentId: student.id, subjectId }))),
    [students],
  )

  const minimumSlots = useMemo(() => {
    if (!subjects.length) return 0
    const bounds = calculateMinimumColors(conflictGraph)
    if (bounds.upperBound === 0) return 0
    const solution = solveGraphColoring(conflictGraph, { nodeLimit: 60000, timeLimitMs: 1800 })
    return solution.success ? solution.colorsUsed : bounds.upperBound
  }, [conflictGraph, subjects.length])

  const invalidateTimetable = useCallback(() => {
    setTimetable((current) => {
      if (current) logActivity('timetable', 'Timetable cleared after a data change')
      return null
    })
  }, [logActivity])

  const addSubject = useCallback((data) => {
    const id = nextId('SUB', subjects)
    setSubjects((current) => [...current, { ...data, id }])
    logActivity('subject', `Subject "${data.name}" added`)
    notify(`Subject "${data.name}" added successfully.`)
    invalidateTimetable()
    return id
  }, [subjects, logActivity, notify, invalidateTimetable])

  const updateSubject = useCallback((id, data) => {
    setSubjects((current) => current.map((subject) => (subject.id === id ? { ...subject, ...data, id } : subject)))
    logActivity('subject', `Subject "${data.name}" updated`)
    notify(`Subject "${data.name}" updated.`)
    invalidateTimetable()
  }, [logActivity, notify, invalidateTimetable])

  const deleteSubject = useCallback((id) => {
    const subject = subjects.find((item) => item.id === id)
    setSubjects((current) => current.filter((item) => item.id !== id))
    setStudents((current) => current.map((student) => ({
      ...student,
      subjectIds: (student.subjectIds || []).filter((subjectId) => subjectId !== id),
    })))
    logActivity('subject', `Subject "${subject?.name || id}" deleted`)
    notify(`Subject "${subject?.name || id}" deleted.`, 'info')
    invalidateTimetable()
  }, [subjects, logActivity, notify, invalidateTimetable])

  const addStudent = useCallback((data) => {
    const id = data.id || nextId('STU', students)
    setStudents((current) => [...current, { ...data, id }])
    logActivity('student', `Student "${data.name}" added`)
    notify(`Student "${data.name}" added successfully.`)
    invalidateTimetable()
    return id
  }, [students, logActivity, notify, invalidateTimetable])

  const updateStudent = useCallback((id, data) => {
    setStudents((current) => current.map((student) => (student.id === id ? { ...student, ...data, id } : student)))
    logActivity('student', `Student "${data.name}" updated`)
    notify(`Student "${data.name}" updated.`)
    invalidateTimetable()
  }, [logActivity, notify, invalidateTimetable])

  const deleteStudent = useCallback((id) => {
    const student = students.find((item) => item.id === id)
    setStudents((current) => current.filter((item) => item.id !== id))
    logActivity('student', `Student "${student?.name || id}" deleted`)
    notify(`Student "${student?.name || id}" deleted.`, 'info')
    invalidateTimetable()
  }, [students, logActivity, notify, invalidateTimetable])

  const saveTimetable = useCallback((generated) => {
    setTimetable(generated)
    logActivity('timetable', `Timetable generated with ${generated.metrics.colorsUsed} exam slots`)
    notify(`Timetable generated using ${generated.metrics.colorsUsed} exam slots.`)
  }, [logActivity, notify])

  const updateSettings = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }))
    notify('Settings saved.', 'info')
  }, [notify])

  const resetSampleData = useCallback(() => {
    const sample = createSampleData()
    setSubjects(sample.subjects)
    setStudents(sample.students)
    setTimetable(null)
    setActivities(sample.activities)
    setSettings((current) => ({ ...current }))
    logActivity('system', 'Sample data restored')
    notify('Sample data restored successfully.')
  }, [logActivity, notify])

  const clearAllData = useCallback(() => {
    clearAllState()
    setSubjects([])
    setStudents([])
    setTimetable(null)
    setActivities([activity('system', 'All application data cleared')])
    setSettings({ ...DEFAULT_SETTINGS })
    notify('All application data cleared.', 'info')
  }, [notify])

  const value = useMemo(() => ({
    subjects,
    students,
    enrollments,
    conflictGraph,
    timetable,
    activities,
    settings,
    minimumSlots,
    toasts,
    notify,
    dismissToast,
    logActivity,
    addSubject,
    updateSubject,
    deleteSubject,
    addStudent,
    updateStudent,
    deleteStudent,
    saveTimetable,
    updateSettings,
    resetSampleData,
    clearAllData,
  }), [
    subjects, students, enrollments, conflictGraph, timetable, activities, settings, minimumSlots,
    toasts, notify, dismissToast, logActivity, addSubject, updateSubject, deleteSubject,
    addStudent, updateStudent, deleteStudent, saveTimetable, updateSettings, resetSampleData, clearAllData,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
