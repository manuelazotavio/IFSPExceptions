import { useEffect, useMemo, useState } from 'react'
import { diasEmAberto, sortOcorrencias } from '../utils/metrics.js'
import { isCustomSchool, loadCustomSchools, removeCustomSchool } from '../utils/schools.js'
import { listarOcorrencias, obterEscola } from '../services/api.js'
import { Badge, Card, MetricCard, Modal } from '../components/ui.jsx'
import { Icon } from '../components/Icons.jsx'
import { SchoolLocationMap } from '../components/SchoolLocationMap.jsx'
import { formatDisplayLabel } from '../utils/labels.js'
import { getComodoCodigo, getComodoNome, getSchoolRooms } from '../utils/comodos.js'

const allSalasKey = 'Todos'

export function EscolaDetalhe({ id, onNavigate }) {
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [escola, setEscola] = useState(null)
  const [loadingEscola, setLoadingEscola] = useState(true)
  const [erroEscola, setErroEscola] = useState('')
  const canDeleteSchool = isCustomSchool(escola?.id)
  const salas = useMemo(() => getSchoolRooms(escola), [escola])
  const fotosEscola = useMemo(() => {
    if (!escola) return []

    const fotosCadastradas = Array.isArray(escola.fotos)
      ? escola.fotos.filter((foto) => foto?.url)
      : []

    if (fotosCadastradas.length) {
      return fotosCadastradas.map((foto, index) => ({
        src: foto.url,
        alt: foto.nome || `Foto cadastrada ${index + 1} da ${escola.nome}`,
        label: index === 0 ? 'Foto cadastrada' : `Foto cadastrada ${index + 1}`,
      }))
    }

    if (!escola.fotoUrl) return []

    return [{ src: escola.fotoUrl, alt: `Foto cadastrada da ${escola.nome}`, label: 'Foto cadastrada' }]
  }, [escola])
  const [ocorrenciasDaEscola, setOcorrenciasDaEscola] = useState([])

  useEffect(() => {
    if (!escola) {
      setOcorrenciasDaEscola([])
      return undefined
    }

    let ativo = true
    listarOcorrencias({ escolaId: escola.id })
      .then((dados) => { if (ativo) setOcorrenciasDaEscola(dados) })
      .catch(() => { if (ativo) setOcorrenciasDaEscola([]) })
    return () => {
      ativo = false
    }
  }, [escola])

  const ocorrenciasEscola = useMemo(
    () => sortOcorrencias(ocorrenciasDaEscola),
    [ocorrenciasDaEscola],
  )
  const roomSummary = useMemo(() => buildRoomSummary(salas), [salas])
  const roomTypeSummary = useMemo(() => buildRoomTypeSummary(salas), [salas])
  const [photoIndex, setPhotoIndex] = useState(0)
  const [selectedSalaKey, setSelectedSalaKey] = useState(allSalasKey)
  const selectedSala = useMemo(
    () => salas.find((item) => getRoomKey(item) === selectedSalaKey) || null,
    [salas, selectedSalaKey],
  )
  const ocorrenciasSala = useMemo(
    () => selectedSalaKey === allSalasKey
      ? ocorrenciasEscola
      : ocorrenciasEscola.filter((item) => roomMatchesOccurrence(selectedSala, item.localizacaoInterna)),
    [ocorrenciasEscola, selectedSala, selectedSalaKey],
  )

  useEffect(() => {
    setSelectedSalaKey(allSalasKey)
    setPhotoIndex(0)
    setLocationModalOpen(false)
  }, [salas])

  useEffect(() => {
    let active = true

    async function carregarEscola() {
      setLoadingEscola(true)
      setErroEscola('')

      try {
        const dados = await obterEscola(id)
        const complementoLocal = loadCustomSchools().find((item) => item.id === dados.id)
        if (active) setEscola(formatSchoolDetailData(dados, complementoLocal))
      } catch (error) {
        if (active) {
          setEscola(null)
          setErroEscola(error.message || 'Escola não encontrada.')
        }
      } finally {
        if (active) setLoadingEscola(false)
      }
    }

    carregarEscola()
    return () => {
      active = false
    }
  }, [id])

  function exportRoomReport() {
    const report = buildSchoolRoomReport({
      escola,
      salas,
      roomSummary,
      roomTypeSummary,
      ocorrenciasEscola,
    })

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-${escola.id}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function exportRoomPdfReport() {
    const reportHtml = buildSchoolPdfReport({
      escola,
      roomTypeSummary,
      ocorrenciasEscola,
    })
    const printWindow = window.open('', '_blank', 'width=960,height=720')
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(reportHtml)
    printWindow.document.close()
  }

  function handleDeleteSchool() {
    if (!canDeleteSchool) return

    const shouldDelete = window.confirm(`Deseja excluir a escola "${escola.nome}"? Esta acao remove o cadastro salvo no front.`)
    if (!shouldDelete) return

    removeCustomSchool(escola.id)
    onNavigate('/escolas')
  }

  return (
    <>
      <div className="space-y-5">
        {loadingEscola ? (
          <Card>
            <p className="text-sm font-semibold text-slate-500">Carregando dados da escola...</p>
          </Card>
        ) : null}

        {!escola && !loadingEscola ? (
          <Card>
            <p className="text-sm font-semibold text-slate-700">{erroEscola || 'Escola não encontrada.'}</p>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/escolas')}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold xl:flex-none"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Voltar
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => setLocationModalOpen(true)}
              disabled={!escola}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="map" className="h-4 w-4" />
              Ver no mapa
            </button>
            {canDeleteSchool ? (
              <button onClick={handleDeleteSchool} className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">
                Excluir escola
              </button>
            ) : null}
          </div>
        </div>

        {escola ? (
          <Card className="overflow-hidden p-0">
            <SchoolPhotoCarousel
              photos={fotosEscola}
              currentIndex={photoIndex}
              onChange={setPhotoIndex}
            />
            <div className="">
              <div>
                <h2 className="text-2xl font-800 mt-4 text-slate-950">{escola.nome}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{escola.bairro} - {escola.endereco}</p>
                {loadingEscola ? <p className="mt-2 text-xs font-semibold text-slate-400">Sincronizando dados da escola com o banco...</p> : null}
              </div>
              {escola.descricao?.trim() ? (
                <p className="mt-4 text-sm leading-6 text-slate-700">{escola.descricao}</p>
              ) : null}
              <div className="mt-5 border-t border-slate-200 pt-5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Indicadores</span>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MetricCard label="Ocorrências" value={ocorrenciasEscola.length} tone="slate" />
                  <MetricCard label="Abertas" value={ocorrenciasEscola.filter((item) => item.status !== 'Resolvida').length} tone="blue" />
                  <MetricCard label="Críticas" value={ocorrenciasEscola.filter((item) => item.criticidade === 'Critica' && item.status !== 'Resolvida').length} tone="critical" />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Cômodos</span>
                  <h3 className="mt-1 text-lg font-800 text-slate-950">Detalhamento das quantidades de cômodos cadastrados da escola "{escola.nome}"</h3>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <span className="flex w-full items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                    {salas.length} ambientes cadastrados
                  </span>
                  <button onClick={exportRoomPdfReport} className="cursor-pointer w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Exportar PDF
                  </button>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                  {buildRoomNameCounts(salas).map((grupo) => (
                    <span key={grupo.nome} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      {grupo.nome}
                      <span className="rounded-full bg-white px-1.5 text-slate-500 ring-1 ring-slate-200">{grupo.quantidade}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-3">
                    <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Ambientes</p>
                    <div className="space-y-1.5 sm:space-y-2">
                      <RoomListButton
                        sala={allSalasKey}
                        total={ocorrenciasEscola.length}
                        active={selectedSalaKey === allSalasKey}
                        subtitle="Visualizar a escola inteira"
                        onClick={() => setSelectedSalaKey(allSalasKey)}
                      />
                      {salas.map((sala) => (
                        <RoomListButton
                          key={getRoomKey(sala)}
                          sala={formatRoomLabel(sala)}
                          total={ocorrenciasEscola.filter((item) => roomMatchesOccurrence(sala, item.localizacaoInterna)).length}
                          active={selectedSalaKey === getRoomKey(sala)}
                          subtitle="Abrir ocorrências do ambiente"
                          onClick={() => setSelectedSalaKey(getRoomKey(sala))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="text-lg font-800 text-slate-950">
                          {selectedSalaKey === allSalasKey ? 'Todas as ocorrências da unidade detalhadas por cômodos' : `Demandas do "${formatRoomLabel(selectedSala)}"`}
                        </h3>
                       
                      </div>
                      <Badge>{ocorrenciasSala.length} registros</Badge>
                    </div>
                    <div className="mt-5 space-y-3">
                      {ocorrenciasSala.map((item) => <OcorrenciaItem key={item.id} item={item} onNavigate={onNavigate} />)}
                      {!ocorrenciasSala.length && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                          {selectedSalaKey === allSalasKey ? 'Sem ocorrências cadastradas para esta escola.' : 'Não há ocorrências registradas para este cômodo.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

      </div>

      {locationModalOpen && escola && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8"
          onClick={() => setLocationModalOpen(false)}
        >
          <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-800 text-slate-950">Localização da escola</h3>
                <p className="mt-1 text-sm text-slate-500">{escola.nome}</p>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                aria-label="Fechar"
                className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-[.8fr_1.2fr]">
              <div>
                <dl className="grid gap-4 text-sm">
                  <Info label="Bairro" value={escola.bairro} />
                  <Info label="Endereço" value={escola.endereco} />
                  <Info label="Latitude" value={formatCoordinate(escola.latitude)} />
                  <Info label="Longitude" value={formatCoordinate(escola.longitude)} />
                  <Info label="Cadastro" value={escola.dataCadastro} />
                </dl>
              </div>
              <div className="h-72">
                <SchoolLocationMap escola={escola} className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatSchoolDetailData(escolaApi, complementoLocal) {
  const local = complementoLocal || {}

  return {
    ...escolaApi,
    status: local.status || escolaApi.status || 'Ativo',
    dataCadastro: escolaApi.dataCadastro || escolaApi.criadoEm?.slice(0, 10) || local.dataCadastro || '',
    descricao: local.descricao || escolaApi.descricao || '',
    fotoNome: local.fotoNome || escolaApi.fotoNome || '',
    fotoUrl: local.fotoUrl || escolaApi.fotoUrl || '',
    fotos: Array.isArray(local.fotos) && local.fotos.length
      ? local.fotos
      : (Array.isArray(escolaApi.fotos) ? escolaApi.fotos : []),
    comodos: Array.isArray(escolaApi.comodos) && escolaApi.comodos.length
      ? escolaApi.comodos
      : (Array.isArray(local.comodos) ? local.comodos : []),
    x: local.x || escolaApi.x,
    y: local.y || escolaApi.y,
  }
}

function getRoomCategory(sala) {
  const value = getRoomName(sala).toLowerCase()
  if (value.includes('banheiro')) return 'banheiro'
  if (value.includes('sala') || value.includes('maternal') || value.includes('pre ')) return 'sala'
  if (value.includes('secretaria') || value.includes('diretoria')) return 'administrativo'
  if (value.includes('cozinha') || value.includes('refeitorio')) return 'alimentacao'
  if (value.includes('biblioteca') || value.includes('laboratorio') || value.includes('brinquedoteca')) return 'apoio_pedagogico'
  if (value.includes('patio') || value.includes('quadra') || value.includes('area externa')) return 'convivencia'
  return 'outros'
}

function getRoomCategoryLabel(category) {
  const labels = {
    banheiro: 'Banheiros',
    sala: 'Salas',
    administrativo: 'Administrativo',
    alimentacao: 'Alimentacao',
    apoio_pedagogico: 'Apoio pedagogico',
    convivencia: 'Convivencia',
    outros: 'Outros cômodos',
  }
  return labels[category] || 'Cômodos'
}

function getRoomTypeLabel(sala) {
  if (typeof sala === 'object' && sala?.nome) return sala.nome

  const value = getRoomName(sala).toLowerCase()
  if (value.includes('sala') || value.includes('maternal') || value.includes('pre ')) return 'Salas'
  if (value.includes('biblioteca')) return 'Biblioteca'
  if (value.includes('laboratorio')) return 'Laboratorio'
  if (value.includes('secretaria')) return 'Secretaria'
  if (value.includes('diretoria')) return 'Diretoria'
  if (value.includes('cozinha')) return 'Cozinha'
  if (value.includes('refeitorio')) return 'Refeitorio'
  if (value.includes('banheiro')) return 'Banheiro'
  if (value.includes('quadra')) return 'Quadra'
  if (value.includes('patio')) return 'Patio'
  if (value.includes('brinquedoteca')) return 'Brinquedoteca'
  if (value.includes('area externa')) return 'Area externa'
  return sala
}

function pluralizeRoomType(label, count) {
  if (count === 1) return label.replace(/s$/, '')
  return label.toLowerCase()
}

function buildRoomSummary(salas) {
  const groups = salas.reduce((acc, sala) => {
    const category = getRoomCategory(sala)
    const label = getRoomCategoryLabel(category)
    if (!acc[category]) acc[category] = { label, rooms: [] }
    acc[category].rooms.push(sala)
    return acc
  }, {})

  return Object.values(groups)
    .map((group) => ({
      ...group,
      count: group.rooms.length,
      description: `${group.rooms.length} ${pluralizeRoomType(group.label, group.rooms.length)} cadastrados: ${group.rooms.map(formatRoomLabel).join(', ')}.`,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function buildRoomTypeSummary(salas) {
  const summary = salas.reduce((acc, sala) => {
    const label = getRoomTypeLabel(sala)
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})

  return Object.entries(summary)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function buildRoomNameCounts(salas) {
  const summary = salas.reduce((acc, sala) => {
    const nome = formatDisplayLabel(getRoomName(sala))
    acc[nome] = (acc[nome] || 0) + 1
    return acc
  }, {})

  return Object.entries(summary)
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'))
}

function buildSchoolRoomReport({ escola, salas, roomSummary, roomTypeSummary, ocorrenciasEscola }) {
  const now = new Date().toLocaleString('pt-BR')
  const roomLines = roomSummary.map((group) => `- ${group.description}`).join('\n')
  const roomTypeLines = roomTypeSummary.map((item) => `- ${item.label}: ${item.count}`).join('\n')
  const occurrenceLines = ocorrenciasEscola.map((item) => (
    `- ${item.titulo} | ${item.localizacaoInterna} | ${item.criticidade} | ${item.status} | envio ${item.dataEnvio}`
  )).join('\n')

  return [
    `RELATORIO DA ESCOLA: ${escola.nome}`,
    `Gerado em: ${now}`,
    '',
    `Bairro: ${escola.bairro}`,
    `Endereço: ${escola.endereco}`,
    `Latitude: ${formatCoordinate(escola.latitude)}`,
    `Longitude: ${formatCoordinate(escola.longitude)}`,
    `Status: ${escola.status}`,
    `Cadastro: ${escola.dataCadastro}`,
    `Descrição: ${escola.descricao?.trim() || 'Não informada.'}`,
    '',
    `Total de cômodos cadastrados: ${salas.length}`,
    `Total de ocorrências: ${ocorrenciasEscola.length}`,
    `Ocorrências abertas: ${ocorrenciasEscola.filter((item) => item.status !== 'Resolvida').length}`,
    '',
    'Tabela de cômodos cadastrados:',
    roomTypeLines || '- Nenhum cômodo cadastrado.',
    '',
    'Resumo de cômodos:',
    roomLines || '- Nenhum cômodo cadastrado.',
    '',
    'Ocorrências da unidade:',
    occurrenceLines || '- Nenhuma ocorrência cadastrada.',
    '',
  ].join('\n')
}

function buildSchoolPdfReportLegacy({ escola, roomTypeSummary, ocorrenciasEscola }) {
  const now = new Date().toLocaleString('pt-BR')
  const roomRows = roomTypeSummary.length
    ? roomTypeSummary.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.count}</td></tr>`).join('')
    : `<tr><td colspan="2">Nenhum cômodo cadastrado.</td></tr>`
  const occurrenceRows = ocorrenciasEscola.length
    ? ocorrenciasEscola.map((item) => `<tr><td>${escapeHtml(item.titulo)}</td><td>${escapeHtml(item.localizacaoInterna)}</td><td>${escapeHtml(item.criticidade)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.dataEnvio)}</td></tr>`).join('')
    : `<tr><td colspan="5">Nenhuma ocorrência cadastrada.</td></tr>`

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório ${escapeHtml(escola.nome)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
    h1, h2 { margin: 0 0 8px; }
    p { margin: 0 0 6px; }
    .meta { margin-bottom: 24px; }
    .section { margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }
    th { background: #f8fafc; text-transform: uppercase; }
    .muted { color: #64748b; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(escola.nome)}</h1>
  <div class="meta">
    <p class="muted">Relatório gerado em ${escapeHtml(now)}</p>
    <p><strong>Bairro:</strong> ${escapeHtml(escola.bairro)}</p>
    <p><strong>Endereço:</strong> ${escapeHtml(escola.endereco)}</p>
    <p><strong>Latitude:</strong> ${escapeHtml(formatCoordinate(escola.latitude))}</p>
    <p><strong>Longitude:</strong> ${escapeHtml(formatCoordinate(escola.longitude))}</p>
    <p><strong>Status:</strong> ${escapeHtml(escola.status)}</p>
    <p><strong>Cadastro:</strong> ${escapeHtml(escola.dataCadastro)}</p>
    <p><strong>Descrição:</strong> ${escapeHtml(escola.descricao?.trim() || 'Não informada.')}</p>
  </div>

  <div class="section">
    <h2>Tabela de cômodos cadastrados</h2>
    <table>
      <thead>
        <tr><th>Tipo</th><th>Quantidade</th></tr>
      </thead>
      <tbody>${roomRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Ocorrências da unidade</h2>
    <table>
      <thead>
        <tr><th>Título</th><th>Cômodo</th><th>Criticidade</th><th>Status</th><th>Envio</th></tr>
      </thead>
      <tbody>${occurrenceRows}</tbody>
    </table>
  </div>

  <script>
    window.addEventListener('load', () => {
      window.print();
    });
  </script>
</body>
</html>`
}

function buildSchoolPdfReport({ escola, roomTypeSummary, ocorrenciasEscola }) {
  const now = new Date().toLocaleString('pt-BR')
  const totalComodos = roomTypeSummary.reduce((total, item) => total + Number(item.count || 0), 0)
  const abertas = ocorrenciasEscola.filter((item) => item.status !== 'Resolvida').length
  const criticas = ocorrenciasEscola.filter((item) => item.criticidade === 'Critica' && item.status !== 'Resolvida').length
  const roomRows = roomTypeSummary.length
    ? roomTypeSummary.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td class="number">${item.count}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty">Nenhum comodo cadastrado.</td></tr>'
  const occurrenceRows = ocorrenciasEscola.length
    ? ocorrenciasEscola.map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.titulo)}</strong></td>
        <td>${escapeHtml(item.localizacaoInterna || 'Nao informado')}</td>
        <td><span class="pill">${escapeHtml(item.criticidade || 'Nao informada')}</span></td>
        <td><span class="pill muted-pill">${escapeHtml(item.status || 'Nao informado')}</span></td>
        <td>${escapeHtml(item.dataEnvio || '-')}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" class="empty">Nenhuma ocorrencia cadastrada.</td></tr>'

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio ${escapeHtml(escola.nome)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f1f5f9; color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #ffffff; padding: 20mm 18mm; }
    .hero { overflow: hidden; border: 1px solid #dbe4f0; border-radius: 14px; box-shadow: 0 14px 36px rgba(15, 23, 42, .08); }
    .brand-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; background: #00129c; color: #ffffff; padding: 18px 20px; }
    .brand-logo { display: block; width: 56px; height: 56px; object-fit: contain; border-radius: 8px; background: #ffffff; padding: 8px; }
    .brand-title { text-align: left; line-height: 1.35; }
    .brand-title strong { display: block; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
    .brand-title span { display: block; margin-top: 3px; color: #dbeafe; font-size: 11px; }
    .school-heading { border-top: 4px solid #001eff; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); padding: 20px; }
    h1 { margin: 0; color: #0f172a; font-size: 24px; line-height: 1.18; letter-spacing: 0; }
    .subtitle { margin: 8px 0 0; color: #475569; font-size: 12px; font-weight: 700; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; margin-top: 18px; }
    .meta-item { border-top: 1px solid #dbe4f0; padding-top: 8px; color: #334155; font-size: 11px; }
    .meta-item span { display: block; margin-bottom: 3px; color: #64748b; font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
    .metric { border: 1px solid #dbe4f0; border-left: 4px solid #001eff; border-radius: 10px; background: #ffffff; padding: 12px; }
    .metric strong { display: block; color: #0f172a; font-size: 22px; line-height: 1; }
    .metric span { display: block; margin-top: 6px; color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
    .section { margin-top: 22px; break-inside: avoid; }
    .section h2 { margin: 0; color: #0f172a; font-size: 15px; letter-spacing: .02em; }
    .section-note { margin: 5px 0 0; color: #64748b; font-size: 11px; line-height: 1.5; }
    table { width: 100%; margin-top: 10px; border: 1px solid #dbe4f0; border-collapse: collapse; border-radius: 10px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 9px 10px; text-align: left; vertical-align: top; font-size: 10.5px; line-height: 1.35; }
    th { background: #f1f5f9; color: #475569; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    .number { width: 90px; text-align: right; color: #00129c; font-weight: 800; }
    .pill { display: inline-block; border-radius: 999px; background: #eef2ff; color: #00129c; padding: 3px 8px; font-size: 9px; font-weight: 800; white-space: nowrap; }
    .muted-pill { border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; }
    .empty { padding: 18px; text-align: center; color: #64748b; font-weight: 700; }
    .footer { display: flex; justify-content: space-between; gap: 16px; margin-top: 26px; border-top: 1px solid #dbe4f0; padding-top: 10px; color: #64748b; font-size: 9px; }
    @media print {
      body { background: #ffffff; }
      .page { width: auto; min-height: auto; margin: 0; padding: 12mm; }
      .hero { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <div class="brand-bar">
        <div class="brand-title">
          <strong>Relatorio de infraestrutura escolar</strong>
          <span>Secretaria Municipal de Educacao - Caraguatatuba</span>
          <span>Gerado em ${escapeHtml(now)}</span>
        </div>
        <img class="brand-logo" src="/prefeitura-de-caraguatatuba-seeklogo.svg" alt="Prefeitura de Caraguatatuba" />
      </div>
      <div class="school-heading">
        <h1>${escapeHtml(escola.nome)}</h1>
        <p class="subtitle">${escapeHtml(escola.bairro || 'Bairro nao informado')} - ${escapeHtml(escola.endereco || 'Endereco nao informado')}</p>
        <div class="meta-grid">
          <div class="meta-item"><span>Status</span>${escapeHtml(escola.status || 'Nao informado')}</div>
          <div class="meta-item"><span>Cadastro</span>${escapeHtml(escola.dataCadastro || 'Nao informado')}</div>
          <div class="meta-item"><span>Latitude</span>${escapeHtml(formatCoordinate(escola.latitude))}</div>
          <div class="meta-item"><span>Longitude</span>${escapeHtml(formatCoordinate(escola.longitude))}</div>
        </div>
      </div>
    </header>

    <section class="metrics" aria-label="Indicadores da escola">
      <div class="metric"><strong>${totalComodos}</strong><span>Ambientes</span></div>
      <div class="metric"><strong>${ocorrenciasEscola.length}</strong><span>Ocorrencias</span></div>
      <div class="metric"><strong>${abertas}</strong><span>Abertas</span></div>
      <div class="metric"><strong>${criticas}</strong><span>Criticas</span></div>
    </section>

    <section class="section">
      <h2>Descricao da unidade</h2>
      <p class="section-note">${escapeHtml(escola.descricao?.trim() || 'Nenhuma descricao cadastrada para esta escola.')}</p>
    </section>

    <section class="section">
      <h2>Comodos cadastrados</h2>
      <p class="section-note">Quantidade de ambientes agrupada por tipo de comodo.</p>
      <table>
        <thead><tr><th>Tipo</th><th>Quantidade</th></tr></thead>
        <tbody>${roomRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Ocorrencias da unidade</h2>
      <p class="section-note">Lista consolidada das demandas vinculadas a esta escola.</p>
      <table>
        <thead><tr><th>Titulo</th><th>Comodo</th><th>Criticidade</th><th>Status</th><th>Envio</th></tr></thead>
        <tbody>${occurrenceRows}</tbody>
      </table>
    </section>

    <footer class="footer">
      <span>Zela+ - IFSP Exceptions</span>
      <span>Documento gerado automaticamente para acompanhamento interno.</span>
    </footer>
  </main>

  <script>
    window.addEventListener('load', () => {
      window.print();
    });
  </script>
</body>
</html>`
}

function SchoolPhotoCarousel({ photos, currentIndex, onChange }) {
  const [telaCheia, setTelaCheia] = useState(false)

  if (!photos.length) {
    return (
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-sm font-bold text-slate-500">
          Nenhuma foto cadastrada para esta escola
        </div>
      </div>
    )
  }

  const currentPhoto = photos[currentIndex] || photos[0]

  function showPrevious() {
    onChange((currentIndex - 1 + photos.length) % photos.length)
  }

  function showNext() {
    onChange((currentIndex + 1) % photos.length)
  }

  return (
    <div className="border-b border-slate-200 bg-slate-950/5 p-4">
      <div className="relative overflow-hidden rounded-lg bg-slate-100">
        <img src={currentPhoto.src} alt={currentPhoto.alt} className="h-80 w-full object-cover" />
        <button
          type="button"
          onClick={() => setTelaCheia(true)}
          className="cursor-pointer absolute right-3 top-3 hidden items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-black/80 sm:flex"
        >
          <Icon name="expand" className="h-3.5 w-3.5" />
          Tela cheia
        </button>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/60 to-transparent p-4">
          <div>
            <p className="text-sm font-bold text-white">{currentPhoto.label}</p>
            <p className="text-xs font-semibold text-slate-200">{currentIndex + 1} de {photos.length}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={showPrevious} className="cursor-pointer rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-white">
              {'<'}
            </button>
            <button onClick={showNext} className="cursor-pointer rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-white">
              {'>'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center sm:hidden">
        <button
          type="button"
          onClick={() => setTelaCheia(true)}
          className="cursor-pointer flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-black/80"
        >
          <Icon name="expand" className="h-3.5 w-3.5" />
          Tela cheia
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.label}
            onClick={() => onChange(index)}
            className={`cursor-pointer overflow-hidden rounded-md border text-left transition ${index === currentIndex ? 'border-primary ring-2 ring-primary-500/40' : 'border-slate-200 hover:border-primary-300'}`}
          >
            <img src={photo.src} alt={photo.alt} className="h-20 w-full object-cover" />
            <div className="px-3 py-2 text-xs font-bold text-slate-700">{photo.label}</div>
          </button>
        ))}
      </div>

      {telaCheia && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-2 sm:p-4"
          onClick={() => setTelaCheia(false)}
        >
          <img
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setTelaCheia(false)}
            aria-label="Fechar"
            className="cursor-pointer absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 sm:right-4 sm:top-4"
          >
            <Icon name="close" className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); showPrevious() }}
                aria-label="Foto anterior"
                className="cursor-pointer absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-white/20 sm:left-4"
              >
                &lsaquo;
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); showNext() }}
                aria-label="Próxima foto"
                className="cursor-pointer absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-white/20 sm:right-4"
              >
                &rsaquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function RoomListButton({ sala, total, subtitle, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition sm:gap-3 sm:px-4 sm:py-3 ${active ? 'border-primary bg-primary text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'
        }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold sm:text-base">{sala}</p>
        <p className={`mt-0.5 truncate text-[10px] font-semibold sm:mt-1 sm:text-xs ${active ? 'text-primary-100' : 'text-slate-400'}`}>{subtitle}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {total}
      </span>
    </button>
  )
}

function OcorrenciaItem({ item, onNavigate }) {
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <>
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <p className="truncate text-xs text-slate-500">Título: <strong className="text-lg font-bold text-slate-800">{item.titulo}</strong></p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>Tipo: <strong className="font-bold text-slate-700">{formatDisplayLabel(item.tipo)}</strong></span>
          <span>Localização: <strong className="font-bold text-slate-700">{formatDisplayLabel(item.localizacaoInterna)}</strong></span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>Criticidade: <strong className="font-bold text-slate-700">{formatDisplayLabel(item.criticidade)}</strong></span>
            <span>Status: <strong className="font-bold text-slate-700">{formatDisplayLabel(item.status)}</strong></span>
            <span>Dias em aberto: <strong className="font-bold text-slate-700">{diasEmAberto(item.dataEnvio)}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Detalhar
          </button>
        </div>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={item.titulo}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Info label="Tipo" value={formatDisplayLabel(item.tipo)} />
          <Info label="Localização" value={formatDisplayLabel(item.localizacaoInterna)} />
          <Info label="Criticidade" value={formatDisplayLabel(item.criticidade)} />
          <Info label="Status" value={formatDisplayLabel(item.status)} />
          <Info label="Dias em aberto" value={diasEmAberto(item.dataEnvio)} />
          <Info label="Atualização" value={item.ultimaAtualizacao} />
          {item.dataResolucao && <Info label="Resolução" value={item.dataResolucao} />}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setModalAberto(false)} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Fechar
          </button>
          <button type="button" onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong">
            Ir até ocorrência
          </button>
        </div>
      </Modal>
    </>
  )
}

function getOccurrenceSignalColor(value, variant) {
  const normalized = String(value || '').toLowerCase()

  if (variant === 'criticidade') {
    if (normalized.includes('critica') || normalized.includes('crítica')) return 'bg-red-500'
    if (normalized.includes('alta')) return 'bg-orange-500'
    if (normalized.includes('media') || normalized.includes('média')) return 'bg-amber-400'
    return 'bg-emerald-500'
  }

  if (normalized.includes('resolvida')) return 'bg-emerald-500'
  if (normalized.includes('aprovacao') || normalized.includes('aprovação')) return 'bg-sky-500'
  if (normalized.includes('andamento')) return 'bg-blue-500'
  if (normalized.includes('analise') || normalized.includes('análise')) return 'bg-indigo-500'
  if (normalized.includes('visita')) return 'bg-violet-500'
  return 'bg-slate-400'
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function getRoomName(sala) {
  return getComodoNome(sala)
}

function getRoomCode(sala) {
  return getComodoCodigo(sala)
}

function formatRoomLabel(sala) {
  const nome = getRoomName(sala)
  const codigo = getRoomCode(sala)
  return codigo ? `${nome} - ${codigo}` : nome
}

function getRoomKey(sala) {
  const nome = normalizeRoomText(getRoomName(sala))
  const codigo = normalizeRoomText(getRoomCode(sala))
  return codigo ? `${nome}::${codigo}` : nome
}

function roomMatchesOccurrence(sala, localizacaoInterna) {
  const local = normalizeRoomText(localizacaoInterna)
  const nome = normalizeRoomText(getRoomName(sala))
  const codigo = normalizeRoomText(getRoomCode(sala))
  return local === nome || (codigo && local === codigo) || (codigo && local === `${nome}::${codigo}`)
}

function normalizeRoomText(value) {
  return String(value || '').trim().toLowerCase()
}

function formatCoordinate(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(6) : 'Não informada'
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
