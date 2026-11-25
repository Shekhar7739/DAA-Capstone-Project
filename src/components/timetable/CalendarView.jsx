import { colorForSlot } from '../../utils/constants'
import { formatDisplayDate } from '../../utils/timetableGenerator'

export default function CalendarView({ entries, dates, sessions }) {
  if (!entries.length) return <p className="px-5 py-12 text-center text-sm text-slate-500">No exams match the current filters.</p>

  return (
    <div className="overflow-x-auto p-4">
      <div className="min-w-[760px] space-y-4">
        {dates.map((date) => {
          const dayEntries = entries.filter((entry) => entry.date === date)
          if (!dayEntries.length) return null
          return (
            <div key={date} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                <p className="text-sm font-bold text-slate-800">{formatDisplayDate(date)}</p>
                <span className="text-xs text-slate-500">{dayEntries.length} exam{dayEntries.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${sessions.length}, minmax(0, 1fr))` }}>
                {sessions.map((session) => {
                  const cellEntries = dayEntries.filter((entry) => entry.session === session)
                  return (
                    <div key={session} className="min-h-[110px] bg-white p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{session}</p>
                      {cellEntries.length === 0 ? (
                        <p className="text-xs text-slate-300">No exams</p>
                      ) : (
                        <div className="space-y-1.5">
                          {cellEntries.map((entry) => {
                            const palette = colorForSlot(entry.color)
                            return (
                              <div key={entry.subjectId} className={`rounded-lg border px-2.5 py-2 ${palette.bg} ${palette.border}`}>
                                <p className={`text-xs font-bold ${palette.text}`}>{entry.code}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-600">{entry.name}</p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
