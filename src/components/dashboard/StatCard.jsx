export default function StatCard({ icon: Icon, label, value, description, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  }

  return (
    <div className="card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={21} />
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Live</span>
      </div>
      <p className="mt-4 text-[32px] font-bold leading-none tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}
