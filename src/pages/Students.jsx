import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Filter, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import SearchInput from '../components/common/SearchInput'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StudentForm from '../components/students/StudentForm'
import { DEPARTMENTS, SEMESTERS } from '../data/sampleData'

export default function Students() {
  const { students, subjects, addStudent, updateStudent, deleteStudent, resetSampleData, conflictGraph } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [department, setDepartment] = useState('all')
  const [semester, setSemester] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])

  const suggestedId = useMemo(() => {
    const highest = students.reduce((max, student) => Math.max(max, Number(String(student.id).replace(/\D/g, '')) || 0), 0)
    return `STU${String(highest + 1).padStart(3, '0')}`
  }, [students])

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = students.filter((student) => {
      const matchesTerm = !term || [student.name, student.email, student.id, ...(student.subjectIds || []).map((id) => subjectMap.get(id)?.name || '')]
        .some((value) => String(value).toLowerCase().includes(term))
      return matchesTerm
        && (department === 'all' || student.department === department)
        && (semester === 'all' || String(student.semester) === semester)
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'enrolled') return (b.subjectIds?.length || 0) - (a.subjectIds?.length || 0)
      if (sort === 'id') return a.id.localeCompare(b.id)
      return sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    })
  }, [students, query, department, semester, sort, subjectMap])

  const clearFilters = () => { setSearchParams({}); setDepartment('all'); setSemester('all'); setSort('name-asc') }
  const handleSubmit = (data) => {
    if (editing) updateStudent(editing.id, data)
    else addStudent(data)
    setFormOpen(false)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        description="Manage student records and enrolments. Conflicts are derived automatically from shared subjects."
        actions={
          <>
            <button type="button" onClick={resetSampleData} className="btn-secondary"><RotateCcw size={16} /> Reset sample</button>
            <button type="button" onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary"><Plus size={17} /> Add student</button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Students</p><p className="mt-2 text-2xl font-bold text-slate-900">{students.length}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Enrolment records</p><p className="mt-2 text-2xl font-bold text-slate-900">{students.reduce((sum, student) => sum + (student.subjectIds?.length || 0), 0)}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conflict edges detected</p><p className="mt-2 text-2xl font-bold text-slate-900">{conflictGraph.edgeCount}</p></div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={(value) => setSearchParams(value ? { q: value } : {})} placeholder="Search by name, email, ID or subject…" className="lg:max-w-sm" />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="hidden items-center gap-1 text-xs font-semibold text-slate-400 sm:flex"><Filter size={14} /> Filters</span>
            <select className="input-base w-auto py-2" value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
              <option value="all">All departments</option>
              {[...new Set([...DEPARTMENTS, ...students.map((student) => student.department)])].filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="input-base w-auto py-2" value={semester} onChange={(event) => setSemester(event.target.value)} aria-label="Filter by semester">
              <option value="all">All semesters</option>
              {SEMESTERS.map((item) => <option key={item} value={item}>Semester {item}</option>)}
            </select>
            <select className="input-base w-auto py-2" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort students">
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="id">Student ID</option>
              <option value="enrolled">Most enrolled</option>
            </select>
            {(query || department !== 'all' || semester !== 'all' || sort !== 'name-asc') && (
              <button type="button" onClick={clearFilters} className="btn-ghost text-xs">Clear</button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={students.length === 0 ? 'No students yet' : 'No students match your filters'}
            description={students.length === 0 ? 'Add students with enrolments to detect subject conflicts.' : 'Try another search term or clear the filters.'}
            action={students.length === 0
              ? <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Add student</button>
              : <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr><th>Student</th><th>Email</th><th>Department</th><th>Semester</th><th>Enrolled subjects</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((student) => {
                  const ids = student.subjectIds || []
                  const invalid = ids.some((id) => !subjectMap.has(id))
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-[11px] font-bold text-brand-800">
                            {student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">{student.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">{student.email}</td>
                      <td className="text-slate-600">{student.department}</td>
                      <td><span className="badge bg-brand-50 text-brand-700">Sem {student.semester}</span></td>
                      <td>
                        {invalid ? (
                          <span className="badge bg-rose-50 text-rose-700"><AlertTriangle size={12} /> Invalid enrolment</span>
                        ) : ids.length === 0 ? (
                          <span className="badge bg-amber-50 text-amber-700">No enrolments</span>
                        ) : (
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {ids.slice(0, 3).map((id) => <span key={id} className="badge bg-slate-100 text-slate-600">{subjectMap.get(id)?.code || id}</span>)}
                            {ids.length > 3 && <span className="badge bg-brand-50 text-brand-700">+{ids.length - 3}</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => { setEditing(student); setFormOpen(true) }} className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" title="Edit student"><Pencil size={16} /></button>
                          <button type="button" onClick={() => setDeleting(student)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete student"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Showing <strong>{rows.length}</strong> of {students.length} students
        </div>
      </section>

      <StudentForm
        open={formOpen}
        initial={editing}
        students={students}
        subjects={subjects}
        suggestedId={suggestedId}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteStudent(deleting.id)}
        title="Delete student?"
        message={`“${deleting?.name}” will be removed. Their enrolments and the conflict edges derived from them will be recalculated automatically.`}
        confirmLabel="Delete student"
      />
    </div>
  )
}
