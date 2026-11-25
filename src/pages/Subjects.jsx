import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Filter, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import SearchInput from '../components/common/SearchInput'
import EmptyState from '../components/common/EmptyState'
import ConfirmDialog from '../components/common/ConfirmDialog'
import SubjectForm from '../components/subjects/SubjectForm'
import { DEPARTMENTS, SEMESTERS } from '../data/sampleData'

export default function Subjects() {
  const { subjects, students, conflictGraph, addSubject, updateSubject, deleteSubject, resetSampleData } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [department, setDepartment] = useState('all')
  const [semester, setSemester] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = subjects.filter((subject) => {
      const matchesTerm = !term || [subject.name, subject.code, subject.department, subject.id].some((value) => String(value).toLowerCase().includes(term))
      const matchesDepartment = department === 'all' || subject.department === department
      const matchesSemester = semester === 'all' || String(subject.semester) === semester
      return matchesTerm && matchesDepartment && matchesSemester
    })

    const value = (subject) => {
      if (sort === 'code') return subject.code.toLowerCase()
      if (sort === 'semester') return subject.semester
      if (sort === 'enrolled') return conflictGraph.enrollmentCount[subject.id] || 0
      if (sort === 'conflicts') return conflictGraph.conflictCount[subject.id] || 0
      return subject.name.toLowerCase()
    }
    return [...filtered].sort((a, b) => {
      const result = value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0
      return sort.endsWith('desc') ? -result : result
    })
  }, [subjects, query, department, semester, sort, conflictGraph])

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (subject) => { setEditing(subject); setFormOpen(true) }
  const handleSubmit = (data) => {
    if (editing) updateSubject(editing.id, data)
    else addSubject(data)
    setFormOpen(false)
  }
  const clearFilters = () => {
    setSearchParams({})
    setDepartment('all')
    setSemester('all')
    setSort('name-asc')
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Subjects"
        description="Manage courses, enrolment counts and conflict degrees used by the scheduler."
        actions={
          <>
            <button type="button" onClick={resetSampleData} className="btn-secondary"><RotateCcw size={16} /> Reset sample</button>
            <button type="button" onClick={openAdd} className="btn-primary"><Plus size={17} /> Add subject</button>
          </>
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={(value) => setSearchParams(value ? { q: value } : {})} placeholder="Search by name, code or ID…" className="lg:max-w-sm" />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="hidden items-center gap-1 text-xs font-semibold text-slate-400 sm:flex"><Filter size={14} /> Filters</span>
            <select className="input-base w-auto py-2" value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
              <option value="all">All departments</option>
              {[...new Set([...DEPARTMENTS, ...subjects.map((subject) => subject.department)])].filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="input-base w-auto py-2" value={semester} onChange={(event) => setSemester(event.target.value)} aria-label="Filter by semester">
              <option value="all">All semesters</option>
              {SEMESTERS.map((item) => <option key={item} value={item}>Semester {item}</option>)}
            </select>
            <select className="input-base w-auto py-2" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort subjects">
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="code">Subject code</option>
              <option value="semester">Semester</option>
              <option value="enrolled">Most enrolled</option>
              <option value="conflicts">Most conflicts</option>
            </select>
            {(query || department !== 'all' || semester !== 'all' || sort !== 'name-asc') && (
              <button type="button" onClick={clearFilters} className="btn-ghost text-xs">Clear</button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={subjects.length === 0 ? 'No subjects yet' : 'No subjects match your filters'}
            description={subjects.length === 0 ? 'Add your first subject or restore the sample university data.' : 'Try a different search term or clear the filters.'}
            action={
              subjects.length === 0
                ? <button type="button" className="btn-primary" onClick={openAdd}><Plus size={16} /> Add subject</button>
                : <button type="button" className="btn-secondary" onClick={clearFilters}>Clear filters</button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Subject</th><th>Code</th><th>Department</th><th>Semester</th><th>Enrolled</th><th>Conflicts</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((subject) => {
                  const enrolled = conflictGraph.enrollmentCount[subject.id] || 0
                  const conflicts = conflictGraph.conflictCount[subject.id] || 0
                  return (
                    <tr key={subject.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{subject.code.slice(0, 2)}</span>
                          <div>
                            <p className="font-semibold text-slate-800">{subject.name}</p>
                            <p className="text-[11px] text-slate-400">{subject.id}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge bg-slate-100 font-mono text-slate-600">{subject.code}</span></td>
                      <td className="text-slate-600">{subject.department}</td>
                      <td><span className="badge bg-brand-50 text-brand-700">Sem {subject.semester}</span></td>
                      <td>
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${enrolled === 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                          <Users size={14} /> {enrolled}
                          {enrolled === 0 && <span className="text-[10px] font-medium">· no enrolment</span>}
                        </span>
                      </td>
                      <td><span className={`badge ${conflicts ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>{conflicts}</span></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openEdit(subject)} className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600" title="Edit subject"><Pencil size={16} /></button>
                          <button type="button" onClick={() => setDeleting(subject)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete subject"><Trash2 size={16} /></button>
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
          Showing <strong>{rows.length}</strong> of {subjects.length} subjects · {students.length} students enrolled across the workspace
        </div>
      </section>

      <SubjectForm open={formOpen} initial={editing} subjects={subjects} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteSubject(deleting.id)}
        title="Delete subject?"
        message={`“${deleting?.name}” will be removed from all student enrolments. Any generated timetable will be cleared. This cannot be undone.`}
        confirmLabel="Delete subject"
      />
    </div>
  )
}
