import { colorForSlot } from '../../utils/constants'
import { formatDisplayDate } from '../../utils/timetableGenerator'

export default function TimetableTable({ entries, duration }) {
  if (!entries.length) return <p className="px-5 py-12 text-center text-sm text-slate-500">No exams match the current filters.</p>
  return (
    <div className="table-wrap">
      <table className="table-base">
        <thead>
          <tr>
            <th>#</th><th>Subject</th><th>Code</th><th>Date</th><th>Session</th><th>Slot</th><th>Department</th><th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const palette = colorForSlot(entry.color)
            return (
              <tr key={entry.subjectId}>
                <td className="text-slate-400">{index + 1}</td>
                <td><span className="font-semibold text-slate-800">{entry.name}</span></td>
                <td><span className="badge bg-slate-100 font-mono text-slate-600">{entry.code}</span></td>
                <td className="whitespace-nowrap">{formatDisplayDate(entry.date)}</td>
                <td className="whitespace-nowrap">{entry.session} <span className="text-[11px] text-slate-400">({duration} min)</span></td>
                <td><span className={`badge ${palette.chip}`}><span className="h-2 w-2 rounded-full" style={{ background: palette.hex }} /> Slot {entry.color + 1}</span></td>
                <td className="text-slate-600">{entry.department}</td>
                <td><span className="badge bg-brand-50 text-brand-700">Sem {entry.semester}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
