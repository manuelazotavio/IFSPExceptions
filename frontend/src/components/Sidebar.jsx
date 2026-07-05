import { Icon } from './Icons.jsx'

const items = [
  ['mapa', 'Mapa de calor', '/mapa', 'map'],
  ['dashboard', 'Dashboard', '/dashboard', 'dashboard'],
  ['ocorrencias', 'Lista de ocorrências', '/ocorrencias', 'alert'],
  ['escolas', 'Escolas cadastradas', '/escolas', 'school'],
  ['usuarios', 'Usuários', '/usuarios', 'users'],
  ['categorias', 'Categorias globais', '/categorias', 'tag'],
  ['auditoria', 'Log de auditoria', '/auditoria', 'history']
]

export function Sidebar({ route, onNavigate, user, open = false, onClose, collapsed = false, onToggleCollapsed, nomeExibido, roleLabel, onLogout, presentationMode = false }) {
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const visibleItems = presentationMode ? [['mapa', 'Mapa de calor', '/mapa', 'map']] : isExterno
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden bg-[#000149] px-5 py-6 text-white shadow-2xl shadow-blue-950/30 transition-[width,transform,padding] duration-200 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(165deg,rgba(0,30,255,0.28)_0%,rgba(0,1,73,0)_42%)] lg:translate-x-0 ${
          collapsed ? 'lg:w-20 lg:px-3' : 'lg:w-64 lg:px-5'
        } ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`relative mb-7 flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:ps-0' : 'justify-between ps-2'}`}>
          <div className={`px-3 py-2 transition-opacity ${collapsed ? 'lg:hidden' : ''}`}>
            <img src="/logo_fundo_escuro.svg" alt="Zela+" className="h-8 w-auto" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-white/10 text-blue-50 hover:bg-white/20 lg:flex"
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="cursor-pointer rounded-md p-1 text-blue-100 hover:bg-white/15 hover:text-white lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1" aria-label="Navegação principal">
          {visibleItems.map(([id, label, path, icon]) => {
            const active = route === path
              || (path === '/ocorrencias' && route.startsWith('/ocorrencias/'))
              || (path === '/escolas' && route.startsWith('/escolas/'))
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavigate(path)}
                title={collapsed ? label : undefined}
                className={`relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  active ? 'bg-white text-primary-strong shadow-lg shadow-blue-950/20' : 'text-blue-100 hover:bg-white/12 hover:text-white'
                }`}
              >
                <Icon name={icon} className="relative z-10 h-5 w-5 shrink-0" />
                <span className={`relative z-10 truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
              </button>
            )
          })}
        </nav>

        <div className={`relative mt-4 border-t border-white/15 pt-4 ${collapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <div className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 ring-1 ring-white/15">
            <img
              src="/prefeitura-de-caraguatatuba-seeklogo.svg"
              alt="Prefeitura de Caraguatatuba"
              className="h-10 w-10 shrink-0 rounded bg-white p-1.5"
            />
            <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="block text-[10px] font-bold uppercase tracking-wide text-blue-100">Prefeitura de</span>
              <span className="block truncate text-sm font-800 text-white">Caraguatatuba</span>
            </div>
          </div>
        </div>

        <div className="relative mt-4 border-t border-white/15 pt-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-blue-50">
            <span className="max-w-[9rem] truncate">{nomeExibido}</span>
            <span className="text-blue-200">|</span>
            <span className="whitespace-nowrap text-blue-100">{roleLabel}</span>
          </div>
          {!presentationMode && (
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full cursor-pointer rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-blue-50 hover:bg-white/15"
            >
              Sair
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
