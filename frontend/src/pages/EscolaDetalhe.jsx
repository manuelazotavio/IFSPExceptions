import { useEffect, useMemo, useState } from 'react'
import { escolas, ocorrencias } from '../data/mockData.js'
import { sortOcorrencias } from '../utils/metrics.js'
import { Badge, Card } from '../components/ui.jsx'
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
  const escola = escolas.find((item) => item.id === id) || escolas[0]
  const salas = salasPorEscola[escola.id] || salasPorEscola['esc-001']
  const fotosEscola = useMemo(() => ([
    { src: schoolPhoto, alt: `Fachada da ${escola.nome}`, label: 'Fachada principal' },
    { src: schoolCourtyard, alt: `Patio interno da ${escola.nome}`, label: 'Patio interno' },
    { src: schoolCorridor, alt: `Corredor da ${escola.nome}`, label: 'Corredor e salas' },
  ]), [escola.nome])
  const ocorrenciasEscola = useMemo(
    () => sortOcorrencias(ocorrencias.filter((item) => item.escolaId === escola.id)),
    [escola.id],
  )
  const roomEntries = useMemo(
    () => salas.map((sala) => ({
      sala,
      categoria: getRoomCategoryLabel(getRoomCategory(sala)),
      totalOcorrencias: ocorrenciasEscola.filter((item) => item.localizacaoInterna === sala).length,
    })),
    [ocorrenciasEscola, salas],
  )
  const [photoIndex, setPhotoIndex] = useState(0)
  const [selectedSala, setSelectedSala] = useState(allSalasKey)
  const ocorrenciasSala = useMemo(
    () => selectedSala === allSalasKey
      ? ocorrenciasEscola
      : ocorrenciasEscola.filter((item) => item.localizacaoInterna === selectedSala),
    [ocorrenciasEscola, selectedSala],
  )

  useEffect(() => {
    setSelectedSala(allSalasKey)
    setPhotoIndex(0)
    setLocationModalOpen(false)
  }, [salas])

  function exportPdfReport() {
    const reportHtml = buildSchoolPdfReport({
      escola,
      roomEntries,
      selectedSala,
      ocorrenciasEscola,
      ocorrenciasSala,
    })
    const printWindow = window.open('', '_blank', 'width=960,height=720')
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(reportHtml)
    printWindow.document.close()
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate('/escolas')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Voltar para escolas
          </button>
          <button onClick={() => setLocationModalOpen(true)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Ver no mapa
          </button>
        </div>

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
              </div>
              <Badge>{escola.status}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Unidade escolar cadastrada para acompanhamento de manutencoes, vistoria de ambientes e registro de ocorrencias aprovadas pela direcao. A pagina consolida informacoes administrativas, salas cadastradas e um resumo visual da planta da escola.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{ocorrenciasEscola.length} ocorrencias</Badge>
              <Badge>{ocorrenciasEscola.filter((item) => item.status !== 'Resolvida').length} abertas</Badge>
              <Badge>{ocorrenciasEscola.filter((item) => item.criticidade === 'Critica' && item.status !== 'Resolvida').length} criticas</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-800 text-slate-950">Comodos cadastrados</h3>
              <p className="mt-1 text-sm text-slate-500">Tabela de ambientes cadastrados separada da tabela de ocorrencias</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{salas.length} ambientes</Badge>
              <button onClick={exportPdfReport} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Comodo</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Ocorrencias</th>
                  </tr>
                </thead>
                <tbody>
                  <RoomTableRow
                    sala={allSalasKey}
                    categoria="Unidade completa"
                    total={ocorrenciasEscola.length}
                    active={selectedSala === allSalasKey}
                    onClick={() => setSelectedSala(allSalasKey)}
                  />
                  {roomEntries.map((room) => (
                    <RoomTableRow
                      key={room.sala}
                      sala={room.sala}
                      categoria={room.categoria}
                      total={room.totalOcorrencias}
                      active={selectedSala === room.sala}
                      onClick={() => setSelectedSala(room.sala)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
                <div>
                  <h3 className="text-lg font-800 text-slate-950">
                    {selectedSala === allSalasKey ? 'Todas as ocorrencias da unidade' : 'Demandas do local selecionado'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSala === allSalasKey
                      ? 'Lista completa da escola, incluindo ocorrencias finalizadas'
                      : `${selectedSala} com historico completo da unidade`}
                  </p>
                </div>
                <Badge>{ocorrenciasSala.length} registros</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Titulo</th>
                      <th className="px-4 py-3">Comodo</th>
                      <th className="px-4 py-3">Criticidade</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocorrenciasSala.map((item) => <OcorrenciaRow key={item.id} item={item} onNavigate={onNavigate} />)}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-4">
                {!ocorrenciasSala.length && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    {selectedSala === allSalasKey ? 'Sem ocorrencias cadastradas para esta escola.' : 'Nao ha ocorrencias registradas para esta sala.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {locationModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-800 text-slate-950">Localizacao da escola</h3>
                <p className="mt-1 text-sm text-slate-500">{escola.nome}</p>
              </div>
              <button onClick={() => setLocationModalOpen(false)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                Fechar
              </button>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-[.8fr_1.2fr]">
              <div>
                <dl className="grid gap-4 text-sm">
                  <Info label="Bairro" value={escola.bairro} />
                  <Info label="Endereco" value={escola.endereco} />
                  <Info label="Coordenada no mapa" value={`X ${escola.x}% / Y ${escola.y}%`} />
                  <Info label="Cadastro" value={escola.dataCadastro} />
                </dl>
              </div>
              <div className="h-72 rounded-md border border-blue-100 bg-blue-50/60 p-4">
                <div className="relative h-full rounded-md border border-blue-200 bg-white">
                  <span
                    className="absolute h-5 w-5 rounded-full border-2 border-white bg-blue-600 shadow"
                    style={{ left: `${escola.x}%`, top: `${escola.y}%`, transform: 'translate(-50%, -50%)' }}
                  />
                  <span className="absolute bottom-3 left-3 rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                    Mapa esquematico da rede
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function getRoomCategory(sala) {
  const value = sala.toLowerCase()
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
    outros: 'Outros comodos',
  }
  return labels[category] || 'Comodos'
}

function buildSchoolPdfReport({ escola, roomEntries, selectedSala, ocorrenciasEscola, ocorrenciasSala }) {
  const now = new Date().toLocaleString('pt-BR')
  const roomRows = [
    `<tr><td>Todos</td><td>Unidade completa</td><td>${ocorrenciasEscola.length}</td></tr>`,
    ...roomEntries.map((room) => `<tr><td>${escapeHtml(room.sala)}</td><td>${escapeHtml(room.categoria)}</td><td>${room.totalOcorrencias}</td></tr>`),
  ].join('')
  const occurrenceRows = ocorrenciasSala.length
    ? ocorrenciasSala.map((item) => `<tr><td>${escapeHtml(item.titulo)}</td><td>${escapeHtml(item.localizacaoInterna)}</td><td>${escapeHtml(item.criticidade)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.dataEnvio)}</td></tr>`).join('')
    : `<tr><td colspan="5">Nenhuma ocorrencia encontrada para o filtro atual.</td></tr>`

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatorio ${escapeHtml(escola.nome)}</title>
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
    <p class="muted">Relatorio gerado em ${escapeHtml(now)}</p>
    <p><strong>Bairro:</strong> ${escapeHtml(escola.bairro)}</p>
    <p><strong>Endereco:</strong> ${escapeHtml(escola.endereco)}</p>
    <p><strong>Status:</strong> ${escapeHtml(escola.status)}</p>
    <p><strong>Cadastro:</strong> ${escapeHtml(escola.dataCadastro)}</p>
  </div>

  <div class="section">
    <h2>Comodos cadastrados</h2>
    <table>
      <thead>
        <tr><th>Comodo</th><th>Tipo</th><th>Ocorrencias</th></tr>
      </thead>
      <tbody>${roomRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>${selectedSala === allSalasKey ? 'Ocorrencias da unidade' : `Ocorrencias de ${escapeHtml(selectedSala)}`}</h2>
    <table>
      <thead>
        <tr><th>Titulo</th><th>Comodo</th><th>Criticidade</th><th>Status</th><th>Envio</th></tr>
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
            <button onClick={showPrevious} className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-white">
              {'<'}
            </button>
            <button onClick={showNext} className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:bg-white">
              {'>'}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <button
            key={photo.label}
            onClick={() => onChange(index)}
            className={`overflow-hidden rounded-md border text-left transition ${index === currentIndex ? 'border-blue-600 ring-2 ring-blue-500/40' : 'border-slate-200 hover:border-blue-300'}`}
          >
            <img src={photo.src} alt={photo.alt} className="h-20 w-full object-cover" />
            <div className="px-3 py-2 text-xs font-bold text-slate-700">{photo.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function RoomTableRow({ sala, categoria, total, active, onClick }) {
  return (
    <tr onClick={onClick} className={`cursor-pointer border-t border-slate-100 ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}>
      <td className="px-4 py-3 font-bold text-slate-800">{sala}</td>
      <td className="px-4 py-3 text-slate-600">{categoria}</td>
      <td className="px-4 py-3 text-right font-semibold text-slate-700">{total}</td>
    </tr>
  )
}

function OcorrenciaRow({ item, onNavigate }) {
  return (
    <tr onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40">
      <td className="px-4 py-3 font-bold text-slate-800">{item.titulo}</td>
      <td className="px-4 py-3 text-slate-600">{item.localizacaoInterna}</td>
      <td className="px-4 py-3"><Badge>{item.criticidade}</Badge></td>
      <td className="px-4 py-3"><Badge>{item.status}</Badge></td>
      <td className="px-4 py-3 text-slate-600">{item.dataEnvio}</td>
    </tr>
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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
