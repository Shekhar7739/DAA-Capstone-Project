import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, GitBranch, Info, Network, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import ConflictGraph from '../components/graph/ConflictGraph'

export default function ConflictGraphPage() {
  const { subjects, students, conflictGraph, timetable } = useApp()
  const [view, setView] = useState('list')
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const assignment = timetable?.entries
    ? Object.fromEntries(timetable.entries.map((entry) => [entry.subjectId, entry.color]))
    : {}
  const density = subjects.length > 1 ? (2 * conflictGraph.edgeCount) / (subjects.length * (subjects.length - 1)) : 0

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Conflict Graph"
        description="Subjects are vertices. Shared-student overlaps are edges. Drag nodes, hover for details and inspect the adjacency structures."
        badge={<span className="badge bg-brand-50 text-brand-700">Auto-detected</span>}
        actions={<Link to="/generate" className="btn-primary"><GitBranch size={16} /> Generate from graph</Link>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Vertices', value: subjects.length, icon: Network, note: 'Subjects in graph' },
          { label: 'Edges', value: conflictGraph.edgeCount, icon: GitBranch, note: 'Conflicting pairs' },
          { label: 'Graph density', value: density.toFixed(2), icon: Info, note: 'Actual / possible edges' },
          { label: 'Shared-student links', value: conflictGraph.edges.reduce((sum, edge) => sum + edge.sharedCount, 0), icon: Users, note: 'Student-pair overlaps' },
        ].map((item) => (
          <div key={item.label} className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><item.icon size={19} /></span>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p><p className="text-xl font-bold text-slate-900">{item.value}</p><p className="text-[11px] text-slate-500">{item.note}</p></div>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Interactive subject conflict graph</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {timetable ? 'Node colours represent assigned exam slots.' : 'Node colours represent departments until a timetable is generated.'}
            </p>
          </div>
          <Link to="/students" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">Edit enrolments <ArrowRight size={13} /></Link>
        </div>
        <ConflictGraph subjects={subjects} graph={conflictGraph} assignment={assignment} students={students} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">Conflicting subject pairs</h2>
            <p className="mt-0.5 text-xs text-slate-500">Computed from {students.length} students and their enrolments</p>
          </div>
          {conflictGraph.edges.length === 0 ? (
            <EmptyState icon={GitBranch} title="No conflicts found" description="Two subjects conflict when a student is enrolled in both." />
          ) : (
            <div className="table-wrap">
              <table className="table-base min-w-[440px]">
                <thead><tr><th>Subject pair</th><th>Departments</th><th className="text-right">Shared students</th></tr></thead>
                <tbody>
                  {conflictGraph.edges.map((edge) => (
                    <tr key={edge.key}>
                      <td>
                        <p className="font-semibold text-slate-800">{subjectMap.get(edge.a)?.code} ↔ {subjectMap.get(edge.b)?.code}</p>
                        <p className="text-[11px] text-slate-400">{subjectMap.get(edge.a)?.name} & {subjectMap.get(edge.b)?.name}</p>
                      </td>
                      <td className="text-xs text-slate-500">{subjectMap.get(edge.a)?.department}<br />{subjectMap.get(edge.b)?.department}</td>
                      <td className="text-right"><span className="badge bg-rose-50 font-bold text-rose-700">{edge.sharedCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Adjacency structures</h2>
              <p className="mt-0.5 text-xs text-slate-500">Consumed directly by the backtracking solver</p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {['list', 'matrix'].map((option) => (
                <button key={option} type="button" onClick={() => setView(option)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${view === option ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{option}</button>
              ))}
            </div>
          </div>
          {subjects.length === 0 ? (
            <EmptyState icon={Network} title="No graph data" description="Add subjects to see adjacency data." />
          ) : view === 'list' ? (
            <div className="max-h-[420px] overflow-y-auto p-4">
              {subjects.map((subject) => {
                const neighbours = conflictGraph.adjacency[subject.id] || []
                return (
                  <div key={subject.id} className="border-b border-slate-50 py-2.5 last:border-0">
                    <p className="text-sm font-semibold text-slate-800">{subject.code} <span className="font-normal text-slate-400">· {subject.name}</span></p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {neighbours.length === 0 ? <span className="badge bg-emerald-50 text-emerald-700">No conflicts</span> : neighbours.map((neighbour) => (
                        <span key={neighbour.id} className="badge bg-rose-50 text-rose-700">{subjectMap.get(neighbour.id)?.code} ({neighbour.sharedCount})</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="max-h-[420px] overflow-auto p-4">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white px-2 py-2 font-bold text-slate-500"> </th>
                    {subjects.map((subject) => <th key={subject.id} className="px-2 py-2 font-bold text-slate-500">{subject.code}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((row) => (
                    <tr key={row.id}>
                      <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-bold text-slate-500">{row.code}</th>
                      {subjects.map((column) => {
                        const value = conflictGraph.matrix[row.id]?.[column.id] || 0
                        return (
                          <td key={column.id} className={`border border-slate-100 px-2 py-2 text-center font-semibold ${value ? 'bg-rose-50 text-rose-700' : 'text-slate-300'}`}>
                            {value || '·'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
