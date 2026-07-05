import { useEffect, useMemo, useState } from 'react'
import { sortOcorrencias } from '../utils/metrics.js'
import { isCustomSchool, loadCustomSchools, loadSchoolCatalog, removeCustomSchool } from '../utils/schools.js'
import { listarOcorrencias } from '../services/api.js'
import { Badge, Card } from '../components/ui.jsx'
import { SchoolLocationMap } from '../components/SchoolLocationMap.jsx'
import schoolCorridor from '../assets/school-corridor.png'
import schoolCourtyard from '../assets/school-courtyard.png'
import schoolPhoto from '../assets/school-exterior.png'

const salasPorEscola = {
  'esc-001': ['Sala 1', 'Sala 2', 'Sala 3', 'Biblioteca', 'Laboratorio', 'Secretaria', 'Refeitorio'],
  'esc-002': ['Maternal A', 'Maternal B', 'Pre I', 'Pre II', 'Brinquedoteca', 'Cozinha'],
  'esc-003': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Informatica', 'Quadra'],
  'esc-004': ['Bercario', 'Maternal', 'Pre I', 'Pre II', 'Sala multiuso', 'Patio'],
  'esc-005': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Biblioteca', 'Refeitorio'],
  'esc-006': ['Maternal A', 'Maternal B', 'Pre I', 'Pre II', 'Secretaria', 'Patio coberto'],
  'esc-007': ['Sala 1', 'Sala 2', 'Sala 3', 'Laboratorio', 'Secretaria', 'Quadra'],
  'esc-008': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Diretoria', 'Area externa'],
}

const allSalasKey = 'Todos'

export function EscolaDetalhe({ id, onNavigate }) {
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [schoolCatalog, setSchoolCatalog] = useState(loadCustomSchools)
  const [loadingEscola, setLoadingEscola] = useState(false)
  const escola = useMemo(
    () => schoolCatalog.find((item) => item.id === id) || schoolCatalog[0] || null,
    [id, schoolCatalog],
  )
  const canDeleteSchool = isCustomSchool(escola?.id)
  const salas = useMemo(() => getSchoolRooms(escola), [escola])
  const fotosEscola = useMemo(() => {
    if (!escola) return []

    const defaultPhotos = [
      { src: schoolPhoto, alt: `Fachada da ${escola.nome}`, label: 'Fachada principal' },
      { src: schoolCourtyard, alt: `Patio interno da ${escola.nome}`, label: 'Patio interno' },
      { src: schoolCorridor, alt: `Corredor da ${escola.nome}`, label: 'Corredor e salas' },
    ]

    if (!escola.fotoUrl) return defaultPhotos

    return [
      { src: escola.fotoUrl, alt: `Foto cadastrada da ${escola.nome}`, label: 'Foto cadastrada' },
      ...defaultPhotos,
    ]
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
      : ocorrenciasEscola.filter((item) => normalizeRoomText(item.localizacaoInterna) === normalizeRoomText(getRoomName(selectedSala))),
    [ocorrenciasEscola, selectedSala, selectedSalaKey],
  )

  useEffect(() => {
    setSelectedSalaKey(allSalasKey)
    setPhotoIndex(0)
    setLocationModalOpen(false)
  }, [salas])

  useEffect(() => {
    let active = true

    async function refreshSchoolCatalog() {
      setLoadingEscola(true)

      try {
        const nextCatalog = await loadSchoolCatalog()
        if (active) setSchoolCatalog(nextCatalog)
      } catch {
        if (active) setSchoolCatalog(loadCustomSchools())
      } finally {
        if (active) setLoadingEscola(false)
      }
    }

    refreshSchoolCatalog()
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
        {!escola && !loadingEscola ? (
          <Card>
            <p className="text-sm font-semibold text-slate-700">Nenhuma escola encontrada no catalogo carregado.</p>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button className="cursor-pointer" onClick={() => onNavigate('/escolas')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Voltar para escolas
          </button>
          <button className="cursor-pointer" onClick={() => setLocationModalOpen(true)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Ver no mapa
          </button>
          {canDeleteSchool ? (
            <button onClick={handleDeleteSchool} className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">
              Excluir escola
            </button>
          ) : null}
        </div>

        {escola ? (
        <Card className="overflow-hidden p-0">
          <SchoolPhotoCarousel
            photos={fotosEscola}
            currentIndex={photoIndex}
            onChange={setPhotoIndex}
          />
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-800 text-slate-950">{escola.nome}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{escola.bairro} - {escola.endereco}</p>
                {loadingEscola ? <p className="mt-2 text-xs font-semibold text-slate-400">Sincronizando dados da escola com o banco...</p> : null}
              </div>
              <Badge>{escola.status}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {escola.descricao?.trim() || 'Unidade escolar cadastrada para acompanhamento de manutenções, vistoria de ambientes e registro de ocorrências aprovadas pela direção. A página consolida informações administrativas e salas cadastradas da escola.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{ocorrenciasEscola.length} ocorrências</Badge>
              <Badge>{ocorrenciasEscola.filter((item) => item.status !== 'Resolvida').length} abertas</Badge>
              <Badge>{ocorrenciasEscola.filter((item) => item.criticidade === 'Critica' && item.status !== 'Resolvida').length} críticas</Badge>
            </div>
          </div>
        </Card>
        ) : null}

        {escola ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-800 text-slate-950">Tabela de cômodos cadastrados</h3>
              <p className="mt-1 text-sm text-slate-500">Resumo por tipo de ambiente cadastrado na unidade</p>
            </div>
            <button onClick={exportRoomPdfReport} className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Exportar PDF
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {roomTypeSummary.map((item) => (
                  <tr key={item.label} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-800">{item.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        ) : null}

        {escola ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-800 text-slate-950">Cômodos cadastrados</h3>
              <p className="mt-1 text-sm text-slate-500">Resumo dos ambientes cadastrados e acesso rápido para as ocorrências</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{salas.length} ambientes</Badge>
              <button onClick={exportRoomReport} className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Exportar relatório
              </button>
            </div>
          </div>
          
          <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="space-y-2">
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
                    total={ocorrenciasEscola.filter((item) => normalizeRoomText(item.localizacaoInterna) === normalizeRoomText(getRoomName(sala))).length}
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
                    {selectedSalaKey === allSalasKey ? 'Todas as ocorrências da unidade' : 'Demandas do local selecionado'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSalaKey === allSalasKey
                      ? 'Lista completa da escola, incluindo ocorrências finalizadas'
                      : `${formatRoomLabel(selectedSala)} com histórico completo da unidade`}
                  </p>
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
        </Card>
        ) : null}

      </div>

      {locationModalOpen && escola && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-800 text-slate-950">Localização da escola</h3>
                <p className="mt-1 text-sm text-slate-500">{escola.nome}</p>
              </div>
              <button className="cursor-pointer" onClick={() => setLocationModalOpen(false)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                Fechar
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

function getSchoolRooms(escola) {
  if (!escola) return []
  if (Array.isArray(escola.comodos) && escola.comodos.length) {
    return escola.comodos
  }

  return salasPorEscola[escola.id] || []
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

function buildSchoolPdfReport({ escola, roomTypeSummary, ocorrenciasEscola }) {
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

function SchoolPhotoCarousel({ photos, currentIndex, onChange }) {
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
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button className="cursor-pointer"
            key={photo.label}
            onClick={() => onChange(index)}
            className={`overflow-hidden rounded-md border text-left transition ${index === currentIndex ? 'border-primary ring-2 ring-primary-500/40' : 'border-slate-200 hover:border-primary-300'}`}
          >
            <img src={photo.src} alt={photo.alt} className="h-20 w-full object-cover" />
            <div className="px-3 py-2 text-xs font-bold text-slate-700">{photo.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function RoomListButton({ sala, total, subtitle, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition ${
        active ? 'border-primary bg-primary text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'
      }`}
    >
      <div>
        <p className="font-bold">{sala}</p>
        <p className={`mt-1 text-xs font-semibold ${active ? 'text-primary-100' : 'text-slate-400'}`}>{subtitle}</p>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {total}
      </span>
    </button>
  )
}

function OcorrenciaItem({ item, onNavigate }) {
  return (
    <button className="cursor-pointer" onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="w-full rounded-md border border-slate-200 bg-white p-4 text-left hover:bg-primary-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-800">{item.titulo}</p>
          <p className="mt-1 text-sm text-slate-500">{item.tipo} - {item.localizacaoInterna}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{item.criticidade}</Badge>
          <Badge>{item.status}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
        <span>Envio: {item.dataEnvio}</span>
        <span>Atualizacao: {item.ultimaAtualizacao}</span>
        {item.dataResolucao && <span>Resolucao: {item.dataResolucao}</span>}
      </div>
    </button>
  )
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
  if (!sala) return ''
  if (typeof sala === 'string') return sala
  return sala.nome || ''
}

function getRoomCode(sala) {
  if (!sala || typeof sala === 'string') return ''
  return sala.codigo || ''
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
