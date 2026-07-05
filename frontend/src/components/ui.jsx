import { useEffect, useRef, useState } from 'react'
import { formatDisplayLabel } from '../utils/labels.js'
import { Icon } from './Icons.jsx'

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

export function Badge({ children, type = 'status', className = '' }) {
  const text = Array.isArray(children) ? children.map((item) => String(item)).join('') : String(children)
  const classes = {
    Critica: 'bg-red-100 text-red-700',
    critica: 'bg-red-100 text-red-700',
    Alta: 'bg-orange-100 text-orange-700',
    Media: 'bg-amber-100 text-amber-700',
    Baixa: 'bg-emerald-100 text-emerald-700',
    'Aguardando aprovacao': 'bg-sky-50 text-sky-700',
    Aberta: 'bg-red-50 text-red-700',
    aberta: 'bg-red-50 text-red-700',
    'Em andamento': 'bg-primary-50 text-primary-strong',
    'Em analise': 'bg-indigo-50 text-indigo-700',
    'Aguardando visita tecnica': 'bg-purple-50 text-purple-700',
    Resolvida: 'bg-emerald-50 text-emerald-700',
    resolvida: 'bg-emerald-50 text-emerald-700',
    Ativo: 'bg-emerald-50 text-emerald-700',
    Inativo: 'bg-slate-100 text-slate-600',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes[text] || 'bg-slate-100 text-slate-700'} ${className}`}>{formatDisplayLabel(text)}</span>
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

function normalizeOption(option) {
  if (option && typeof option === 'object' && 'value' in option) return option
  return { value: option, label: formatDisplayLabel(option) }
}

export function Select({ value, onChange, options, placeholder = 'Selecione...', disabled = false, className = '', size = 'md', direction = 'down' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const normalized = options.map(normalizeOption)
  const selected = normalized.find((item) => item.value === value)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function selecionar(nextValue) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${open ? 'z-[4000]' : 'z-10'} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-md border bg-white outline-none transition ${
          size === 'xs' ? 'h-8 px-2 text-xs' : size === 'sm' ? 'h-9 px-3 text-sm' : size === 'lg' ? 'h-11 px-3 text-sm' : 'h-10 px-3 text-sm'
        } ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            : open
              ? 'cursor-pointer border-primary ring-2 ring-primary-100'
              : 'cursor-pointer border-slate-200 hover:border-primary-300'
        }`}
      >
        <span className={`truncate ${selected ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="chevron-down" className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180 text-primary' : 'text-slate-400'}`} />
      </button>

      {open && !disabled && (
        <ul role="listbox" className={`absolute z-[5000] max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {normalized.map((item) => {
            const active = item.value === value
            return (
              <li key={item.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => selecionar(item.value)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded px-3 py-2 text-left text-sm font-semibold ${
                    active ? 'bg-primary-50 text-primary-strong' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {active && <Icon name="check" className="h-4 w-4 shrink-0 text-primary-strong" />}
                </button>
              </li>
            )
          })}
          {!normalized.length && (
            <li className="px-3 py-2 text-sm font-semibold text-slate-400">Nenhuma opção disponível</li>
          )}
        </ul>
      )}
    </div>
  )
}

export function FilterSelect({ label, value, onChange, options }) {
  const normalizedOptions = options.map(normalizeOption)
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <Select
        value={value}
        onChange={onChange}
        placeholder="Todos"
        options={[{ value: '', label: 'Todos' }, ...normalizedOptions]}
      />
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
