import { useEffect, useState } from 'react'
import {
  Database,
  GraduationCap,
  Info,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { DEPARTMENTS } from '../data/sampleData'

const accents = [
  { id: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { id: 'violet', name: 'Violet', hex: '#8b5cf6' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6' },
]

export default function Settings() {
  const { settings, updateSettings, subjects, students, timetable, activities, resetSampleData, clearAllData } = useApp()
  const [form, setForm] = useState(settings)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { setForm(settings) }, [settings])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const saveExamSettings = () => {
    const sessions = form.sessions.map((session) => String(session).trim()).filter(Boolean)
    if (!sessions.length) { updateSettings({ sessions: ['09:00 – 11:00'] }); return }
    updateSettings({
      examDuration: Number(form.examDuration) || 120,
      examDays: Math.max(1, Math.min(30, Number(form.examDays) || 5)),
      maxExamsPerSlot: Math.max(1, Number(form.maxExamsPerSlot) || 4),
      defaultDepartment: form.defaultDepartment,
      defaultStartDate: form.defaultStartDate,
      sessions,
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="Configure examination defaults, appearance and persisted application data." />

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Settings2 size={20} /></span><div><h2 className="text-sm font-bold text-slate-900">Examination defaults</h2><p className="text-xs text-slate-500">Used when generating a timetable</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-base">Exam duration (minutes)</label><input type="number" min="30" max="360" step="15" className="input-base" value={form.examDuration} onChange={(event) => setField('examDuration', event.target.value)} /></div>
            <div><label className="label-base">Exam days</label><input type="number" min="1" max="30" className="input-base" value={form.examDays} onChange={(event) => setField('examDays', event.target.value)} /></div>
            <div><label className="label-base">Max exams per slot</label><input type="number" min="1" max="20" className="input-base" value={form.maxExamsPerSlot} onChange={(event) => setField('maxExamsPerSlot', event.target.value)} /></div>
            <div><label className="label-base">Default start date</label><input type="date" className="input-base" value={form.defaultStartDate} onChange={(event) => setField('defaultStartDate', event.target.value)} /></div>
            <div className="sm:col-span-2">
              <label className="label-base">Default department</label>
              <select className="input-base" value={form.defaultDepartment} onChange={(event) => setField('defaultDepartment', event.target.value)}>
                {[...new Set([...DEPARTMENTS, form.defaultDepartment])].filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="label-base">Available exam sessions</label>
            <div className="space-y-2">
              {form.sessions.map((session, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input className="input-base" value={session} onChange={(event) => setForm((current) => ({ ...current, sessions: current.sessions.map((item, i) => (i === index ? event.target.value : item)) }))} />
                  <button type="button" className="btn-ghost px-2" onClick={() => setField('sessions', form.sessions.filter((_, i) => i !== index))} title="Remove session"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setField('sessions', [...form.sessions, ''])} className="btn-ghost mt-2 text-xs text-brand-600"><Plus size={14} /> Add session</button>
          </div>

          <button type="button" onClick={saveExamSettings} className="btn-primary mt-5"><Save size={16} /> Save changes</button>
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Palette size={20} /></span><div><h2 className="text-sm font-bold text-slate-900">Appearance</h2><p className="text-xs text-slate-500">Applied instantly and saved automatically</p></div></div>
            <p className="label-base">Accent color</p>
            <div className="flex flex-wrap gap-3">
              {accents.map((accent) => (
                <button key={accent.id} type="button" onClick={() => updateSettings({ accent: accent.id })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${settings.accent === accent.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: accent.hex }} /> {accent.name}
                  {settings.accent === accent.id && <span className="text-[11px]">Active</span>}
                </button>
              ))}
            </div>
            <p className="label-base mt-5">Interface density</p>
            <div className="flex rounded-lg bg-slate-100 p-1">
              {['comfortable', 'compact'].map((option) => (
                <button key={option} type="button" onClick={() => updateSettings({ density: option })} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${settings.density === option ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}>{option}</button>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Info size={20} /></span><div><h2 className="text-sm font-bold text-slate-900">Application information</h2><p className="text-xs text-slate-500">Exam Scheduler v1.0.0</p></div></div>
            <dl className="space-y-2 text-sm">
              {[
                ['Purpose', 'Automated conflict-free exam timetabling'],
                ['Algorithm', 'Graph Coloring with Backtracking'],
                ['Heuristic', 'Descending degree vertex ordering'],
                ['Frontend', 'React + Vite + Tailwind CSS'],
                ['Charts', 'Recharts'],
                ['Persistence', 'Browser LocalStorage'],
                ['External APIs', 'None'],
              ].map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-slate-50 py-1.5 last:border-0"><dt className="text-slate-500">{key}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <section className="card mt-5 p-5">
        <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Database size={20} /></span><div><h2 className="text-sm font-bold text-slate-900">Data management</h2><p className="text-xs text-slate-500">All data is stored locally in this browser</p></div></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Subjects', subjects.length], ['Students', students.length], ['Activity events', activities.length],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setConfirm('reset')} className="btn-secondary"><RotateCcw size={16} /> Reset to Sample Data</button>
          <button type="button" onClick={() => setConfirm('clear')} className="btn-danger"><Trash2 size={16} /> Clear All Data</button>
          {timetable && <span className="badge self-center bg-emerald-50 text-emerald-700">Timetable stored</span>}
        </div>
      </section>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
        <GraduationCap size={20} className="text-brand-500" />
        Capstone project · Exam Scheduler – Intelligent Timetable Generator · Built with React, Vite and graph theory.
      </div>

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={resetSampleData}
        title="Reset to sample data?"
        message="This replaces all subjects, students and enrolments with the original 10-subject / 20-student sample data and clears the current timetable."
        confirmLabel="Reset data"
        danger={false}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        onClose={() => setConfirm(null)}
        onConfirm={clearAllData}
        title="Clear all data?"
        message="This permanently removes all subjects, students, enrolments, timetable, activity logs and settings from LocalStorage. This cannot be undone."
        confirmLabel="Clear everything"
      />
    </div>
  )
}
