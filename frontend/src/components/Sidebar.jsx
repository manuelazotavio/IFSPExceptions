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

export function Sidebar({ route, onNavigate, user }) {
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

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:block">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Icon name="school" className="h-5 w-5" />
        </div>
        <div>
          <strong className="block text-sm font-800 text-slate-950">Escola em Dia</strong>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Navegação principal">
        {visibleItems.map(([id, label, path, icon]) => {
          const active = route === path
            || (path === '/ocorrencias' && route.startsWith('/ocorrencias/'))
            || (path === '/escolas' && route.startsWith('/escolas/'))
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(path)}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
              }`}
            >
              <Icon name={icon} className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
