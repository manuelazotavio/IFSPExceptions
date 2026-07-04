import { escolas, ocorrenciasAprovadas } from '../data/mockData.js'

const peso = { Baixa: 1, Media: 2, Alta: 3, Critica: 4 }

export function sortOcorrencias(lista) {
  return [...lista].sort((a, b) => {
    const byCriticidade = peso[b.criticidade] - peso[a.criticidade]
    if (byCriticidade !== 0) return byCriticidade
    return new Date(a.dataEnvio) - new Date(b.dataEnvio)
  })
}

export function diasEmAberto(dataEnvio) {
  const dias = Math.floor((new Date() - new Date(`${dataEnvio}T00:00:00`)) / (1000 * 60 * 60 * 24))
  if (dias <= 0) return 'Hoje'
  return dias === 1 ? '1 dia' : `${dias} dias`
}

export function groupCount(items, key) {
  return items.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), {})
}

export function getSchoolStats(escolaId) {
  const lista = ocorrenciasAprovadas.filter((item) => item.escolaId === escolaId)
  const abertas = lista.filter((item) => item.status !== 'Resolvida')
  return {
    total: lista.length,
    abertas: abertas.length,
    criticas: abertas.filter((item) => item.criticidade === 'Critica').length,
    altas: abertas.filter((item) => item.criticidade === 'Alta').length,
    medias: abertas.filter((item) => item.criticidade === 'Media').length,
  }
}

export function getSchoolSeverity(escolaId) {
  const stats = getSchoolStats(escolaId)
  if (stats.criticas > 0) return 'red'
  if (stats.altas > 0 || stats.medias >= 3) return 'yellow'
  return 'green'
}

export function dashboardMetrics(lista = ocorrenciasAprovadas, totalEscolas = escolas.length) {
  return {
    escolas: totalEscolas,
    aprovadas: lista.length,
    abertas: lista.filter((item) => item.status === 'Aberta').length,
    andamento: lista.filter((item) => item.status === 'Em andamento').length,
    resolvidas: lista.filter((item) => item.status === 'Resolvida').length,
    criticas: lista.filter((item) => item.criticidade === 'Critica' && item.status !== 'Resolvida').length,
  }
}
