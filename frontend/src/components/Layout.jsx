import { useState } from 'react'
import { NotificationBell } from './NotificationBell.jsx'
import { Sidebar } from './Sidebar.jsx'
import { buildNotificacoes } from '../utils/metrics.js'

const titles = {
  '/dashboard': 'Dashboard Geral',
  '/mapa': 'Mapa de calor de ocorrencias por escola',
  '/ocorrencias': 'Lista de ocorrencias',
  '/escolas': 'Escolas cadastradas',
  '/usuarios': 'Gerenciamento de usuarios',
  '/categorias': 'Categorias globais',
  '/configuracoes': 'Configuracoes',
}

const roleLabels = {
  SEDUC: 'SEDUC',
  DIRETOR: 'Diretor(a)',
  EXTERNO: 'Externo',
}

export function Layout({ route, onNavigate, onExport, user, onLogout, children }) {
  const [exportOpen, setExportOpen] = useState(false)
  const isExterno = user?.role === 'EXTERNO'
  const notificacoes = buildNotificacoes(user)
  const title = isExterno
    ? (route.startsWith('/ocorrencias/') ? 'Detalhe da ocorrencia' : 'Minhas ocorrencias')
    : titles[route]
      || (route.startsWith('/ocorrencias/') ? 'Detalhe da ocorrencia' : '')
      || (route.startsWith('/escolas/') ? 'Detalhe da escola' : '')
      || 'Dashboard geral'

  function handleExport(format) {
    onExport(format)
    setExportOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar route={route} onNavigate={onNavigate} user={user} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">SEDUC Caraguatatuba</p>
              <h1 className="text-2xl font-800 text-slate-950">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              {!isExterno && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportOpen((current) => !current)}
                    className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Exportar
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                      {['csv', 'pdf', 'xlsx'].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => handleExport(format)}
                          className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm font-semibold uppercase text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <NotificationBell notificacoes={notificacoes} onNavigate={onNavigate} />
              <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="truncate">{user?.nome}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">{roleLabels[user?.role] || user?.role}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sair
              </button>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
