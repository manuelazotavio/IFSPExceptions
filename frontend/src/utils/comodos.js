const salasPorEscola = {
  'esc-001': ['Sala 1', 'Sala 2', 'Sala 3', 'Biblioteca', 'Laboratorio', 'Secretaria', 'Refeitorio'],
  'esc-002': ['Maternal A', 'Maternal B', 'Pre I', 'Pre II', 'Brinquedoteca', 'Cozinha'],
  'esc-003': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Informatica', 'Quadra'],
  'esc-004': ['Bercario', 'Maternal', 'Pre I', 'Pre II', 'Sala multiuso', 'Patio'],
  'esc-005': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Biblioteca', 'Refeitorio'],
  'esc-006': ['Maternal A', 'Maternal B', 'Pre I', 'Pre II', 'Secretaria', 'Patio coberto'],
  'esc-007': ['Sala 1', 'Sala 2', 'Sala 3', 'Laboratorio', 'Secretaria', 'Quadra'],
  'esc-008': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Diretoria', 'Area externa'],
}

export function getSchoolRooms(escola) {
  if (!escola) return []
  if (Array.isArray(escola.comodos) && escola.comodos.length) return escola.comodos
  return []
}

export function getFallbackSchoolRooms(escola) {
  if (!escola) return []
  return salasPorEscola[escola.id] || []
}

export function getComodoNome(comodo) {
  if (!comodo) return ''
  if (typeof comodo === 'string') return comodo
  return comodo.nome || ''
}

export function getComodoCodigo(comodo) {
  if (!comodo || typeof comodo === 'string') return ''
  return comodo.codigo || ''
}

export function getComodoChave(comodo) {
  if (!comodo || typeof comodo === 'string') return String(comodo || '')
  return comodo.codigo || comodo.nome || ''
}

export function getComodoRotulo(comodo) {
  if (!comodo || typeof comodo === 'string') return String(comodo || '')
  return comodo.codigo ? `${comodo.nome} - ${comodo.codigo}` : comodo.nome
}
