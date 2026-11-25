import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  GitBranch,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/dashboard/StatCard'
import DashboardCharts from '../components/dashboard/DashboardCharts'

const activityIcons = {
  subject: BookOpen,
  student: Users,
  conflict: GitBranch,
  timetable: CalendarCheck2,
  system: Sparkles,
}

const activityColors = {
  subject: 'bg-brand-50 text-brand-600',
  student: 'bg-sky-50 text-sky-600',
  conflict: 'bg-amber-50 text-amber-600',
  timetable: 'bg-emerald-50 text-emerald-600',
  system: 'bg-slate-100 text-slate-600',
}

function timeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

export default function Dashboard() {
  const { subjects, students, enrollments, conflictGraph, minimumSlots, timetable, activities, resetSampleData } = useApp()
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Monitor subjects, students, conflicts and exam scheduling at a glance."
        badge={<span className="badge bg-emerald-50 text-emerald-700">● System online</span>}
        actions={
          <>
            <button type="button" onClick={resetSampleData} className="btn-secondary"><RefreshCw size={16} /> Reset sample data</button>
            <Link to="/generate" className="btn-primary"><Sparkles size={16} /> Generate timetable</Link>
          </>
        }
      />

      {subjects.length === 0 && students.length === 0 && (
        <div className="card mb-5 flex flex-col items-center gap-3 border-dashed p-8 text-center">
          <GraduationCap size={28} className="text-brand-500" />
          <p className="font-semibold text-slate-800">Your workspace is empty</p>
          <p className="text-sm text-slate-500">Restore the realistic sample university data to explore the complete system.</p>
          <button type="button" className="btn-primary" onClick={resetSampleData}>Load sample data</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Total Subjects" value={subjects.length} description="Courses available for exam scheduling" tone="brand" />
        <StatCard icon={Users} label="Total Students" value={students.length} description={`${enrollments.length} enrolment records tracked`} tone="sky" />
        <StatCard icon={GitBranch} label="Total Conflicts" value={conflictGraph.edgeCount} description="Subject pairs with shared students" tone="amber" />
        <StatCard icon={CalendarClock} label="Exam Slots Required" value={minimumSlots} description={timetable ? `${timetable.metrics.colorsUsed} slots used in current timetable` : 'Minimum computed by graph coloring'} tone="emerald" />
      </div>

      <div className="mt-5"><DashboardCharts /></div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <p className="mt-0.5 text-xs text-slate-500">Persisted changes in this workspace</p>
            </div>
            <Link to="/settings" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">Manage <ArrowRight size={13} /></Link>
          </div>
          <div className="max-h-[380px] overflow-y-auto px-5 py-2">
            {activities.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No activity recorded yet.</p>
            ) : activities.slice(0, 8).map((item) => {
              const Icon = activityIcons[item.type] || Sparkles
              return (
                <div key={item.id} className="flex items-start gap-3 border-b border-slate-50 py-3 last:border-0">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColors[item.type] || activityColors.system}`}><Icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{item.message}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(item.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Conflicts</h2>
              <p className="mt-0.5 text-xs text-slate-500">Subject pairs sharing the most students</p>
            </div>
            <Link to="/conflict-graph" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">View graph <ArrowRight size={13} /></Link>
          </div>
          <div className="px-5 py-2">
            {conflictGraph.edges.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No conflicts detected. Enrol students in multiple subjects.</p>
            ) : conflictGraph.edges.slice(0, 6).map((edge) => (
              <div key={edge.key} className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">{edge.sharedCount}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {subjectMap.get(edge.a)?.code || edge.a} <span className="text-slate-300">↔</span> {subjectMap.get(edge.b)?.code || edge.b}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{subjectMap.get(edge.a)?.name} & {subjectMap.get(edge.b)?.name}</p>
                </div>
                <span className="badge bg-slate-50 text-slate-500">{edge.sharedCount} shared</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
