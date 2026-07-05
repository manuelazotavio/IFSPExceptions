import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { CaraguatatubaBairrosLayer, bairroStyleDefaults } from '../components/CaraguatatubaBairrosLayer.jsx'
import { CaraguatatubaBoundary } from '../components/Mapa_com_boundary.jsx'
import { Card, Select } from '../components/ui.jsx'
import { getEscolaOcorrenciasFallback, loadMapOccurrences } from '../services/mapa.js'
import { getAllSchools, loadSchoolCatalog } from '../utils/schools.js'
import {
  includesNormalized,
  MAP_CRITICIDADE_OPTIONS,
  mergeSchoolsWithOccurrences,
  normalizeOccurrenceCriticidadeKey,
} from '../utils/schoolRecords.js'
import {
  filterOccurrencesForMap,
  isResolvedOccurrence,
  isResolvedStatusFilter,
  MAP_STATUS_OPTIONS,
} from '../utils/occurrenceStatus.js'
import {
  buildBairroStats,
  buildFeatureEntries,
  buildSchoolBairroIndex,
  defaultColorScale,
  getBairroDisplayName,
  getBairroKey,
  getScaledColor,
  getSchoolPendingScore,
  isValidSchoolCoordinate,
} from '../utils/mapaBairros.js'

const mapCenter = [-23.6203, -45.4131]
const drawerFocusOffset = { x: -180, y: 0 }
const criticidadeOptions = MAP_CRITICIDADE_OPTIONS
const statusOptions = MAP_STATUS_OPTIONS
const mapStyleStorageKey = 'seduc-map-style'
const colorScaleStorageKey = 'seduc-map-color-scale'
const schoolLabelZoom = 15
const schoolSearchResultLimit = 12
const resolvedHistoryColorScale = {
  start: '#94a3b8',
  middle: '#94a3b8',
  end: '#94a3b8',
}
const BAIRROS_GEOJSON_URLS = [
  '/geo/caraguatatuba-bairros-atualizado-v2.geojson',
  '/geo/caraguatatuba-bairros.geojson',
]

const bairroStyleConfig = {
  ...bairroStyleDefaults,
  strokeColor: '#334155',
  municipioBoundaryWeight: 2.2,
  strokeWeight: 1.2,
  strokeOpacity: 0.75,
  dashArray: '6 4',
  municipioFillOpacity: 0.02,
  fillOpacity: 0.16,
  fillOpacitySelected: 0.1,
}

const mapStyles = {
  cartoLight: {
    label: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  cartoLightNoLabels: {
    label: 'Claro sem rótulos',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  cartoVoyager: {
    label: 'Ruas',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  cartoDark: {
    label: 'Escuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  osmPadrao: {
    label: 'OSM padrão',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  stadiaSmooth: {
    label: 'Suave',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors',
  },
}
const defaultMapStyleKey = 'cartoLightNoLabels'

function isFeatureCollectionGeoJson(data) {
  return data?.type === 'FeatureCollection' && Array.isArray(data.features)
}

async function fetchFirstAvailableGeoJson(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Falha ao carregar ${url}`)
      }

      const data = await response.json()
      if (isFeatureCollectionGeoJson(data)) {
        return data
      }

      throw new Error(`GeoJSON inválido em ${url}`)
    } catch (error) {
      console.warn(error.message)
    }
  }

  return null
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''))
}

function readStoredColorScale() {
  if (typeof window === 'undefined') {
    return defaultColorScale
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(colorScaleStorageKey) || 'null')
    if (!stored || typeof stored !== 'object') {
      return defaultColorScale
    }

    return {
      start: isHexColor(stored.start) ? stored.start : defaultColorScale.start,
      middle: isHexColor(stored.middle) ? stored.middle : defaultColorScale.middle,
      end: isHexColor(stored.end) ? stored.end : defaultColorScale.end,
    }
  } catch {
    return defaultColorScale
  }
}

function getPreferredCoordinate(primaryValue, fallbackValue) {
  if (Number.isFinite(Number(primaryValue))) return Number(primaryValue)
  if (Number.isFinite(Number(fallbackValue))) return Number(fallbackValue)
  return null
}

function mergeSchoolHeatmapData({ schoolCatalog, heatmapData }) {
  const catalogById = new Map(schoolCatalog.map((school) => [school.id, school]))
  const heatmapById = new Map(heatmapData.map((item) => [item.escolaId, item]))
  const allIds = new Set([...catalogById.keys(), ...heatmapById.keys()])

  return [...allIds]
    .map((schoolId) => {
      const catalogSchool = catalogById.get(schoolId) || {}
      const heatmapSchool = heatmapById.get(schoolId) || {}
      const latitude = getPreferredCoordinate(heatmapSchool.latitude, catalogSchool.latitude)
      const longitude = getPreferredCoordinate(heatmapSchool.longitude, catalogSchool.longitude)
      const normalizedSchool = {
        ...catalogSchool,
        ...heatmapSchool,
        id: schoolId,
        escolaId: schoolId,
        escolaNome: heatmapSchool.escolaNome || heatmapSchool.nome || catalogSchool.nome || 'Escola sem nome',
        nome: catalogSchool.nome || heatmapSchool.escolaNome || heatmapSchool.nome || 'Escola sem nome',
        bairro: heatmapSchool.bairro || heatmapSchool.bairroNome || catalogSchool.bairro || catalogSchool.bairroNome || '',
        latitude,
        longitude,
        totalOcorrencias: Number(heatmapSchool.totalOcorrencias || 0),
        criticas: Number(heatmapSchool.criticas || 0),
        atencao: Number(heatmapSchool.atencao || 0),
        baixas: Number(heatmapSchool.baixas || 0),
        intensidade: Number.isFinite(Number(heatmapSchool.intensidade)) ? Number(heatmapSchool.intensidade) : 0,
      }

      return {
        ...normalizedSchool,
        score: getSchoolPendingScore(normalizedSchool),
      }
    })
    .sort((left, right) => left.escolaNome.localeCompare(right.escolaNome, 'pt-BR'))
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function truncateMapText(value, maxLength = 30) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getBairroLabelPosition(entry, stats) {
  if (Array.isArray(entry?.labelPosition) && entry.labelPosition.length === 2) {
    return entry.labelPosition
  }

  if (Array.isArray(entry?.bounds?.center) && entry.bounds.center.length === 2) {
    return entry.bounds.center
  }

  if (Array.isArray(entry?.labelBounds?.bounds?.center) && entry.labelBounds.bounds.center.length === 2) {
    return entry.labelBounds.bounds.center
  }

  if (Array.isArray(stats?.labelPosition) && stats.labelPosition.length === 2) {
    return stats.labelPosition
  }

  return null
}

function getBairroLabelPixelBounds(entry, map) {
  if (!map) return null

  const bounds = entry?.bounds || entry?.labelBounds?.bounds || null
  if (bounds?.northWest && bounds?.southEast) {
    const northWest = map.latLngToLayerPoint(bounds.northWest)
    const southEast = map.latLngToLayerPoint(bounds.southEast)
    const width = Math.abs(southEast.x - northWest.x)
    const height = Math.abs(southEast.y - northWest.y)

    if (Number.isFinite(width) && Number.isFinite(height)) {
      return {
        width,
        height,
        area: width * height,
        smallestSide: Math.min(width, height),
      }
    }
  }

  const labelBounds = entry?.labelBounds
  if (!labelBounds) return null
  const northWest = map.latLngToLayerPoint([labelBounds.maxLatitude, labelBounds.minLongitude])
  const southEast = map.latLngToLayerPoint([labelBounds.minLatitude, labelBounds.maxLongitude])
  const width = Math.abs(southEast.x - northWest.x)
  const height = Math.abs(southEast.y - northWest.y)

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null
  }

  return {
    width,
    height,
    area: width * height,
    smallestSide: Math.min(width, height),
  }
}

function createSchoolPointIcon({ color, isSelected, isDimmed }) {
  const size = isSelected ? 20 : 15
  const borderWidth = isSelected ? 3 : 2.4
  const opacity = isDimmed ? 0.22 : 0.96
  const glowSize = isSelected ? 16 : 11
  const outerGlow = isSelected ? 24 : 17

  return L.divIcon({
    className: 'school-point-icon',
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        background:${color};
        border:${borderWidth}px solid rgba(255,255,255,0.92);
        opacity:${opacity};
        transform:scale(${isSelected ? 1.15 : 1});
        transform-origin:center center;
        box-shadow:
          0 0 ${glowSize}px ${color},
          0 0 ${outerGlow}px ${color};
        transition:transform .18s ease, opacity .18s ease, box-shadow .18s ease;
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -13],
    tooltipAnchor: [0, -16],
  })
}

function createBairroLabelIcon() {
  return L.divIcon({
    className: 'bairro-label-anchor',
    html: '<span></span>',
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    tooltipAnchor: [0, 0],
  })
}

function normalizeCriticidade(value) {
  return normalizeOccurrenceCriticidadeKey(value)
}

function matchesOccurrenceFilters(occurrence, filters) {
  if (filters.escolaId && occurrence.escolaId !== filters.escolaId) return false
  if (filters.criticidade && normalizeCriticidade(occurrence.criticidade) !== normalizeCriticidade(filters.criticidade)) return false
  if (filters.dataInicial && (occurrence.dataAbertura || occurrence.dataEnvio || '') < filters.dataInicial) return false
  if (filters.dataFinal && (occurrence.dataAbertura || occurrence.dataEnvio || '') > filters.dataFinal) return false
  return true
}

function getCriticidadeRank(criticidade) {
  const key = normalizeOccurrenceCriticidadeKey(criticidade)
  if (key === 'critica') return 3
  if (key === 'atencao') return 2
  return 1
}

function getOccurrenceOpenDate(occurrence) {
  const raw = occurrence.dataAbertura || occurrence.dataEnvio || occurrence.data || occurrence.dataAtualizacao
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function sortOcorrenciasByUrgencia(left, right) {
  const rankDiff = getCriticidadeRank(right.criticidade) - getCriticidadeRank(left.criticidade)
  if (rankDiff !== 0) return rankDiff

  const leftDate = getOccurrenceOpenDate(left)
  const rightDate = getOccurrenceOpenDate(right)
  if (leftDate && rightDate) return leftDate - rightDate
  if (leftDate) return -1
  if (rightDate) return 1
  return 0
}

function getOccurrenceCopy(historyMode) {
  return historyMode
    ? {
        colorScaleLabel: 'Ocorrências resolvidas',
        drawerSectionTitle: 'Ocorrências resolvidas',
        emptyBairroMessage: 'Nenhuma ocorrência resolvida encontrada para as escolas deste bairro com os filtros atuais.',
        emptyEscolaMessage: 'Nenhuma ocorrência resolvida encontrada para esta escola.',
        markerSummarySingular: 'ocorrência resolvida',
        markerSummaryPlural: 'ocorrências resolvidas',
      }
    : {
        colorScaleLabel: 'Solicitações pendentes',
        drawerSectionTitle: 'Solicitações pendentes',
        emptyBairroMessage: 'Nenhuma solicitação encontrada para as escolas deste bairro com os filtros atuais.',
        emptyEscolaMessage: 'Nenhuma ocorrência encontrada para esta escola.',
        markerSummarySingular: 'ocorrência ativa',
        markerSummaryPlural: 'ocorrências ativas',
      }
}

function formatOccurrenceQuantity(total, singularLabel, pluralLabel) {
  const amount = Number(total || 0)
  return `${amount} ${amount === 1 ? singularLabel : pluralLabel}`
}

function buildMetricItems({ metrics, historyMode, schoolCount }) {
  if (historyMode) {
    return [
      {
        label: 'Resolvidas',
        value: Number(metrics.totalOcorrencias || 0),
      },
      {
        label: 'Escolas',
        value: Number(schoolCount || 0),
      },
    ]
  }

  return [
    {
      label: 'Ocorrências ativas',
      value: Number(metrics.totalOcorrencias || 0),
    },
    {
      label: 'Críticas ativas',
      value: Number(metrics.criticas || 0),
    },
  ]
}

function getContextMetrics({
  historyMode,
  escola,
  selectedBairroStats,
  summaryMetrics,
  visibleSchoolCount,
}) {
  if (escola) {
    const metrics = {
      totalOcorrencias: Number(escola.totalOcorrencias || 0),
      criticas: Number(escola.criticas || 0),
      atencao: Number(escola.atencao || 0),
      baixas: Number(escola.baixas || 0),
      intensidade: Number(escola.score || escola.intensidade || 0),
    }

    return {
      title: escola.escolaNome || escola.nome || 'Escola selecionada',
      message: escola.bairro ? `Leitura focada em ${escola.bairro}.` : 'Leitura focada na unidade selecionada.',
      items: buildMetricItems({
        metrics,
        schoolCount: 1,
        historyMode,
      }),
    }
  }

  if (selectedBairroStats) {
    const metrics = {
      totalOcorrencias: Number(selectedBairroStats.totalSolicitacoes || 0),
      criticas: Number(selectedBairroStats.criticas || 0),
      atencao: Number(selectedBairroStats.atencao || 0),
      baixas: Number(selectedBairroStats.baixas || 0),
      intensidade: Number(selectedBairroStats.score || 0),
    }

    return {
      title: selectedBairroStats.nome,
      message: selectedBairroStats.totalEscolas > 0
        ? `${selectedBairroStats.totalEscolas} escola${selectedBairroStats.totalEscolas > 1 ? 's' : ''} no contexto atual.`
        : 'Nenhuma escola cadastrada neste bairro.',
      items: buildMetricItems({
        metrics,
        schoolCount: selectedBairroStats.totalEscolas,
        historyMode,
      }),
    }
  }

  return {
    title: 'Geral',
    message: `${visibleSchoolCount} escola${visibleSchoolCount === 1 ? '' : 's'} visíveis no contexto atual.`,
    items: buildMetricItems({
      metrics: summaryMetrics,
      schoolCount: visibleSchoolCount,
      historyMode,
    }),
  }
}

function getBairroSolicitacoes({ bairroKey, bairroStats, occurrences, schoolsById }) {
  if (!bairroKey || !bairroStats[bairroKey]) {
    return []
  }

  const schoolIds = new Set(bairroStats[bairroKey].schoolIds || [])
  return occurrences
    .filter((occurrence) => schoolIds.has(occurrence.escolaId))
    .map((occurrence) => ({
      ...occurrence,
      escolaNome: occurrence.escola || schoolsById[occurrence.escolaId]?.escolaNome || schoolsById[occurrence.escolaId]?.nome || 'Escola sem nome',
    }))
    .sort(sortOcorrenciasByUrgencia)
}

function getBairroLabelStyle({ entry, currentZoom, isSelected, map }) {
  const pixelBounds = getBairroLabelPixelBounds(entry, map)
  const width = Number(pixelBounds?.width || 80)
  const height = Number(pixelBounds?.height || 40)
  const area = Math.max(1, Number(pixelBounds?.area || width * height))
  const smallestSide = Math.min(width, height)

  if (!isSelected && currentZoom < 12) return { visible: false }
  if (!isSelected && smallestSide < 28 && currentZoom < 15) return { visible: false }
  if (!isSelected && width < 64 && currentZoom < 14) return { visible: false }
  if (!isSelected && height < 18 && currentZoom < 15) return { visible: false }

  const fontSize = clampNumber(
    Math.min(Math.sqrt(area) / 20, height * 0.62, width / 5.3),
    8,
    isSelected ? 18 : 15,
  )
  const maxWidth = clampNumber(
    width * 0.65,
    56,
    isSelected ? 220 : 180,
  )
  const maxLength = clampNumber(
    Math.floor(maxWidth / Math.max(fontSize * 0.58, 1)),
    8,
    28,
  )

  return {
    visible: true,
    fontSize,
    maxWidth,
    maxLength,
    opacity: isSelected ? 0.98 : 0.78,
  }
}

function SchoolSearchCombobox({
  options,
  searchValue,
  selectedValue,
  onClear,
  onSearchChange,
  onSelectOption,
  placeholder = 'Buscar escola...',
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const showClearButton = Boolean(searchValue || selectedValue)

  useEffect(() => {
    if (!open) return undefined

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function handleInputChange(event) {
    onSearchChange(event.target.value)
    setOpen(true)
  }

  function handleSelect(option) {
    onSelectOption(option)
    setOpen(false)
  }

  function handleClear() {
    onClear()
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      setOpen(true)
    }

    if (event.key === 'Enter' && open && options.length === 1) {
      event.preventDefault()
      handleSelect(options[0])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="school-search-results"
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-16 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />

      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
        {showClearButton ? (
          <button
            type="button"
            onClick={handleClear}
            className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Limpar escola"
          >
            <span className="text-base leading-none">&times;</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={open ? 'Fechar busca de escolas' : 'Abrir busca de escolas'}
        >
          <ChevronIcon direction={open ? 'up' : 'down'} />
        </button>
      </div>

      {open ? (
        <div className="absolute top-full z-[4100] mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <ul id="school-search-results" role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {options.length > 0 ? options.map((option) => {
              const isSelected = option.value === selectedValue

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-start justify-between gap-2 rounded-md px-3 py-2.5 text-left transition ${isSelected ? 'bg-primary-50 text-primary-strong' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug">{option.inputLabel}</span>
                      {option.secondaryLabel ? (
                        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                          {option.secondaryLabel}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <span className="shrink-0 text-xs font-bold text-primary-strong">OK</span>
                    ) : null}
                  </button>
                </li>
              )
            }) : (
              <li className="px-3 py-2 text-sm font-semibold text-slate-400">Nenhuma escola encontrada</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function Mapa({ onNavigate }) {
  const [filters, setFilters] = useState({
    criticidade: '',
    status: '',
    escolaId: '',
    dataInicial: '',
    dataFinal: '',
  })
  const [schoolCatalog, setSchoolCatalog] = useState(() => getAllSchools())
  const [occurrenceCatalog, setOccurrenceCatalog] = useState([])
  const [loadingMapa, setLoadingMapa] = useState(true)
  const [erroMapa, setErroMapa] = useState('')
  const [escolaSelecionada, setEscolaSelecionada] = useState('')
  const [modalContext, setModalContext] = useState(null)
  const [mapFocusTarget, setMapFocusTarget] = useState(null)
  const [caraguatatubaBoundary, setCaraguatatubaBoundary] = useState(null)
  const [bairrosGeoJson, setBairrosGeoJson] = useState(null)
  const [showBairrosLayer, setShowBairrosLayer] = useState(true)
  const [showMunicipioBoundary, setShowMunicipioBoundary] = useState(false)
  const [selectedBairro, setSelectedBairro] = useState('')
  const [currentZoom, setCurrentZoom] = useState(13)
  const [colorScale, setColorScale] = useState(() => readStoredColorScale())
  const [isColorScaleExpanded, setIsColorScaleExpanded] = useState(false)
  const [isMapStyleExpanded, setIsMapStyleExpanded] = useState(false)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState('')
  const warnedSchoolIdsRef = useRef(new Set())
  const [mapStyleKey, setMapStyleKey] = useState(() => {
    if (typeof window === 'undefined') return defaultMapStyleKey

    try {
      const storedStyle = window.localStorage.getItem(mapStyleStorageKey)
      if (!storedStyle || storedStyle === 'cartoLight') {
        return defaultMapStyleKey
      }

      return mapStyles[storedStyle] ? storedStyle : defaultMapStyleKey
    } catch {
      return defaultMapStyleKey
    }
  })

  const drawerAberto = Boolean(modalContext)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMapData() {
      setLoadingMapa(true)
      setErroMapa('')

      try {
        const schools = await loadSchoolCatalog({ includeOfficialFallback: true })
        if (controller.signal.aborted) return

        const nextSchools = Array.isArray(schools) && schools.length > 0 ? schools : getAllSchools()
        setSchoolCatalog(nextSchools)

        const occurrences = await loadMapOccurrences(nextSchools, controller.signal)
        if (controller.signal.aborted) return

        setOccurrenceCatalog(occurrences)
      } catch (error) {
        if (controller.signal.aborted) return

        setSchoolCatalog(getAllSchools())
        setOccurrenceCatalog([])
        setErroMapa(error.message || 'Não foi possível carregar os dados do mapa.')
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMapa(false)
        }
      }
    }

    loadMapData()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let active = true

    fetch('/geo/caraguatatuba-boundary.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Falha ao carregar limite municipal')
        }
        return response.json()
      })
      .then((data) => {
        if (active) {
          setCaraguatatubaBoundary(data)
        }
      })
      .catch((error) => {
        console.warn(error.message)
        if (active) {
          setCaraguatatubaBoundary(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    fetchFirstAvailableGeoJson(BAIRROS_GEOJSON_URLS)
      .then((data) => {
        if (active) {
          setBairrosGeoJson(data)
        }
      })
      .catch(() => {
        if (active) {
          setBairrosGeoJson(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

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
    try {
      window.localStorage.setItem(mapStyleStorageKey, mapStyleKey)
    } catch {
      return
    }
  }, [mapStyleKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(colorScaleStorageKey, JSON.stringify(colorScale))
    } catch {
      return
    }
  }, [colorScale])

  useEffect(() => {
    if (showBairrosLayer) return

    setSelectedBairro('')
    if (modalContext?.type === 'bairro') {
      setModalContext(null)
    }
  }, [modalContext, showBairrosLayer])

  const historyMode = isResolvedStatusFilter(filters.status)
  const occurrenceCopy = useMemo(() => getOccurrenceCopy(historyMode), [historyMode])
  const effectiveColorScale = historyMode ? resolvedHistoryColorScale : colorScale

  const statusScopedOccurrences = useMemo(
    () => filterOccurrencesForMap(occurrenceCatalog, filters.status),
    [filters.status, occurrenceCatalog],
  )

  const filteredOccurrences = useMemo(
    () => statusScopedOccurrences.filter((occurrence) => matchesOccurrenceFilters(occurrence, filters)),
    [filters, statusScopedOccurrences],
  )

  const mergedSchoolsFull = useMemo(
    () => mergeSchoolsWithOccurrences(schoolCatalog, occurrenceCatalog),
    [occurrenceCatalog, schoolCatalog],
  )

  const allMapSchools = useMemo(
    () => mergeSchoolsWithOccurrences(schoolCatalog, filteredOccurrences),
    [filteredOccurrences, schoolCatalog],
  )

  const featureEntries = useMemo(
    () => buildFeatureEntries(bairrosGeoJson),
    [bairrosGeoJson],
  )

  const mapSchools = useMemo(
    () => allMapSchools.filter((item) => {
      if (filters.escolaId && item.escolaId !== filters.escolaId) return false
      return true
    }),
    [allMapSchools, filters.escolaId],
  )

  const allSchoolById = useMemo(
    () => Object.fromEntries(allMapSchools.map((item) => [item.escolaId, item])),
    [allMapSchools],
  )

  const { schoolBairroIndex, unmatchedSchools } = useMemo(
    () => buildSchoolBairroIndex({ schools: mapSchools, featureEntries }),
    [featureEntries, mapSchools],
  )

  const schoolMarkers = useMemo(
    () => mapSchools
      .filter(isValidSchoolCoordinate)
      .map((school) => ({
        ...school,
        bairroKey: schoolBairroIndex[school.escolaId] || '',
      })),
    [mapSchools, schoolBairroIndex],
  )

  const schoolById = useMemo(
    () => Object.fromEntries(mapSchools.map((item) => [item.escolaId, item])),
    [mapSchools],
  )

  useEffect(() => {
    if (!import.meta.env.DEV) return

    unmatchedSchools.forEach((school) => {
      if (warnedSchoolIdsRef.current.has(school.escolaId)) return
      warnedSchoolIdsRef.current.add(school.escolaId)
      console.warn(
        `[Mapa] Escola sem correspondencia espacial no GeoJSON: ${school.escolaNome || school.nome} (${school.escolaId})`,
      )
    })
  }, [unmatchedSchools])

  useEffect(() => {
    if (!import.meta.env.DEV || mergedSchoolsFull.length === 0) return

    const escolasComOcorrencias = mergedSchoolsFull.filter((school) => Number(school.totalOcorrencias || 0) > 0).length
    console.info('[schools]', {
      escolas: mergedSchoolsFull.length,
      ocorrencias: occurrenceCatalog.length,
      escolasComOcorrencias,
      escolasSemOcorrencias: mergedSchoolsFull.length - escolasComOcorrencias,
    })
  }, [mergedSchoolsFull, occurrenceCatalog.length])

  const escolaSelecionadaResumo = schoolById[escolaSelecionada] || allSchoolById[escolaSelecionada] || null

  useEffect(() => {
    if (!escolaSelecionada) return

    if (!schoolById[escolaSelecionada]) {
      closeDrawer()
    }
  }, [escolaSelecionada, schoolById])

  const detalheEscola = escolaSelecionadaResumo || null
  const loadingDetalhe = false

  const ocorrenciasEscola = useMemo(() => {
    if (Array.isArray(detalheEscola?.ocorrencias)) {
      return [...detalheEscola.ocorrencias].sort(sortOcorrenciasByUrgencia)
    }

    const fallback = getEscolaOcorrenciasFallback(escolaSelecionada, allMapSchools, filteredOccurrences)
    return [...fallback.ocorrencias].sort(sortOcorrenciasByUrgencia)
  }, [allMapSchools, detalheEscola, escolaSelecionada, filteredOccurrences])

  const schoolOptions = useMemo(() => (
    mergedSchoolsFull.map((school) => ({
      value: school.escolaId,
      inputLabel: school.escolaNome || school.nome || 'Escola sem nome',
      secondaryLabel: school.bairro || '',
      label: `${school.escolaNome}${school.bairro ? ` - ${school.bairro}` : ''}`,
    }))
  ), [mergedSchoolsFull])

  const selectedSchoolOption = useMemo(
    () => schoolOptions.find((option) => option.value === filters.escolaId) || null,
    [filters.escolaId, schoolOptions],
  )

  const schoolSearchQuery = filters.escolaId && selectedSchoolOption?.inputLabel === schoolSearch
    ? ''
    : schoolSearch

  const filteredSchoolOptions = useMemo(() => {
    const matchingOptions = schoolSearchQuery
      ? schoolOptions.filter((option) => includesNormalized(option.inputLabel, schoolSearchQuery))
      : schoolOptions

    return schoolSearchQuery
      ? matchingOptions.slice(0, 40)
      : matchingOptions.slice(0, schoolSearchResultLimit)
  }, [schoolOptions, schoolSearchQuery])

  const avisoGlobal = useMemo(() => {
    if (!erroMapa) return null

    return {
      title: 'Alguns dados estão em fallback local porque a API não respondeu.',
      detail: erroMapa,
    }
  }, [erroMapa])

  const summaryMetrics = useMemo(() => (
    mapSchools.reduce((accumulator, item) => ({
      totalOcorrencias: accumulator.totalOcorrencias + Number(item.totalOcorrencias || 0),
      criticas: accumulator.criticas + Number(item.criticas || 0),
      atencao: accumulator.atencao + Number(item.atencao || 0),
      baixas: accumulator.baixas + Number(item.baixas || 0),
      intensidade: accumulator.intensidade + Number(item.score || 0),
    }), {
      totalOcorrencias: 0,
      criticas: 0,
      atencao: 0,
      baixas: 0,
      intensidade: 0,
    })
  ), [mapSchools])

  const schoolScoreRange = useMemo(() => ({
    minimum: 0,
    maximum: Math.max(0, ...schoolMarkers.map((item) => Number(historyMode ? item.totalOcorrencias : item.score) || 0)),
  }), [historyMode, schoolMarkers])

  const markerIconsById = useMemo(() => (
    Object.fromEntries(
      schoolMarkers.map((item) => [
        item.escolaId,
        createSchoolPointIcon({
          color: historyMode
            ? effectiveColorScale.middle
            : getScaledColor(item.score, effectiveColorScale, schoolScoreRange.maximum),
          isSelected: escolaSelecionada === item.escolaId,
          isDimmed: Boolean(
            showBairrosLayer
            && selectedBairro
            && item.bairroKey !== selectedBairro,
          ),
        }),
      ]),
    )
  ), [effectiveColorScale, escolaSelecionada, historyMode, schoolMarkers, schoolScoreRange.maximum, selectedBairro, showBairrosLayer])

  const bairroStatsResult = useMemo(
    () => buildBairroStats({
      featureEntries,
      schools: mapSchools,
      schoolBairroIndex,
      colorScale: effectiveColorScale,
    }),
    [effectiveColorScale, featureEntries, mapSchools, schoolBairroIndex],
  )

  const bairroStats = bairroStatsResult.bairroStats
  const bairroScoreRange = useMemo(() => ({
    minimum: 0,
    maximum: historyMode
      ? Math.max(0, ...Object.values(bairroStats).map((item) => Number(item.totalSolicitacoes || 0)))
      : bairroStatsResult.maxScore,
  }), [bairroStats, bairroStatsResult.maxScore, historyMode])

  useEffect(() => {
    if (!selectedBairro) return

    if (!bairroStats[selectedBairro]) {
      setSelectedBairro('')
      if (modalContext?.type === 'bairro') {
        setModalContext(null)
      }
    }
  }, [bairroStats, modalContext, selectedBairro])

  const selectedBairroStats = selectedBairro ? bairroStats[selectedBairro] || null : null

  const visibleSchoolPoints = useMemo(() => (
    schoolMarkers
      .map((item) => [Number(item.latitude), Number(item.longitude)])
      .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude))
  ), [schoolMarkers])

  const bairroLabelEntries = useMemo(() => (
    featureEntries.filter((entry) => Boolean(entry.labelPosition))
  ), [featureEntries])

  const currentSchoolContext = modalContext?.type === 'escola'
    ? (detalheEscola || escolaSelecionadaResumo)
    : null

  const metricContext = useMemo(() => (
    getContextMetrics({
      historyMode,
      escola: currentSchoolContext,
      selectedBairroStats,
      summaryMetrics,
      visibleSchoolCount: mapSchools.length,
    })
  ), [currentSchoolContext, historyMode, mapSchools.length, selectedBairroStats, summaryMetrics])

  const selectedMapStyle = mapStyles[mapStyleKey] || mapStyles[defaultMapStyleKey]
  const shouldShowPermanentSchoolLabels = currentZoom >= schoolLabelZoom && !filters.escolaId && !drawerAberto
  const legendRange = showBairrosLayer ? bairroScoreRange : schoolScoreRange
  const legendGradient = `linear-gradient(90deg, ${effectiveColorScale.start} 0%, ${effectiveColorScale.middle} 50%, ${effectiveColorScale.end} 100%)`

  const bairroDrawerStats = modalContext?.type === 'bairro'
    ? bairroStats[modalContext.bairroKey] || null
    : null

  const bairroDrawerOcorrencias = useMemo(() => (
    modalContext?.type === 'bairro'
      ? getBairroSolicitacoes({
        bairroKey: modalContext.bairroKey,
        bairroStats,
        occurrences: filteredOccurrences,
        schoolsById: allSchoolById,
      })
      : []
  ), [allSchoolById, bairroStats, filteredOccurrences, modalContext])

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function clearSchoolFilter({ preserveSearch = false, nextSearch = '' } = {}) {
    setFilter('escolaId', '')
    setSchoolSearch(preserveSearch ? nextSearch : '')
    closeDrawer()
  }

  function handleSchoolSearchChange(value) {
    setSchoolSearch(value)

    if (filters.escolaId) {
      setFilter('escolaId', '')
      closeDrawer()
    }
  }

  function handleSelectSchoolOption(option) {
    setSchoolSearch(option.inputLabel)
    setFilter('escolaId', option.value)
    openSchoolDrawer(option.value, { zoom: 16 })
  }

  function handleClearSchoolSelection() {
    clearSchoolFilter()
  }

  function clearSchoolContext() {
    setEscolaSelecionada('')
  }

  function handleSelectBairro(feature) {
    const bairroKey = getBairroKey(feature)
    if (!bairroKey) return

    const isSameBairro = selectedBairro === bairroKey
    if (isSameBairro) {
      setSelectedBairro('')
      if (modalContext?.type === 'bairro' && modalContext.bairroKey === bairroKey) {
        setModalContext(null)
      }
      return
    }

    clearSchoolContext()
    setSelectedBairro(bairroKey)
    setModalContext({ type: 'bairro', bairroKey })

    const bounds = L.geoJSON(feature).getBounds()
    if (bounds.isValid()) {
      const southWest = bounds.getSouthWest()
      const northEast = bounds.getNorthEast()
      setMapFocusTarget({
        bounds: [
          [southWest.lat, southWest.lng],
          [northEast.lat, northEast.lng],
        ],
        paddingTopLeft: [280, 24],
        paddingBottomRight: [32, 32],
        maxZoom: 15,
      })
    }
  }

  function openSchoolDrawer(escolaId, options = {}) {
    const escola = schoolById[escolaId] || allSchoolById[escolaId] || null
    const bairroKey = schoolBairroIndex[escolaId] || ''

    clearSchoolContext()
    setEscolaSelecionada(escolaId)
    setModalContext({ type: 'escola', escolaId, bairroKey })

    if (showBairrosLayer && bairroKey) {
      setSelectedBairro(bairroKey)
    }

    if (escola && isValidSchoolCoordinate(escola)) {
      setMapFocusTarget({
        latitude: Number(escola.latitude),
        longitude: Number(escola.longitude),
        zoom: options.zoom || 15,
        offsetX: drawerFocusOffset.x,
        offsetY: drawerFocusOffset.y,
      })
    }
  }

  function closeDrawer() {
    setModalContext(null)
    clearSchoolContext()
    setMapFocusTarget(null)
  }

  function clearSelectedBairro() {
    setSelectedBairro('')
    if (modalContext?.type === 'bairro') {
      setModalContext(null)
    }
  }

  function deselectAll() {
    if (!modalContext && !selectedBairro && !escolaSelecionada && !filters.escolaId) return

    closeDrawer()
    setSelectedBairro('')
    if (filters.escolaId) {
      clearSchoolFilter()
    }
  }

  function openSchoolRegistry() {
    if (modalContext?.type !== 'escola' || !escolaSelecionada) return
    onNavigate?.(`/escolas/${encodeURIComponent(escolaSelecionada)}`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {avisoGlobal ? (
        <Card className="shrink-0 border-amber-200 bg-amber-50/80">
          <p className="text-sm font-bold text-amber-900">{avisoGlobal.title}</p>
          <p className="mt-1 text-xs font-semibold text-amber-800/80">{avisoGlobal.detail}</p>
        </Card>
      ) : null}

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setIsFiltersExpanded((current) => !current)}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm sm:hidden"
          aria-expanded={isFiltersExpanded}
          aria-label={isFiltersExpanded ? 'Fechar filtros do mapa' : 'Abrir filtros do mapa'}
        >
          Filtros
          <ChevronIcon direction={isFiltersExpanded ? 'up' : 'down'} />
        </button>

        <div className={`${isFiltersExpanded ? 'grid' : 'hidden'} mt-2 grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:mt-0 sm:flex sm:flex-wrap sm:items-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}>
          <div className="min-w-0 sm:w-32">
            <Select
              value={filters.criticidade}
              onChange={(value) => setFilter('criticidade', value)}
              placeholder="Criticidade"
              options={[{ value: '', label: 'Criticidade' }, ...criticidadeOptions]}
            />
          </div>
          <div className="min-w-0 sm:w-32">
            <Select
              value={filters.status}
              onChange={(value) => setFilter('status', value)}
              placeholder="Todos"
              options={[{ value: '', label: 'Todos' }, ...statusOptions]}
            />
          </div>
          <div className="col-span-2 min-w-0 sm:col-span-1 sm:w-72 lg:w-[25rem]">
            <SchoolSearchCombobox
              options={filteredSchoolOptions}
              searchValue={schoolSearch}
              selectedValue={filters.escolaId}
              onClear={handleClearSchoolSelection}
              onSearchChange={handleSchoolSearchChange}
              onSelectOption={handleSelectSchoolOption}
            />
          </div>
          <MapDateFilter
            label="Início"
            value={filters.dataInicial}
            onChange={(value) => setFilter('dataInicial', value)}
          />
          <MapDateFilter
            label="Fim"
            value={filters.dataFinal}
            onChange={(value) => setFilter('dataFinal', value)}
          />
        </div>
      </div>

      <Card className="relative z-0 flex flex-1 min-h-0 overflow-hidden p-0">
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <MetricPanel context={metricContext} drawerAberto={drawerAberto} />

          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom zoomControl={false} className="h-full w-full z-0">
            <TileLayer
              key={mapStyleKey}
              attribution={selectedMapStyle.attribution}
              url={selectedMapStyle.url}
            />
            <MapZoomWatcher onZoomChange={setCurrentZoom} />
            <MapBackgroundClickHandler onBackgroundClick={deselectAll} />
            {showMunicipioBoundary ? (
              <CaraguatatubaBoundary data={caraguatatubaBoundary} styleConfig={bairroStyleConfig} />
            ) : null}
            {showBairrosLayer ? (
              <CaraguatatubaBairrosLayer
                data={bairrosGeoJson}
                bairroStats={bairroStats}
                styleConfig={bairroStyleConfig}
                selectedSchoolId={escolaSelecionada}
                selectedBairro={selectedBairro}
                onSelectBairro={handleSelectBairro}
              />
            ) : null}
            {showBairrosLayer ? (
              <BairroLabelsLayer
                entries={bairroLabelEntries}
                bairroStats={bairroStats}
                currentZoom={currentZoom}
                selectedBairro={selectedBairro}
              />
            ) : null}
            <SyncMapView points={visibleSchoolPoints} boundaryData={caraguatatubaBoundary} />
            <MapResizeController drawerAberto={drawerAberto} />
            <MapTooltipCleanup
              shouldShowPermanentLabels={shouldShowPermanentSchoolLabels}
              schoolMarkerCount={schoolMarkers.length}
              selectedBairro={selectedBairro}
              selectedSchoolFilter={filters.escolaId}
              drawerAberto={drawerAberto}
            />
            <ZoomControlPosition />
            <MapFocusController target={mapFocusTarget} />

            {schoolMarkers.map((item) => {
              const showPermanentName = shouldShowPermanentSchoolLabels
              const tooltipMode = showPermanentName ? 'label' : 'detail'

              return (
                <Marker
                  key={item.escolaId}
                  icon={markerIconsById[item.escolaId]}
                  position={[item.latitude, item.longitude]}
                  eventHandlers={{ click: () => openSchoolDrawer(item.escolaId) }}
                >
                  <Tooltip
                    key={`tooltip-${item.escolaId}-${tooltipMode}`}
                    permanent={showPermanentName}
                    direction="top"
                    offset={[0, -8]}
                    opacity={1}
                    className={tooltipMode === 'label' ? 'school-name-tooltip' : 'school-detail-tooltip'}
                  >
                    {showPermanentName ? (
                      <span>{truncateMapText(item.escolaNome, 24)}</span>
                    ) : (
                      <div className="space-y-1">
                        <strong>{item.escolaNome}</strong>
                        <p>{formatOccurrenceQuantity(
                          item.totalOcorrencias,
                          occurrenceCopy.markerSummarySingular,
                          occurrenceCopy.markerSummaryPlural,
                        )}</p>
                      </div>
                    )}
                  </Tooltip>
                </Marker>
              )
            })}
          </MapContainer>

          <MapColorScaleControl
            colorScale={colorScale}
            isHistoryMode={historyMode}
            isExpanded={isColorScaleExpanded}
            legendGradient={legendGradient}
            legendRange={legendRange}
            label={occurrenceCopy.colorScaleLabel}
            onChangeScale={setColorScale}
            onToggle={() => setIsColorScaleExpanded((current) => !current)}
          />

          <div className={`absolute bottom-4 z-[650] max-w-[calc(100%-1rem)] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur ${drawerAberto ? 'hidden right-4 sm:block sm:right-[410px]' : 'right-4'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="block text-[10px] font-bold tracking-wide text-slate-500">
                Estilo do mapa
              </span>
              <button
                type="button"
                onClick={() => setIsMapStyleExpanded((current) => !current)}
                className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 sm:hidden"
                aria-label={isMapStyleExpanded ? 'Recolher opções do mapa' : 'Expandir opções do mapa'}
              >
                <ChevronIcon direction={isMapStyleExpanded ? 'up' : 'down'} />
              </button>
            </div>

            <div className={`${isMapStyleExpanded ? 'block' : 'hidden'} sm:block`}>
              <Select
                size="xs"
                dropUp
                className="mt-1"
                direction="up"
                value={mapStyleKey}
                onChange={setMapStyleKey}
                options={Object.entries(mapStyles).map(([styleKey, style]) => ({ value: styleKey, label: style.label }))}
              />
              <div className="mt-2 space-y-1.5 text-xs font-semibold text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showBairrosLayer}
                    onChange={(event) => setShowBairrosLayer(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border border-slate-300 text-primary"
                  />
                  Divisão por bairros
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showMunicipioBoundary}
                    onChange={(event) => setShowMunicipioBoundary(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border border-slate-300 text-primary"
                  />
                  Limite da cidade
                </label>
              </div>
              {selectedBairroStats ? (
                <div className="mt-2 border-t border-slate-200 pt-2">
                  <p className="truncate text-[10px] font-bold tracking-wide text-slate-500">
                    Bairro: {selectedBairroStats.nome}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {selectedBairroStats.totalEscolas > 0
                      ? `${selectedBairroStats.totalEscolas} escola${selectedBairroStats.totalEscolas > 1 ? 's' : ''} com ${formatOccurrenceQuantity(
                        selectedBairroStats.totalSolicitacoes,
                        occurrenceCopy.markerSummarySingular,
                        occurrenceCopy.markerSummaryPlural,
                      )}.`
                      : 'Sem escolas associadas no cadastro atual.'}
                  </p>
                  <button
                    type="button"
                    onClick={clearSelectedBairro}
                    className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Limpar bairro
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-28 bg-gradient-to-t from-slate-950/12 to-transparent" />

          {loadingMapa ? (
            <div className="absolute inset-0 z-[550] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                Carregando escolas e ocorrências...
              </div>
            </div>
          ) : null}

          <MapContextDrawer
            bairroOcorrencias={bairroDrawerOcorrencias}
            bairroStats={bairroDrawerStats}
            context={modalContext}
            detalheEscola={detalheEscola || escolaSelecionadaResumo}
            historyMode={historyMode}
            loadingDetalhe={loadingDetalhe}
            occurrenceCopy={occurrenceCopy}
            ocorrenciasEscola={ocorrenciasEscola}
            onClose={closeDrawer}
            onOpenSchoolRegistry={openSchoolRegistry}
            onOpenOcorrencia={(ocorrenciaId) => onNavigate?.(`/ocorrencias/${encodeURIComponent(ocorrenciaId)}`)}
          />
        </div>
      </Card>
    </div>
  )
}

function MetricPanel({ context, drawerAberto }) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  return (
    <div className={`absolute left-2 top-2 z-[650] sm:left-4 sm:top-4 ${drawerAberto ? 'hidden sm:block' : ''}`}>
      <button
        type="button"
        onClick={() => setIsMobileExpanded((current) => !current)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur sm:hidden"
        aria-expanded={isMobileExpanded}
        aria-label={isMobileExpanded ? 'Fechar resumo do mapa' : 'Abrir resumo do mapa'}
      >
        Resumo
        <ChevronIcon direction={isMobileExpanded ? 'up' : 'down'} />
      </button>

      <div
        className={`mt-2 w-[260px] max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:mt-0 sm:block sm:max-w-[calc(100%-1rem)] sm:p-4 ${isMobileExpanded ? 'block' : 'hidden'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500">
              {context.title}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {context.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileExpanded(false)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 sm:hidden"
            aria-label="Fechar resumo do mapa"
          >
            &times;
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {context.items.map((item) => (
            <MetricCard key={item.label} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MapDateFilter({ label, value, onChange }) {
  return (
    <label className="min-w-0 sm:w-36">
      <span className="mb-1 block text-[10px] font-bold leading-none tracking-wide text-slate-500">{label}</span>
      <input
        type="date"
        aria-label={`Data ${label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-[90%] min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary-500 sm:w-36 sm:px-3"
      />
    </label>
  )
}

function MetricCard({ item }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <span className="block text-[10px] font-bold tracking-wide text-slate-500">{item.label}</span>
      <strong className="mt-1 block text-base font-800 text-slate-950">{item.value}</strong>
    </div>
  )
}

function MapColorScaleControl({ colorScale, isExpanded, isHistoryMode, label, legendGradient, legendRange, onChangeScale, onToggle }) {
  return (
    <div className={`absolute bottom-4 left-20 z-[650] hidden border border-slate-200 bg-white/95 shadow-md backdrop-blur transition-all sm:block ${isExpanded ? 'w-[280px] rounded-xl p-3 shadow-lg' : 'w-[210px] rounded-lg px-3 py-2'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-wide text-slate-600">
          {label}
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
          aria-label={isExpanded ? 'Recolher escala de cores' : 'Expandir escala de cores'}
        >
          <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
        </button>
      </div>

      <div className={`${isExpanded ? 'block' : 'hidden'} sm:block`}>
        {isExpanded && !isHistoryMode ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ColorScaleField label="Início" value={colorScale.start} onChange={(value) => onChangeScale((current) => ({ ...current, start: value }))} />
            <ColorScaleField label="Meio" value={colorScale.middle} onChange={(value) => onChangeScale((current) => ({ ...current, middle: value }))} />
            <ColorScaleField label="Fim" value={colorScale.end} onChange={(value) => onChangeScale((current) => ({ ...current, end: value }))} />
          </div>
        ) : null}
        {isExpanded && isHistoryMode ? (
          <p className="mt-3 text-[11px] font-semibold text-slate-500">
            O histórico resolvido usa estilo neutro e não entra na intensidade do mapa.
          </p>
        ) : null}

        <div className={`${isExpanded ? 'mt-3' : 'mt-2'} h-3 rounded-full`} style={{ backgroundImage: legendGradient }} />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500">
          <span>{legendRange.minimum}</span>
          <span>{legendRange.maximum}</span>
        </div>
      </div>
    </div>
  )
}

function ChevronIcon({ direction }) {
  const isUp = direction === 'up'
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d={isUp ? 'M3 9L7 5L11 9' : 'M3 5L7 9L11 5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ColorScaleField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold text-slate-500">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full cursor-pointer rounded border border-slate-200 bg-white p-1"
      />
    </label>
  )
}


function BairroLabelsLayer({ entries, bairroStats, currentZoom, selectedBairro }) {
  const map = useMap()

  return entries.map((entry) => {
    const stats = bairroStats?.[entry.key] || null
    const labelPosition = getBairroLabelPosition(entry, stats)
    if (!labelPosition) return null

    const isSelected = selectedBairro === entry.key
    const labelStyle = getBairroLabelStyle({
      map,
      entry,
      currentZoom,
      isSelected,
    })

    if (!labelStyle.visible) return null

    const bairroName = getBairroDisplayName(entry) || stats?.nome || 'Bairro sem nome'

    return (
      <Marker
        key={`bairro-label-${entry.key}-${currentZoom}-${isSelected ? 'selected' : 'default'}`}
        position={labelPosition}
        icon={createBairroLabelIcon()}
        interactive={false}
      >
        <Tooltip
          permanent
          direction="center"
          offset={[0, 0]}
          opacity={1}
          className="bairro-name-tooltip"
        >
          <span
            style={{
              display: 'block',
              maxWidth: `${labelStyle.maxWidth}px`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontSize: `${labelStyle.fontSize}px`,
              fontWeight: isSelected ? 900 : 800,
              letterSpacing: isSelected ? '0.08em' : '0.05em',
              color: stats?.labelColor || '#475569',
              opacity: labelStyle.opacity,
              textShadow: '0 1px 0 rgba(255,255,255,0.96), 0 0 5px rgba(255,255,255,0.9), 0 1px 8px rgba(15,23,42,0.14)',
              WebkitTextStroke: '0.3px rgba(255,255,255,0.9)',
            }}
          >
            {truncateMapText(bairroName, labelStyle.maxLength)}
          </span>
        </Tooltip>
      </Marker>
    )
  })
}

function MapContextDrawer({
  bairroOcorrencias,
  bairroStats,
  context,
  detalheEscola,
  historyMode,
  loadingDetalhe,
  occurrenceCopy,
  ocorrenciasEscola,
  onClose,
  onOpenOcorrencia,
  onOpenSchoolRegistry,
}) {
  if (!context) return null

  const isBairroMode = context.type === 'bairro'
  const isEscolaMode = context.type === 'escola'
  const drawerTitle = isBairroMode
    ? (bairroStats?.nome || 'Bairro selecionado')
    : (detalheEscola?.escolaNome || detalheEscola?.nome || 'Detalhe da escola')

  return (
    <aside className="absolute bottom-4 right-4 top-4 z-[700] w-[390px] max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            {isEscolaMode ? (
              <button
                type="button"
                onClick={onOpenSchoolRegistry}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <span className="block truncate">{drawerTitle}</span>
              </button>
            ) : (
              <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <span className="block truncate text-sm font-bold text-slate-800">{drawerTitle}</span>
                <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                  {historyMode ? 'Histórico das escolas do bairro' : 'Solicitações das escolas do bairro'}
                </span>
              </div>
            )}
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Fechar
            </button>
          </div> 
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {isBairroMode ? (
            <>
              {Number(bairroStats?.totalEscolas || 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Nenhuma escola cadastrada neste bairro no contexto atual.
                </div>
              ) : bairroOcorrencias.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  {occurrenceCopy.emptyBairroMessage}
                </div>
              ) : (
                <div className="space-y-2">
                  {bairroOcorrencias.map((ocorrencia) => (
                    <OcorrenciaCard
                      key={ocorrencia.id}
                      ocorrencia={ocorrencia}
                      schoolName={ocorrencia.escolaNome}
                      onClick={() => onOpenOcorrencia?.(ocorrencia.id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {loadingDetalhe ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  Carregando dados da escola...
                </div>
              ) : null}

              {detalheEscola ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-800 tracking-wide text-slate-500">{occurrenceCopy.drawerSectionTitle}</h4>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${historyMode ? 'bg-slate-100 text-slate-700' : 'bg-primary-50 text-primary-strong'}`}>
                      {ocorrenciasEscola.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ocorrenciasEscola.length > 0 ? ocorrenciasEscola.map((ocorrencia) => (
                      <OcorrenciaCard
                        key={ocorrencia.id}
                        ocorrencia={ocorrencia}
                        onClick={() => onOpenOcorrencia?.(ocorrencia.id)}
                      />
                    )) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                        {occurrenceCopy.emptyEscolaMessage}
                      </div>
                    )}
                  </div>
                </div>
              ) : !loadingDetalhe ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                  Não foi possível localizar os dados desta escola.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

const criticidadeTextStyles = {
  critica: 'text-red-600',
  atencao: 'text-amber-600',
  baixa: 'text-emerald-600',
}

function OcorrenciaCriticidadeTag({ ocorrencia }) {
  if (isResolvedOccurrence(ocorrencia)) {
    return (
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
        Histórico resolvido
      </span>
    )
  }

  const key = normalizeOccurrenceCriticidadeKey(ocorrencia.criticidade)
  const label = ocorrencia.criticidadeLabel || ocorrencia.criticidade

  return (
    <span className="shrink-0 text-xs font-semibold text-slate-400">
      Prioridade: <span className={`font-bold ${criticidadeTextStyles[key]}`}>{label}</span>
    </span>
  )
}

function OcorrenciaStatusTag({ ocorrencia }) {
  const label = ocorrencia.statusLabel || ocorrencia.status

  return (
    <span className="text-[11px] font-semibold text-slate-500">
      Status: <span className="font-bold text-slate-700">{label}</span>
    </span>
  )
}

function formatOcorrenciaData(value) {
  if (!value) return 'Sem data'

  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? String(value) : parsedDate.toLocaleDateString('pt-BR')
}

function OcorrenciaCard({ ocorrencia, schoolName = '', onClick }) {
  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      } : undefined}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h5 className="text-sm font-bold leading-snug text-slate-900">{ocorrencia.titulo}</h5>
          {schoolName ? (
            <p className="mt-0.5 truncate text-[10px] font-bold tracking-wide text-slate-500">
              {schoolName}
            </p>
          ) : null}
        </div>
        <OcorrenciaCriticidadeTag ocorrencia={ocorrencia} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
        <OcorrenciaStatusTag ocorrencia={ocorrencia} />
        <span className="text-slate-300">•</span>
        <span className="font-semibold text-slate-500">
          {formatOcorrenciaData(ocorrencia.data || ocorrencia.dataAtualizacao || ocorrencia.dataAbertura || ocorrencia.dataEnvio)}
        </span>
      </div>
    </article>
  )
}

function MapFocusController({ target }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return

    if (target.bounds) {
      map.fitBounds(target.bounds, {
        paddingTopLeft: target.paddingTopLeft || [24, 24],
        paddingBottomRight: target.paddingBottomRight || [24, 24],
        maxZoom: target.maxZoom || 15,
      })
      return
    }

    let cancelled = false
    const handleMoveEnd = () => {
      if (cancelled || !target.offsetX) return
      map.panBy([target.offsetX, target.offsetY || 0], {
        animate: true,
        duration: 0.45,
      })
    }

    map.once('moveend', handleMoveEnd)
    map.flyTo([target.latitude, target.longitude], target.zoom || 15, {
      duration: 0.8,
    })

    return () => {
      cancelled = true
      map.off('moveend', handleMoveEnd)
    }
  }, [map, target])

  return null
}

function ZoomControlPosition() {
  const map = useMap()

  useEffect(() => {
    const zoomControl = L.control.zoom({ position: 'bottomleft' })
    zoomControl.addTo(map)

    return () => {
      zoomControl.remove()
    }
  }, [map])

  return null
}

function MapZoomWatcher({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom())
    },
  })

  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])

  return null
}

function MapBackgroundClickHandler({ onBackgroundClick }) {
  useMapEvents({
    click: () => {
      onBackgroundClick()
    },
  })

  return null
}

function MapTooltipCleanup({
  shouldShowPermanentLabels,
  schoolMarkerCount,
  selectedBairro,
  selectedSchoolFilter,
  drawerAberto,
}) {
  const map = useMap()

  useEffect(() => {
    if (shouldShowPermanentLabels) return undefined

    let frameId = window.requestAnimationFrame(() => {
      map.eachLayer((layer) => {
        const tooltip = typeof layer.getTooltip === 'function' ? layer.getTooltip() : null
        const className = String(tooltip?.options?.className || '')
        const isSchoolTooltip = className.includes('school-name-tooltip') || className.includes('school-detail-tooltip')

        if (isSchoolTooltip && typeof layer.closeTooltip === 'function') {
          layer.closeTooltip()
        }
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [drawerAberto, map, schoolMarkerCount, selectedBairro, selectedSchoolFilter, shouldShowPermanentLabels])

  return null
}

function SyncMapView({ points, boundaryData }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()

    if (points.length === 0) {
      if (boundaryData?.type === 'FeatureCollection' && Array.isArray(boundaryData.features) && boundaryData.features.length > 0) {
        const boundaryLayer = L.geoJSON(boundaryData)
        const bounds = boundaryLayer.getBounds()

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 })
          return
        }
      }

      map.setView(mapCenter, 13)
      return
    }

    const bounds = L.latLngBounds(points.map(([latitude, longitude]) => [latitude, longitude]))
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 })
  }, [boundaryData, map, points])

  return null
}

function MapResizeController({ drawerAberto }) {
  const map = useMap()

  useEffect(() => {
    let frameId = 0

    const invalidateMapSize = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        map.invalidateSize()
      })
    }

    const handleWindowResize = () => {
      invalidateMapSize()
    }

    invalidateMapSize()
    window.addEventListener('resize', handleWindowResize)

    const mapContainer = map.getContainer()
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          invalidateMapSize()
        })
      : null

    resizeObserver?.observe(mapContainer)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.removeEventListener('resize', handleWindowResize)
      resizeObserver?.disconnect()
    }
  }, [drawerAberto, map])

  return null
}
