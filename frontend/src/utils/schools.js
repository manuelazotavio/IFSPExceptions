import { escolasSeed } from '../seeds/escolasSeed.js'
import { listarEscolas } from '../services/api.js'
import { normalizeSchoolList, normalizeSchoolRecord } from './schoolRecords.js'
import {
  hydrateSchoolWithPhotos,
  hydrateSchoolsWithPhotos,
  normalizeSchoolPhotos,
  removeSchoolPhotos,
  saveSchoolPhotos,
} from './schoolAssets.js'

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

function isInlineAssetUrl(value) {
  return String(value || '').startsWith('data:')
}

function buildStoredPhotoList(record) {
  const normalizedPhotos = normalizeSchoolPhotos(record?.fotos)
  if (normalizedPhotos.length > 0) return normalizedPhotos

  if (isInlineAssetUrl(record?.fotoUrl)) {
    return [{ nome: record?.fotoNome || 'foto-1', url: record.fotoUrl }]
  }

  return []
}

function sanitizeSchoolForStorage(record = {}) {
  const normalized = normalizeSchoolRecord(record)
  const inlineCover = isInlineAssetUrl(normalized.fotoUrl)

  return normalizeSchoolRecord({
    ...normalized,
    fotoUrl: inlineCover ? '' : normalized.fotoUrl,
    fotoNome: inlineCover && normalized.fotos.length === 0 ? '' : normalized.fotoNome,
    fotos: [],
  })
}

async function migrateLegacyInlineAssets() {
  const storedSchools = readCustomSchoolsFromStorage()
  const schoolsToMigrate = storedSchools.filter((school) => (
    buildStoredPhotoList(school).length > 0
      || Array.isArray(school?.fotos) && school.fotos.some((foto) => isInlineAssetUrl(foto?.url))
  ))

  if (!schoolsToMigrate.length) return

  await Promise.all(schoolsToMigrate.map(async (school) => {
    const photos = buildStoredPhotoList(school)
    if (photos.length > 0) {
      await saveSchoolPhotos(normalizeSchoolRecord(school).id, photos)
    }
  }))

  persistCustomSchools(storedSchools.map(sanitizeSchoolForStorage))
}

export function isCustomSchool(schoolId) {
  return String(schoolId || '').startsWith('esc-custom-')
}

export function loadCustomSchools() {
  return normalizeSchoolList(readCustomSchoolsFromStorage().map(sanitizeSchoolForStorage))
}

export async function loadCustomSchoolById(schoolId) {
  await migrateLegacyInlineAssets()
  const school = loadCustomSchools().find((item) => item.id === schoolId) || null
  return hydrateSchoolWithPhotos(school)
}

export function getAllSchools() {
  return mergeSchoolCatalog([], { includeOfficialFallback: true })
}

export async function loadSchoolCatalog(options = {}) {
  const includeOfficialFallback = Boolean(options.includeOfficialFallback)
  await migrateLegacyInlineAssets()
  const customSchools = await hydrateSchoolsWithPhotos(loadCustomSchools())

  try {
    const remoteSchools = await listarEscolas()
    const mergedRemoteSchools = mergeSchoolCatalog(remoteSchools, { includeOfficialFallback, customSchools })
    if (mergedRemoteSchools.length > 0) {
      return mergedRemoteSchools
    }
  } catch {
    return mergeSchoolCatalog([], { includeOfficialFallback: true, customSchools })
  }

  return mergeSchoolCatalog([], { includeOfficialFallback: true, customSchools })
}

export function mergeSchoolCatalog(remoteSchools = [], options = {}) {
  const includeOfficialFallback = Boolean(options.includeOfficialFallback)
  const officialSchools = getOfficialSchools()
  const customSchools = normalizeSchoolList(options.customSchools ?? loadCustomSchools())
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
    const existingEntry = [...mergedByStableId.entries()].find(([, school]) => school.id === customSchool.id)
    const targetKey = existingEntry?.[0] || customSchool.stableId || customSchool.id
    mergedByStableId.set(targetKey, mergeSchoolData(customSchool, existingEntry?.[1] || null))
  })

  return [...mergedByStableId.values()].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
}

export async function saveCustomSchool(payload) {
  await migrateLegacyInlineAssets()
  const normalizedSchool = normalizeSchoolRecord(payload)
  const photos = buildStoredPhotoList(normalizedSchool)
  const current = loadCustomSchools()
  const nextById = new Map(current.map((school) => [school.id, school]))
  nextById.set(normalizedSchool.id, sanitizeSchoolForStorage(normalizedSchool))
  const next = [...nextById.values()].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
  persistCustomSchools(next)
  await saveSchoolPhotos(normalizedSchool.id, photos)
  return hydrateSchoolsWithPhotos(next)
}

export async function removeCustomSchool(schoolId) {
  const next = loadCustomSchools().filter((item) => item.id !== schoolId)
  persistCustomSchools(next)
  await removeSchoolPhotos(schoolId)
  return next
}
