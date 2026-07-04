import { useEffect, useState } from 'react'
import { Layout } from './components/Layout.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Mapa } from './pages/Mapa.jsx'
import { Ocorrencias } from './pages/Ocorrencias.jsx'
import { OcorrenciaDetalhe } from './pages/OcorrenciaDetalhe.jsx'
import { Categorias, Configuracoes, Escolas, Indicadores, Usuarios } from './pages/AdminPages.jsx'

function normalizeRoute() {
  const hash = window.location.hash.replace('#', '')
  return hash || '/dashboard'
}

function parseRoute(route) {
  const [pathname, search = ''] = route.split('?')
  return {
    pathname,
    searchParams: new URLSearchParams(search),
  }
}

export default function App() {
  const [route, setRoute] = useState(normalizeRoute)
  const { pathname, searchParams } = parseRoute(route)

  useEffect(() => {
    const onHashChange = () => setRoute(normalizeRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function navigate(path) {
    window.location.hash = path
    setRoute(path)
  }

  function renderPage() {
    if (pathname.startsWith('/ocorrencias/')) {
      return <OcorrenciaDetalhe id={pathname.split('/').at(-1)} onNavigate={navigate} />
    }

    const pages = {
      '/dashboard': <Dashboard onNavigate={navigate} />,
      '/mapa': <Mapa onNavigate={navigate} />,
      '/ocorrencias': <Ocorrencias onNavigate={navigate} />,
      '/escolas': <Escolas escolaIdFiltro={searchParams.get('escolaId') || ''} onNavigate={navigate} />,
      '/indicadores': <Indicadores />,
      '/usuarios': <Usuarios />,
      '/categorias': <Categorias />,
      '/configuracoes': <Configuracoes />,
    }

    return pages[pathname] || pages['/dashboard']
  }

  return (
    <Layout route={pathname} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  )
}
