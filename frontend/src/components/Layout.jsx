import { Sidebar } from './Sidebar.jsx'

const titles = {
  '/dashboard': 'Dashboard geral',
  '/mapa': 'Mapa das escolas',
  '/ocorrencias': 'Lista de ocorrencias',
  '/escolas': 'Escolas cadastradas',
  '/indicadores': 'Indicadores gerais',
  '/usuarios': 'Gerenciamento de usuarios',
  '/categorias': 'Categorias globais',
  '/configuracoes': 'Configuracoes',
}

export function Layout({ route, onNavigate, children }) {
  const title = titles[route] || (route.startsWith('/ocorrencias/') ? 'Detalhe da ocorrencia' : 'Dashboard geral')
  return (
    <div className="min-h-screen bg-white">
      <Sidebar route={route} onNavigate={onNavigate} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold  tracking-wide text-blue-600">SEDUC Caraguatatuba</p>
              <h1 className="text-2xl font-800 text-slate-950">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">SEDUC</div>
            </div>
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
