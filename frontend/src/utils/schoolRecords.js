const CRITICIDADE_LABELS = {
  baixa: 'Baixa',
  atencao: 'Atenção',
  critica: 'Crítica',
}

const STATUS_LABELS = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  em_execucao: 'Em execução',
  resolvida: 'Resolvida',
}

export const MAP_CRITICIDADE_OPTIONS = [
  { value: 'baixa', label: CRITICIDADE_LABELS.baixa },
  { value: 'atencao', label: CRITICIDADE_LABELS.atencao },
  { value: 'critica', label: CRITICIDADE_LABELS.critica },
]

export const MAP_STATUS_OPTIONS = [
  { value: 'aberta', label: STATUS_LABELS.aberta },
  { value: 'em_analise', label: STATUS_LABELS.em_analise },
  { value: 'em_execucao', label: STATUS_LABELS.em_execucao },
  { value: 'resolvida', label: STATUS_LABELS.resolvida },
]

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function includesNormalized(source, search) {
  const searchText = normalizeText(search)
  if (!searchText) return true
  return normalizeText(source).includes(searchText)
}

export function createSchoolId(nome) {
  return normalizeText(nome)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toCleanString(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function toMaybeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeSchoolStatus(value) {
  if (value === 'Ativa') return 'Ativo'
  if (value === 'Inativa') return 'Inativo'
  return toCleanString(value) || 'Ativo'
}

function normalizeRoomRecord(room) {
  const nome = toCleanString(room?.nome || room?.ambiente)
  const codigo = toCleanString(room?.codigo)
  if (!nome && !codigo) return null

  return {
    nome: nome || codigo || 'Ambiente',
    ambiente: nome || codigo || 'Ambiente',
    codigo,
  }
}

function normalizeRoomList(record) {
  const rawRooms = Array.isArray(record?.comodos) && record.comodos.length
    ? record.comodos
    : (Array.isArray(record?.comodosCadastrados) ? record.comodosCadastrados : [])

  return rawRooms
    .map(normalizeRoomRecord)
    .filter(Boolean)
}

function sortSchoolsByName(left, right) {
  return left.nome.localeCompare(right.nome, 'pt-BR')
}

export function normalizeSchoolRecord(record = {}) {
  const nome = toCleanString(record?.nome || record?.escolaNome) || 'Escola sem nome'
  const stableId = createSchoolId(nome)
  const preferredId = toCleanString(record?.id || record?.escolaId) || stableId
  const comodos = normalizeRoomList(record)

  return {
    ...record,
    id: preferredId,
    escolaId: preferredId,
    stableId,
    nome,
    escolaNome: nome,
    cep: toCleanString(record?.cep),
    bairro: toCleanString(record?.bairro || record?.bairroNome),
    bairroNome: toCleanString(record?.bairro || record?.bairroNome),
    endereco: toCleanString(record?.endereco),
    latitude: toMaybeNumber(record?.latitude),
    longitude: toMaybeNumber(record?.longitude),
    status: normalizeSchoolStatus(record?.status),
    descricao: toCleanString(record?.descricao),
    fotoNome: toCleanString(record?.fotoNome),
    fotoUrl: toCleanString(record?.fotoUrl),
    fotos: Array.isArray(record?.fotos) ? record.fotos : [],
    dataCadastro: toCleanString(record?.dataCadastro),
    comodos,
    comodosCadastrados: comodos.map((room) => ({
      ambiente: room.nome,
      codigo: room.codigo,
    })),
  }
}

export function normalizeSchoolList(list = []) {
  return list
    .map((item) => normalizeSchoolRecord(item))
    .sort(sortSchoolsByName)
}

export function buildSchoolLookup(schools = []) {
  const list = Array.isArray(schools) ? schools.map((item) => normalizeSchoolRecord(item)) : []
  const byId = new Map()
  const byStableId = new Map()
  const byName = new Map()

  list.forEach((school) => {
    byId.set(school.id, school)
    byStableId.set(school.stableId, school)
    byName.set(normalizeText(school.nome), school)
  })

  return { list, byId, byStableId, byName }
}

function asSchoolLookup(schoolsOrLookup) {
  if (schoolsOrLookup?.byId instanceof Map) {
    return schoolsOrLookup
  }

  return buildSchoolLookup(Array.isArray(schoolsOrLookup) ? schoolsOrLookup : [])
}

export function normalizeOccurrenceCriticidadeKey(value) {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, '_')

  if (normalized === 'critica' || normalized === 'alta') return 'critica'
  if (normalized === 'atencao' || normalized === 'media') return 'atencao'
  return 'baixa'
}

export function normalizeOccurrenceStatusKey(value) {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, '_')

  if (!normalized) return 'aberta'
  if (normalized === 'resolvida' || normalized === 'concluida' || normalized === 'fechada') return 'resolvida'
  if (normalized === 'em_analise' || normalized === 'analise') return 'em_analise'

  if ([
    'em_execucao',
    'em_andamento',
    'andamento',
    'aguardando_orcamento',
    'aguardando_visita_tecnica',
  ].includes(normalized)) {
    return 'em_execucao'
  }

  return 'aberta'
}

export function getOccurrenceCriticidadeLabel(value) {
  return CRITICIDADE_LABELS[normalizeOccurrenceCriticidadeKey(value)] || CRITICIDADE_LABELS.baixa
}

export function getOccurrenceStatusLabel(value) {
  return STATUS_LABELS[normalizeOccurrenceStatusKey(value)] || STATUS_LABELS.aberta
}

function resolveSchoolForOccurrence(record, lookup) {
  const rawSchoolId = toCleanString(record?.escolaId)
  const rawSchoolName = toCleanString(record?.escolaNome || record?.escola)

  if (rawSchoolId && lookup.byId.has(rawSchoolId)) {
    return lookup.byId.get(rawSchoolId)
  }

  if (rawSchoolId && lookup.byStableId.has(rawSchoolId)) {
    return lookup.byStableId.get(rawSchoolId)
  }

  const stableIdFromName = rawSchoolName ? createSchoolId(rawSchoolName) : ''
  if (stableIdFromName && lookup.byStableId.has(stableIdFromName)) {
    return lookup.byStableId.get(stableIdFromName)
  }

  const nameKey = normalizeText(rawSchoolName)
  if (nameKey && lookup.byName.has(nameKey)) {
    return lookup.byName.get(nameKey)
  }

  return null
}

function resolveOccurrenceRoom(record, school) {
  const rooms = Array.isArray(school?.comodos) ? school.comodos : []
  const rawCodigo = toCleanString(record?.ambienteCodigo || record?.localizacaoInterna)
  const rawNome = toCleanString(record?.ambiente)
  const roomByCode = rawCodigo
    ? rooms.find((room) => toCleanString(room.codigo) === rawCodigo)
    : null
  const roomByName = rawNome
    ? rooms.find((room) => normalizeText(room.nome) === normalizeText(rawNome))
    : null
  const room = roomByCode || roomByName || null

  return {
    ambienteCodigo: rawCodigo || room?.codigo || '',
    ambiente: rawNome || room?.nome || room?.codigo || '',
  }
}

function getOccurrenceDate(record, primaryKey, fallbackKey) {
  return toCleanString(record?.[primaryKey] || record?.[fallbackKey] || record?.data || '')
}

export function sortOccurrencesByLatestDate(left, right) {
  return new Date(right.data || right.dataAtualizacao || right.dataAbertura || right.dataEnvio || 0)
    - new Date(left.data || left.dataAtualizacao || left.dataAbertura || left.dataEnvio || 0)
}

export function normalizeOccurrenceRecord(record = {}, schools = []) {
  const lookup = asSchoolLookup(schools)
  const school = resolveSchoolForOccurrence(record, lookup)
  const rawSchoolName = toCleanString(record?.escolaNome || record?.escola)
  const stableIdFromName = rawSchoolName ? createSchoolId(rawSchoolName) : ''
  const dataAbertura = getOccurrenceDate(record, 'dataAbertura', 'dataEnvio')
  const dataAtualizacao = getOccurrenceDate(record, 'dataAtualizacao', 'ultimaAtualizacao') || dataAbertura
  const criticidade = normalizeOccurrenceCriticidadeKey(record?.criticidade)
  const status = normalizeOccurrenceStatusKey(record?.status)
  const room = resolveOccurrenceRoom(record, school)

  return {
    ...record,
    id: toCleanString(record?.id || record?.protocolo) || `oco-${school?.id || stableIdFromName || 'escola'}-${dataAbertura}`,
    escolaId: school?.id || toCleanString(record?.escolaId) || stableIdFromName,
    schoolStableId: school?.stableId || stableIdFromName || createSchoolId(rawSchoolName || school?.nome || ''),
    escolaNome: school?.nome || rawSchoolName || 'Escola sem nome',
    escola: school?.nome || rawSchoolName || 'Escola sem nome',
    bairro: school?.bairro || toCleanString(record?.bairro),
    ambienteCodigo: room.ambienteCodigo,
    ambiente: room.ambiente,
    localizacaoInterna: room.ambienteCodigo || room.ambiente,
    titulo: toCleanString(record?.titulo) || 'Ocorrencia sem titulo',
    descricao: toCleanString(record?.descricao),
    criticidade,
    criticidadeLabel: getOccurrenceCriticidadeLabel(criticidade),
    status,
    statusLabel: getOccurrenceStatusLabel(status),
    dataAbertura,
    dataAtualizacao,
    dataEnvio: dataAbertura,
    data: dataAtualizacao || dataAbertura,
    fotos: Array.isArray(record?.fotos) ? record.fotos : [],
  }
}

export function normalizeOccurrenceList(list = [], schools = []) {
  const lookup = asSchoolLookup(schools)
  return list
    .map((item) => normalizeOccurrenceRecord(item, lookup))
    .sort(sortOccurrencesByLatestDate)
}

function summarizeOccurrences(occurrences) {
  return occurrences.reduce((accumulator, occurrence) => {
    if (occurrence.criticidade === 'critica') accumulator.criticas += 1
    else if (occurrence.criticidade === 'atencao') accumulator.atencao += 1
    else accumulator.baixas += 1

    return accumulator
  }, { criticas: 0, atencao: 0, baixas: 0 })
}

export function mergeSchoolsWithOccurrences(schools = [], occurrences = []) {
  const normalizedSchools = normalizeSchoolList(schools)
  const lookup = buildSchoolLookup(normalizedSchools)
  const normalizedOccurrences = normalizeOccurrenceList(occurrences, lookup)
  const occurrencesBySchoolId = new Map(normalizedSchools.map((school) => [school.id, []]))

  normalizedOccurrences.forEach((occurrence) => {
    const school = resolveSchoolForOccurrence(occurrence, lookup)
    if (!school || !occurrencesBySchoolId.has(school.id)) return

    occurrencesBySchoolId.get(school.id).push({
      ...occurrence,
      escolaId: school.id,
      schoolStableId: school.stableId,
      escolaNome: school.nome,
      escola: school.nome,
      bairro: occurrence.bairro || school.bairro,
    })
  })

  return normalizedSchools
    .map((school) => {
      const schoolOccurrences = (occurrencesBySchoolId.get(school.id) || []).sort(sortOccurrencesByLatestDate)
      const summary = summarizeOccurrences(schoolOccurrences)
      const intensidade = summary.baixas + (summary.atencao * 2) + (summary.criticas * 3)

      return {
        ...school,
        escolaId: school.id,
        escolaNome: school.nome,
        ocorrencias: schoolOccurrences,
        totalOcorrencias: schoolOccurrences.length,
        criticas: summary.criticas,
        atencao: summary.atencao,
        baixas: summary.baixas,
        intensidade,
        score: intensidade,
      }
    })
    .sort(sortSchoolsByName)
}

export function matchesSchoolSearch(school, search) {
  return [
    school?.escolaNome,
    school?.nome,
    school?.bairro,
    school?.endereco,
    school?.cep,
  ].some((value) => includesNormalized(value, search))
}

export function findSchoolByReference(schools = [], reference = '') {
  const lookup = buildSchoolLookup(schools)
  const rawReference = toCleanString(reference)

  if (!rawReference) return null
  if (lookup.byId.has(rawReference)) return lookup.byId.get(rawReference)
  if (lookup.byStableId.has(rawReference)) return lookup.byStableId.get(rawReference)

  const normalizedReference = normalizeText(rawReference)
  if (lookup.byName.has(normalizedReference)) return lookup.byName.get(normalizedReference)

  return null
}
