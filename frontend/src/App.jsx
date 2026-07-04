import { useEffect, useState } from 'react'
import { Layout } from './components/Layout.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Mapa } from './pages/Mapa.jsx'
import { Ocorrencias } from './pages/Ocorrencias.jsx'
import { OcorrenciaDetalhe } from './pages/OcorrenciaDetalhe.jsx'
import { EscolaDetalhe } from './pages/EscolaDetalhe.jsx'
import { Categorias, Configuracoes, Escolas, Indicadores, Usuarios } from './pages/AdminPages.jsx'

function normalizeRoute() {
  const hash = window.location.hash.replace('#', '')
  return hash || '/dashboard'
}

export default function App() {
  const [route, setRoute] = useState(normalizeRoute)

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
    if (route.startsWith('/ocorrencias/')) {
      return <OcorrenciaDetalhe id={route.split('/').at(-1)} onNavigate={navigate} />
    }

    if (route.startsWith('/escolas/')) {
      return <EscolaDetalhe id={route.split('/').at(-1)} onNavigate={navigate} />
    }

    const pages = {
      '/dashboard': <Dashboard onNavigate={navigate} />,
      '/mapa': <Mapa onNavigate={navigate} />,
      '/ocorrencias': <Ocorrencias onNavigate={navigate} />,
      '/escolas': <Escolas onNavigate={navigate} />,
      '/indicadores': <Indicadores />,
      '/usuarios': <Usuarios />,
      '/categorias': <Categorias />,
      '/configuracoes': <Configuracoes />,
    }

    return pages[route] || pages['/dashboard']
  }

  return (
    <Layout route={route} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  )
}
