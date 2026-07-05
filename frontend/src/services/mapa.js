import { listarOcorrencias } from './api.js'
import { ocorrenciasSeed } from '../seeds/ocorrenciasSeed.js'
import {
  findSchoolByReference,
  mergeSchoolsWithOccurrences,
  normalizeOccurrenceList,
  sortOccurrencesByLatestDate,
} from '../utils/schoolRecords.js'

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}`)
  }

  return response.json()
}

async function loadPublicOccurrenceSeed(signal) {
  return fetchJson('/seeds/ocorrencias_seduc_caraguatatuba_seed.json', signal)
}

export async function loadMapOccurrences(schools = [], signal) {
  try {
    const data = await listarOcorrencias()
    const normalized = normalizeOccurrenceList(Array.isArray(data) ? data : [], schools)
    if (normalized.length > 0) {
      return normalized
    }
  } catch {
    try {
      const seedData = await loadPublicOccurrenceSeed(signal)
      return normalizeOccurrenceList(Array.isArray(seedData) ? seedData : [], schools)
    } catch {
      return normalizeOccurrenceList(ocorrenciasSeed, schools)
    }
  }

  try {
    const seedData = await loadPublicOccurrenceSeed(signal)
    return normalizeOccurrenceList(Array.isArray(seedData) ? seedData : [], schools)
  } catch {
    return normalizeOccurrenceList(ocorrenciasSeed, schools)
  }
}

export function getEscolaOcorrenciasFallback(escolaId, schools = [], occurrences = []) {
  const school = findSchoolByReference(schools, escolaId)
  if (!school) {
    return { escola: null, ocorrencias: [] }
  }

  const mergedSchool = mergeSchoolsWithOccurrences([school], occurrences)[0]
  return {
    escola: mergedSchool || school,
    ocorrencias: Array.isArray(mergedSchool?.ocorrencias)
      ? mergedSchool.ocorrencias.slice().sort(sortOccurrencesByLatestDate)
      : [],
  }
}
