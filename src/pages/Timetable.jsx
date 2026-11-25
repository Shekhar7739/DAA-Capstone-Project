import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Download, List, Printer, Table2, WandSparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import SearchInput from '../components/common/SearchInput'
import EmptyState from '../components/common/EmptyState'
import TimetableTable from '../components/timetable/TimetableTable'
import CalendarView from '../components/timetable/CalendarView'
import { formatDisplayDate } from '../utils/timetableGenerator'
import { downloadCSV, printPage } from '../utils/export'

export default function Timetable() {
  const { timetable, subjects } = useApp()
  const [view, setView] = useState('calendar')
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [semester, setSemester] = useState('all')
  const [date, setDate] = useState('all')

  const entries = timetable?.entries || []
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return entries.filter((entry) => {
      const matchesTerm = !term || [entry.name, entry.code, entry.department, entry.subjectId].some((value) => String(value).toLowerCase().includes(term))
      return matchesTerm
        && (department === 'all' || entry.department === department)
        && (semester === 'all' || String(entry.semester) === semester)
        && (date === 'all' || entry.date === date)
    })
  }, [entries, query, department, semester, date])

  const exportCSV = () => {
    if (!filtered.length) return
    downloadCSV('exam-timetable-filtered.csv', filtered.map((entry, index) => ({
      '#': index + 1, Subject: entry.name, Code: entry.code, Department: entry.department,
      Semester: entry.semester, Date: entry.date, Session: entry.session, Slot: entry.color + 1,
    })))
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Timetable"
        description="View the generated conflict-free exam schedule in calendar or table format."
        actions={
          timetable ? (
            <>
              <button type="button" onClick={exportCSV} className="btn-secondary"><Download size={16} /> Export CSV</button>
              <button type="button" onClick={printPage} className="btn-secondary"><Printer size={16} /> Print</button>
              <Link to="/generate" className="btn-primary"><WandSparkles size={16} /> Regenerate</Link>
            </>
          ) : <Link to="/generate" className="btn-primary"><WandSparkles size={16} /> Generate timetable</Link>}
      />

      {!timetable ? (
        <div className="card">
          <EmptyState
            icon={CalendarDays}
            title="No timetable generated yet"
            description="Configure exam dates and sessions, then run the graph-coloring solver to create a schedule."
            action={<Link to="/generate" className="btn-primary">Go to generator</Link>}
          />
        </div>
      ) : (
        <>
          <div className="card mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-sm">
            <span className="text-slate-500">Generated <strong className="text-slate-800">{new Date(timetable.generatedAt).toLocaleString()}</strong></span>
            <span className="text-slate-500">Exams <strong className="text-slate-800">{timetable.entries.length}</strong></span>
            <span className="text-slate-500">Slots <strong className="text-slate-800">{timetable.usedSlots}</strong></span>
            <span className="text-slate-500">Duration <strong className="text-slate-800">{timetable.examDuration} min</strong></span>
            <span className="badge ml-auto bg-emerald-50 text-emerald-700">✓ Conflict-free</span>
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
              <SearchInput value={query} onChange={setQuery} placeholder="Search scheduled subjects…" className="lg:max-w-xs" />
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <select className="input-base w-auto py-2" value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
                  <option value="all">All departments</option>
                  {[...new Set(entries.map((entry) => entry.department))].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select className="input-base w-auto py-2" value={semester} onChange={(event) => setSemester(event.target.value)} aria-label="Filter by semester">
                  <option value="all">All semesters</option>
                  {[...new Set(entries.map((entry) => entry.semester))].sort((a, b) => a - b).map((item) => <option key={item} value={item}>Semester {item}</option>)}
                </select>
                <select className="input-base w-auto py-2" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter by date">
                  <option value="all">All dates</option>
                  {timetable.examDates.map((item) => <option key={item} value={item}>{formatDisplayDate(item)}</option>)}
                </select>
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button type="button" onClick={() => setView('calendar')} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${view === 'calendar' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}><CalendarDays size={14} className="mr-1 inline" />Calendar</button>
                  <button type="button" onClick={() => setView('table')} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${view === 'table' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}><Table2 size={14} className="mr-1 inline" />Table</button>
                </div>
              </div>
            </div>

            {view === 'calendar'
              ? <CalendarView entries={filtered} dates={timetable.examDates} sessions={timetable.sessions} />
              : <TimetableTable entries={filtered} duration={timetable.examDuration} />}

            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              Showing <strong>{filtered.length}</strong> of {entries.length} scheduled exams · {subjects.length} subjects in workspace
            </div>
          </section>

          <div className="no-print mt-5 card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><List size={18} /></span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Validation summary</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  The schedule was verified against all {timetable.metrics.edges} conflict edges: no two subjects sharing a student are assigned to the same date and session.
                  The solver used {timetable.metrics.colorsUsed} colour classes and {timetable.metrics.backtracks} backtracking steps in {timetable.metrics.executionMs.toFixed(2)} ms.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
