import { Icon } from './Icons.jsx'

const items = [
  ['dashboard', 'Dashboard geral', '/dashboard', 'dashboard'],
  ['mapa', 'Mapa de calor', '/mapa', 'map'],
  ['ocorrencias', 'Lista de ocorrências', '/ocorrencias', 'alert'],
  ['escolas', 'Escolas cadastradas', '/escolas', 'school'],
  ['usuarios', 'Usuários', '/usuarios', 'users'],
  ['categorias', 'Categorias globais', '/categorias', 'tag'],
  ['configuracoes', 'Configurações', '/configuracoes', 'settings'],
]

export function Sidebar({ route, onNavigate, user, open = false, onClose, nomeExibido, roleLabel, onLogout }) {
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const visibleItems = isExterno
    ? [['ocorrencias', 'Minhas ocorrências', '/ocorrencias', 'alert']]
    : isDiretor
      ? [
          ['dashboard', 'Dashboard da escola', '/dashboard', 'dashboard'],
          ['ocorrencias', 'Ocorrências da escola', '/ocorrencias', 'alert'],
        ]
      : items

  function handleNavigate(path) {
    onNavigate(path)
    onClose?.()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-center justify-between gap-3 ps-2">
          <img src="/geo/logo_fundo_branco.svg" alt="Escola em Dia" className="h-8 w-auto" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1" aria-label="Navegação principal">
          {visibleItems.map(([id, label, path, icon]) => {
            const active = route === path
              || (path === '/ocorrencias' && route.startsWith('/ocorrencias/'))
              || (path === '/escolas' && route.startsWith('/escolas/'))
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavigate(path)}
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                  active ? 'bg-primary-50 text-primary-strong' : 'text-slate-600 hover:bg-slate-50 hover:text-primary-strong'
                }`}
              >
                <Icon name={icon} className="h-4 w-4" />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-slate-200 pt-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            <span className="max-w-[9rem] truncate">{nomeExibido}</span>
            <span className="text-slate-400">|</span>
            <span className="whitespace-nowrap text-slate-500">{roleLabel}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 w-full cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
