const PREFIX = 'exam-scheduler:v1:'

export const STORAGE_KEYS = {
  subjects: 'subjects',
  students: 'students',
  timetable: 'timetable',
  activities: 'activities',
  settings: 'settings',
}

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

export function loadState(key, fallback) {
  if (!canUseStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (error) {
    console.warn(`Unable to read persisted state "${key}":`, error)
    return fallback
  }
}

export function saveState(key, value) {
  if (!canUseStorage()) return false
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Unable to persist state "${key}":`, error)
    return false
  }
}

export function removeState(key) {
  if (!canUseStorage()) return false
  try {
    window.localStorage.removeItem(PREFIX + key)
    return true
  } catch (error) {
    console.warn(`Unable to remove persisted state "${key}":`, error)
    return false
  }
}

export function clearAllState() {
  Object.values(STORAGE_KEYS).forEach(removeState)
}
