import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const styles = {
  success: { icon: CheckCircle2, accent: 'text-emerald-600', bar: 'bg-emerald-500' },
  info: { icon: Info, accent: 'text-brand-600', bar: 'bg-brand-500' },
  error: { icon: AlertCircle, accent: 'text-rose-600', bar: 'bg-rose-500' },
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const style = styles[toast.type] || styles.success
        const Icon = style.icon
        return (
          <div key={toast.id} className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-float animate-slide-in-right">
            <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />
            <Icon size={18} className={`mt-0.5 shrink-0 ${style.accent}`} />
            <p className="flex-1 text-sm font-medium leading-snug text-slate-700">{toast.message}</p>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
