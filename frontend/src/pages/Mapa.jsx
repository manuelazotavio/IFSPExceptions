import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { escolas, statusValues } from '../data/mockData.js'
import { Badge, Card, FilterSelect } from '../components/ui.jsx'
import { fetchEscolaOcorrencias, fetchHeatmapOcorrencias, getEscolaOcorrenciasFallback, getHeatmapFallback } from '../services/mapa.js'

const mapCenter = [-23.6203, -45.4131]
const criticidadeOptions = ['Baixa', 'Atencao', 'Critica']
const schoolOptions = escolas.map((escola) => ({ value: escola.id, label: escola.nome }))
const heatLegend = [
  { label: 'Baixa', color: '#60a5fa' },
  { label: 'Atencao', color: '#f59e0b' },
  { label: 'Critica', color: '#dc2626' },
]

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function hasValidCoordinates(item) {
  const latitude = Number(item?.latitude)
  const longitude = Number(item?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

export function Mapa({ onNavigate }) {
  const [filters, setFilters] = useState({
    criticidade: '',
    status: '',
    escolaId: '',
    dataInicial: '',
    dataFinal: '',
  })
  const [heatmapData, setHeatmapData] = useState([])
  const [loadingMapa, setLoadingMapa] = useState(true)
  const [erroMapa, setErroMapa] = useState('')
  const [escolaSelecionada, setEscolaSelecionada] = useState('')
  const [drawerAberto, setDrawerAberto] = useState(false)
  const [detalheEscola, setDetalheEscola] = useState(null)
  const [ocorrenciasEscola, setOcorrenciasEscola] = useState([])
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState('')
  const [searchEscola, setSearchEscola] = useState('')
  const [mapFocusTarget, setMapFocusTarget] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadHeatmap() {
      setLoadingMapa(true)
      setErroMapa('')

      try {
        const data = await fetchHeatmapOcorrencias(filters, controller.signal)
        if (!controller.signal.aborted) {
          setHeatmapData(data)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return

        setHeatmapData(getHeatmapFallback(filters))
        setErroMapa(requestError.message)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMapa(false)
        }
      }
    }

    loadHeatmap()
    return () => controller.abort()
  }, [filters])

  useEffect(() => {
    if (!drawerAberto) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeDrawer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerAberto])

  useEffect(() => {
    if (!drawerAberto || !escolaSelecionada) return undefined

    const controller = new AbortController()

    async function loadDetalhe() {
      setLoadingDetalhe(true)
      setErroDetalhe('')

      try {
        const data = await fetchEscolaOcorrencias(escolaSelecionada, controller.signal)
        if (!controller.signal.aborted) {
          setDetalheEscola(data.escola)
          setOcorrenciasEscola(data.ocorrencias)
        }
      } catch (requestError) {
        if (controller.signal.aborted) return

        const fallback = getEscolaOcorrenciasFallback(escolaSelecionada)
        setDetalheEscola(fallback.escola)
        setOcorrenciasEscola(fallback.ocorrencias)
        setErroDetalhe(requestError.message)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetalhe(false)
        }
      }
    }

    loadDetalhe()
    return () => controller.abort()
  }, [drawerAberto, escolaSelecionada])

  const heatPoints = useMemo(
    () => heatmapData
      .map((item) => [Number(item.latitude), Number(item.longitude), Number(item.intensidade)])
      .filter(([latitude, longitude, intensidade]) => (
        Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(intensidade)
      )),
    [heatmapData],
  )

  const escolaSelecionadaResumo = useMemo(
    () => heatmapData.find((item) => item.escolaId === escolaSelecionada) || null,
    [escolaSelecionada, heatmapData],
  )

  const escolasDisponiveis = useMemo(() => {
    const itemsById = new Map()

    escolas.forEach((escola) => {
      itemsById.set(escola.id, {
        escolaId: escola.id,
        escolaNome: escola.nome,
        latitude: Number(escola.latitude),
        longitude: Number(escola.longitude),
      })
    })

    heatmapData.forEach((item) => {
      itemsById.set(item.escolaId, {
        escolaId: item.escolaId,
        escolaNome: item.escolaNome,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
      })
    })

    return [...itemsById.values()]
      .filter(hasValidCoordinates)
      .sort((a, b) => a.escolaNome.localeCompare(b.escolaNome, 'pt-BR'))
  }, [heatmapData])

  const searchSuggestions = useMemo(() => (
    escolasDisponiveis
      .filter((item) => normalizeText(item.escolaNome).includes(normalizeText(searchEscola)))
      .slice(0, 8)
  ), [escolasDisponiveis, searchEscola])

  const avisoGlobal = useMemo(() => {
    if (erroMapa) {
      return {
        title: 'Alguns dados estao sendo exibidos em modo temporario porque a API nao respondeu.',
        detail: erroMapa,
      }
    }

    if (erroDetalhe) {
      return {
        title: 'Os dados da escola selecionada foram carregados em modo temporario.',
        detail: erroDetalhe,
      }
    }

    return null
  }, [erroMapa, erroDetalhe])

  const totalOcorrencias = heatmapData.reduce((total, item) => total + item.totalOcorrencias, 0)
  const totalCriticas = heatmapData.reduce((total, item) => total + item.criticas, 0)
  const intensidadeTotal = heatmapData.reduce((total, item) => total + item.intensidade, 0)

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function openDrawer(escolaId) {
    setEscolaSelecionada(escolaId)
    setDrawerAberto(true)
  }

  function closeDrawer() {
    setDrawerAberto(false)
    setEscolaSelecionada('')
    setDetalheEscola(null)
    setOcorrenciasEscola([])
    setErroDetalhe('')
  }

  function openSchoolRegistry() {
    if (!escolaSelecionada) return
    onNavigate?.(`/escolas?escolaId=${encodeURIComponent(escolaSelecionada)}`)
  }

  function focusSchool(escola) {
    if (!escola || !hasValidCoordinates(escola)) return

    setSearchEscola(escola.escolaNome)
    setMapFocusTarget({
      latitude: Number(escola.latitude),
      longitude: Number(escola.longitude),
      zoom: 16,
    })
    openDrawer(escola.escolaId)
  }

  function handleSearchEscola() {
    const normalizedSearch = normalizeText(searchEscola)
    if (!normalizedSearch) return

    const exactMatch = escolasDisponiveis.find((item) => normalizeText(item.escolaNome) === normalizedSearch)
    const partialMatch = escolasDisponiveis.find((item) => normalizeText(item.escolaNome).includes(normalizedSearch))
    focusSchool(exactMatch || partialMatch || null)
  }

  return (
    <div className="space-y-6">
      {avisoGlobal ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900">{avisoGlobal.title}</p>
          <p className="mt-1 text-sm text-amber-800">{avisoGlobal.detail}</p>
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Buscar escola</span>
            <div className="flex gap-2">
              <input
                type="text"
                list="mapa-escolas"
                value={searchEscola}
                onChange={(event) => setSearchEscola(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearchEscola()
                  }
                }}
                placeholder="Digite o nome da escola"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSearchEscola}
                className="h-10 shrink-0 rounded-md bg-blue-600 px-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Buscar
              </button>
            </div>
            <datalist id="mapa-escolas">
              {searchSuggestions.map((item) => (
                <option key={item.escolaId} value={item.escolaNome} />
              ))}
            </datalist>
          </label>
          <FilterSelect label="Criticidade" value={filters.criticidade} onChange={(value) => setFilter('criticidade', value)} options={criticidadeOptions} />
          <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter('status', value)} options={statusValues} />
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Escola</span>
            <select value={filters.escolaId} onChange={(event) => setFilter('escolaId', event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="">Todas</option>
              {schoolOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <DateFilter label="Data inicial" value={filters.dataInicial} onChange={(value) => setFilter('dataInicial', value)} />
          <DateFilter label="Data final" value={filters.dataFinal} onChange={(value) => setFilter('dataFinal', value)} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1 space-y-3">
            <h2 className="text-xl font-800 text-slate-950">Mapa de calor de ocorrencias por escola</h2>
            <div className="flex flex-wrap gap-2">
              <MetricCompact label="Escolas" value={heatmapData.length} />
              <MetricCompact label="Ocorrencias" value={totalOcorrencias} />
              <MetricCompact label="Criticas" value={totalCriticas} />
              <MetricCompact label="Intensidade" value={intensidadeTotal} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
            {heatLegend.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <i className="h-2.5 w-4 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative h-[calc(100vh-16rem)] min-h-[560px]">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SyncMapView points={heatPoints} />
            <MapResizeController drawerAberto={drawerAberto} />
            <MapFocusController target={mapFocusTarget} />
            <HeatmapLayer points={heatPoints} />

            {heatmapData.map((item) => (
              <Marker
                key={item.escolaId}
                position={[item.latitude, item.longitude]}
                eventHandlers={{ click: () => openDrawer(item.escolaId) }}
              >
                <Tooltip direction="top" offset={[0, -16]}>
                  <div className="space-y-1">
                    <strong>{item.escolaNome}</strong>
                    <p>{item.totalOcorrencias} ocorrencias</p>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-28 bg-gradient-to-t from-slate-950/12 to-transparent" />

          {loadingMapa ? (
            <div className="absolute inset-0 z-[550] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                Carregando mapa de calor...
              </div>
            </div>
          ) : null}

          <EscolaDrawer
            detalhe={detalheEscola || escolaSelecionadaResumo}
            drawerAberto={drawerAberto}
            loadingDetalhe={loadingDetalhe}
            ocorrencias={ocorrenciasEscola}
            onClose={closeDrawer}
            onOpenSchoolRegistry={openSchoolRegistry}
          />
        </div>
      </Card>
    </div>
  )
}

function MetricCompact({ label, value }) {
  return (
    <div className="min-w-[108px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block text-base font-800 text-slate-950">{value}</strong>
    </div>
  )
}

function DateFilter({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
    </label>
  )
}

function EscolaDrawer({ detalhe, drawerAberto, loadingDetalhe, ocorrencias, onClose, onOpenSchoolRegistry }) {
  if (!drawerAberto) return null

  return (
    <>
      <button
        type="button"
        aria-label="Fechar detalhe da escola"
        className="absolute inset-0 z-[650] bg-slate-950/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 z-[700] w-full max-w-[92vw] sm:max-w-[420px]">
        <div className="flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onOpenSchoolRegistry}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Ver dados da escola
              </button>
              <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Fechar
              </button>
            </div>

            <h3 className="break-words text-base font-semibold leading-6 text-slate-500">
              {detalhe?.escolaNome || detalhe?.nome || 'Detalhe da escola'}
            </h3>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {loadingDetalhe ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                Carregando dados da escola...
              </div>
            ) : null}

            {detalhe ? (
              <>
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-800 uppercase tracking-wide text-slate-500">Ocorrencias previas</h4>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {ocorrencias.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {ocorrencias.length > 0 ? ocorrencias.map((ocorrencia) => (
                      <article key={ocorrencia.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-bold text-slate-900">{ocorrencia.titulo}</h5>
                          <Badge>{ocorrencia.criticidade}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge>{ocorrencia.status}</Badge>
                          <span className="text-xs font-semibold text-slate-500">{ocorrencia.data || 'Sem data'}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {ocorrencia.descricao || 'Sem descricao resumida para esta ocorrencia.'}
                        </p>
                      </article>
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                        Nenhuma ocorrencia encontrada para esta escola.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : !loadingDetalhe ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Nao foi possivel localizar os dados desta escola.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  )
}

function MapFocusController({ target }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return

    map.setView([target.latitude, target.longitude], target.zoom || 16)
    map.invalidateSize()
  }, [map, target])

  return null
}

function SyncMapView({ points }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()

    if (points.length === 0) {
      map.setView(mapCenter, 13)
      return
    }

    const bounds = L.latLngBounds(points.map(([latitude, longitude]) => [latitude, longitude]))
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
  }, [map, points])

  return null
}

function MapResizeController({ drawerAberto }) {
  const map = useMap()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      map.invalidateSize()
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [drawerAberto, map])

  return null
}

function HeatmapLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      minOpacity: 0.35,
      maxZoom: 16,
      gradient: {
        0.25: '#60a5fa',
        0.5: '#f59e0b',
        1: '#dc2626',
      },
    })

    layer.addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, points])

  return null
}
