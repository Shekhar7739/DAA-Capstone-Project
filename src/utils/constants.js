export const COLOR_PALETTE = [
  { name: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', chip: 'bg-indigo-100 text-indigo-700' },
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-700' },
  { name: 'Amber', hex: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', chip: 'bg-amber-100 text-amber-700' },
  { name: 'Sky', hex: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', chip: 'bg-sky-100 text-sky-700' },
  { name: 'Rose', hex: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', chip: 'bg-rose-100 text-rose-700' },
  { name: 'Violet', hex: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', chip: 'bg-violet-100 text-violet-700' },
  { name: 'Teal', hex: '#14b8a6', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', chip: 'bg-teal-100 text-teal-700' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', chip: 'bg-orange-100 text-orange-700' },
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', chip: 'bg-blue-100 text-blue-700' },
  { name: 'Lime', hex: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', chip: 'bg-lime-100 text-lime-700' },
]

export function colorForSlot(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length]
}

export const DEPARTMENT_COLORS = {
  'Computer Science': '#6366f1',
  'Electronics & Communication': '#0ea5e9',
  'Mechanical Engineering': '#f59e0b',
  Mathematics: '#10b981',
}
