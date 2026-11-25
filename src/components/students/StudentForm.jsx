import { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import Field from '../common/Field'
import { DEPARTMENTS, SEMESTERS } from '../../data/sampleData'
import { validateStudent } from '../../utils/validation'
import SearchInput from '../common/SearchInput'

export default function StudentForm({ open, initial, students, subjects, suggestedId, onClose, onSubmit }) {
  const [form, setForm] = useState({ id: '', name: '', email: '', department: '', semester: 1, subjectIds: [] })
  const [errors, setErrors] = useState({})
  const [subjectQuery, setSubjectQuery] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...initial, _originalId: initial.id, subjectIds: [...(initial.subjectIds || [])] }
        : { id: suggestedId, name: '', email: '', department: '', semester: 1, subjectIds: [] })
      setErrors({})
      setSubjectQuery('')
    }
  }, [open, initial, suggestedId])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const filteredSubjects = useMemo(() => {
    const term = subjectQuery.trim().toLowerCase()
    return subjects.filter((subject) => !term || [subject.name, subject.code, subject.department].some((value) => String(value).toLowerCase().includes(term)))
  }, [subjects, subjectQuery])

  const toggleSubject = (id) => {
    setForm((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(id) ? current.subjectIds.filter((item) => item !== id) : [...current.subjectIds, id],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateStudent(form, students, subjects)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return
    onSubmit({
      id: form.id.trim(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      department: form.department.trim(),
      semester: Number(form.semester),
      subjectIds: form.subjectIds,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={initial ? 'Edit student' : 'Add new student'}
      description="Enrol the student in one or more subjects. Enrolments automatically create conflict edges."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="student-form" className="btn-primary">{initial ? 'Save changes' : 'Add student'}</button>
        </>
      }
    >
      <form id="student-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student ID" required error={errors.id}>
            <input className="input-base font-mono" value={form.id} onChange={(event) => setField('id', event.target.value.toUpperCase())} placeholder="STU021" />
          </Field>
          <Field label="Full name" required error={errors.name}>
            <input className="input-base" value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Student name" autoFocus />
          </Field>
          <Field label="Email address" required error={errors.email} className="sm:col-span-2">
            <input type="email" className="input-base" value={form.email} onChange={(event) => setField('email', event.target.value)} placeholder="student@university.edu" />
          </Field>
          <Field label="Department" required error={errors.department}>
            <input className="input-base" list="student-departments" value={form.department} onChange={(event) => setField('department', event.target.value)} placeholder="Department" />
            <datalist id="student-departments">{DEPARTMENTS.map((department) => <option key={department} value={department} />)}</datalist>
          </Field>
          <Field label="Semester" required error={errors.semester}>
            <select className="input-base" value={form.semester} onChange={(event) => setField('semester', event.target.value)}>
              {SEMESTERS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </select>
          </Field>
        </div>

        <Field label={`Enrolled subjects (${form.subjectIds.length} selected)`} required error={errors.subjectIds}>
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput value={subjectQuery} onChange={setSubjectQuery} placeholder="Find a subject…" className="sm:max-w-xs" />
              <div className="flex gap-2 sm:ml-auto">
                <button type="button" className="btn-ghost px-2 py-1.5 text-xs" onClick={() => setForm((current) => ({ ...current, subjectIds: subjects.map((subject) => subject.id) }))}>Select all</button>
                <button type="button" className="btn-ghost px-2 py-1.5 text-xs" onClick={() => setForm((current) => ({ ...current, subjectIds: [] }))}>Clear</button>
              </div>
            </div>
            <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredSubjects.length === 0 && <p className="col-span-full py-4 text-center text-sm text-slate-500">No subjects available or matched.</p>}
              {filteredSubjects.map((subject) => {
                const checked = form.subjectIds.includes(subject.id)
                return (
                  <label key={subject.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${checked ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleSubject(subject.id)} className="h-4 w-4 accent-brand-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-700">{subject.name}</span>
                      <span className="block text-[11px] text-slate-400">{subject.code} · Sem {subject.semester}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </Field>
      </form>
    </Modal>
  )
}
