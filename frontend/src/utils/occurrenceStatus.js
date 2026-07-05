const STATUS_KEYS = Object.freeze({
  aberta: 'aberta',
  em_analise: 'em_analise',
  em_andamento: 'em_andamento',
  aguardando_visita_tecnica: 'aguardando_visita_tecnica',
  resolvida: 'resolvida',
})

const STATUS_LABELS = Object.freeze({
  [STATUS_KEYS.aberta]: 'Aberta',
  [STATUS_KEYS.em_analise]: 'Em análise',
  [STATUS_KEYS.em_andamento]: 'Em andamento',
  [STATUS_KEYS.aguardando_visita_tecnica]: 'Aguardando visita técnica',
  [STATUS_KEYS.resolvida]: 'Resolvida',
})

const ACTIVE_STATUS_KEYS = new Set([
  STATUS_KEYS.aberta,
  STATUS_KEYS.em_analise,
  STATUS_KEYS.em_andamento,
  STATUS_KEYS.aguardando_visita_tecnica,
])

export const MAP_STATUS_OPTIONS = [
  { value: STATUS_KEYS.aberta, label: STATUS_LABELS[STATUS_KEYS.aberta] },
  { value: STATUS_KEYS.em_analise, label: STATUS_LABELS[STATUS_KEYS.em_analise] },
  { value: STATUS_KEYS.em_andamento, label: STATUS_LABELS[STATUS_KEYS.em_andamento] },
  { value: STATUS_KEYS.aguardando_visita_tecnica, label: STATUS_LABELS[STATUS_KEYS.aguardando_visita_tecnica] },
  { value: STATUS_KEYS.resolvida, label: STATUS_LABELS[STATUS_KEYS.resolvida] },
]

function normalizeStatusText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getOccurrenceStatusKey(input) {
  if (typeof input === 'string') {
    return normalizeOccurrenceStatusKey(input)
  }

  return normalizeOccurrenceStatusKey(input?.status)
}

export function normalizeOccurrenceStatusKey(value) {
  const normalized = normalizeStatusText(value)

  if (!normalized) return STATUS_KEYS.aberta
  if (normalized === 'pendente') return STATUS_KEYS.aberta
  if (normalized === STATUS_KEYS.resolvida || normalized === 'concluida' || normalized === 'fechada') {
    return STATUS_KEYS.resolvida
  }
  if (normalized === STATUS_KEYS.em_analise || normalized === 'analise') {
    return STATUS_KEYS.em_analise
  }
  if (normalized === 'em_execucao' || normalized === STATUS_KEYS.em_andamento || normalized === 'andamento') {
    return STATUS_KEYS.em_andamento
  }
  if (normalized === STATUS_KEYS.aguardando_visita_tecnica || normalized === 'aguardando_visita') {
    return STATUS_KEYS.aguardando_visita_tecnica
  }

  return STATUS_KEYS.aberta
}

export function getOccurrenceStatusLabel(value) {
  const key = normalizeOccurrenceStatusKey(value)
  return STATUS_LABELS[key] || STATUS_LABELS[STATUS_KEYS.aberta]
}

export function isResolvedOccurrence(occurrence) {
  return getOccurrenceStatusKey(occurrence) === STATUS_KEYS.resolvida
}

export function isActiveOccurrence(occurrence) {
  return ACTIVE_STATUS_KEYS.has(getOccurrenceStatusKey(occurrence))
}

export function isResolvedStatusFilter(selectedStatus) {
  return String(selectedStatus ?? '').trim() !== '' && normalizeOccurrenceStatusKey(selectedStatus) === STATUS_KEYS.resolvida
}

export function filterOccurrencesForMap(occurrences = [], selectedStatus = '') {
  if (!Array.isArray(occurrences)) {
    return []
  }

  const rawSelectedStatus = String(selectedStatus ?? '').trim()

  if (rawSelectedStatus === '' || normalizeStatusText(rawSelectedStatus) === 'todos') {
    return occurrences.filter(isActiveOccurrence)
  }

  const normalizedSelectedStatus = normalizeOccurrenceStatusKey(rawSelectedStatus)
  return occurrences.filter((occurrence) => normalizeOccurrenceStatusKey(occurrence?.status) === normalizedSelectedStatus)
}
