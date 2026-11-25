import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Menu, Search, Settings2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const routeLabels = {
  '/': 'Dashboard',
  '/subjects': 'Subjects',
  '/students': 'Students',
  '/conflict-graph': 'Conflict Graph',
  '/generate': 'Generate Timetable',
  '/timetable': 'Timetable',
  '/analysis': 'Algorithm Analysis',
  '/settings': 'Settings',
}

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { subjects, students, activities } = useApp()
  const [query, setQuery] = useState('')
  const [openPanel, setOpenPanel] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => { setOpenPanel(null); setQuery('') }, [location.pathname])

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpenPanel(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return { subjects: [], students: [] }
    return {
      subjects: subjects.filter((subject) => [subject.name, subject.code, subject.department].some((value) => String(value).toLowerCase().includes(term))).slice(0, 4),
      students: students.filter((student) => [student.name, student.email, student.id].some((value) => String(value).toLowerCase().includes(term))).slice(0, 4),
    }
  }, [query, subjects, students])

  const currentLabel = routeLabels[location.pathname] || 'Dashboard'

  const goToSearch = (path) => {
    setOpenPanel(null)
    setQuery('')
    navigate(`${path}?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="no-print sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button type="button" onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <Link to="/" className="text-slate-400 transition hover:text-brand-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="truncate font-semibold text-slate-700">{currentLabel}</span>
      </div>

      <div className="relative ml-auto w-full max-w-xs" ref={containerRef}>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setOpenPanel('search') }}
            onFocus={() => setOpenPanel('search')}
            onKeyDown={(event) => { if (event.key === 'Enter' && query.trim()) goToSearch('/subjects') }}
            placeholder="Search subjects, students…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/10"
          />
        </div>
        {openPanel === 'search' && query.trim() && (
          <div className="absolute right-0 top-11 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-float animate-slide-up">
            {results.subjects.length === 0 && results.students.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-slate-500">No matches for “{query}”</p>
            ) : (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.subjects.length > 0 && <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Subjects</p>}
                {results.subjects.map((subject) => (
                  <button key={subject.id} type="button" onClick={() => navigate(`/subjects?q=${encodeURIComponent(subject.code)}`)} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-700">{subject.name}</span>
                    <span className="text-xs text-slate-400">{subject.code}</span>
                  </button>
                ))}
                {results.students.length > 0 && <p className="mt-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Students</p>}
                {results.students.map((student) => (
                  <button key={student.id} type="button" onClick={() => navigate(`/students?q=${encodeURIComponent(student.name)}`)} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-700">{student.name}</span>
                    <span className="text-xs text-slate-400">{student.id}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => goToSearch('/subjects')} className="w-full border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-brand-600 hover:bg-brand-50">
              Search all data for “{query}”
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenPanel(openPanel === 'notifications' ? null : 'notifications')}
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {activities.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
        {openPanel === 'notifications' && (
          <div className="absolute right-0 top-11 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-float animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Recent activity</p>
              <span className="text-xs text-slate-400">{activities.length} events</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {activities.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">No activity yet.</p> : activities.slice(0, 8).map((item) => (
                <div key={item.id} className="border-b border-slate-50 px-4 py-3 last:border-0">
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{relativeTime(item.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link to="/settings" className="flex shrink-0 items-center gap-2 rounded-lg py-1 pl-1 pr-1 transition hover:bg-slate-100 sm:pr-2" title="Open settings">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">ES</span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold leading-tight text-slate-800">Scheduler Admin</span>
          <span className="block text-[11px] text-slate-400">University</span>
        </span>
        <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
      </Link>
      <Link to="/settings" className="hidden text-slate-400 hover:text-brand-600 xl:block" title="Settings"><Settings2 size={18} /></Link>
    </header>
  )
}
