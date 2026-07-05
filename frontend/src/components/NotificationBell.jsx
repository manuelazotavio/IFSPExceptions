import { useState } from 'react'
import { Icon } from './Icons.jsx'

export function NotificationBell({ notificacoes, onAbrir, onLimpar }) {
  const [open, setOpen] = useState(false)
  const naoLidas = notificacoes.filter((item) => !item.lida)

  function abrirNotificacao(notificacao) {
    onAbrir(notificacao)
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
        {naoLidas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
            {naoLidas.length > 9 ? '9+' : naoLidas.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <h3 className="text-sm font-800 text-slate-900">Notificações</h3>
            {naoLidas.length > 0 && (
              <button
                type="button"
                onClick={onLimpar}
                className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 && (
              <p className="px-4 py-8 text-center text-sm font-semibold text-slate-400">Nenhuma notificação no momento.</p>
            )}
            {notificacoes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => abrirNotificacao(item)}
                className={`flex w-full cursor-pointer items-start gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50 ${item.lida ? 'opacity-60' : ''}`}
              >
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.tipo === 'URGENTE' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary'}`}>
                  <Icon name={item.tipo === 'URGENTE' ? 'alert' : 'bell'} className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{item.titulo}</p>
                    {item.protocolo && <span className="shrink-0 text-xs font-semibold text-slate-400">{item.protocolo}</span>}
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
