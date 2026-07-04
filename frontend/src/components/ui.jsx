export function Card({ children, className = '' }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>{children}</section>
}

export function MetricCard({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
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
    'Em andamento': 'bg-blue-50 text-blue-700',
    'Em analise': 'bg-indigo-50 text-indigo-700',
    'Aguardando orcamento': 'bg-amber-50 text-amber-700',
    'Aguardando visita tecnica': 'bg-purple-50 text-purple-700',
    Resolvida: 'bg-emerald-50 text-emerald-700',
    Ativo: 'bg-emerald-50 text-emerald-700',
    Inativo: 'bg-slate-100 text-slate-600',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes[text] || 'bg-slate-100 text-slate-700'}`}>{children}</span>
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-800 text-slate-950">{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold  text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
        <option value="">Todos</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
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
          <div className="mb-1 flex justify-between text-sm font-semibold text-slate-600"><span>{item.label}</span><span>{item.value}</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${(item.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}
