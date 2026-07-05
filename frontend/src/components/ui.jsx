import { formatDisplayLabel } from '../utils/labels.js'

export function Card({ children, className = '' }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>{children}</section>
}

export function MetricCard({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-primary-50 text-primary-strong',
    green: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    critical: 'bg-red-100 text-red-700',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <Card className={tone === 'critical' ? 'bg-red-100 border-red-200' : ''}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <strong className="text-3xl font-800 text-slate-950">{value}</strong>
        
      </div>
    </Card>
  )
}

export function Badge({ children, type = 'status' }) {
  const text = String(children)
  const classes = {
    Critica: 'bg-red-100 text-red-700',
    Alta: 'bg-orange-100 text-orange-700',
    Media: 'bg-amber-100 text-amber-700',
    Baixa: 'bg-emerald-100 text-emerald-700',
    Aberta: 'bg-red-50 text-red-700',
    'Em andamento': 'bg-primary-50 text-primary-strong',
    'Em analise': 'bg-indigo-50 text-indigo-700',
    'Aguardando orcamento': 'bg-amber-50 text-amber-700',
    'Aguardando visita tecnica': 'bg-purple-50 text-purple-700',
    Resolvida: 'bg-emerald-50 text-emerald-700',
    Ativo: 'bg-emerald-50 text-emerald-700',
    Inativo: 'bg-slate-100 text-slate-600',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes[text] || 'bg-slate-100 text-slate-700'}`}>{formatDisplayLabel(text)}</span>
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-800 text-slate-950">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }

  return (
    <div className="fixed right-4 top-4 z-[60] w-[calc(100vw-2rem)] max-w-sm">
      <div className={`rounded-lg border px-4 py-3 shadow-lg ${styles[toast.type] || styles.info}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <strong className="block text-sm font-800">{toast.title}</strong>
            {toast.message && <p className="mt-1 text-sm font-semibold opacity-80">{toast.message}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar aviso" className="cursor-pointer rounded px-1 text-lg font-bold leading-none opacity-60 hover:opacity-100">
            &times;
          </button>
        </div>
      </div>
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold  text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500">
        <option value="">Todos</option>
        {options.map((option) => <option key={option} value={option}>{formatDisplayLabel(option)}</option>)}
      </select>
    </label>
  )
}

export function BarList({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm font-semibold text-slate-600"><span>{formatDisplayLabel(item.label)}</span><span>{item.value}</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
