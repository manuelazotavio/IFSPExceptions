const LABELS = {
  Indaia: 'Indaiá',
  'Jardim California': 'Jardim Califórnia',
  Massaguacu: 'Massaguaçu',
  'Pereque Mirim': 'Perequê-Mirim',
  'Martim de Sa': 'Martim de Sá',
  Travessao: 'Travessão',
  Eletrica: 'Elétrica',
  Hidraulica: 'Hidráulica',
  Seguranca: 'Segurança',
  Mobiliario: 'Mobiliário',
  Critica: 'Crítica',
  Media: 'Média',
  'Aguardando aprovacao': 'Aguardando aprovação',
  'Em analise': 'Em análise',
  'Aguardando visita tecnica': 'Aguardando visita técnica',
  Laboratorio: 'Laboratório',
  Patio: 'Pátio',
  'Patio coberto': 'Pátio coberto',
  'Area externa': 'Área externa',
  Refeitorio: 'Refeitório',
  'Sala multifuncional': 'Sala multifuncional',
  Localizacao: 'Localização',
  Endereco: 'Endereço',
  Ocorrencias: 'Ocorrências',
  Criticas: 'Críticas',
  Titulo: 'Título',
  Comodo: 'Cômodo',
  Comodos: 'Cômodos',
}

export function formatDisplayLabel(value) {
  return LABELS[value] || value
}
