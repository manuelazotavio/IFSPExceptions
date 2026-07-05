function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const bairroSchoolSeeds = [
  {
    bairro: 'Bairro Serramar',
    points: [
      { latitude: -23.649487, longitude: -45.486615 },
      { latitude: -23.657644, longitude: -45.492308 },
    ],
  },
  {
    bairro: 'Barranco Alto',
    points: [
      { latitude: -23.684227, longitude: -45.445965 },
      { latitude: -23.687352, longitude: -45.449402 },
    ],
  },
  {
    bairro: 'Benfica',
    points: [
      { latitude: -23.610768, longitude: -45.41667 },
      { latitude: -23.616376, longitude: -45.42011 },
    ],
  },
  {
    bairro: 'Camaroeiro',
    points: [
      { latitude: -23.629915, longitude: -45.393737 },
      { latitude: -23.628265, longitude: -45.396593 },
    ],
  },
  {
    bairro: 'Canta Galo',
    points: [
      { latitude: -23.608936, longitude: -45.410039 },
      { latitude: -23.608604, longitude: -45.401489 },
    ],
  },
  {
    bairro: 'Caputera',
    points: [
      { latitude: -23.619473, longitude: -45.422779 },
      { latitude: -23.617733, longitude: -45.426766 },
    ],
  },
  {
    bairro: 'Centro',
    points: [
      { latitude: -23.620591, longitude: -45.415577 },
      { latitude: -23.627229, longitude: -45.419352 },
    ],
  },
  {
    bairro: 'Cidade Jardim',
    points: [
      { latitude: -23.611556, longitude: -45.393033 },
      { latitude: -23.609974, longitude: -45.390806 },
    ],
  },
  {
    bairro: 'Getuba',
    points: [
      { latitude: -23.596881, longitude: -45.363853 },
      { latitude: -23.600812, longitude: -45.358934 },
    ],
  },
  {
    bairro: 'Golfinhos',
    points: [
      { latitude: -23.666159, longitude: -45.444538 },
      { latitude: -23.670097, longitude: -45.464461 },
    ],
  },
  {
    bairro: 'Indaia',
    points: [
      { latitude: -23.631478, longitude: -45.419728 },
      { latitude: -23.634071, longitude: -45.425101 },
    ],
  },
  {
    bairro: 'Jaraguazinho',
    points: [
      { latitude: -23.607243, longitude: -45.434484 },
      { latitude: -23.623581, longitude: -45.434734 },
    ],
  },
  {
    bairro: 'Jardim Aruan',
    points: [
      { latitude: -23.642074, longitude: -45.426748 },
      { latitude: -23.643953, longitude: -45.424638 },
    ],
  },
  {
    bairro: 'Jardim Atlantico',
    points: [
      { latitude: -23.653929, longitude: -45.428106 },
      { latitude: -23.64879, longitude: -45.429084 },
    ],
  },
  {
    bairro: 'Jardim California',
    points: [
      { latitude: -23.619167, longitude: -45.41832 },
      { latitude: -23.617826, longitude: -45.416388 },
    ],
  },
  {
    bairro: 'Jardim do Sol',
    points: [
      { latitude: -23.592301, longitude: -45.342604 },
      { latitude: -23.589923, longitude: -45.345153 },
    ],
  },
  {
    bairro: 'Martim de Sa',
    points: [
      { latitude: -23.632555, longitude: -45.38731 },
      { latitude: -23.621571, longitude: -45.385203 },
    ],
  },
  {
    bairro: 'Massaguacu',
    points: [
      { latitude: -23.585698, longitude: -45.339312 },
      { latitude: -23.595496, longitude: -45.343728 },
    ],
  },
  {
    bairro: 'Morro do Algodao',
    points: [
      { latitude: -23.681814, longitude: -45.447555 },
      { latitude: -23.677173, longitude: -45.451081 },
    ],
  },
  {
    bairro: 'Olaria',
    points: [
      { latitude: -23.607566, longitude: -45.376385 },
      { latitude: -23.604999, longitude: -45.374383 },
    ],
  },
  {
    bairro: 'Pegoreli',
    points: [
      { latitude: -23.71595, longitude: -45.448465 },
      { latitude: -23.704783, longitude: -45.452285 },
    ],
  },
  {
    bairro: 'Pereque Mirim',
    points: [
      { latitude: -23.707754, longitude: -45.430901 },
      { latitude: -23.72027, longitude: -45.438537 },
    ],
  },
  {
    bairro: 'Porto Novo',
    points: [
      { latitude: -23.688232, longitude: -45.431081 },
      { latitude: -23.684852, longitude: -45.440884 },
    ],
  },
  {
    bairro: 'Praia das Palmeiras',
    points: [
      { latitude: -23.671736, longitude: -45.430769 },
      { latitude: -23.673944, longitude: -45.440006 },
    ],
  },
  {
    bairro: 'Rio do Ouro',
    points: [
      { latitude: -23.599526, longitude: -45.419849 },
      { latitude: -23.600078, longitude: -45.422073 },
    ],
  },
  {
    bairro: 'Sumare',
    points: [
      { latitude: -23.621901, longitude: -45.395098 },
      { latitude: -23.619077, longitude: -45.403545 },
    ],
  },
  {
    bairro: 'Tinga',
    points: [
      { latitude: -23.628079, longitude: -45.435193 },
      { latitude: -23.625125, longitude: -45.438754 },
    ],
  },
  {
    bairro: 'Travessao',
    points: [
      { latitude: -23.70111, longitude: -45.445239 },
      { latitude: -23.692572, longitude: -45.445316 },
    ],
  },
  {
    bairro: 'Poiares',
    points: [
      { latitude: -23.642101, longitude: -45.436695 },
      { latitude: -23.63538, longitude: -45.436276 },
    ],
  },
  {
    bairro: 'Ponte Seca',
    points: [
      { latitude: -23.619759, longitude: -45.426509 },
      { latitude: -23.61756, longitude: -45.429669 },
    ],
  },
]

const schoolTypeCycle = ['EMEF', 'CEI', 'EMEI', 'EMEI/EMEF', 'CMEI', 'EMEFI']
const descriptorCycle = ['Costa Norte', 'Serra do Mar', 'Vila Caicara', 'Parque das Flores', 'Mirante do Sol', 'Jardim das Ondas', 'Bosque Azul', 'Recanto do Mar', 'Vale Verde', 'Pontal Sul']
const streetTypeCycle = ['Rua', 'Avenida', 'Travessa', 'Alameda', 'Estrada Municipal']
const streetNameCycle = ['das Palmeiras', 'do Contorno', 'dos Ipes', 'da Restinga', 'do Farol', 'dos Coqueiros', 'do Mirante', 'da Lagoa', 'da Serra', 'do Pontal']
const issueTemplates = [
  { tipo: 'Hidraulica', titulo: 'Infiltracao identificada na', locais: ['Biblioteca', 'Cozinha', 'Refeitorio', 'Banheiro infantil', 'Sala 2'] },
  { tipo: 'Eletrica', titulo: 'Oscilacao eletrica registrada em', locais: ['Laboratorio', 'Sala 4', 'Secretaria', 'Sala dos professores', 'Bloco A'] },
  { tipo: 'Estrutural', titulo: 'Fissura observada em', locais: ['Patio coberto', 'Corredor', 'Sala multifuncional', 'Bloco B', 'Area externa'] },
  { tipo: 'Seguranca', titulo: 'Ponto de risco encontrado em', locais: ['Entrada', 'Entrada lateral', 'Portaria', 'Diretoria', 'Cobertura'] },
  { tipo: 'Acessibilidade', titulo: 'Ajuste de acessibilidade pendente em', locais: ['Entrada', 'Corredor', 'Sala 1', 'Patio', 'Secretaria'] },
  { tipo: 'Equipamento', titulo: 'Equipamento indisponivel em', locais: ['Laboratorio', 'Biblioteca', 'Sala 3', 'Sala 5', 'Refeitorio'] },
  { tipo: 'Mobiliario', titulo: 'Mobiliario danificado em', locais: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Diretoria'] },
  { tipo: 'Limpeza', titulo: 'Demanda de limpeza reforcada em', locais: ['Patio', 'Corredor', 'Refeitorio', 'Area externa', 'Banheiro infantil'] },
  { tipo: 'Tecnologia', titulo: 'Falha de conectividade em', locais: ['Laboratorio', 'Sala 4', 'Sala 5', 'Secretaria', 'Bloco B'] },
  { tipo: 'Outros', titulo: 'Ajuste operacional solicitado para', locais: ['Portaria', 'Almoxarifado', 'Cobertura', 'Sala dos professores', 'Area externa'] },
]
const categoriasBase = ['Eletrica', 'Hidraulica', 'Estrutural', 'Seguranca', 'Acessibilidade', 'Equipamento', 'Mobiliario', 'Limpeza', 'Tecnologia', 'Outros']
const nomesSolicitantes = ['Fernanda Souza', 'Ricardo Almeida', 'Juliana Costa', 'Marcos Pereira', 'Patricia Lima', 'Anderson Santos']

export const statusValues = ['Aberta', 'Em analise', 'Em andamento', 'Aguardando orcamento', 'Aguardando visita tecnica', 'Resolvida']
export const criticidadeValues = ['Baixa', 'Media', 'Alta', 'Critica']
export const locaisInternos = ['Biblioteca', 'Laboratorio', 'Patio', 'Patio coberto', 'Area externa', 'Entrada', 'Entrada lateral', 'Corredor', 'Refeitorio', 'Cozinha', 'Secretaria', 'Diretoria', 'Portaria', 'Almoxarifado', 'Cobertura', 'Banheiro infantil', 'Sala dos professores', 'Sala multifuncional', 'Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5', 'Bloco A', 'Bloco B']

export const escolas = bairroSchoolSeeds.flatMap((bairroSeed, bairroIndex) => (
  bairroSeed.points.map((point, pointIndex) => {
    const schoolIndex = bairroIndex * 2 + pointIndex

    return {
      id: `esc-${String(schoolIndex + 1).padStart(3, '0')}`,
      nome: `${schoolTypeCycle[schoolIndex % schoolTypeCycle.length]} ${bairroSeed.bairro} - ${descriptorCycle[schoolIndex % descriptorCycle.length]}`,
      bairro: bairroSeed.bairro,
      endereco: `${streetTypeCycle[schoolIndex % streetTypeCycle.length]} ${streetNameCycle[(schoolIndex + pointIndex) % streetNameCycle.length]}, ${120 + schoolIndex * 7}`,
      status: 'Ativa',
      dataCadastro: addDays('2025-08-04', schoolIndex * 4),
      x: 18 + ((schoolIndex * 11) % 64),
      y: 18 + ((schoolIndex * 7) % 58),
      latitude: point.latitude,
      longitude: point.longitude,
    }
  })
))

export const bairros = [...new Set(escolas.map((escola) => escola.bairro))]
  .sort((left, right) => left.localeCompare(right, 'pt-BR'))

export const ocorrencias = escolas.flatMap((escola, schoolIndex) => {
  const totalOcorrencias = 3 + (schoolIndex % 5)

  return Array.from({ length: totalOcorrencias }, (_, occurrenceIndex) => {
    const template = issueTemplates[(schoolIndex * 3 + occurrenceIndex) % issueTemplates.length]
    const status = statusValues[(schoolIndex + occurrenceIndex) % statusValues.length]
    const criticidade = criticidadeValues[(schoolIndex * 2 + occurrenceIndex) % criticidadeValues.length]
    const localizacaoInterna = template.locais[(schoolIndex + occurrenceIndex) % template.locais.length]
    const dataEnvio = addDays('2026-03-03', schoolIndex * 2 + occurrenceIndex * 5)
    const dataResolucao = status === 'Resolvida' ? addDays(dataEnvio, 9) : ''
    const ultimaAtualizacao = status === 'Resolvida'
      ? dataResolucao
      : addDays(dataEnvio, 2 + ((schoolIndex + occurrenceIndex) % 4))

    const interacoes = [
      { origem: 'sistema', autor: 'Sistema', data: dataEnvio, hora: '08:12', status: 'Aberta', mensagem: 'Ocorrencia aberta pela escola.' },
      { origem: 'seduc', autor: 'Ernesto Cavalcanti', data: addDays(dataEnvio, 1), hora: '09:45', status: 'Em analise', mensagem: 'Protocolo homologado, estamos comecando as tratativas.' },
    ]

    if (status !== 'Aberta') {
      interacoes.push({ origem: 'escola', autor: 'Direcao da escola', data: addDays(dataEnvio, 2), hora: '14:20', status: 'Em andamento', mensagem: 'A equipe local atualizou o contexto e anexou novos registros.' })
      interacoes.push({ origem: 'sistema', autor: 'Sistema', data: addDays(dataEnvio, 3), hora: '10:05', status, mensagem: `Status atualizado para "${status}".` })
    }

    if (status === 'Resolvida') {
      interacoes.push({ origem: 'seduc', autor: 'Ernesto Cavalcanti', data: dataResolucao, hora: '16:30', status: 'Resolvida', mensagem: 'Servico concluido. Ocorrencia finalizada.' })
    }

    return {
      id: `occ-${String(schoolIndex * 10 + occurrenceIndex + 1).padStart(4, '0')}`,
      protocolo: `2026-${String(schoolIndex * 10 + occurrenceIndex + 1).padStart(4, '0')}`,
      escolaId: escola.id,
      escola: escola.nome,
      bairro: escola.bairro,
      endereco: escola.endereco,
      titulo: `${template.titulo} ${localizacaoInterna.toLowerCase()}`,
      descricao: `${template.titulo} ${localizacaoInterna.toLowerCase()}. Registro acompanhado pela equipe da ${escola.nome}, no bairro ${escola.bairro}.`,
      tipo: template.tipo,
      criticidade,
      status,
      localizacaoInterna,
      dataEnvio,
      dataAprovacao: addDays(dataEnvio, 4),
      ultimaAtualizacao,
      dataResolucao,
      aprovadaPelaEscola: true,
      criadoPorEmail: `externo.${String((schoolIndex % 12) + 1).padStart(2, '0')}@escola.gov.br`,
      criadoPorNome: nomesSolicitantes[(schoolIndex + occurrenceIndex) % nomesSolicitantes.length],
      chatPendente: status !== 'Resolvida' && ((schoolIndex + occurrenceIndex) % 3 === 0),
      fotos: ['Foto da area', 'Detalhe do problema', 'Registro complementar'],
      interacoes,
    }
  })
})

export const ocorrenciasAprovadas = ocorrencias.filter((item) => item.aprovadaPelaEscola)
const CATEGORIAS_STORAGE_KEY = 'ifsp-categorias-globais'
const CATEGORIAS_DESCRICOES_STORAGE_KEY = 'ifsp-categorias-descricoes'
const DESCRICAO_CATEGORIA_PADRAO = 'Categoria global disponivel para ocorrencias aprovadas no fluxo da SEDUC.'

function loadCategorias() {
  if (typeof window === 'undefined') return categoriasBase

  try {
    const salvas = JSON.parse(window.localStorage.getItem(CATEGORIAS_STORAGE_KEY) || '[]')
    if (!Array.isArray(salvas)) return categoriasBase
    return [...new Set([...categoriasBase, ...salvas.filter(Boolean)])]
  } catch {
    return categoriasBase
  }
}

export const categorias = loadCategorias()
export const categoriasDescricoes = loadCategoriasDescricoes()

function loadCategoriasDescricoes() {
  if (typeof window === 'undefined') return {}

  try {
    const salvas = JSON.parse(window.localStorage.getItem(CATEGORIAS_DESCRICOES_STORAGE_KEY) || '{}')
    if (!salvas || Array.isArray(salvas) || typeof salvas !== 'object') return {}
    return salvas
  } catch {
    return {}
  }
}

export function salvarCategoriasGlobais(lista, descricoes = categoriasDescricoes) {
  categorias.splice(0, categorias.length, ...lista)
  Object.keys(categoriasDescricoes).forEach((key) => delete categoriasDescricoes[key])
  Object.entries(descricoes).forEach(([key, value]) => {
    if (value) categoriasDescricoes[key] = value
  })

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CATEGORIAS_STORAGE_KEY, JSON.stringify(lista))
    window.localStorage.setItem(CATEGORIAS_DESCRICOES_STORAGE_KEY, JSON.stringify(categoriasDescricoes))
  }
}

export function getCategoriaDescricao(categoria) {
  return categoriasDescricoes[categoria] || DESCRICAO_CATEGORIA_PADRAO
}

const nomesUsuariosExternos = [
  'Fernanda Souza',
  'Ricardo Almeida',
  'Juliana Costa',
  'Marcos Pereira',
  'Patricia Lima',
  'Anderson Santos',
  'Camila Rocha',
  'Diego Martins',
  'Luana Alves',
  'Renato Prado',
  'Bianca Oliveira',
  'Thiago Campos',
]

const usuariosExternos = nomesUsuariosExternos.map((nome, index) => ({
  email: `externo.${String(index + 1).padStart(2, '0')}@escola.gov.br`,
  nome,
  escolaId: escolas[index % escolas.length]?.id || null,
}))

export const usuarios = [
  { nome: 'Ana Paula Ribeiro', email: 'ana.ribeiro@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Hoje, 09:18' },
  { nome: 'Carlos Henrique', email: 'carlos.henrique@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Ontem, 17:42' },
  { nome: 'Marina Souza', email: 'marina.souza@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-001', status: 'Ativo', ultimoAcesso: '02/07/2026' },
  { nome: 'Rafael Lima', email: 'rafael.lima@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-002', status: 'Inativo', ultimoAcesso: '18/06/2026' },
  ...usuariosExternos.map((usuario) => ({ ...usuario, role: 'EXTERNO', status: 'Ativo', ultimoAcesso: '01/07/2026' })),
]
