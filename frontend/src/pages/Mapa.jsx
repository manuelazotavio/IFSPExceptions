import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { statusValues } from '../data/mockData.js'
import { CaraguatatubaBairrosLayer, bairroStyleDefaults } from '../components/CaraguatatubaBairrosLayer.jsx'
import { CaraguatatubaBoundary } from '../components/Mapa_com_boundary.jsx'
import { Badge, Card, FilterSelect, Select } from '../components/ui.jsx'
import { fetchEscolaOcorrencias, fetchHeatmapOcorrencias, getEscolaOcorrenciasFallback, getHeatmapFallback } from '../services/mapa.js'
import { listarEscolas } from '../services/api.js'

const mapCenter = [-23.6203, -45.4131]
const drawerFocusOffset = { x: -180, y: 0 }
const criticidadeOptions = ['Baixa', 'Atencao', 'Critica']
const mapStyleStorageKey = 'seduc-map-style'
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
    label: 'OSM padrao',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  stadiaSmooth: {
    label: 'Suave',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors',
  },
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

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

function hasValidCoordinates(item) {
  const latitude = Number(item?.latitude)
  const longitude = Number(item?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function getFeatureBairroName(feature) {
  return feature?.properties?.NM_BAIRRO
    || feature?.properties?.nome_bairro
    || feature?.properties?.nome_bairr
    || feature?.properties?.nome
    || feature?.properties?.name
    || 'Bairro sem nome'
}

function getSchoolPendingScore(item) {
  if (Number.isFinite(Number(item?.scoreRiscoPendente))) {
    return Number(item.scoreRiscoPendente)
  }

  if (Number.isFinite(Number(item?.intensidade))) {
    return Number(item.intensidade)
  }

  const weightedScore = calcularScorePendenciaEscola(item)
  if (weightedScore > 0) {
    return weightedScore
  }

  if (Number.isFinite(Number(item?.totalOcorrencias))) {
    return Number(item.totalOcorrencias)
  }

  return 0
}

function isPointInsideRing([longitude, latitude], ring) {
  let inside = false

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[previous]
    const intersects = ((y1 > latitude) !== (y2 > latitude))
      && (longitude < ((x2 - x1) * (latitude - y1)) / ((y2 - y1) || Number.EPSILON) + x1)

    if (intersects) inside = !inside
  }

  return inside
}

function isPointInsidePolygon([longitude, latitude], polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) return false

  const [outerRing, ...holes] = polygonCoordinates
  if (!isPointInsideRing([longitude, latitude], outerRing)) return false

  return !holes.some((hole) => isPointInsideRing([longitude, latitude], hole))
}

function featureContainsCoordinates(feature, latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false

  const geometry = feature?.geometry
  if (!geometry) return false

  const point = [longitude, latitude]

  if (geometry.type === 'Polygon') {
    return isPointInsidePolygon(point, geometry.coordinates)
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygonCoordinates) => isPointInsidePolygon(point, polygonCoordinates))
  }

  return false
}

function getBairroFillColor(score, maximumScore) {
  if (maximumScore <= 0) {
    return '#16a34a'
  }

  return getSchoolIconColor(score, 0, maximumScore)
}

function getBairroSchools({ bairroKey, heatmapData, bairroStats }) {
  if (!bairroKey || !bairroStats[bairroKey]) {
    return []
  }

  const schoolIds = new Set(bairroStats[bairroKey].schoolIds || [])
  return heatmapData.filter((item) => schoolIds.has(item.escolaId))
}

function getVisibleSchools({ showBairrosLayer, selectedBairro, heatmapData, bairroStats }) {
  if (!showBairrosLayer) {
    return heatmapData
  }

  if (!selectedBairro) {
    return []
  }

  return getBairroSchools({ bairroKey: selectedBairro, heatmapData, bairroStats })
}

function getSchoolBairroKey({ escolaMapa, escolaCatalogo, bairroStats, featureEntries }) {
  const bairroNome = escolaMapa?.bairro || escolaMapa?.bairroNome || escolaCatalogo?.bairro || escolaCatalogo?.bairroNome || ''
  const normalizedBairro = normalizeText(bairroNome)

  if (normalizedBairro && bairroStats[normalizedBairro]) {
    return normalizedBairro
  }

  const foundFeature = featureEntries.find(({ feature }) => (
    featureContainsCoordinates(feature, Number(escolaMapa?.latitude), Number(escolaMapa?.longitude))
  ))

  return foundFeature?.key || ''
}

function buildBairroStats({ bairrosGeoJson, escolasNoMapa, escolasCatalogo }) {
  if (bairrosGeoJson?.type !== 'FeatureCollection' || !Array.isArray(bairrosGeoJson.features)) {
    return {}
  }

  const validFeatures = bairrosGeoJson.features.filter((feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type))
  if (validFeatures.length === 0) {
    return {}
  }

  const catalogoPorId = new Map(escolasCatalogo.map((escola) => [escola.id, escola]))
  const bairroStats = Object.fromEntries(
    validFeatures.map((feature) => {
      const nome = getFeatureBairroName(feature) || 'Bairro'
      return [normalizeText(nome), {
        nome,
        totalEscolas: 0,
        totalSolicitacoes: 0,
        score: 0,
        criticas: 0,
        atencao: 0,
        baixas: 0,
        intensidade: 0,
        schoolIds: [],
        fillColor: '#16a34a',
      }]
    }),
  )

  const featureEntries = validFeatures.map((feature) => ({
    key: normalizeText(getFeatureBairroName(feature)),
    feature,
  }))

  for (const escolaMapa of escolasNoMapa) {
    const escolaCatalogo = catalogoPorId.get(escolaMapa.escolaId) || {}
    const bairroNome = escolaMapa.bairro || escolaMapa.bairroNome || escolaCatalogo.bairro || escolaCatalogo.bairroNome || ''
    let bairroKey = normalizeText(bairroNome)

    if (!bairroKey || !bairroStats[bairroKey]) {
      bairroKey = getSchoolBairroKey({
        escolaMapa,
        escolaCatalogo,
        bairroStats,
        featureEntries,
      })
    }

    if (!bairroKey || !bairroStats[bairroKey]) {
      continue
    }

    bairroStats[bairroKey].totalEscolas += 1
    bairroStats[bairroKey].totalSolicitacoes += Number(escolaMapa.totalOcorrencias || 0)
    bairroStats[bairroKey].score += getSchoolPendingScore(escolaMapa)
    bairroStats[bairroKey].criticas += Number(escolaMapa.criticas || 0)
    bairroStats[bairroKey].atencao += Number(escolaMapa.atencao || 0)
    bairroStats[bairroKey].baixas += Number(escolaMapa.baixas || 0)
    bairroStats[bairroKey].intensidade += Number(escolaMapa.intensidade || 0)
    bairroStats[bairroKey].schoolIds.push(escolaMapa.escolaId)
  }

  const maximumScore = Math.max(0, ...Object.values(bairroStats).map((item) => item.score))

  Object.values(bairroStats).forEach((item) => {
    item.fillColor = getBairroFillColor(item.score, maximumScore)
  })

  return bairroStats
}

function isOcorrenciaPendente(status) {
  const normalized = String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

  return ['ABERTA', 'PENDENTE', 'EM_ANDAMENTO', 'EM ANALISE', 'EM_ANALISE'].includes(normalized)
}

function calcularScorePendenciaEscola(item) {
  if (Array.isArray(item?.ocorrencias)) {
    return item.ocorrencias
      .filter((ocorrencia) => isOcorrenciaPendente(ocorrencia.status))
      .reduce((total, ocorrencia) => {
        const criticidade = normalizeText(ocorrencia.criticidade)
        if (criticidade === 'critica') return total + 3
        if (criticidade === 'baixa') return total + 1
        return total + 2
      }, 0)
  }

  if (Number.isFinite(Number(item?.scorePendencia))) {
    return Number(item.scorePendencia)
  }

  if (Number.isFinite(Number(item?.intensidadePendente))) {
    return Number(item.intensidadePendente)
  }

  const criticas = Number(item?.criticas || 0)
  const atencao = Number(item?.atencao || 0)
  const baixas = Number(item?.baixas || 0)

  return criticas * 3 + atencao * 2 + baixas
}

function interpolateColor(start, end, progress) {
  const clamp = Math.max(0, Math.min(1, progress))
  const from = start.match(/\w\w/g).map((value) => Number.parseInt(value, 16))
  const to = end.match(/\w\w/g).map((value) => Number.parseInt(value, 16))
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * clamp))
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function getSchoolIconColor(score, minimum, maximum) {
  if (maximum === minimum) {
    return score > 0 ? '#f59e0b' : '#16a34a'
  }

  const normalized = (score - minimum) / (maximum - minimum)

  if (normalized <= 0.5) {
    return interpolateColor('#16a34a', '#f59e0b', normalized / 0.5)
  }

  return interpolateColor('#f59e0b', '#dc2626', (normalized - 0.5) / 0.5)
}

function createSchoolDivIcon({ color, isSelected, isDimmed }) {
  const opacity = isDimmed ? 0.4 : 1
  const scale = isSelected ? 1.12 : 1
  const shadow = isSelected ? '0 10px 22px rgba(15,23,42,.28)' : '0 6px 14px rgba(15,23,42,.16)'
  const ring = isSelected ? '#0f172a' : 'rgba(15,23,42,.18)'
  const svg = `
    <div style="opacity:${opacity};transform:scale(${scale});transform-origin:bottom center;transition:transform .18s ease,opacity .18s ease;filter:drop-shadow(${shadow});">
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17 2C9.82 2 4 7.82 4 15c0 10.5 13 25 13 25s13-14.5 13-25C30 7.82 24.18 2 17 2Z" fill="${color}" />
        <path d="M17 39c-.4 0-.77-.17-1.03-.47C14.71 37.05 3 23.72 3 15 3 7.27 9.27 1 17 1s14 6.27 14 14c0 8.72-11.71 22.05-12.97 23.53-.26.3-.63.47-1.03.47Z" fill="none" stroke="${ring}" stroke-width="2" stroke-linejoin="round" />
        <rect x="10" y="10" width="14" height="14" rx="2.4" fill="white" />
        <rect x="12.4" y="12.4" width="3" height="3" rx=".6" fill="${color}" />
        <rect x="18.6" y="12.4" width="3" height="3" rx=".6" fill="${color}" />
        <rect x="12.4" y="17.1" width="3" height="3" rx=".6" fill="${color}" />
        <rect x="18.6" y="17.1" width="3" height="3" rx=".6" fill="${color}" />
        <rect x="15.65" y="19.4" width="2.7" height="4.6" rx=".8" fill="${color}" />
        <circle cx="17" cy="15" r="11.5" fill="none" stroke="white" stroke-opacity=".35" stroke-width="1.2" />
      </svg>
    </div>
  `

  return L.divIcon({
    html: svg,
    className: 'school-marker-icon',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -32],
  })
}

export function Mapa({ onNavigate }) {
  const [filters, setFilters] = useState({
    criticidade: '',
    status: '',
    escolaId: '',
    dataInicial: '',
    dataFinal: '',
  })
  const [escolas, setEscolas] = useState([])
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
  const [caraguatatubaBoundary, setCaraguatatubaBoundary] = useState(null)
  const [bairrosGeoJson, setBairrosGeoJson] = useState(null)
  const [showBairrosLayer, setShowBairrosLayer] = useState(true)
  const [showMunicipioBoundary, setShowMunicipioBoundary] = useState(true)
  const [selectedBairro, setSelectedBairro] = useState('')
  const [mapStyleKey, setMapStyleKey] = useState(() => {
    if (typeof window === 'undefined') return 'cartoLight'

    try {
      const storedStyle = window.localStorage.getItem(mapStyleStorageKey)
      return storedStyle && mapStyles[storedStyle] ? storedStyle : 'cartoLight'
    } catch {
      return 'cartoLight'
    }
  })

  const schoolOptions = useMemo(() => escolas.map((escola) => ({ value: escola.id, label: escola.nome })), [escolas])

  useEffect(() => {
    let ativo = true
    listarEscolas()
      .then((dados) => { if (ativo) setEscolas(dados) })
      .catch(() => { if (ativo) setEscolas([]) })
    return () => {
      ativo = false
    }
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
    try {
      window.localStorage.setItem(mapStyleStorageKey, mapStyleKey)
    } catch {
      return
    }
  }, [mapStyleKey])

  useEffect(() => {
    if (!escolaSelecionada) return

    const exists = heatmapData.some((item) => item.escolaId === escolaSelecionada)
    if (!exists) {
      closeDrawer()
    }
  }, [escolaSelecionada, heatmapData])

  useEffect(() => {
    if (showBairrosLayer) return

    setSelectedBairro('')
  }, [showBairrosLayer])

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
        title: 'Alguns dados estão sendo exibidos em modo temporário porque a API não respondeu.',
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

  const riskScoresById = useMemo(() => (
    Object.fromEntries(
      heatmapData.map((item) => [item.escolaId, calcularScorePendenciaEscola(item)]),
    )
  ), [heatmapData])

  const summaryMetrics = useMemo(() => (
    heatmapData.reduce((accumulator, item) => ({
      totalOcorrencias: accumulator.totalOcorrencias + Number(item.totalOcorrencias || 0),
      criticas: accumulator.criticas + Number(item.criticas || 0),
      atencao: accumulator.atencao + Number(item.atencao || 0),
      baixas: accumulator.baixas + Number(item.baixas || 0),
      intensidade: accumulator.intensidade + Number(item.intensidade || 0),
    }), {
      totalOcorrencias: 0,
      criticas: 0,
      atencao: 0,
      baixas: 0,
      intensidade: 0,
    })
  ), [heatmapData])

  const globalOccurrenceRange = useMemo(() => {
    if (heatmapData.length === 0) {
      return { minimum: 0, maximum: 0 }
    }

    const values = heatmapData.map((item) => Number(riskScoresById[item.escolaId] || 0))
    return {
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    }
  }, [heatmapData, riskScoresById])

  const markerIconsById = useMemo(() => (
    Object.fromEntries(
      heatmapData.map((item) => [
        item.escolaId,
        createSchoolDivIcon({
          color: getSchoolIconColor(
            Number(riskScoresById[item.escolaId] || 0),
            globalOccurrenceRange.minimum,
            globalOccurrenceRange.maximum,
          ),
          isSelected: escolaSelecionada === item.escolaId,
          isDimmed: Boolean(escolaSelecionada) && escolaSelecionada !== item.escolaId,
        }),
      ]),
    )
  ), [escolaSelecionada, globalOccurrenceRange.maximum, globalOccurrenceRange.minimum, heatmapData, riskScoresById])

  const bairroStats = useMemo(() => (
    buildBairroStats({
      bairrosGeoJson,
      escolasNoMapa: heatmapData,
      escolasCatalogo: escolas,
    })
  ), [bairrosGeoJson, heatmapData])

  const bairroFeatureEntries = useMemo(() => {
    if (bairrosGeoJson?.type !== 'FeatureCollection' || !Array.isArray(bairrosGeoJson.features)) {
      return []
    }

    return bairrosGeoJson.features
      .filter((feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type))
      .map((feature) => ({
        key: normalizeText(getFeatureBairroName(feature)),
        feature,
      }))
  }, [bairrosGeoJson])

  const bairroScoreRange = useMemo(() => {
    const values = Object.values(bairroStats).map((item) => Number(item.score || 0))

    if (values.length === 0) {
      return { minimum: 0, maximum: 0 }
    }

    return {
      minimum: Math.min(...values),
      maximum: Math.max(...values),
    }
  }, [bairroStats])

  const visibleSchools = useMemo(() => (
    getVisibleSchools({
      showBairrosLayer,
      selectedBairro,
      heatmapData,
      bairroStats,
    })
  ), [bairroStats, heatmapData, selectedBairro, showBairrosLayer])

  const visibleSchoolPoints = useMemo(() => (
    visibleSchools
      .map((item) => [Number(item.latitude), Number(item.longitude)])
      .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude))
  ), [visibleSchools])

  const selectedBairroStats = selectedBairro ? bairroStats[selectedBairro] || null : null

  const metricContext = useMemo(() => {
    const escola = detalheEscola || escolaSelecionadaResumo

    if (escolaSelecionada && escola) {
      return {
        title: escola.escolaNome || escola.nome || 'Escola selecionada',
        metrics: {
          totalOcorrencias: Number(escola.totalOcorrencias || 0),
          criticas: Number(escola.criticas || 0),
          atencao: Number(escola.atencao || 0),
          baixas: Number(escola.baixas || 0),
          intensidade: Number(escola.intensidade || 0),
        },
      }
    }

    if (showBairrosLayer && selectedBairroStats) {
      return {
        title: selectedBairroStats.nome,
        metrics: {
          totalOcorrencias: Number(selectedBairroStats.totalSolicitacoes || 0),
          criticas: Number(selectedBairroStats.criticas || 0),
          atencao: Number(selectedBairroStats.atencao || 0),
          baixas: Number(selectedBairroStats.baixas || 0),
          intensidade: Number(selectedBairroStats.score || 0),
        },
      }
    }

    return {
      title: 'Geral',
      metrics: summaryMetrics,
    }
  }, [detalheEscola, escolaSelecionada, escolaSelecionadaResumo, selectedBairroStats, showBairrosLayer, summaryMetrics])

  const selectedMapStyle = mapStyles[mapStyleKey] || mapStyles.cartoLight
  const legendRange = showBairrosLayer ? bairroScoreRange : globalOccurrenceRange

  useEffect(() => {
    if (!escolaSelecionada) return

    const visibleIds = new Set(visibleSchools.map((item) => item.escolaId))
    if (!visibleIds.has(escolaSelecionada)) {
      closeDrawer()
    }
  }, [escolaSelecionada, visibleSchools])

  useEffect(() => {
    if (!selectedBairro) return

    if (!bairroStats[selectedBairro]) {
      setSelectedBairro('')
    }
  }, [bairroStats, selectedBairro])

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSelectBairro(feature) {
    const bairroKey = normalizeText(getFeatureBairroName(feature))
    if (!bairroKey) return

    if (selectedBairro === bairroKey) {
      setSelectedBairro('')
      return
    }

    closeDrawer()
    setSelectedBairro(bairroKey)

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

  function openDrawer(escolaId) {
    const escola = heatmapData.find((item) => item.escolaId === escolaId)
    const escolaCatalogo = escolas.find((item) => item.id === escolaId)
    setDetalheEscola(null)
    setOcorrenciasEscola([])
    setErroDetalhe('')
    setEscolaSelecionada(escolaId)
    setDrawerAberto(true)

    if (showBairrosLayer && !selectedBairro) {
      const bairroKey = getSchoolBairroKey({
        escolaMapa: escola,
        escolaCatalogo,
        bairroStats,
        featureEntries: bairroFeatureEntries,
      })

      if (bairroKey) {
        setSelectedBairro(bairroKey)
      }
    }

    if (escola && hasValidCoordinates(escola)) {
      setMapFocusTarget({
        latitude: Number(escola.latitude),
        longitude: Number(escola.longitude),
        zoom: 15,
        offsetX: drawerFocusOffset.x,
        offsetY: drawerFocusOffset.y,
      })
    }
  }

  function closeDrawer() {
    setDrawerAberto(false)
    setEscolaSelecionada('')
    setDetalheEscola(null)
    setOcorrenciasEscola([])
    setErroDetalhe('')
    setMapFocusTarget(null)
  }

  function openSchoolRegistry() {
    if (!escolaSelecionada) return
    onNavigate?.(`/escolas/${encodeURIComponent(escolaSelecionada)}`)
  }

  function focusSchool(escola) {
    if (!escola || !hasValidCoordinates(escola)) return

    const escolaCatalogo = escolas.find((item) => item.id === escola.escolaId)
    if (showBairrosLayer && !selectedBairro) {
      const bairroKey = getSchoolBairroKey({
        escolaMapa: escola,
        escolaCatalogo,
        bairroStats,
        featureEntries: bairroFeatureEntries,
      })

      if (bairroKey) {
        setSelectedBairro(bairroKey)
      }
    }

    setSearchEscola(escola.escolaNome)
    setMapFocusTarget({
      latitude: Number(escola.latitude),
      longitude: Number(escola.longitude),
      zoom: 16,
      offsetX: drawerFocusOffset.x,
      offsetY: drawerFocusOffset.y,
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

      <Card>
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
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
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleSearchEscola}
                className="cursor-pointer h-10 shrink-0 rounded-md bg-primary px-3 text-sm font-bold text-white hover:bg-primary-strong"
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
            <Select
              value={filters.escolaId}
              onChange={(value) => setFilter('escolaId', value)}
              placeholder="Todas"
              options={[{ value: '', label: 'Todas' }, ...schoolOptions]}
            />
          </label>
          <DateFilter label="Data inicial" value={filters.dataInicial} onChange={(value) => setFilter('dataInicial', value)} />
          <DateFilter label="Data final" value={filters.dataFinal} onChange={(value) => setFilter('dataFinal', value)} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">

        <div className="relative h-[calc(100vh-16rem)] min-h-[560px]">
          <div className="absolute left-4 top-4 z-[650] w-[240px] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {metricContext.title}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MetricCompact label="Ocorrências" value={metricContext.metrics.totalOcorrencias} />
              <MetricCompact label="Críticas" value={metricContext.metrics.criticas} />
              <MetricCompact label="Atencao" value={metricContext.metrics.atencao} />
              <MetricCompact label="Baixas" value={metricContext.metrics.baixas} />
              <div className="col-span-2">
                <MetricCompact label="Intensidade" value={metricContext.metrics.intensidade} />
              </div>
            </div>
          </div>

          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom zoomControl={false} className="h-full w-full">
            <TileLayer
              key={mapStyleKey}
              attribution={selectedMapStyle.attribution}
              url={selectedMapStyle.url}
            />
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
            <SyncMapView points={visibleSchoolPoints} boundaryData={caraguatatubaBoundary} />
            <MapResizeController drawerAberto={drawerAberto} />
            <ZoomControlPosition />
            <MapFocusController target={mapFocusTarget} />

            {visibleSchools.map((item) => (
              <Marker
                key={item.escolaId}
                icon={markerIconsById[item.escolaId]}
                position={[item.latitude, item.longitude]}
                eventHandlers={{ click: () => openDrawer(item.escolaId) }}
              >
                <Tooltip direction="top" offset={[0, -16]}>
                  <div className="space-y-1">
                    <strong>{item.escolaNome}</strong>
                    <p>{item.totalOcorrencias} ocorrências</p>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute bottom-4 left-20 z-[650] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Solicitacoes pendentes</p>
            <div className="h-3 w-36 rounded-full bg-gradient-to-r from-green-500 via-amber-400 to-red-600" />
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500">
              <span>{legendRange.minimum}</span>
              <span>{legendRange.maximum}</span>
            </div>
          </div>

          <div className={`absolute bottom-4 z-[650] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur ${drawerAberto ? 'right-[410px]' : 'right-4'}`}>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Estilo do mapa
            </span>
            <Select
              size="xs"
              className="mt-1"
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
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Bairro: {selectedBairroStats.nome}
                </p>
                <button className="cursor-pointer"
                  type="button"
                  onClick={() => setSelectedBairro('')}
                  className="mt-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  Limpar bairro
                </button>
              </div>
            ) : null}
          </div>

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
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block text-lg font-800 text-slate-950">{value}</strong>
    </div>
  )
}

function DateFilter({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500" />
    </label>
  )
}

function EscolaDrawer({ detalhe, drawerAberto, loadingDetalhe, ocorrencias, onClose, onOpenSchoolRegistry }) {
  if (!drawerAberto) return null

  return (
    <aside className="absolute bottom-4 right-4 top-4 z-[700] w-[390px] max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSchoolRegistry}
              className="cursor-pointer min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <span className="block truncate">
                {detalhe?.escolaNome || detalhe?.nome || 'Detalhe da escola'}
              </span>
            </button>
            <button type="button" onClick={onClose} className="cursor-pointer shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {loadingDetalhe ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              Carregando dados da escola...
            </div>
          ) : null}

          {detalhe ? (
            <>
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-800 uppercase tracking-wide text-slate-500">Solicitacoes pendentes</h4>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-strong">
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
                        {ocorrencia.descricao || 'Sem descrição resumida para esta ocorrência.'}
                      </p>
                    </article>
                  )) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                      Nenhuma ocorrência encontrada para esta escola.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : !loadingDetalhe ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Não foi possível localizar os dados desta escola.
            </div>
          ) : null}
        </div>
      </div>
    </aside>
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
    const timeout = window.setTimeout(() => {
      map.invalidateSize()
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [drawerAberto, map])

  return null
}
