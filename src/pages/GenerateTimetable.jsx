import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import { generateTimetable } from '../utils/timetableGenerator'
import { downloadCSV, printPage } from '../utils/export'
import { isValidDate } from '../utils/validation'

function defaultDate(offset = 1) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function GenerateTimetable() {
  const { subjects, students, settings, timetable, saveTimetable } = useApp()
  const [startDate, setStartDate] = useState(settings.defaultStartDate || defaultDate())
  const [days, setDays] = useState(settings.examDays || 5)
  const [duration, setDuration] = useState(settings.examDuration || 120)
  const [sessions, setSessions] = useState([...(settings.sessions || [])])
  const [maxPerSlot, setMaxPerSlot] = useState(settings.maxExamsPerSlot || 4)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lastAlgorithm, setLastAlgorithm] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const slotCount = useMemo(() => {
    const validDays = Number.isFinite(Number(days)) ? Math.max(0, Math.floor(Number(days))) : 0
    return isValidDate(startDate) ? validDays * sessions.filter((session) => session.trim()).length : 0
  }, [startDate, days, sessions])

  const handleGenerate = () => {
    if (!isValidDate(startDate)) { setError('Please select a valid start date.'); return }
    if (!sessions.some((session) => session.trim())) { setError('Configure at least one exam session.'); return }
    if (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 30) { setError('Exam days must be between 1 and 30.'); return }
    if (!Number.isInteger(Number(maxPerSlot)) || Number(maxPerSlot) < 1) { setError('Maximum exams per slot must be at least 1.'); return }
    if (!Number.isInteger(Number(duration)) || Number(duration) < 30 || Number(duration) > 360) { setError('Exam duration must be between 30 and 360 minutes.'); return }

    setError('')
    setBusy(true)
    timerRef.current = setTimeout(() => {
      const result = generateTimetable(subjects, students, settings, {
        startDate,
        examDates: undefined,
        sessions: sessions.map((session) => session.trim()).filter(Boolean),
        maxExamsPerSlot: Number(maxPerSlot),
        examDuration: Number(duration),
      })
      if (result.success) {
        saveTimetable(result.timetable)
        setLastAlgorithm(result.algorithm)
      } else {
        setError(result.error)
        if (result.algorithm) setLastAlgorithm(result.algorithm)
      }
      setBusy(false)
    }, 320)
  }

  const exportCSV = () => {
    if (!timetable) return
    downloadCSV('exam-timetable.csv', timetable.entries.map((entry, index) => ({
      '#': index + 1,
      'Subject ID': entry.subjectId,
      'Subject': entry.name,
      'Subject Code': entry.code,
      'Department': entry.department,
      'Semester': entry.semester,
      'Exam Date': entry.date,
      'Session': entry.session,
      'Duration (min)': timetable.examDuration,
      'Slot': entry.color + 1,
    })))
  }

  const metrics = timetable?.metrics
  const displayedMetrics = lastAlgorithm && !timetable ? {
    colorsUsed: lastAlgorithm.colorsUsed,
    vertices: lastAlgorithm.order?.length || 0,
    edges: subjects.length ? undefined : 0,
    attempts: lastAlgorithm.attempts,
    backtracks: lastAlgorithm.backtracks,
    nodesVisited: lastAlgorithm.nodesVisited,
    executionMs: lastAlgorithm.executionMs,
    optimal: lastAlgorithm.optimal,
  } : metrics

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Generate Timetable"
        description="Configure exam windows, then let the backtracking graph-coloring solver build a conflict-free schedule."
        badge={<span className="badge bg-brand-50 text-brand-700">Real algorithm</span>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><CalendarDays size={20} /></span>
            <div><h2 className="text-sm font-bold text-slate-900">Examination configuration</h2><p className="text-xs text-slate-500">Settings apply to this generation run only</p></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-base">Start date<span className="ml-0.5 text-rose-500">*</span></label>
              <input type="date" className="input-base" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="label-base">Number of exam days</label>
              <input type="number" min="1" max="30" className="input-base" value={days} onChange={(event) => setDays(event.target.value)} />
            </div>
            <div>
              <label className="label-base">Exam duration (minutes)</label>
              <div className="relative">
                <Clock3 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="30" max="360" step="15" className="input-base pl-9" value={duration} onChange={(event) => setDuration(event.target.value)} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Default can be changed in Settings</p>
            </div>
            <div>
              <label className="label-base">Max exams per slot</label>
              <input type="number" min="1" max="20" className="input-base" value={maxPerSlot} onChange={(event) => setMaxPerSlot(event.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <label className="label-base">Available exam sessions</label>
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-400">{index + 1}</span>
                  <input
                    className="input-base"
                    value={session}
                    onChange={(event) => setSessions((current) => current.map((item, i) => (i === index ? event.target.value : item)))}
                    placeholder="09:00 – 11:00"
                  />
                  <button type="button" className="btn-ghost px-2" onClick={() => setSessions((current) => current.filter((_, i) => i !== index))} title="Remove session"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSessions((current) => [...current, ''])} className="btn-ghost mt-2 text-xs text-brand-600"><Plus size={14} /> Add session</button>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Total available slots</span>
            <span className="font-bold text-slate-900">{slotCount}</span>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <button type="button" onClick={handleGenerate} disabled={busy || !subjects.length || !students.length} className="btn-primary mt-5 w-full py-3">
            {busy ? <><Loader2 size={18} className="animate-spin" /> Running backtracking solver…</> : <><Sparkles size={18} /> {timetable ? 'Regenerate timetable' : 'Generate timetable'}</>}
          </button>
          {(!subjects.length || !students.length) && <p className="mt-2 text-center text-xs text-rose-600">Add subjects and students before generating.</p>}
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${timetable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {timetable ? <CheckCircle2 size={20} /> : <RefreshCw size={20} />}
                </span>
                <div><h2 className="text-sm font-bold text-slate-900">{timetable ? 'Timetable ready' : 'No timetable generated'}</h2><p className="text-xs text-slate-500">{timetable ? `Generated ${new Date(timetable.generatedAt).toLocaleString()}` : 'Configure the exam window and run the solver'}</p></div>
              </div>
              {timetable && <span className="badge bg-emerald-50 text-emerald-700">Validated</span>}
            </div>

            {timetable ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Exams', timetable.entries.length],
                    ['Slots used', `${timetable.usedSlots}/${timetable.totalSlots}`],
                    ['Colors', timetable.metrics.colorsUsed],
                    ['Conflicts', timetable.metrics.edges],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/timetable" className="btn-primary"><CalendarDays size={16} /> View timetable</Link>
                  <button type="button" onClick={exportCSV} className="btn-secondary"><Download size={16} /> Download CSV</button>
                  <button type="button" onClick={printPage} className="btn-secondary"><Printer size={16} /> Print</button>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-500">The solver builds a subject conflict graph, orders vertices by degree, and searches for the minimum number of colours. Each colour becomes an exam slot.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Algorithm execution statistics</h2>
            <p className="mt-0.5 text-xs text-slate-500">Measured during the last solver run</p>
            {displayedMetrics ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Vertices', displayedMetrics.vertices],
                  ['Edges', displayedMetrics.edges ?? '—'],
                  ['Colors used', displayedMetrics.colorsUsed],
                  ['Attempts', displayedMetrics.attempts ?? 1],
                  ['Backtracks', displayedMetrics.backtracks],
                  ['Nodes visited', displayedMetrics.nodesVisited],
                  ['Execution time', `${(displayedMetrics.executionMs || 0).toFixed(2)} ms`],
                  ['Optimal proven', displayedMetrics.optimal ? 'Yes' : 'No / limited'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-100 p-3"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">Run the solver to see measured statistics.</div>
            )}
            {displayedMetrics?.optimal === false && <p className="mt-3 text-xs text-amber-600">Note: a search limit was reached, so the minimum may not be proven optimal.</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
