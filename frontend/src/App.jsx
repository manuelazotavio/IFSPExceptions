import { useEffect, useState } from 'react'
import { Layout } from './components/Layout.jsx'
import { clearStoredUser, getStoredUser, setStoredUser } from './auth/session.js'
import { escolas, ocorrenciasAprovadas } from './data/mockData.js'
import { Cadastro } from './pages/Cadastro.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Landing } from './pages/Landing.jsx'
import { Login } from './pages/Login.jsx'
import { Mapa } from './pages/Mapa.jsx'
import { Ocorrencias } from './pages/Ocorrencias.jsx'
import { OcorrenciaDetalhe } from './pages/OcorrenciaDetalhe.jsx'
import { EscolaDetalhe } from './pages/EscolaDetalhe.jsx'
import { Escolas } from './pages/Escolas.jsx'
import { Auditoria, Categorias, Configuracoes, Indicadores, Usuarios } from './pages/AdminPages.jsx'
import { dashboardMetrics, groupCount } from './utils/metrics.js'

function normalizeRoute() {
  const hash = window.location.hash.replace('#', '')
  return hash || '/'
}

function parseRoute(route) {
  const [pathname, search = ''] = route.split('?')
  return {
    pathname,
    searchParams: new URLSearchParams(search),
  }
}

function isPublicRoute(pathname) {
  return pathname === '/' || pathname === '/publico'
}

export default function App() {
  const [route, setRoute] = useState(normalizeRoute)
  const [user, setUser] = useState(getStoredUser)
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const { pathname, searchParams } = parseRoute(route)

  useEffect(() => {
    const onHashChange = () => setRoute(normalizeRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (isPublicRoute(pathname)) return

    const rotaDeOcorrencia = route === '/ocorrencias' || route.startsWith('/ocorrencias/')
    if (isExterno && !rotaDeOcorrencia) {
      navigate('/ocorrencias')
    } else if (isDiretor && route !== '/dashboard' && !rotaDeOcorrencia) {
      navigate('/dashboard')
    }
  }, [isExterno, isDiretor, pathname, route])

  function navigate(path) {
    window.location.hash = path
    setRoute(path)
  }

  function handleLogin(loggedUser) {
    setStoredUser(loggedUser)
    setUser(loggedUser)
    navigate(loggedUser.role === 'EXTERNO' ? '/ocorrencias' : '/dashboard')
  }

  function handleLogout() {
    clearStoredUser()
    setUser(null)
    navigate('/login')
  }

  function buildDashboardExportRows() {
    const escopo = isDiretor ? ocorrenciasAprovadas.filter((item) => item.escolaId === user.escolaId) : ocorrenciasAprovadas
    const metrics = dashboardMetrics(escopo, isDiretor ? 1 : escolas.length)
    const escolasRank = escolas
      .filter((escola) => !isDiretor || escola.id === user.escolaId)
      .map((escola) => ({
        escola: escola.nome,
        bairro: escola.bairro,
        total: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id).length,
        criticas: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id && item.criticidade === 'Critica').length,
      }))
      .sort((a, b) => b.total - a.total)

    return [
      ['Seção', 'Indicador', 'Valor'],
      ['Métricas', 'Escolas cadastradas', metrics.escolas],
      ['Métricas', 'Ocorrências aprovadas', metrics.aprovadas],
      ['Métricas', 'Ocorrências abertas', metrics.abertas],
      ['Métricas', 'Ocorrências em andamento', metrics.andamento],
      ['Métricas', 'Ocorrências resolvidas', metrics.resolvidas],
      ['Métricas', 'Ocorrências críticas', metrics.criticas],
      ...Object.entries(groupCount(escopo, 'bairro')).map(([bairro, total]) => ['Ocorrências por bairro', bairro, total]),
      ...Object.entries(groupCount(escopo, 'tipo')).map(([tipo, total]) => ['Ocorrências por tipo', tipo, total]),
      ...Object.entries(groupCount(escopo, 'criticidade')).map(([criticidade, total]) => ['Ocorrências por criticidade', criticidade, total]),
      ...escolasRank.map((item) => ['Ranking de escolas', `${item.escola} (${item.bairro})`, `${item.total} ocorrências / ${item.criticas} críticas`]),
    ]
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function exportCsv(rows) {
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, 'dashboard-geral-seduc.csv')
  }

  async function exportPdf(rows) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const tableWidth = pageWidth - margin * 2
    const columns = [
      { title: 'Seção', width: 42 },
      { title: 'Indicador', width: 91 },
      { title: 'Valor', width: tableWidth - 133 },
    ]

    function drawHeader() {
      doc.setFillColor(10, 37, 64)
      doc.rect(0, 0, pageWidth, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text('Dashboard Geral SEDUC', margin, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Exportação tabulada dos indicadores consolidados', margin, 20)
      doc.setTextColor(23, 32, 51)
    }

    function drawTableHeader(y) {
      doc.setFillColor(239, 246, 255)
      doc.setDrawColor(203, 213, 225)
      doc.rect(margin, y, tableWidth, 9, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(30, 64, 175)
      let x = margin
      columns.forEach((column) => {
        doc.text(column.title, x + 2, y + 6)
        x += column.width
      })
      doc.setTextColor(23, 32, 51)
      return y + 9
    }

    function drawFooter() {
      const pageCount = doc.internal.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }
      doc.setTextColor(23, 32, 51)
    }

    drawHeader()
    let y = drawTableHeader(36)

    rows.slice(1).forEach(([section, indicator, value], index) => {
      const sectionLines = doc.splitTextToSize(String(section), columns[0].width - 4)
      const indicatorLines = doc.splitTextToSize(String(indicator), columns[1].width - 4)
      const valueLines = doc.splitTextToSize(String(value), columns[2].width - 4)
      const lineCount = Math.max(sectionLines.length, indicatorLines.length, valueLines.length)
      const rowHeight = Math.max(10, lineCount * 5 + 4)

      if (y + rowHeight > pageHeight - 16) {
        doc.addPage()
        drawHeader()
        y = drawTableHeader(36)
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, y, tableWidth, rowHeight, 'F')
      }

      doc.setDrawColor(226, 232, 240)
      doc.rect(margin, y, tableWidth, rowHeight)
      doc.line(margin + columns[0].width, y, margin + columns[0].width, y + rowHeight)
      doc.line(margin + columns[0].width + columns[1].width, y, margin + columns[0].width + columns[1].width, y + rowHeight)

      doc.setFontSize(8.2)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(sectionLines, margin + 2, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(51, 65, 85)
      doc.text(indicatorLines, margin + columns[0].width + 2, y + 6)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(valueLines, margin + columns[0].width + columns[1].width + 2, y + 6)

      y += rowHeight
    })

    drawFooter()
    doc.save('dashboard-geral-seduc.pdf')
  }

  function xmlEscape(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  async function exportXlsx(rows) {
    const { zipSync, strToU8 } = await import('fflate')
    const sheetRows = rows.map((row) => (
      `<row>${row.map((cell) => `<c t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`).join('')}</row>`
    )).join('')

    const files = {
      '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
      '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Dashboard Geral" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
      'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`),
    }
    const zipped = zipSync(files)
    downloadBlob(new Blob([zipped], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'dashboard-geral-seduc.xlsx')
  }

  async function exportDashboard(format) {
    const rows = buildDashboardExportRows()
    if (format === 'pdf') await exportPdf(rows)
    else if (format === 'xlsx') await exportXlsx(rows)
    else exportCsv(rows)
  }

  function renderPage() {
    if (pathname.startsWith('/ocorrencias/')) {
      return <OcorrenciaDetalhe id={pathname.split('/').at(-1)} onNavigate={navigate} user={user} />
    }

    if (pathname.startsWith('/escolas/')) {
      return <EscolaDetalhe id={pathname.split('/').at(-1)} onNavigate={navigate} />
    }

    if (isExterno) {
      return <Ocorrencias onNavigate={navigate} user={user} />
    }

    if (isDiretor) {
      return pathname === '/ocorrencias'
        ? <Ocorrencias onNavigate={navigate} user={user} />
        : <Dashboard onNavigate={navigate} user={user} />
    }

    const pages = {
      '/dashboard': <Dashboard onNavigate={navigate} user={user} />,
      '/mapa': <Mapa onNavigate={navigate} />,
      '/ocorrencias': <Ocorrencias onNavigate={navigate} user={user} />,
      '/escolas': <Escolas onNavigate={navigate} escolaIdFiltro={searchParams.get('escolaId') || ''} />,
      '/indicadores': <Indicadores />,
      '/usuarios': <Usuarios />,
      '/categorias': <Categorias />,
      '/auditoria': <Auditoria />,
      '/configuracoes': <Configuracoes />,
    }

    return pages[pathname] || pages['/dashboard']
  }

  if (isPublicRoute(pathname)) {
    return <Landing onNavigate={navigate} user={user} />
  }

  if (!user) {
    if (route === '/login') return <Login onLogin={handleLogin} onNavigate={navigate} />
    if (route === '/cadastro') return <Cadastro onNavigate={navigate} />
    return <Login onLogin={handleLogin} onNavigate={navigate} />
  }

  return (
    <Layout route={pathname} onNavigate={navigate} onExport={exportDashboard} user={user} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  )
}
