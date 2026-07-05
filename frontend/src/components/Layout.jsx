import { useCallback, useEffect, useState } from 'react'
import { Icon } from './Icons.jsx'
import { NotificationBell } from './NotificationBell.jsx'
import { Sidebar } from './Sidebar.jsx'
import { listarNotificacoes, marcarNotificacaoLida, marcarNotificacoesLidas } from '../services/api.js'

const INTERVALO_ATUALIZACAO_NOTIFICACOES = 20000

const titles = {
  '/dashboard': 'Dashboard',
  '/mapa': 'Mapa de calor de ocorrências por escola',
  '/ocorrencias': 'Lista de ocorrências',
  '/escolas': 'Escolas cadastradas',
  '/usuarios': 'Usuários',
  '/categorias': 'Categorias globais',
  '/auditoria': 'Log de auditoria',
  '/configuracoes': 'Configurações',
}

const roleLabels = {
  SEDUC: 'SEDUC',
  DIRETOR: 'Diretor(a)',
  EXTERNO: 'Externo',
}

export function Layout({ route, onNavigate, onExport, user, onLogout, children }) {
  const [exportOpen, setExportOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const [notificacoes, setNotificacoes] = useState([])
  const filtrosNotificacoes = {
    ...(isDiretor && user?.escolaId ? { escolaId: user.escolaId } : {}),
    ...(isExterno && user?.email ? { criadoPorEmail: user.email } : {}),
  }

  const carregarNotificacoes = useCallback(() => {
    return listarNotificacoes(filtrosNotificacoes)
      .then((dados) => setNotificacoes(dados))
      .catch(() => setNotificacoes([]))
  }, [isDiretor, isExterno, user?.escolaId, user?.email])

  useEffect(() => {
    let ativo = true
    carregarNotificacoes()
    const intervalo = setInterval(() => {
      if (ativo) carregarNotificacoes()
    }, INTERVALO_ATUALIZACAO_NOTIFICACOES)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [carregarNotificacoes])

  async function handleAbrirNotificacao(notificacao) {
    if (!notificacao.lida) {
      setNotificacoes((prev) => prev.map((item) => (item.id === notificacao.id ? { ...item, lida: true } : item)))
      marcarNotificacaoLida(notificacao.id).catch(() => {})
    }
    onNavigate(`/ocorrencias/${notificacao.ocorrenciaId}`)
  }

  async function handleLimparNotificacoes() {
    setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })))
    try {
      await marcarNotificacoesLidas(filtrosNotificacoes)
    } catch {
      carregarNotificacoes()
    }
  }

  const nomeExibido = user?.role === 'SEDUC' ? 'João Beserra' : user?.nome
  const roleLabel = roleLabels[user?.role] || user?.role
  const title = isExterno
    ? (route.startsWith('/ocorrencias/') ? 'Detalhe da ocorrência' : 'Minhas ocorrências')
    : titles[route]
      || (route.startsWith('/ocorrencias/') ? 'Detalhe da ocorrência' : '')
      || (route.startsWith('/escolas/') ? 'Detalhe da escola' : '')
      || 'Dashboard geral'

  function handleExport(format) {
    onExport(format)
    setExportOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        route={route}
        onNavigate={onNavigate}
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        nomeExibido={nomeExibido}
        roleLabel={roleLabel}
        onLogout={onLogout}
      />
      <div className={`transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 pt-4 pb-0 backdrop-blur sm:pb-4 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start justify-between gap-2 sm:items-center">
              <div className="flex items-center gap-3">
                <img src="/geo/logo_fundo_branco.svg" alt="ZelaMais" className="hidden h-8 w-auto sm:block lg:hidden" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <button className="cursor-pointer"
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Abrir menu"
                    className="absolute -left-2 top-0 rounded-md p-2 text-slate-500 hover:bg-slate-100 sm:static sm:-ml-2 lg:hidden"
                  >
                    <Icon name="menu" className="h-5 w-5" />
                  </button>

                  <h1 className="pt-11 text-xl font-extrabold text-slate-950 sm:pt-0">{title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 md:hidden">
                {!isExterno && route === '/dashboard' && (
                  <div className="relative">
                    <button className="cursor-pointer"
                      type="button"
                      onClick={() => setExportOpen((current) => !current)}
                      className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Exportar
                    </button>
                    {exportOpen && (
                      <div className="absolute right-0 z-30 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                        {['csv', 'pdf', 'xlsx'].map((format) => (
                          <button className="cursor-pointer"
                            key={format}
                            type="button"
                            onClick={() => handleExport(format)}
                            className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm font-semibold uppercase text-slate-700 hover:bg-primary-50 hover:text-primary-strong"
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <NotificationBell notificacoes={notificacoes} onAbrir={handleAbrirNotificacao} onLimpar={handleLimparNotificacoes} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isExterno && route === '/dashboard' && (
                <div className="relative hidden md:block">
                  <button className="cursor-pointer"
                    type="button"
                    onClick={() => setExportOpen((current) => !current)}
                    className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Exportar
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                      {['csv', 'pdf', 'xlsx'].map((format) => (
                        <button className="cursor-pointer"
                          key={format}
                          type="button"
                          onClick={() => handleExport(format)}
                          className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm font-semibold uppercase text-slate-700 hover:bg-primary-50 hover:text-primary-strong"
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="hidden md:block">
                <NotificationBell notificacoes={notificacoes} onAbrir={handleAbrirNotificacao} onLimpar={handleLimparNotificacoes} />
              </div>
              <div className="hidden min-w-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 lg:flex">
                <span className="max-w-[8rem] truncate sm:max-w-[14rem]">{nomeExibido}</span>
                <span className="text-slate-400">|</span>
                <span className="whitespace-nowrap text-slate-500">{roleLabel}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="hidden cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:block"
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
