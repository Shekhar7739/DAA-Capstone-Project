import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Network,
  Settings,
  Users,
  X,
} from 'lucide-react'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/conflict-graph', label: 'Conflict Graph', icon: Network },
  { to: '/generate', label: 'Generate Timetable', icon: CalendarClock },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/analysis', label: 'Algorithm Analysis', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
              <GraduationCap size={22} />
            </span>
            <span>
              <span className="block text-[15px] font-bold leading-tight tracking-tight text-slate-900">Exam Scheduler</span>
              <span className="block text-[11px] font-medium text-slate-400">Intelligent Timetable Generator</span>
            </span>
          </NavLink>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          {navigation.slice(0, 4).map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
          <p className="mb-3 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Scheduling</p>
          {navigation.slice(4).map((item) => <NavItem key={item.to} item={item} onClose={onClose} />)}
        </nav>

        <div className="m-3 rounded-xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100">
          <p className="text-xs font-bold text-brand-800">Graph Coloring Engine</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Backtracking solver assigns conflict-free exam slots automatically.</p>
        </div>
      </aside>
    </>
  )
}

function NavItem({ item, onClose }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-brand-50 text-brand-700 shadow-[inset_2px_0_0_0_theme(colors.brand.600)]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}
