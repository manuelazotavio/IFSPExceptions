import { escolasSeed } from '../seeds/escolasSeed.js'
import { listarEscolas } from '../services/api.js'
import { normalizeSchoolList, normalizeSchoolRecord } from './schoolRecords.js'

const CUSTOM_SCHOOLS_KEY = 'custom-schools'

function getOfficialSchools() {
  return normalizeSchoolList(escolasSeed)
}

function pickCoordinate(primary, fallback) {
  if (Number.isFinite(Number(primary))) return Number(primary)
  if (Number.isFinite(Number(fallback))) return Number(fallback)
  return null
}

function mergeSchoolData(primarySchool, fallbackSchool) {
  const primary = primarySchool ? normalizeSchoolRecord(primarySchool) : {}
  const fallback = fallbackSchool ? normalizeSchoolRecord(fallbackSchool) : {}
  const hasPrimaryRooms = Array.isArray(primary.comodos) && primary.comodos.length > 0
  const hasPrimaryFotos = Array.isArray(primary.fotos) && primary.fotos.length > 0

  return normalizeSchoolRecord({
    ...fallback,
    ...primary,
    id: primary.id || fallback.id,
    nome: primary.nome || fallback.nome,
    bairro: primary.bairro || fallback.bairro,
    endereco: primary.endereco || fallback.endereco,
    cep: primary.cep || fallback.cep,
    latitude: pickCoordinate(primary.latitude, fallback.latitude),
    longitude: pickCoordinate(primary.longitude, fallback.longitude),
    status: primary.status || fallback.status || 'Ativo',
    descricao: primary.descricao || fallback.descricao || '',
    fotoNome: primary.fotoNome || fallback.fotoNome || '',
    fotoUrl: primary.fotoUrl || fallback.fotoUrl || '',
    fotos: hasPrimaryFotos ? primary.fotos : (fallback.fotos || []),
    dataCadastro: primary.dataCadastro || fallback.dataCadastro || '',
    comodos: hasPrimaryRooms ? primary.comodos : (fallback.comodos || []),
  })
}

function readCustomSchoolsFromStorage() {
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

function persistCustomSchools(schools) {
  window.localStorage.setItem(CUSTOM_SCHOOLS_KEY, JSON.stringify(schools))
}

export function isCustomSchool(schoolId) {
  return String(schoolId || '').startsWith('esc-custom-')
}

export function loadCustomSchools() {
  return normalizeSchoolList(readCustomSchoolsFromStorage())
}

export function getAllSchools() {
  return mergeSchoolCatalog([], { includeOfficialFallback: true })
}

export async function loadSchoolCatalog(options = {}) {
  const includeOfficialFallback = Boolean(options.includeOfficialFallback)

  try {
    const remoteSchools = await listarEscolas()
    const mergedRemoteSchools = mergeSchoolCatalog(remoteSchools, { includeOfficialFallback })
    if (mergedRemoteSchools.length > 0) {
      return mergedRemoteSchools
    }
  } catch {
    return mergeSchoolCatalog([], { includeOfficialFallback: true })
  }

  return mergeSchoolCatalog([], { includeOfficialFallback: true })
}

export function mergeSchoolCatalog(remoteSchools = [], options = {}) {
  const includeOfficialFallback = Boolean(options.includeOfficialFallback)
  const officialSchools = getOfficialSchools()
  const customSchools = loadCustomSchools()
  const officialByStableId = new Map(officialSchools.map((school) => [school.stableId, school]))
  const mergedByStableId = new Map()

  normalizeSchoolList(remoteSchools).forEach((remoteSchool) => {
    const officialSchool = officialByStableId.get(remoteSchool.stableId) || null
    mergedByStableId.set(remoteSchool.stableId, mergeSchoolData(remoteSchool, officialSchool))
  })

  if (includeOfficialFallback || mergedByStableId.size === 0) {
    officialSchools.forEach((officialSchool) => {
      if (!mergedByStableId.has(officialSchool.stableId)) {
        mergedByStableId.set(officialSchool.stableId, mergeSchoolData(officialSchool, null))
      }
    })
  }

  customSchools.forEach((customSchool) => {
    mergedByStableId.set(customSchool.stableId || customSchool.id, mergeSchoolData(customSchool, null))
  })

  return [...mergedByStableId.values()].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
}

export function saveCustomSchool(payload) {
  const normalizedSchool = normalizeSchoolRecord(payload)
  const current = loadCustomSchools()
  const nextById = new Map(current.map((school) => [school.id, school]))
  nextById.set(normalizedSchool.id, normalizedSchool)
  const next = [...nextById.values()].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
  persistCustomSchools(next)
  return next
}

export function removeCustomSchool(schoolId) {
  const next = loadCustomSchools().filter((item) => item.id !== schoolId)
  persistCustomSchools(next)
  return next
}
