export const DEPARTMENTS = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Mathematics',
]

export const SEMESTERS = [1, 2, 3, 4, 5, 6]

export const DEFAULT_SETTINGS = {
  examDuration: 120,
  examDays: 5,
  sessions: ['09:00 – 11:00', '11:30 – 13:30', '14:00 – 16:00', '16:30 – 18:30'],
  defaultDepartment: 'Computer Science',
  accent: 'indigo',
  density: 'comfortable',
  maxExamsPerSlot: 4,
  defaultStartDate: '',
}

const SUBJECTS = [
  { id: 'SUB001', name: 'Data Structures', code: 'CS301', department: 'Computer Science', semester: 3 },
  { id: 'SUB002', name: 'Design & Analysis of Algorithms', code: 'CS302', department: 'Computer Science', semester: 3 },
  { id: 'SUB003', name: 'Database Management Systems', code: 'CS401', department: 'Computer Science', semester: 4 },
  { id: 'SUB004', name: 'Operating Systems', code: 'CS402', department: 'Computer Science', semester: 4 },
  { id: 'SUB005', name: 'Computer Networks', code: 'CS501', department: 'Computer Science', semester: 5 },
  { id: 'SUB006', name: 'Digital Electronics', code: 'EC301', department: 'Electronics & Communication', semester: 3 },
  { id: 'SUB007', name: 'Signals & Systems', code: 'EC401', department: 'Electronics & Communication', semester: 4 },
  { id: 'SUB008', name: 'Thermodynamics', code: 'ME301', department: 'Mechanical Engineering', semester: 3 },
  { id: 'SUB009', name: 'Engineering Mathematics', code: 'MA201', department: 'Mathematics', semester: 2 },
  { id: 'SUB010', name: 'Probability & Statistics', code: 'MA401', department: 'Mathematics', semester: 4 },
]

const STUDENT_NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Verma', 'Ananya Iyer', 'Kabir Malhotra',
  'Meera Nair', 'Arjun Reddy', 'Sneha Kulkarni', 'Vikram Singh', 'Isha Gupta',
  'Nikhil Rao', 'Priya Bansal', 'Aditya Menon', 'Riya Chaudhary', 'Sahil Kapoor',
  'Naina Joshi', 'Karan Bhatia', 'Tara Deshmukh', 'Varun Agarwal', 'Pooja Tiwari',
]

// Each entry is intentionally overlapping with others so the sample data
// produces a meaningful conflict graph (including a 4-clique).
const ENROLLMENTS = [
  ['SUB001', 'SUB002', 'SUB009'],
  ['SUB001', 'SUB003', 'SUB009'],
  ['SUB002', 'SUB004', 'SUB010'],
  ['SUB003', 'SUB004', 'SUB005'],
  ['SUB001', 'SUB005', 'SUB010'],
  ['SUB006', 'SUB007', 'SUB009'],
  ['SUB006', 'SUB010', 'SUB001'],
  ['SUB007', 'SUB008', 'SUB009'],
  ['SUB008', 'SUB010', 'SUB002'],
  ['SUB001', 'SUB002', 'SUB003', 'SUB004'],
  ['SUB005', 'SUB006', 'SUB007'],
  ['SUB003', 'SUB005', 'SUB010'],
  ['SUB004', 'SUB007', 'SUB009'],
  ['SUB002', 'SUB006', 'SUB010'],
  ['SUB008', 'SUB009', 'SUB010'],
  ['SUB001', 'SUB004', 'SUB007'],
  ['SUB002', 'SUB005', 'SUB008'],
  ['SUB003', 'SUB006', 'SUB009'],
  ['SUB004', 'SUB005', 'SUB010'],
  ['SUB007', 'SUB010', 'SUB001'],
]

export function createSampleData() {
  const subjects = SUBJECTS.map((subject) => ({ ...subject }))
  const students = STUDENT_NAMES.map((name, index) => {
    const subjectIds = [...ENROLLMENTS[index]]
    const departments = [...new Set(subjectIds.map((id) => SUBJECTS.find((s) => s.id === id)?.department).filter(Boolean))]
    const semesters = [...new Set(subjectIds.map((id) => SUBJECTS.find((s) => s.id === id)?.semester).filter(Boolean))]
    const department = departments[0] || 'Computer Science'
    return {
      id: `STU${String(index + 1).padStart(3, '0')}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@university.edu`,
      department,
      semester: semesters[0] || 1,
      subjectIds,
    }
  })

  return {
    subjects,
    students,
    timetable: null,
    activities: [
      { id: 'act-1', type: 'system', message: 'Sample university data loaded successfully', timestamp: new Date().toISOString() },
    ],
    settings: { ...DEFAULT_SETTINGS },
  }
}
