import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const USER_AGENT = 'hackaton-2026-seduc-caraguatatuba-geocoder/1.0'
const REQUEST_DELAY_MS = 1200
const CACHE_VERSION = 2
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const VIEWBOX = '-45.75,-23.35,-45.10,-24.05'
const NOMINATIM_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'pt-BR',
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const inputPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_mock.json')
const outputPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_geocoded.json')
const cachePath = path.join(projectRoot, 'scripts', 'cache', 'geocode-cache-seduc-caragua.json')

const CARAGUA_BOUNDS = {
  minLongitude: -45.75,
  maxLongitude: -45.10,
  minLatitude: -24.05,
  maxLatitude: -23.35,
}

const ABBREVIATION_REPLACEMENTS = [
  [/\bav[.]?\b/gi, 'Avenida'],
  [/\br[.]?\b/gi, 'Rua'],
  [/\bjd[.]?\b/gi, 'Jardim'],
  [/\bpq[.]?\b/gi, 'Parque'],
  [/\bsta[.]?\b/gi, 'Santa'],
  [/\bsto[.]?\b/gi, 'Santo'],
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

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function expandCommonAbbreviations(value) {
  let output = String(value ?? '')

  for (const [pattern, replacement] of ABBREVIATION_REPLACEMENTS) {
    output = output.replace(pattern, replacement)
  }

  return output.replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isFiniteCoordinate(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return Number.isFinite(Number(value))
}

function hasValidCoordinates(record) {
  return isFiniteCoordinate(record?.latitude) && isFiniteCoordinate(record?.longitude)
}

function toNullableNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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
  const sanitized = String(address ?? '')
  const match = sanitized.match(/,\s*(?:n[º°o.]?\s*)?(\d+[a-z0-9/-]*)\b/i)
  return match?.[1] ?? null
}

function removeNoNumberSuffix(address) {
  return String(address ?? '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/,\s*s\s*\/?\s*n(?:[\s.]*[oº°])?.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function removeStreetNumberSuffix(address) {
  return String(address ?? '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/,\s*(?:n[º°o.]?\s*)?\d+[a-z0-9/-]*\b.*$/i, '')
    .replace(/,\s*s\s*\/?\s*n(?:[\s.]*[oº°])?.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildCacheKey(query) {
  return normalizeText(query)
    .replace(/[^\p{Letter}\p{Number}\s,/-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeQuerySegment(value) {
  return expandCommonAbbreviations(
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
  const endereco = String(record?.endereco ?? '').trim()
  const bairro = String(record?.bairro ?? '').trim()

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
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

function buildComparableText(value) {
  return normalizeText(expandCommonAbbreviations(value))
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

  if (targetTokens.length === 0) {
    return false
  }

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
  const displayName = String(result?.display_name ?? '')
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

function formatFromGeocode(record, geocode) {
  return {
    ...record,
    latitude: geocode.latitude,
    longitude: geocode.longitude,
    geocode_status: geocode.status,
    geocode_confianca: geocode.confidence,
    geocode_provider: 'nominatim',
    geocode_query: geocode.query,
    geocode_display_name: geocode.displayName,
    geocode_updated_at: geocode.updatedAt,
    geocode_observacao: geocode.observation,
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
  }
}

function buildGeocodeFromCache(cached, fallbackQuery, updatedAt) {
  return {
    query: cached.query || fallbackQuery,
    latitude: toNullableNumber(cached.latitude),
    longitude: toNullableNumber(cached.longitude),
    status: cached.status,
    confidence: Number(cached.confidence ?? 0),
    displayName: cached.displayName || null,
    updatedAt,
    observation: cached.observation || null,
  }
}

function buildCachePayload(geocode) {
  return {
    version: CACHE_VERSION,
    query: geocode.query,
    latitude: geocode.latitude,
    longitude: geocode.longitude,
    status: geocode.status,
    confidence: geocode.confidence,
    displayName: geocode.displayName,
    observation: geocode.observation,
    updatedAt: geocode.updatedAt,
  }
}

function buildFailureGeocode(query, observation, updatedAt) {
  return {
    query,
    latitude: null,
    longitude: null,
    status: 'falhou',
    confidence: 0,
    displayName: null,
    updatedAt,
    observation,
  }
}

function buildNoAddressGeocode(updatedAt) {
  return {
    query: null,
    latitude: null,
    longitude: null,
    status: 'sem_endereco',
    confidence: 0,
    displayName: null,
    updatedAt,
    observation: 'Registro sem endereco para geocodificacao.',
  }
}

function buildExistingCoordinatesGeocode(record, query, addressWithoutNumber, updatedAt) {
  return {
    query,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
    status: addressWithoutNumber ? 'aproximado' : 'confirmado',
    confidence: addressWithoutNumber ? 0.8 : 0.95,
    displayName: record.geocode_display_name || null,
    updatedAt,
    observation: 'Coordenadas ja existentes no arquivo original; consulta nao executada.',
  }
}

function applyStats(stats, geocode, options = {}) {
  if (options.alreadyHadCoordinates) {
    stats.alreadyHadCoordinates += 1
  }

  if (geocode.status === 'confirmado' && !options.alreadyHadCoordinates) {
    stats.geocoded += 1
  }

  if (geocode.status === 'aproximado') {
    stats.approximated += 1
  }

  if (geocode.status === 'falhou') {
    stats.failed += 1
  }

  if (geocode.status === 'sem_endereco') {
    stats.withoutAddress += 1
  }
}

function logResult(tag, record, geocode) {
  const suffix = geocode.displayName ? ` -> ${geocode.displayName}` : ''
  console.log(`${tag} ${record.nome_oficial}${suffix}`)
}

function validateOutput(records) {
  for (const record of records) {
    const latitude = record.latitude
    const longitude = record.longitude
    const latitudeOk = latitude === null || Number.isFinite(latitude)
    const longitudeOk = longitude === null || Number.isFinite(longitude)

    if (!latitudeOk || !longitudeOk) {
      throw new Error(`Coordenadas invalidas para ${record.nome_oficial}.`)
    }
  }
}

async function main() {
  const records = await readJson(inputPath, [])
  const cache = await readJson(cachePath, {})
  const output = []
  const stats = {
    total: Array.isArray(records) ? records.length : 0,
    alreadyHadCoordinates: 0,
    geocoded: 0,
    approximated: 0,
    failed: 0,
    withoutAddress: 0,
  }

  if (!Array.isArray(records)) {
    throw new Error('O arquivo de entrada nao contem uma lista JSON.')
  }

  let lastRequestAt = 0

  for (const record of records) {
    const updatedAt = new Date().toISOString()
    const queryPlan = buildGeocodeQueries(record)

    if (hasValidCoordinates(record)) {
      const geocode = buildExistingCoordinatesGeocode(
        record,
        queryPlan.primaryQuery,
        queryPlan.addressWithoutNumber,
        updatedAt,
      )
      applyStats(stats, geocode, { alreadyHadCoordinates: true })
      output.push(formatFromGeocode(record, geocode))
      logResult('[OK]', record, geocode)
      continue
    }

    if (!queryPlan.primaryQuery) {
      const geocode = buildNoAddressGeocode(updatedAt)
      applyStats(stats, geocode)
      output.push(formatFromGeocode(record, geocode))
      logResult('[SEM_ENDERECO]', record, geocode)
      continue
    }

    let geocode = null
    let usedCache = false
    let lastFailure = null

    for (const candidate of queryPlan.candidates) {
      const cacheKey = buildCacheKey(candidate.query)
      const cached = cache[cacheKey]?.version === CACHE_VERSION ? cache[cacheKey] : null

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

      if (lastRequestAt > 0) {
        const elapsed = Date.now() - lastRequestAt
        if (elapsed < REQUEST_DELAY_MS) {
          await sleep(REQUEST_DELAY_MS - elapsed)
        }
      }

      try {
        lastRequestAt = Date.now()
        const results = await fetchNominatim(candidate.query)
        const best = chooseBestResult(results, {
          bairro: record.bairro,
          endereco: record.endereco,
          schoolName: record.nome_oficial,
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
            }
          : buildFailureGeocode(
              candidate.query,
              'Nenhum resultado confiavel encontrado no Nominatim.',
              updatedAt,
            )

        cache[cacheKey] = buildCachePayload(attemptedGeocode)
        await writeJson(cachePath, cache)

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
        )
      }
    }

    if (!geocode) {
      geocode = lastFailure ?? buildFailureGeocode(
        queryPlan.primaryQuery,
        'Nenhum resultado confiavel encontrado no Nominatim.',
        updatedAt,
      )
    }

    const primaryCacheKey = buildCacheKey(queryPlan.primaryQuery)
    cache[primaryCacheKey] = buildCachePayload(geocode)
    await writeJson(cachePath, cache)

    applyStats(stats, geocode)
    output.push(formatFromGeocode(record, geocode))

    if (usedCache) {
      logResult('[CACHE]', record, geocode)
      continue
    }

    if (geocode.status === 'confirmado') {
      logResult('[OK]', record, geocode)
      continue
    }

    if (geocode.status === 'aproximado') {
      logResult('[APROX]', record, geocode)
      continue
    }

    logResult('[FALHOU]', record, geocode)
  }

  validateOutput(output)
  await writeJson(outputPath, output)

  console.log('')
  console.log(`Total de escolas: ${stats.total}`)
  console.log(`Ja tinham coordenadas: ${stats.alreadyHadCoordinates}`)
  console.log(`Geocodificadas: ${stats.geocoded}`)
  console.log(`Aproximadas: ${stats.approximated}`)
  console.log(`Falharam: ${stats.failed}`)
  console.log(`Sem endereco: ${stats.withoutAddress}`)
  console.log(`Arquivo gerado em: ${outputPath}`)
  console.log(`Cache em: ${cachePath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
