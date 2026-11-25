import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, GitBranch, Layers3 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { DEPARTMENT_COLORS } from '../../utils/constants'
import EmptyState from '../common/EmptyState'

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 12px 32px -12px rgba(15,23,42,.25)', fontSize: 12 },
  labelStyle: { fontWeight: 700, color: '#0f172a' },
}

function ChartCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="card p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon size={18} /></div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default function DashboardCharts() {
  const { subjects, conflictGraph, timetable } = useApp()

  const departmentData = useMemo(() => {
    const counts = {}
    subjects.forEach((subject) => {
      const key = subject.department || 'Unassigned'
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name: name.replace(' & Communication', ' & Comm.').replace(' Engineering', ' Eng.'), count, fullName: name }))
  }, [subjects])

  const conflictByDepartment = useMemo(() => {
    const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))
    const counts = {}
    conflictGraph.edges.forEach((edge) => {
      ;[edge.a, edge.b].forEach((id) => {
        const department = subjectMap.get(id)?.department || 'Unassigned'
        counts[department] = (counts[department] || 0) + 1
      })
    })
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(' & Communication', ' & Comm.').replace(' Engineering', ' Eng.'), fullName: name, value }))
  }, [conflictGraph.edges, subjects])

  const slotData = useMemo(() => {
    if (!timetable) return []
    return timetable.slotUsage.map((slot) => ({
      name: `${slot.date.slice(5)} ${slot.session.split('–')[0].trim()}`,
      exams: slot.count,
      full: `${slot.date} · ${slot.session}`,
    }))
  }, [timetable])

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <ChartCard icon={Layers3} title="Subject Distribution" subtitle="Subjects grouped by department">
        {departmentData.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${value} subjects`, 'Count']} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title="No subjects yet" description="Add subjects to see their distribution." />}
      </ChartCard>

      <ChartCard icon={GitBranch} title="Conflict Distribution" subtitle="Conflict endpoints by department">
        {conflictByDepartment.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conflictByDepartment} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {conflictByDepartment.map((entry) => (
                    <Cell key={entry.name} fill={DEPARTMENT_COLORS[entry.fullName] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value, name) => [`${value} conflict endpoints`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title="No conflicts detected" description="Enrol students in multiple subjects to create conflicts." />}
      </ChartCard>

      <ChartCard icon={BarChart3} title="Timetable Slot Usage" subtitle="Exams scheduled per date and session">
        {slotData.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slotData} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: '#f1f5f9' }} labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ''} formatter={(value) => [`${value} exams`, 'Scheduled']} />
                <Bar dataKey="exams" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title="No timetable generated" description="Generate a timetable to see slot utilisation here." />}
      </ChartCard>
    </div>
  )
}
