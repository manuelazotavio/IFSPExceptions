import { isActiveOccurrence } from './occurrenceStatus.js'

export const defaultColorScale = {
  start: '#16a34a',
  middle: '#f59e0b',
  end: '#dc2626',
}

const neutralBairroLabelColor = 'rgba(51, 65, 85, 0.72)'

export function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function pickBairroDisplayName(featureOrEntry) {
  const props = featureOrEntry?.feature?.properties || featureOrEntry?.properties || featureOrEntry || {}
  const candidates = [
    featureOrEntry?.nome,
    featureOrEntry?.name,
    props.nome,
    props.NOME,
    props.bairro,
    props.BAIRRO,
    props.name,
    props.Name,
    props.NM_BAIRRO,
    props.nm_bairro,
    props.nome_bairro,
    props.nome_bairr,
  ]

  const match = candidates.find((value) => String(value || '').trim())
  return match ? String(match).trim() : ''
}

export function getBairroDisplayName(featureOrEntry) {
  return pickBairroDisplayName(featureOrEntry) || 'Bairro sem nome'
}

export function getBairroName(feature) {
  return getBairroDisplayName(feature)
}

export function getBairroKey(feature) {
  return normalizeName(getBairroName(feature))
}

export function isValidSchoolCoordinate(item) {
  const latitude = Number(item?.latitude)
  const longitude = Number(item?.longitude)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

export function schoolToGeoJsonPoint(school) {
  return [Number(school?.longitude), Number(school?.latitude)]
}

export function isPendingOccurrence(status) {
  return isActiveOccurrence({ status })
}

export function calculateSchoolPendingScore(item) {
  if (Array.isArray(item?.ocorrencias)) {
    return item.ocorrencias
      .filter((ocorrencia) => isPendingOccurrence(ocorrencia.status))
      .reduce((total, ocorrencia) => {
        const criticidade = normalizeName(ocorrencia.criticidade)
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

export function getSchoolPendingScore(item) {
  if (Number.isFinite(Number(item?.scoreRiscoPendente))) {
    return Number(item.scoreRiscoPendente)
  }

  if (Number.isFinite(Number(item?.intensidade))) {
    return Number(item.intensidade)
  }

  const weightedScore = calculateSchoolPendingScore(item)
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

function isPointInsidePolygon(point, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) return false

  const [outerRing, ...holes] = polygonCoordinates
  if (!isPointInsideRing(point, outerRing)) return false

  return !holes.some((hole) => isPointInsideRing(point, hole))
}

export function featureContainsCoordinates(feature, latitude, longitude) {
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

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '')
  const matches = normalized.match(/\w\w/g)

  if (!matches || matches.length !== 3) {
    return [0, 0, 0]
  }

  return matches.map((value) => Number.parseInt(value, 16))
}

function blendColors(startColor, endColor, progress) {
  const clamp = Math.max(0, Math.min(1, progress))
  const from = hexToRgb(startColor)
  const to = hexToRgb(endColor)
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * clamp))
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function getNormalizedScore(score, maxScore) {
  if (maxScore <= 0) return 0
  return Math.max(0, Math.min(1, Number(score || 0) / maxScore))
}

export function interpolateColor(startColor, middleColor, endColor, normalizedValue) {
  const clamped = Math.max(0, Math.min(1, normalizedValue))

  if (clamped <= 0.5) {
    return blendColors(startColor, middleColor, clamped / 0.5)
  }

  return blendColors(middleColor, endColor, (clamped - 0.5) / 0.5)
}

export function getScaledColor(score, colorScale, maxScore) {
  return interpolateColor(
    colorScale?.start || defaultColorScale.start,
    colorScale?.middle || defaultColorScale.middle,
    colorScale?.end || defaultColorScale.end,
    getNormalizedScore(score, maxScore),
  )
}

function calculateSignedRingArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0

  let area = 0

  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[(index + 1) % ring.length]
    area += x1 * y2 - x2 * y1
  }

  return area / 2
}

function getRingArea(ring) {
  return Math.abs(calculateSignedRingArea(ring))
}

function getAverageCoordinate(ring) {
  if (!Array.isArray(ring) || ring.length === 0) return null

  const total = ring.reduce((accumulator, coordinate) => ({
    longitude: accumulator.longitude + Number(coordinate?.[0] || 0),
    latitude: accumulator.latitude + Number(coordinate?.[1] || 0),
  }), { longitude: 0, latitude: 0 })

  return [total.longitude / ring.length, total.latitude / ring.length]
}

function getRingCentroid(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return getAverageCoordinate(ring)

  let factor = 0
  let centroidX = 0
  let centroidY = 0

  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[(index + 1) % ring.length]
    const cross = x1 * y2 - x2 * y1
    factor += cross
    centroidX += (x1 + x2) * cross
    centroidY += (y1 + y2) * cross
  }

  if (Math.abs(factor) < Number.EPSILON) {
    return getAverageCoordinate(ring)
  }

  return [
    centroidX / (3 * factor),
    centroidY / (3 * factor),
  ]
}

function flattenCoordinates(coordinates, result = []) {
  if (!Array.isArray(coordinates)) return result

  if (typeof coordinates[0] === 'number') {
    result.push(coordinates)
    return result
  }

  coordinates.forEach((coordinate) => flattenCoordinates(coordinate, result))
  return result
}

function getCoordinateBounds(coordinates) {
  const points = flattenCoordinates(coordinates)
  if (points.length === 0) return null

  const initial = points[0]
  return points.reduce((accumulator, [longitude, latitude]) => ({
    minLongitude: Math.min(accumulator.minLongitude, longitude),
    maxLongitude: Math.max(accumulator.maxLongitude, longitude),
    minLatitude: Math.min(accumulator.minLatitude, latitude),
    maxLatitude: Math.max(accumulator.maxLatitude, latitude),
  }), {
    minLongitude: initial[0],
    maxLongitude: initial[0],
    minLatitude: initial[1],
    maxLatitude: initial[1],
  })
}

function getBoundsCenter(coordinates) {
  const bounds = getCoordinateBounds(coordinates)
  if (!bounds) return null

  return [
    (bounds.minLongitude + bounds.maxLongitude) / 2,
    (bounds.minLatitude + bounds.maxLatitude) / 2,
  ]
}

function getRepresentativePoint(feature) {
  const geometry = feature?.geometry
  if (!geometry) return null

  if (geometry.type === 'Polygon') {
    const centroid = getRingCentroid(geometry.coordinates?.[0])
    if (centroid && featureContainsCoordinates(feature, centroid[1], centroid[0])) {
      return centroid
    }

    const boundsCenter = getBoundsCenter(geometry.coordinates)
    if (boundsCenter && featureContainsCoordinates(feature, boundsCenter[1], boundsCenter[0])) {
      return boundsCenter
    }

    return geometry.coordinates?.[0]?.[0] || null
  }

  if (geometry.type === 'MultiPolygon') {
    const [largestPolygon] = [...geometry.coordinates].sort((left, right) => (
      getRingArea(right?.[0] || []) - getRingArea(left?.[0] || [])
    ))

    const polygonFeature = {
      ...feature,
      geometry: {
        type: 'Polygon',
        coordinates: largestPolygon,
      },
    }

    return getRepresentativePoint(polygonFeature)
  }

  return null
}

export function buildFeatureEntries(bairrosGeoJson) {
  if (bairrosGeoJson?.type !== 'FeatureCollection' || !Array.isArray(bairrosGeoJson.features)) {
    return []
  }

  return bairrosGeoJson.features
    .filter((feature) => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type))
    .map((feature) => {
      const bairroName = getBairroDisplayName(feature)
      const representativePoint = getRepresentativePoint(feature)
      const coordinateBounds = getCoordinateBounds(feature?.geometry?.coordinates)
      const boundsWidth = coordinateBounds ? coordinateBounds.maxLongitude - coordinateBounds.minLongitude : 0
      const boundsHeight = coordinateBounds ? coordinateBounds.maxLatitude - coordinateBounds.minLatitude : 0
      const bounds = coordinateBounds ? {
        northWest: [coordinateBounds.maxLatitude, coordinateBounds.minLongitude],
        southEast: [coordinateBounds.minLatitude, coordinateBounds.maxLongitude],
        center: [
          (coordinateBounds.minLatitude + coordinateBounds.maxLatitude) / 2,
          (coordinateBounds.minLongitude + coordinateBounds.maxLongitude) / 2,
        ],
      } : null
      const labelPosition = representativePoint
        ? [representativePoint[1], representativePoint[0]]
        : bounds?.center || null

      if (import.meta.env.DEV && bairroName === 'Bairro sem nome') {
        console.warn('[Mapa] Feature de bairro sem nome identificavel no GeoJSON.', feature?.properties || feature)
      }

      return {
        key: getBairroKey(feature),
        nome: bairroName,
        name: bairroName,
        feature,
        labelPosition,
        bounds,
        labelBounds: coordinateBounds ? {
          width: boundsWidth,
          height: boundsHeight,
          area: boundsWidth * boundsHeight,
          minLongitude: coordinateBounds.minLongitude,
          maxLongitude: coordinateBounds.maxLongitude,
          minLatitude: coordinateBounds.minLatitude,
          maxLatitude: coordinateBounds.maxLatitude,
          bounds,
        } : null,
      }
    })
}

export function buildSchoolBairroIndex({ schools, featureEntries }) {
  const validBairroKeys = new Set(featureEntries.map((entry) => entry.key))
  const schoolBairroIndex = {}
  const unmatchedSchools = []

  schools.forEach((school) => {
    const schoolId = school?.escolaId || school?.id
    if (!schoolId) return

    if (isValidSchoolCoordinate(school)) {
      const featureMatch = featureEntries.find(({ feature }) => (
        featureContainsCoordinates(feature, Number(school.latitude), Number(school.longitude))
      ))

      if (featureMatch) {
        schoolBairroIndex[schoolId] = featureMatch.key
        return
      }

      unmatchedSchools.push(school)
      schoolBairroIndex[schoolId] = ''
      return
    }

    const fallbackKey = normalizeName(school?.bairro || school?.bairroNome || '')
    schoolBairroIndex[schoolId] = validBairroKeys.has(fallbackKey) ? fallbackKey : ''
  })

  return { schoolBairroIndex, unmatchedSchools }
}

export function buildBairroStats({ featureEntries, schools, schoolBairroIndex, colorScale }) {
  const bairroStats = Object.fromEntries(
    featureEntries.map((entry) => [entry.key, {
      nome: entry.nome || entry.name,
      key: entry.key,
      labelPosition: entry.labelPosition,
      totalEscolas: 0,
      totalSolicitacoes: 0,
      score: 0,
      criticas: 0,
      atencao: 0,
      baixas: 0,
      intensidade: 0,
      schoolIds: [],
      fillColor: 'transparent',
      labelColor: neutralBairroLabelColor,
      hasSchools: false,
    }]),
  )

  schools.forEach((school) => {
    const schoolId = school?.escolaId || school?.id
    const bairroKey = schoolBairroIndex[schoolId]

    if (!schoolId || !bairroKey || !bairroStats[bairroKey]) {
      return
    }

    const stats = bairroStats[bairroKey]
    stats.totalEscolas += 1
    stats.totalSolicitacoes += Number(school.totalOcorrencias || 0)
    stats.score += Number(school.score || 0)
    stats.criticas += Number(school.criticas || 0)
    stats.atencao += Number(school.atencao || 0)
    stats.baixas += Number(school.baixas || 0)
    stats.intensidade += Number(school.intensidade || 0)
    stats.schoolIds.push(schoolId)
  })

  const populatedBairros = Object.values(bairroStats).filter((item) => item.totalEscolas > 0)
  const maxScore = Math.max(0, ...populatedBairros.map((item) => Number(item.score || 0)))

  Object.values(bairroStats).forEach((stats) => {
    stats.hasSchools = stats.totalEscolas > 0
    stats.fillColor = stats.hasSchools ? getScaledColor(stats.score, colorScale, maxScore) : 'transparent'
    stats.labelColor = stats.hasSchools ? stats.fillColor : neutralBairroLabelColor
  })

  return {
    bairroStats,
    maxScore,
  }
}

export function truncateLabel(value, maxLength = 30) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}
