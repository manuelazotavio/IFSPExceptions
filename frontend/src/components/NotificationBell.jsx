import { useState } from 'react'
import { Icon } from './Icons.jsx'

export function NotificationBell({ notificacoes, onNavigate }) {
  const [open, setOpen] = useState(false)

  function abrirOcorrencia(ocorrenciaId) {
    onNavigate(`/ocorrencias/${ocorrenciaId}`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notificacoes"
        className="relative cursor-pointer rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
      >
        <Icon name="bell" className="h-4 w-4" />
        {notificacoes.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {notificacoes.length > 9 ? '9+' : notificacoes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <h3 className="text-sm font-800 text-slate-900">Notificações</h3>
            {notificacoes.length > 0 && <span className="text-xs font-semibold text-slate-400">{notificacoes.length} no total</span>}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">Nenhuma notificação no momento.</p>
            )}
            {notificacoes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => abrirOcorrencia(item.ocorrenciaId)}
                className="flex w-full cursor-pointer items-start gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
              >
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.tipo === 'urgente' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary'}`}>
                  <Icon name={item.tipo === 'urgente' ? 'alert' : 'bell'} className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{item.tipo === 'urgente' ? 'Crítica em aberto' : 'Movimentação'}</p>
                    <span className="shrink-0 text-xs font-semibold text-slate-400">{item.protocolo}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
