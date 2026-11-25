import { useEffect, useState } from 'react'
import Modal from '../common/Modal'
import Field from '../common/Field'
import { DEPARTMENTS, SEMESTERS } from '../../data/sampleData'
import { validateSubject } from '../../utils/validation'

const emptyForm = { name: '', code: '', department: '', semester: 1 }

export default function SubjectForm({ open, initial, subjects, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(initial ? { name: initial.name, code: initial.code, department: initial.department, semester: initial.semester } : { ...emptyForm })
      setErrors({})
    }
  }, [open, initial])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validateSubject({ ...form, id: initial?.id }, subjects)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return
    onSubmit({
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      department: form.department.trim(),
      semester: Number(form.semester),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit subject' : 'Add new subject'}
      description={initial ? 'Update the subject details below.' : 'Create a subject that can be scheduled for an exam.'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="subject-form" className="btn-primary">{initial ? 'Save changes' : 'Add subject'}</button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Subject name" required error={errors.name} className="sm:col-span-2">
          <input className="input-base" value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Data Structures" autoFocus />
        </Field>
        <Field label="Subject code" required error={errors.code} hint="Unique short code, e.g. CS301">
          <input className="input-base" value={form.code} onChange={(event) => setField('code', event.target.value.toUpperCase())} placeholder="CS301" />
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <select className="input-base" value={form.semester} onChange={(event) => setField('semester', event.target.value)}>
            {SEMESTERS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
          </select>
        </Field>
        <Field label="Department" required error={errors.department} className="sm:col-span-2">
          <input className="input-base" list="department-options" value={form.department} onChange={(event) => setField('department', event.target.value)} placeholder="Select or type a department" />
          <datalist id="department-options">
            {DEPARTMENTS.map((department) => <option key={department} value={department} />)}
          </datalist>
        </Field>
      </form>
    </Modal>
  )
}
