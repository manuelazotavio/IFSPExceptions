import { escolas, ocorrenciasAprovadas } from '../data/mockData.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
const endpoint = `${API_URL}/mapa/heatmap/ocorrencias`

function normalizeCriticidade(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

  if (normalized === 'MEDIA' || normalized === 'ALTA' || normalized === 'ATENCAO') {
    return 'ATENCAO'
  }

  if (normalized === 'CRITICA') return 'CRITICA'
  if (normalized === 'BAIXA') return 'BAIXA'
  return normalized
}

function calculateIntensity(item) {
  const criticas = Number(item.criticas || 0)
  const atencao = Number(item.atencao || 0)
  const baixas = Number(item.baixas || 0)
  const intensidade = Number(item.intensidade)

  return Number.isFinite(intensidade)
    ? intensidade
    : criticas * 3 + atencao * 2 + baixas
}

function normalizeHeatmapItem(item) {
  const normalized = {
    escolaId: item.escolaId,
    escolaNome: item.escolaNome,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    totalOcorrencias: Number(item.totalOcorrencias),
    criticas: Number(item.criticas),
    atencao: Number(item.atencao),
    baixas: Number(item.baixas),
  }

  return {
    ...normalized,
    intensidade: calculateIntensity({ ...item, ...normalized }),
  }
}

function normalizeOcorrencia(item) {
  return {
    id: item.id,
    titulo: item.titulo,
    criticidade: item.criticidade,
    status: item.status,
    data: item.data || item.dataEnvio || '',
    descricao: item.descricao || '',
  }
}

function hasValidCoordinates(item) {
  return Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
}

function buildFallbackHeatmap(filters = {}) {
  const bySchool = new Map(
    escolas.map((escola) => [escola.id, {
      escolaId: escola.id,
      escolaNome: escola.nome,
      latitude: Number(escola.latitude),
      longitude: Number(escola.longitude),
      totalOcorrencias: 0,
      criticas: 0,
      atencao: 0,
      baixas: 0,
    }]),
  )

  for (const ocorrencia of ocorrenciasAprovadas) {
    if (filters.escolaId && ocorrencia.escolaId !== filters.escolaId) continue
    if (filters.status && ocorrencia.status !== filters.status) continue
    if (filters.criticidade && normalizeCriticidade(ocorrencia.criticidade) !== normalizeCriticidade(filters.criticidade)) continue
    if (filters.dataInicial && ocorrencia.dataEnvio < filters.dataInicial) continue
    if (filters.dataFinal && ocorrencia.dataEnvio > filters.dataFinal) continue

    const current = bySchool.get(ocorrencia.escolaId)
    if (!current) continue

    current.totalOcorrencias += 1
    const criticidade = normalizeCriticidade(ocorrencia.criticidade)

    if (criticidade === 'CRITICA') current.criticas += 1
    else if (criticidade === 'BAIXA') current.baixas += 1
    else current.atencao += 1
  }

  return [...bySchool.values()]
    .map((item) => ({
      ...item,
      intensidade: calculateIntensity(item),
    }))
    .filter((item) => item.totalOcorrencias > 0 && hasValidCoordinates(item))
    .sort((a, b) => b.intensidade - a.intensidade || a.escolaNome.localeCompare(b.escolaNome, 'pt-BR'))
}

function buildFallbackSchoolDetail(escolaId) {
  const escola = escolas.find((item) => item.id === escolaId)
  if (!escola) {
    return { escola: null, ocorrencias: [] }
  }

  const ocorrencias = ocorrenciasAprovadas
    .filter((item) => item.escolaId === escolaId)
    .map(normalizeOcorrencia)
    .sort((a, b) => new Date(b.data) - new Date(a.data))

  const criticas = ocorrencias.filter((item) => normalizeCriticidade(item.criticidade) === 'CRITICA').length
  const baixas = ocorrencias.filter((item) => normalizeCriticidade(item.criticidade) === 'BAIXA').length
  const atencao = ocorrencias.length - criticas - baixas

  return {
    escola: {
      id: escola.id,
      nome: escola.nome,
      escolaNome: escola.nome,
      endereco: escola.endereco,
      latitude: Number(escola.latitude),
      longitude: Number(escola.longitude),
      totalOcorrencias: ocorrencias.length,
      criticas,
      atencao,
      baixas,
      intensidade: calculateIntensity({ criticas, atencao, baixas }),
    },
    ocorrencias,
  }
}

export async function fetchHeatmapOcorrencias(filters = {}, signal) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  const response = await fetch(`${endpoint}?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o mapa de calor.')
  }

  const data = await response.json()
  return data.map(normalizeHeatmapItem).filter(hasValidCoordinates)
}

export async function fetchEscolaOcorrencias(escolaId, signal) {
  const response = await fetch(`${API_URL}/escolas/${escolaId}/ocorrencias`, { signal })
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o detalhe da escola.')
  }

  const data = await response.json()
  return {
    escola: data.escola ? {
      ...data.escola,
      escolaNome: data.escola.nome || data.escola.escolaNome,
      latitude: Number(data.escola.latitude),
      longitude: Number(data.escola.longitude),
      totalOcorrencias: Number(data.escola.totalOcorrencias || 0),
      criticas: Number(data.escola.criticas || 0),
      atencao: Number(data.escola.atencao || 0),
      baixas: Number(data.escola.baixas || 0),
      intensidade: calculateIntensity(data.escola),
    } : null,
    ocorrencias: Array.isArray(data.ocorrencias) ? data.ocorrencias.map(normalizeOcorrencia) : [],
  }
}

export function getHeatmapFallback(filters = {}) {
  return buildFallbackHeatmap(filters)
}

export function getEscolaOcorrenciasFallback(escolaId) {
  return buildFallbackSchoolDetail(escolaId)
}
