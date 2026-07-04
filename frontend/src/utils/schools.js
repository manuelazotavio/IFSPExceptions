import { escolas as mockSchools } from '../data/mockData.js'
import { listarEscolas } from '../services/api.js'

const CUSTOM_SCHOOLS_KEY = 'custom-schools'

export function isCustomSchool(schoolId) {
  return String(schoolId || '').startsWith('esc-custom-')
}

export function loadCustomSchools() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_SCHOOLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getAllSchools() {
  return [...mockSchools, ...loadCustomSchools()]
}

export async function loadSchoolCatalog() {
  const remoteSchools = await listarEscolas()
  return mergeSchoolCatalog(remoteSchools)
}

export function mergeSchoolCatalog(remoteSchools = []) {
  const customSchools = loadCustomSchools()
  const mockById = new Map(mockSchools.map((school) => [school.id, school]))
  const mergedById = new Map()

  remoteSchools.forEach((remoteSchool) => {
    mergedById.set(remoteSchool.id, mergeSchoolData(remoteSchool, mockById.get(remoteSchool.id)))
  })

  customSchools.forEach((customSchool) => {
    mergedById.set(customSchool.id, mergeSchoolData(customSchool, null))
  })

  return [...mergedById.values()]
}

export function saveCustomSchool(payload) {
  const current = loadCustomSchools()
  const next = [...current, payload]
  window.localStorage.setItem(CUSTOM_SCHOOLS_KEY, JSON.stringify(next))
  return next
}

export function removeCustomSchool(schoolId) {
  const current = loadCustomSchools()
  const next = current.filter((item) => item.id !== schoolId)
  window.localStorage.setItem(CUSTOM_SCHOOLS_KEY, JSON.stringify(next))
  return next
}

function mergeSchoolData(primarySchool, fallbackSchool) {
  const primary = primarySchool || {}
  const fallback = fallbackSchool || {}

  return {
    ...fallback,
    ...primary,
    status: normalizeSchoolStatus(primary.status || fallback.status || 'Ativo'),
    dataCadastro: primary.dataCadastro || formatSchoolCreatedAt(primary.criadoEm) || fallback.dataCadastro || '',
    descricao: primary.descricao || fallback.descricao || '',
    fotoNome: primary.fotoNome || fallback.fotoNome || '',
    fotoUrl: primary.fotoUrl || fallback.fotoUrl || '',
    comodos: Array.isArray(primary.comodos) && primary.comodos.length
      ? primary.comodos
      : (fallback.comodos || []),
    latitude: pickCoordinate(primary.latitude, fallback.latitude),
    longitude: pickCoordinate(primary.longitude, fallback.longitude),
  }
}

function normalizeSchoolStatus(value) {
  if (value === 'Ativa') return 'Ativo'
  if (value === 'Inativa') return 'Inativo'
  return value || 'Ativo'
}

function formatSchoolCreatedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function pickCoordinate(primary, fallback) {
  if (Number.isFinite(Number(primary))) return Number(primary)
  if (Number.isFinite(Number(fallback))) return Number(fallback)
  return null
}
