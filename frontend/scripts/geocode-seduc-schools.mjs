import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const USER_AGENT = 'hackaton-2026-seduc-caraguatatuba-geocoder/1.0'
const REQUEST_DELAY_MS = 1100
const GEOCODE_CACHE_VERSION = 3
const CEP_CACHE_VERSION = 1
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const VIACEP_BASE_URL = 'https://viacep.com.br/ws/SP/Caraguatatuba'
const VIEWBOX = '-45.75,-23.35,-45.10,-24.05'
const NOMINATIM_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'pt-BR',
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const geocodedPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_geocoded.json')
const schoolsPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba.json')
const pendingPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_pendencias.json')
const geocodeCachePath = path.join(projectRoot, 'scripts', 'cache', 'geocode-cache-seduc-caragua.json')
const cepCachePath = path.join(projectRoot, 'scripts', 'cache', 'cep-cache-seduc-caragua.json')

const CARAGUA_BOUNDS = {
  minLongitude: -45.75,
  maxLongitude: -45.10,
  minLatitude: -24.05,
  maxLatitude: -23.35,
}

const DEFAULT_COMODOS = Object.freeze([
  { ambiente: 'Sala 1', codigo: 'SALA-01' },
  { ambiente: 'Sala 2', codigo: 'SALA-02' },
  { ambiente: 'Sala 3', codigo: 'SALA-03' },
  { ambiente: 'Banheiro Feminino', codigo: 'BAN-FEM-01' },
  { ambiente: 'Banheiro Masculino', codigo: 'BAN-MASC-01' },
  { ambiente: 'Cozinha', codigo: 'COZ-01' },
  { ambiente: 'Diretoria', codigo: 'DIR-01' },
  { ambiente: 'Biblioteca', codigo: 'BIB-01' },
  { ambiente: 'Refeitório', codigo: 'REF-01' },
])

const QUERY_ABBREVIATIONS = [
  { pattern: /\bAv\.(?=\s)/gi, replacement: 'Avenida' },
  { pattern: /\bAv(?=\s)/gi, replacement: 'Avenida' },
  { pattern: /\bR\.(?=\s)/gi, replacement: 'Rua' },
  { pattern: /\bR(?=\s)/gi, replacement: 'Rua' },
  { pattern: /\bJd\.(?=\s)/gi, replacement: 'Jardim' },
  { pattern: /\bJd(?=\s)/gi, replacement: 'Jardim' },
  { pattern: /\bTrav\.(?=\s)/gi, replacement: 'Travessa' },
  { pattern: /\bTrav(?=\s)/gi, replacement: 'Travessa' },
]

const LOCATION_STOPWORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'd', 'e'])
const STREET_TYPE_TOKENS = new Set(['rua', 'avenida', 'travessa', 'estrada', 'rodovia', 'alameda', 'praca', 'largo'])
const SCHOOL_NAME_STOPWORDS = new Set([
  'centro',
  'integrado',
  'educacao',
  'educacional',
  'ensino',
  'fundamental',
  'infantil',
  'municipal',
  'escola',
  'emei',
  'emef',
  'emefebs',
  'cei',
  'ciefi',
  'ciase',
  'cries',
  'biblioteca',
  'creche',
  'prof',
  'profa',
  'professor',
  'professora',
  'dr',
  'dra',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
])

const FINAL_GEOCODE_STATUSES = new Set(['confirmado', 'aproximado', 'falhou', 'sem_endereco'])

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function mojibakeScore(value) {
  return (String(value ?? '').match(/[ÃÂ�]/g) || []).length
}

function repairText(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (!/[ÃÂ]/.test(text)) return text

  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8')
    return mojibakeScore(repaired) < mojibakeScore(text) ? repaired : text
  } catch {
    return text
  }
}

function cleanText(value) {
  return repairText(value).replace(/\s+/g, ' ').trim()
}

function normalizeGeocodeStatus(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_')
  return FINAL_GEOCODE_STATUSES.has(normalized) ? normalized : null
}

function expandAddressAbbreviations(value) {
  let output = cleanText(value)

  for (const { pattern, replacement } of QUERY_ABBREVIATIONS) {
    output = output.replace(pattern, replacement)
  }

  return output
    .replace(/\s+,/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pathExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function readJson(filePath, fallbackValue) {
  try {
    const content = await readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT' && fallbackValue !== undefined) {
      return fallbackValue
    }

    throw error
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function isFiniteCoordinate(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return Number.isFinite(Number(value))
}

function toNullableNumber(value) {
  return isFiniteCoordinate(value) ? Number(value) : null
}

function formatCep(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return null
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function extractCepFromText(value) {
  const match = cleanText(value).match(/\b\d{5}-?\d{3}\b/)
  return match ? formatCep(match[0]) : null
}

function isWithinCaraguaBounds(latitude, longitude) {
  return latitude >= CARAGUA_BOUNDS.minLatitude
    && latitude <= CARAGUA_BOUNDS.maxLatitude
    && longitude >= CARAGUA_BOUNDS.minLongitude
    && longitude <= CARAGUA_BOUNDS.maxLongitude
}

function hasNoNumberMarker(address) {
  return /\bs\s*\/?\s*n(?:[\s.]*[oº°])?/i.test(String(address ?? ''))
}

function extractStreetNumber(address) {
  const sanitized = cleanText(address)
  const match = sanitized.match(/,\s*(?:n[º°o.]?\s*)?(\d+[a-z0-9/-]*)\b/i)
  return match?.[1] ?? null
}

function removeNoNumberSuffix(address) {
  return cleanText(address)
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/,\s*s\s*\/?\s*n(?:[\s.]*[oº°])?.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function removeStreetNumberSuffix(address) {
  return cleanText(address)
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/,\s*(?:n[º°o.]?\s*)?\d+[a-z0-9/-]*\b.*$/i, '')
    .replace(/,\s*s\s*\/?\s*n(?:[\s.]*[oº°])?.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeStreetNumberPart(value) {
  const text = cleanText(value)
  return /^(?:n[º°o.]?\s*)?\d+[a-z0-9/-]*$/i.test(text) || hasNoNumberMarker(text)
}

function extractPrimaryAddress(value) {
  const expanded = expandAddressAbbreviations(value)
  if (!expanded) return null

  const parts = expanded.split(',').map((item) => item.trim()).filter(Boolean)
  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0]
  if (looksLikeStreetNumberPart(parts[1])) return `${parts[0]}, ${parts[1]}`
  return `${parts[0]}, ${parts[1]}`
}

function buildCacheKey(query) {
  return normalizeText(query)
    .replace(/[^\p{Letter}\p{Number}\s,/-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeQuerySegment(value) {
  return expandAddressAbbreviations(
    String(value ?? '')
      .replace(/\s*\(.*?\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function buildQuery(address, bairro) {
  const segments = [address, bairro, 'Caraguatatuba', 'São Paulo', 'Brasil']
    .map((segment) => String(segment ?? '').trim())
    .filter(Boolean)

  return segments.length ? segments.join(', ') : null
}

function dedupeQueryCandidates(candidates) {
  const seen = new Set()

  return candidates.filter((candidate) => {
    if (!candidate?.query) return false

    const key = buildCacheKey(candidate.query)
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function buildGeocodeQueries(record) {
  const endereco = String(record.endereco ?? '').trim()
  const bairro = String(record.bairro ?? '').trim()

  if (!endereco) {
    return { primaryQuery: null, candidates: [], addressWithoutNumber: false, streetNumber: null }
  }

  const addressWithoutNumber = hasNoNumberMarker(endereco)
  const streetNumber = extractStreetNumber(endereco)
  const normalizedAddress = sanitizeQuerySegment(addressWithoutNumber ? removeNoNumberSuffix(endereco) : endereco)
  const normalizedStreetOnly = sanitizeQuerySegment(
    addressWithoutNumber ? removeNoNumberSuffix(endereco) : removeStreetNumberSuffix(endereco),
  )
  const normalizedBairro = sanitizeQuerySegment(bairro)

  const candidates = dedupeQueryCandidates([
    {
      query: buildQuery(normalizedAddress, normalizedBairro),
      usedFallbackWithoutBairro: false,
      usedFallbackWithoutNumber: addressWithoutNumber,
    },
    {
      query: buildQuery(normalizedStreetOnly, normalizedBairro),
      usedFallbackWithoutBairro: false,
      usedFallbackWithoutNumber: true,
    },
    {
      query: buildQuery(normalizedAddress, ''),
      usedFallbackWithoutBairro: true,
      usedFallbackWithoutNumber: addressWithoutNumber,
    },
    {
      query: buildQuery(normalizedStreetOnly, ''),
      usedFallbackWithoutBairro: true,
      usedFallbackWithoutNumber: true,
    },
  ])

  return {
    primaryQuery: candidates[0]?.query ?? null,
    candidates,
    addressWithoutNumber,
    streetNumber,
  }
}

function getResultAddressText(result) {
  return Object.values(result?.address ?? {})
    .map((value) => cleanText(value))
    .filter(Boolean)
    .join(', ')
}

function buildComparableText(value) {
  return normalizeText(expandAddressAbbreviations(value))
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildComparableTokens(
  value,
  { ignoreStreetTypes = false, ignoreSchoolStopwords = false, extraStopwords = [] } = {},
) {
  const stopwords = new Set([...LOCATION_STOPWORDS, ...extraStopwords])

  if (ignoreSchoolStopwords) {
    for (const token of SCHOOL_NAME_STOPWORDS) {
      stopwords.add(token)
    }
  }

  return [...new Set(
    buildComparableText(value)
      .split(' ')
      .filter(Boolean)
      .filter((token) => !stopwords.has(token))
      .filter((token) => !(ignoreStreetTypes && STREET_TYPE_TOKENS.has(token))),
  )]
}

function hasDirectComparableMatch(target, candidate) {
  const normalizedTarget = buildComparableText(target)
  const normalizedCandidate = buildComparableText(candidate)
  return Boolean(normalizedTarget) && normalizedCandidate.includes(normalizedTarget)
}

function hasTokenOverlap(
  target,
  candidate,
  { ignoreStreetTypes = false, ignoreSchoolStopwords = false, minRatio = 0.67, minMatches = 1 } = {},
) {
  const targetTokens = buildComparableTokens(target, { ignoreStreetTypes, ignoreSchoolStopwords })
  const candidateTokens = new Set(
    buildComparableTokens(candidate, { ignoreStreetTypes, ignoreSchoolStopwords }),
  )

  if (targetTokens.length === 0) return false

  let matches = 0
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) {
      matches += 1
    }
  }

  const requiredMatches = Math.max(minMatches, Math.ceil(targetTokens.length * minRatio))
  return matches >= requiredMatches
}

function matchesNeighborhood(result, bairro) {
  if (!bairro) return true

  const address = result?.address ?? {}
  const candidates = [
    result?.display_name,
    address.suburb,
    address.neighbourhood,
    address.quarter,
    address.city_district,
    address.village,
    address.hamlet,
    getResultAddressText(result),
  ]

  return candidates.some((value) => (
    hasDirectComparableMatch(bairro, value)
    || hasTokenOverlap(bairro, value, { minRatio: 0.67, minMatches: 2 })
  ))
}

function matchesStreet(result, originalAddress) {
  const streetText = sanitizeQuerySegment(removeStreetNumberSuffix(originalAddress))
  if (!streetText) return false

  const address = result?.address ?? {}
  const candidates = [
    address.road,
    address.pedestrian,
    address.footway,
    address.path,
    result?.display_name,
    getResultAddressText(result),
  ]

  return candidates.some((value) => (
    hasDirectComparableMatch(streetText, value)
    || hasTokenOverlap(streetText, value, {
      ignoreStreetTypes: true,
      minRatio: 0.67,
      minMatches: 2,
    })
  ))
}

function matchesStreetNumber(result, streetNumber) {
  if (!streetNumber) return false

  const target = normalizeText(streetNumber)
  const address = result?.address ?? {}
  const candidates = [
    address.house_number,
    result?.display_name,
    getResultAddressText(result),
  ]

  const numberPattern = new RegExp(`\\b${escapeRegExp(target)}\\b`, 'i')
  return candidates.some((value) => {
    const normalized = normalizeText(value)
    return normalized === target || numberPattern.test(normalized)
  })
}

function matchesSchoolName(result, schoolName) {
  if (!schoolName) return false

  const address = result?.address ?? {}
  const candidates = [
    result?.name,
    result?.display_name,
    address.amenity,
    getResultAddressText(result),
  ]

  return candidates.some((value) => (
    hasDirectComparableMatch(schoolName, value)
    || hasTokenOverlap(schoolName, value, {
      ignoreSchoolStopwords: true,
      minRatio: 0.5,
      minMatches: 2,
    })
  ))
}

function analyzeResult(result, context) {
  const latitude = Number(result?.lat)
  const longitude = Number(result?.lon)
  const displayName = cleanText(result?.display_name)
  const displayNormalized = normalizeText(displayName)
  const addressText = normalizeText(getResultAddressText(result))
  const hasCaragua = displayNormalized.includes('caraguatatuba') || addressText.includes('caraguatatuba')
  const hasSaoPaulo = displayNormalized.includes('sao paulo') || addressText.includes('sao paulo')
  const hasBrasil = displayNormalized.includes('brasil') || addressText.includes('brasil')
  const withinBounds = Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && isWithinCaraguaBounds(latitude, longitude)
  const streetMatches = matchesStreet(result, context.endereco)
  const neighborhoodMatches = matchesNeighborhood(result, context.bairro)
  const exactNumberMatch = matchesStreetNumber(result, context.streetNumber)
  const schoolNameMatch = matchesSchoolName(result, context.schoolName)
  const postcode = formatCep(result?.address?.postcode)

  let score = 0
  if (withinBounds) score += 40
  if (hasCaragua) score += 35
  if (hasSaoPaulo) score += 20
  if (hasBrasil) score += 10
  if (streetMatches) score += 20
  if (neighborhoodMatches) score += 15
  if (exactNumberMatch) score += 25
  if (schoolNameMatch) score += 30
  if (context.streetNumber && !exactNumberMatch) score -= 10

  return {
    latitude,
    longitude,
    displayName,
    hasCaragua,
    hasSaoPaulo,
    hasBrasil,
    withinBounds,
    streetMatches,
    neighborhoodMatches,
    exactNumberMatch,
    schoolNameMatch,
    postcode,
    score,
  }
}

function classifyResult(analysis, context) {
  const baseValid = analysis.withinBounds
    && analysis.hasCaragua
    && analysis.hasSaoPaulo
    && (analysis.streetMatches || analysis.schoolNameMatch)

  if (!baseValid) {
    return {
      ok: false,
      status: 'falhou',
      confidence: 0,
      observation: 'Resultado descartado por nao parecer estar em Caraguatatuba/SP.',
    }
  }

  if (context.streetNumber && analysis.exactNumberMatch && analysis.hasBrasil) {
    return {
      ok: true,
      status: 'confirmado',
      confidence: 0.95,
      observation: 'Endereco confirmado com numero correspondente.',
    }
  }

  if (context.addressWithoutNumber && (analysis.neighborhoodMatches || analysis.schoolNameMatch)) {
    return {
      ok: true,
      status: 'aproximado',
      confidence: 0.8,
      observation: 'Endereco sem numero; coordenada aproximada dentro do bairro.',
    }
  }

  if (analysis.neighborhoodMatches || analysis.schoolNameMatch) {
    return {
      ok: true,
      status: 'aproximado',
      confidence: 0.6,
      observation: 'Resultado localizado sem evidencia forte do numero do endereco.',
    }
  }

  if (context.usedFallbackWithoutBairro) {
    return {
      ok: true,
      status: 'aproximado',
      confidence: 0.6,
      observation: 'Resultado localizado pela rua em Caraguatatuba, sem confirmacao do bairro.',
    }
  }

  return {
    ok: false,
    status: 'falhou',
    confidence: 0,
    observation: 'Resultado nao apresentou correspondencia suficiente com o bairro informado.',
  }
}

async function fetchNominatim(query) {
  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', query)
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('limit', '3')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'pt-BR')
  url.searchParams.set('viewbox', VIEWBOX)
  url.searchParams.set('bounded', '1')

  const response = await fetch(url, { headers: NOMINATIM_HEADERS })

  if (!response.ok) {
    throw new Error(`Nominatim respondeu com status ${response.status}.`)
  }

  return response.json()
}

function chooseBestResult(results, context) {
  const analyses = results
    .map((result) => ({ result, analysis: analyzeResult(result, context) }))
    .sort((left, right) => right.analysis.score - left.analysis.score)

  if (analyses.length === 0) {
    return null
  }

  const best = analyses[0]
  const classification = classifyResult(best.analysis, context)

  if (!classification.ok) {
    return null
  }

  return {
    status: classification.status,
    confidence: classification.confidence,
    latitude: best.analysis.latitude,
    longitude: best.analysis.longitude,
    displayName: best.analysis.displayName,
    observation: classification.observation,
    postcode: best.analysis.postcode,
  }
}

function buildComparableNameKey(value) {
  return buildComparableText(value)
}

function getFirstOwnValue(record, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key]
    }
  }
  return undefined
}

function getNameFromRecord(record) {
  return cleanText(getFirstOwnValue(record, ['nome', 'nome_oficial', 'nomeOficial']))
}

function getBairroFromRecord(record) {
  return cleanText(getFirstOwnValue(record, ['bairro', 'bairro_escola']))
}

function getEnderecoFromRecord(record) {
  const enderecoDireto = extractPrimaryAddress(getFirstOwnValue(record, ['endereco']))
  if (enderecoDireto) return enderecoDireto
  return extractPrimaryAddress(getFirstOwnValue(record, ['endereco_geocodificacao']))
}

function normalizeInputRecord(record, index) {
  const nome = getNameFromRecord(record) || `Escola ${index + 1}`
  const bairro = getBairroFromRecord(record) || null
  const endereco = getEnderecoFromRecord(record) || null
  const latitude = toNullableNumber(record?.latitude)
  const longitude = toNullableNumber(record?.longitude)
  const cep = formatCep(record?.cep) || extractCepFromText(record?.geocode_display_name)

  return {
    index,
    raw: record,
    nome,
    bairro,
    endereco,
    latitude,
    longitude,
    cep,
    geocodeStatus: normalizeGeocodeStatus(record?.geocode_status),
    geocodeConfidence: Number.isFinite(Number(record?.geocode_confianca)) ? Number(record.geocode_confianca) : 0,
    geocodeProvider: cleanText(record?.geocode_provider) || null,
    geocodeQuery: cleanText(record?.geocode_query) || null,
    geocodeDisplayName: cleanText(record?.geocode_display_name) || null,
    geocodeUpdatedAt: cleanText(record?.geocode_updated_at) || null,
    geocodeObservation: cleanText(record?.geocode_observacao) || null,
  }
}

function mergeOverlayValue(baseValue, overlayValue, fallbackNull = false) {
  if (overlayValue === null && fallbackNull) return null
  if (overlayValue === undefined) return baseValue
  return overlayValue
}

function overlayFinalRecord(baseRecord, finalRecord) {
  const output = { ...baseRecord }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'nome')) {
    output.nome = finalRecord.nome
    output.nome_oficial = finalRecord.nome
  }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'bairro')) {
    output.bairro = mergeOverlayValue(baseRecord.bairro, finalRecord.bairro, true)
    output.bairro_escola = mergeOverlayValue(baseRecord.bairro_escola, finalRecord.bairro, true)
  }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'endereco')) {
    output.endereco = mergeOverlayValue(baseRecord.endereco, finalRecord.endereco, true)
    output.endereco_geocodificacao = mergeOverlayValue(baseRecord.endereco_geocodificacao, finalRecord.endereco, true)
  }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'latitude')) {
    output.latitude = finalRecord.latitude
  }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'longitude')) {
    output.longitude = finalRecord.longitude
  }

  if (Object.prototype.hasOwnProperty.call(finalRecord, 'cep')) {
    output.cep = finalRecord.cep
  }

  return output
}

function mergeFinalEdits(baseRecords, finalRecords) {
  const overlayByName = new Map(
    finalRecords.map((record) => [buildComparableNameKey(getNameFromRecord(record)), record]),
  )

  return baseRecords.map((record, index) => {
    const baseNameKey = buildComparableNameKey(getNameFromRecord(record))
    const overlayRecord = overlayByName.get(baseNameKey) || (finalRecords.length === baseRecords.length ? finalRecords[index] : null)
    return overlayRecord ? overlayFinalRecord(record, overlayRecord) : record
  })
}

async function loadWorkingRecords() {
  const hasGeocoded = await pathExists(geocodedPath)
  const hasSchools = await pathExists(schoolsPath)

  const geocodedRecords = hasGeocoded ? await readJson(geocodedPath, []) : null
  const schoolsRecords = hasSchools ? await readJson(schoolsPath, []) : null

  let sourceLabel = ''
  let sourcePath = ''
  let baseRecords = null

  if (Array.isArray(geocodedRecords) && geocodedRecords.length > 0) {
    sourceLabel = 'geocoded'
    sourcePath = geocodedPath
    baseRecords = geocodedRecords
  } else if (Array.isArray(schoolsRecords) && schoolsRecords.length > 0) {
    sourceLabel = 'oficial'
    sourcePath = schoolsPath
    baseRecords = schoolsRecords
  } else {
    throw new Error('Nenhum arquivo de entrada valido foi encontrado.')
  }

  if (Array.isArray(schoolsRecords) && schoolsRecords.length > 0 && sourceLabel !== 'oficial') {
    baseRecords = mergeFinalEdits(baseRecords, schoolsRecords)
  }

  return {
    sourceLabel,
    sourcePath,
    records: baseRecords.map((record, index) => normalizeInputRecord(record, index)),
  }
}

function cloneComodosPadrao() {
  return DEFAULT_COMODOS.map((item) => ({ ...item }))
}

function createRateLimiter() {
  let lastRequestAt = 0

  return {
    async wait() {
      if (lastRequestAt === 0) {
        lastRequestAt = Date.now()
        return
      }

      const elapsed = Date.now() - lastRequestAt
      if (elapsed < REQUEST_DELAY_MS) {
        await sleep(REQUEST_DELAY_MS - elapsed)
      }

      lastRequestAt = Date.now()
    },
  }
}

function buildGeocodeFromCache(cached, fallbackQuery, updatedAt) {
  return {
    query: cached.query || fallbackQuery,
    latitude: toNullableNumber(cached.latitude),
    longitude: toNullableNumber(cached.longitude),
    status: cleanText(cached.status) || 'falhou',
    confidence: Number(cached.confidence ?? 0),
    displayName: cleanText(cached.displayName) || null,
    updatedAt,
    observation: cleanText(cached.observation) || null,
    postcode: formatCep(cached.postcode),
  }
}

function buildGeocodeCachePayload(geocode) {
  return {
    version: GEOCODE_CACHE_VERSION,
    query: geocode.query,
    latitude: geocode.latitude,
    longitude: geocode.longitude,
    status: geocode.status,
    confidence: geocode.confidence,
    displayName: geocode.displayName,
    observation: geocode.observation,
    postcode: geocode.postcode,
    updatedAt: geocode.updatedAt,
  }
}

function buildFailureGeocode(query, observation, updatedAt, record) {
  return {
    query,
    latitude: record.latitude,
    longitude: record.longitude,
    status: 'falhou',
    confidence: 0,
    displayName: record.geocodeDisplayName || null,
    updatedAt,
    observation,
    postcode: record.cep || extractCepFromText(record.geocodeDisplayName),
  }
}

function buildNoAddressGeocode(updatedAt, record) {
  return {
    query: null,
    latitude: record.latitude,
    longitude: record.longitude,
    status: 'sem_endereco',
    confidence: 0,
    displayName: record.geocodeDisplayName || null,
    updatedAt,
    observation: 'Registro sem endereco para geocodificacao.',
    postcode: record.cep || null,
  }
}

function buildExistingCoordinatesGeocode(record, updatedAt) {
  const addressWithoutNumber = hasNoNumberMarker(record.endereco)
  const inferredStatus = addressWithoutNumber ? 'aproximado' : 'confirmado'
  const resolvedStatus = (
    record.geocodeStatus === 'confirmado' || record.geocodeStatus === 'aproximado'
      ? record.geocodeStatus
      : inferredStatus
  )
  const resolvedConfidence = record.geocodeConfidence || (resolvedStatus === 'aproximado' ? 0.8 : 0.95)

  return {
    query: buildGeocodeQueries(record).primaryQuery,
    latitude: record.latitude,
    longitude: record.longitude,
    status: resolvedStatus,
    confidence: resolvedConfidence,
    displayName: record.geocodeDisplayName || null,
    updatedAt,
    observation: record.geocodeObservation || 'Coordenadas mantidas a partir do arquivo de entrada.',
    postcode: record.cep || extractCepFromText(record.geocodeDisplayName),
  }
}

function getStreetForCepLookup(address) {
  const streetOnly = sanitizeQuerySegment(removeStreetNumberSuffix(address))
  return streetOnly || null
}

async function fetchViaCep(logradouro) {
  const endpoint = `${VIACEP_BASE_URL}/${encodeURIComponent(logradouro)}/json/`
  const response = await fetch(endpoint, {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!response.ok) {
    throw new Error(`ViaCEP respondeu com status ${response.status}.`)
  }

  return response.json()
}

function evaluateViaCepMatch(result, context) {
  const localidade = cleanText(result?.localidade)
  const uf = cleanText(result?.uf)
  if (normalizeText(localidade) !== 'caraguatatuba' || uf.toUpperCase() !== 'SP') {
    return { score: -1, streetMatch: false, bairroMatch: false }
  }

  const streetMatch = (
    hasDirectComparableMatch(context.logradouro, result?.logradouro)
    || hasTokenOverlap(context.logradouro, result?.logradouro, {
      ignoreStreetTypes: true,
      minRatio: 0.5,
      minMatches: 1,
    })
  )

  const bairroMatch = !context.bairro
    || hasDirectComparableMatch(context.bairro, result?.bairro)
    || hasTokenOverlap(context.bairro, result?.bairro, {
      minRatio: 0.5,
      minMatches: 1,
    })

  let score = 15
  if (streetMatch) score += 60
  if (bairroMatch) score += 25

  return { score, streetMatch, bairroMatch }
}

function chooseBestViaCepResult(results, context) {
  if (!Array.isArray(results)) return null

  const ranked = results
    .map((result) => ({ result, evaluation: evaluateViaCepMatch(result, context) }))
    .filter((entry) => entry.evaluation.score >= 0)
    .sort((left, right) => right.evaluation.score - left.evaluation.score)

  if (ranked.length === 0) return null

  const best = ranked[0]
  if (!best.evaluation.streetMatch || best.evaluation.score < 55) {
    return null
  }

  const cep = formatCep(best.result?.cep)
  if (!cep) return null

  return {
    cep,
    bairro: cleanText(best.result?.bairro) || null,
    logradouro: cleanText(best.result?.logradouro) || null,
    observation: best.evaluation.bairroMatch
      ? 'CEP encontrado pelo ViaCEP com boa correspondencia de logradouro e bairro.'
      : 'CEP encontrado pelo ViaCEP com boa correspondencia de logradouro.',
  }
}

function buildCepCachePayload(logradouro, result) {
  return {
    version: CEP_CACHE_VERSION,
    logradouro,
    cep: result?.cep || null,
    bairro: result?.bairro || null,
    logradouroEncontrado: result?.logradouro || null,
    observation: result?.observation || null,
  }
}

async function resolveCep({ record, geocode, cepCache }) {
  const existingCep = formatCep(record.cep)
  if (existingCep) {
    return existingCep
  }

  const geocodeCep = formatCep(geocode?.postcode) || extractCepFromText(geocode?.displayName)
  if (geocodeCep) {
    return geocodeCep
  }

  const street = getStreetForCepLookup(record.endereco)
  if (!street || street.length < 3) {
    return null
  }

  const cacheKey = buildCacheKey(street)
  const cached = cepCache[cacheKey]?.version === CEP_CACHE_VERSION ? cepCache[cacheKey] : null
  if (cached) {
    return formatCep(cached.cep)
  }

  try {
    const viaCepResponse = await fetchViaCep(street)
    const chosen = chooseBestViaCepResult(Array.isArray(viaCepResponse) ? viaCepResponse : [], {
      logradouro: street,
      bairro: record.bairro,
    })

    cepCache[cacheKey] = buildCepCachePayload(street, chosen)
    await writeJson(cepCachePath, cepCache)

    return chosen?.cep || null
  } catch {
    return null
  }
}

async function resolveGeocode({ record, geocodeCache, rateLimiter }) {
  const updatedAt = new Date().toISOString()
  const queryPlan = buildGeocodeQueries(record)
  const hasCoordinates = isFiniteCoordinate(record.latitude) && isFiniteCoordinate(record.longitude)

  if (!queryPlan.primaryQuery) {
    return buildNoAddressGeocode(updatedAt, record)
  }

  if (hasCoordinates) {
    return buildExistingCoordinatesGeocode(record, updatedAt)
  }

  let geocode = null
  let usedCache = false
  let lastFailure = null

  for (const candidate of queryPlan.candidates) {
    const cacheKey = buildCacheKey(candidate.query)
    const cached = geocodeCache[cacheKey]?.version === GEOCODE_CACHE_VERSION ? geocodeCache[cacheKey] : null

    if (cached) {
      const cachedGeocode = buildGeocodeFromCache(cached, candidate.query, updatedAt)
      if (cachedGeocode.status === 'confirmado' || cachedGeocode.status === 'aproximado') {
        geocode = cachedGeocode
        usedCache = true
        break
      }

      lastFailure = cachedGeocode
      continue
    }

    await rateLimiter.wait()

    try {
      const results = await fetchNominatim(candidate.query)
      const best = chooseBestResult(results, {
        bairro: record.bairro,
        endereco: record.endereco,
        schoolName: record.nome,
        streetNumber: queryPlan.streetNumber,
        addressWithoutNumber: queryPlan.addressWithoutNumber,
        usedFallbackWithoutBairro: candidate.usedFallbackWithoutBairro,
        usedFallbackWithoutNumber: candidate.usedFallbackWithoutNumber,
      })

      const attemptedGeocode = best
        ? {
            query: candidate.query,
            latitude: best.latitude,
            longitude: best.longitude,
            status: best.status,
            confidence: best.confidence,
            displayName: best.displayName,
            updatedAt,
            observation: best.observation,
            postcode: best.postcode,
          }
        : buildFailureGeocode(
            candidate.query,
            'Nenhum resultado confiavel encontrado no Nominatim.',
            updatedAt,
            record,
          )

      geocodeCache[cacheKey] = buildGeocodeCachePayload(attemptedGeocode)
      await writeJson(geocodeCachePath, geocodeCache)

      if (attemptedGeocode.status === 'confirmado' || attemptedGeocode.status === 'aproximado') {
        geocode = attemptedGeocode
        break
      }

      lastFailure = attemptedGeocode
    } catch (error) {
      lastFailure = buildFailureGeocode(
        candidate.query,
        `Erro ao consultar o Nominatim: ${error.message}`,
        updatedAt,
        record,
      )
    }
  }

  const resolved = geocode || lastFailure || buildFailureGeocode(
    queryPlan.primaryQuery,
    'Nenhum resultado confiavel encontrado no Nominatim.',
    updatedAt,
    record,
  )

  geocodeCache[buildCacheKey(queryPlan.primaryQuery)] = buildGeocodeCachePayload(resolved)
  await writeJson(geocodeCachePath, geocodeCache)

  return { ...resolved, usedCache }
}

function buildEnrichedRecord(record, geocode, cep) {
  return {
    ...record.raw,
    nome: record.nome,
    nome_oficial: record.raw?.nome_oficial ?? record.nome,
    bairro: record.bairro,
    endereco: record.endereco,
    latitude: toNullableNumber(geocode.latitude),
    longitude: toNullableNumber(geocode.longitude),
    cep,
    geocode_status: geocode.status,
    geocode_confianca: geocode.confidence,
    geocode_provider: 'nominatim',
    geocode_query: geocode.query,
    geocode_display_name: geocode.displayName,
    geocode_updated_at: geocode.updatedAt,
    geocode_observacao: geocode.observation,
  }
}

function buildFinalRecord(enrichedRecord) {
  return {
    nome: cleanText(enrichedRecord.nome || enrichedRecord.nome_oficial) || null,
    cep: formatCep(enrichedRecord.cep),
    bairro: cleanText(enrichedRecord.bairro) || null,
    endereco: extractPrimaryAddress(enrichedRecord.endereco) || null,
    latitude: toNullableNumber(enrichedRecord.latitude),
    longitude: toNullableNumber(enrichedRecord.longitude),
    fotos: null,
    comodosCadastrados: cloneComodosPadrao(),
  }
}

function buildPendingRecord(finalRecord) {
  const motivos = []
  if (finalRecord.latitude === null) motivos.push('latitude ausente')
  if (finalRecord.longitude === null) motivos.push('longitude ausente')
  if (finalRecord.cep === null) motivos.push('cep ausente')
  if (!finalRecord.endereco) motivos.push('endereco ausente')

  return {
    nome: finalRecord.nome,
    bairro: finalRecord.bairro,
    endereco: finalRecord.endereco,
    latitude: finalRecord.latitude,
    longitude: finalRecord.longitude,
    cep: finalRecord.cep,
    motivos,
  }
}

function validateFinalOutput(records) {
  for (const record of records) {
    const latitudeOk = record.latitude === null || Number.isFinite(record.latitude)
    const longitudeOk = record.longitude === null || Number.isFinite(record.longitude)

    if (!latitudeOk || !longitudeOk) {
      throw new Error(`Coordenadas invalidas para ${record.nome}.`)
    }
  }
}

function updateStats(stats, finalRecord, geocode) {
  if (finalRecord.latitude !== null && finalRecord.longitude !== null) {
    stats.withCoordinates += 1
  } else {
    stats.withoutCoordinates += 1
  }

  if (finalRecord.cep) {
    stats.withCep += 1
  } else {
    stats.withoutCep += 1
  }

  if (geocode.status === 'confirmado') {
    stats.confirmed += 1
  } else if (geocode.status === 'aproximado') {
    stats.approximated += 1
  } else if (geocode.status === 'falhou') {
    stats.failed += 1
  } else if (geocode.status === 'sem_endereco') {
    stats.withoutAddress += 1
  }
}

function logRecord(tag, record, geocode, cep) {
  const displayName = geocode.displayName ? ` -> ${geocode.displayName}` : ''
  const cepSuffix = cep ? ` [CEP ${cep}]` : ''
  console.log(`${tag} ${record.nome}${cepSuffix}${displayName}`)
}

async function main() {
  const { sourceLabel, sourcePath, records } = await loadWorkingRecords()
  const geocodeCache = await readJson(geocodeCachePath, {})
  const cepCache = await readJson(cepCachePath, {})
  const rateLimiter = createRateLimiter()

  const enrichedRecords = []
  const finalRecords = []
  const pendingRecords = []
  const stats = {
    total: records.length,
    withCoordinates: 0,
    withoutCoordinates: 0,
    withCep: 0,
    withoutCep: 0,
    confirmed: 0,
    approximated: 0,
    failed: 0,
    withoutAddress: 0,
  }

  for (const record of records) {
    const geocode = await resolveGeocode({ record, geocodeCache, rateLimiter })
    const cep = await resolveCep({ record, geocode, cepCache })
    const enriched = buildEnrichedRecord(record, geocode, cep)
    const finalRecord = buildFinalRecord(enriched)

    enrichedRecords.push(enriched)
    finalRecords.push(finalRecord)
    updateStats(stats, finalRecord, geocode)

    if (finalRecord.latitude === null || finalRecord.longitude === null || finalRecord.cep === null) {
      pendingRecords.push(buildPendingRecord(finalRecord))
    }

    if (geocode.status === 'confirmado') {
      logRecord(geocode.usedCache ? '[CACHE]' : '[OK]', record, geocode, finalRecord.cep)
      continue
    }

    if (geocode.status === 'aproximado') {
      logRecord(geocode.usedCache ? '[CACHE]' : '[APROX]', record, geocode, finalRecord.cep)
      continue
    }

    if (geocode.status === 'sem_endereco') {
      logRecord('[SEM_ENDERECO]', record, geocode, finalRecord.cep)
      continue
    }

    logRecord('[FALHOU]', record, geocode, finalRecord.cep)
  }

  validateFinalOutput(finalRecords)
  await writeJson(geocodedPath, enrichedRecords)
  await writeJson(schoolsPath, finalRecords)
  await writeJson(pendingPath, pendingRecords)

  console.log('')
  console.log(`Fonte de entrada: ${sourceLabel} (${sourcePath})`)
  console.log(`Total de registros: ${stats.total}`)
  console.log(`Registros com latitude/longitude: ${stats.withCoordinates}`)
  console.log(`Registros sem latitude/longitude: ${stats.withoutCoordinates}`)
  console.log(`Registros com CEP: ${stats.withCep}`)
  console.log(`Registros sem CEP: ${stats.withoutCep}`)
  console.log(`Geocodificacoes confirmadas: ${stats.confirmed}`)
  console.log(`Geocodificacoes aproximadas: ${stats.approximated}`)
  console.log(`Falhas de geocodificacao: ${stats.failed}`)
  console.log(`Registros sem endereco: ${stats.withoutAddress}`)
  console.log(`Arquivo final gerado: ${schoolsPath}`)
  console.log(`Arquivo de pendencias: ${pendingPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
