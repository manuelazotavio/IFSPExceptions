export const bairros = ['Indaia', 'Jardim California', 'Tinga', 'Porto Novo', 'Massaguacu', 'Pereque Mirim', 'Martim de Sa', 'Travessao']

export const escolas = [
  { id: 'esc-001', nome: 'EMEF Dr. Carlos de Almeida Rodrigues', bairro: 'Indaia', endereco: 'Av. Pernambuco, 1101', status: 'Ativa', dataCadastro: '2026-01-12', x: 50, y: 36, latitude: -23.633, longitude: -45.417 },
  { id: 'esc-002', nome: 'CEI/EMEI Profa. Ana Maria Aulicino', bairro: 'Jardim California', endereco: 'Rua Manoel Amaral, 51', status: 'Ativa', dataCadastro: '2026-01-20', x: 42, y: 43, latitude: -23.642, longitude: -45.429 },
  { id: 'esc-003', nome: 'EMEI/EMEF Prof. Lucio Jacinto dos Santos', bairro: 'Tinga', endereco: 'Rua Denilza Sebastiana dos Santos, 75', status: 'Ativa', dataCadastro: '2026-02-03', x: 62, y: 50, latitude: -23.621, longitude: -45.466 },
  { id: 'esc-004', nome: 'EMEF Profa. Maria Aparecida Ujio', bairro: 'Porto Novo', endereco: 'Av. Ezequiel da Silva Barreto, 285', status: 'Ativa', dataCadastro: '2026-02-11', x: 73, y: 66, latitude: -23.704, longitude: -45.428 },
  { id: 'esc-005', nome: 'EMEF Profa. Antonia Antunes Arouca', bairro: 'Massaguacu', endereco: 'Rua Italia Baffi Magni, 581', status: 'Ativa', dataCadastro: '2026-02-14', x: 28, y: 24, latitude: -23.567, longitude: -45.327 },
  { id: 'esc-006', nome: 'EMEI/EMEF Prof. Yasutada Nasu', bairro: 'Pereque Mirim', endereco: 'Av. Pedro Goncalves, 685', status: 'Ativa', dataCadastro: '2026-03-01', x: 78, y: 78, latitude: -23.724, longitude: -45.394 },
  { id: 'esc-007', nome: 'EMEF Prof. Luiz Ribeiro Muniz', bairro: 'Martim de Sa', endereco: 'Rua Analandia, 355', status: 'Ativa', dataCadastro: '2026-03-12', x: 39, y: 18, latitude: -23.603, longitude: -45.389 },
  { id: 'esc-008', nome: 'EMEI/EMEF Profa. Alaor Xavier Junqueira', bairro: 'Travessao', endereco: 'Rua Jose Ferreira dos Santos, 381', status: 'Ativa', dataCadastro: '2026-04-02', x: 67, y: 34, latitude: -23.672, longitude: -45.468 },
]

const base = [
  ['occ-001', 'esc-001', 'Infiltracao na biblioteca', 'Hidraulica', 'Alta', 'Aberta', 'Biblioteca', '2026-05-02', true],
  ['occ-002', 'esc-001', 'Quadro eletrico com faiscas', 'Eletrica', 'Critica', 'Em andamento', 'Bloco A', '2026-04-23', true],
  ['occ-003', 'esc-002', 'Portao lateral danificado', 'Seguranca', 'Media', 'Em analise', 'Entrada lateral', '2026-05-04', true],
  ['occ-004', 'esc-003', 'Telhado com risco de queda', 'Estrutural', 'Critica', 'Aberta', 'Patio coberto', '2026-04-18', true],
  ['occ-005', 'esc-004', 'Banheiro sem descarga', 'Hidraulica', 'Media', 'Aguardando visita tecnica', 'Banheiro infantil', '2026-05-08', true],
  ['occ-006', 'esc-005', 'Luminarias queimadas', 'Eletrica', 'Baixa', 'Resolvida', 'Corredor principal', '2026-04-29', true],
  ['occ-007', 'esc-006', 'Rampa sem corrimao adequado', 'Acessibilidade', 'Alta', 'Aguardando orcamento', 'Entrada', '2026-04-14', true],
  ['occ-008', 'esc-007', 'Computadores sem rede', 'Tecnologia', 'Media', 'Em andamento', 'Laboratorio', '2026-05-01', true],
  ['occ-009', 'esc-008', 'Muro com rachadura', 'Estrutural', 'Alta', 'Aberta', 'Area externa', '2026-04-11', true],
  ['occ-010', 'esc-003', 'Bebedouro quebrado', 'Equipamento', 'Baixa', 'Resolvida', 'Refeitorio', '2026-05-06', true],
  ['occ-011', 'esc-004', 'Falta de limpeza no patio', 'Limpeza', 'Baixa', 'Em analise', 'Patio', '2026-05-09', true],
  ['occ-012', 'esc-005', 'Carteiras danificadas', 'Mobiliario', 'Media', 'Aberta', 'Sala 3', '2026-04-30', true],
  ['occ-013', 'esc-006', 'Curto em tomada', 'Eletrica', 'Critica', 'Em andamento', 'Sala 2', '2026-04-20', true],
  ['occ-014', 'esc-007', 'Vidro trincado', 'Seguranca', 'Alta', 'Aberta', 'Secretaria', '2026-04-26', true],
  ['occ-015', 'esc-002', 'Vazamento em pia', 'Hidraulica', 'Media', 'Aguardando visita tecnica', 'Cozinha', '2026-05-03', true],
  ['occ-016', 'esc-001', 'Ar condicionado parado', 'Equipamento', 'Baixa', 'Aberta', 'Sala dos professores', '2026-05-07', true],
  ['occ-017', 'esc-008', 'Iluminacao externa insuficiente', 'Seguranca', 'Alta', 'Aguardando orcamento', 'Area externa', '2026-04-17', true],
  ['occ-018', 'esc-005', 'Piso solto', 'Estrutural', 'Media', 'Em analise', 'Sala 5', '2026-04-28', true],
  ['occ-019', 'esc-006', 'Porta emperrada', 'Outros', 'Baixa', 'Resolvida', 'Almoxarifado', '2026-05-05', true],
  ['occ-020', 'esc-004', 'Falta de tomada acessivel', 'Acessibilidade', 'Media', 'Aberta', 'Sala multifuncional', '2026-05-10', true],
  ['occ-021', 'esc-007', 'Caixa d agua sem tampa', 'Hidraulica', 'Critica', 'Aberta', 'Cobertura', '2026-04-13', true],
  ['occ-022', 'esc-003', 'Projetor queimado', 'Tecnologia', 'Baixa', 'Em andamento', 'Sala 1', '2026-05-11', true],
  ['occ-023', 'esc-002', 'Extintor vencido', 'Seguranca', 'Critica', 'Aberta', 'Corredor', '2026-04-10', true],
  ['occ-024', 'esc-008', 'Mesa quebrada', 'Mobiliario', 'Media', 'Aguardando orcamento', 'Diretoria', '2026-05-12', true],
  ['occ-025', 'esc-005', 'Ocorrencia publica pendente', 'Outros', 'Alta', 'Aberta', 'Portaria', '2026-05-13', false],
]

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const ocorrencias = base.map(([id, escolaId, titulo, tipo, criticidade, status, localizacaoInterna, dataEnvio, aprovadaPelaEscola], index) => {
  const escola = escolas.find((item) => item.id === escolaId)
  const dataResolucao = status === 'Resolvida' ? addDays(dataEnvio, 8) : ''

  const interacoes = [
    { origem: 'sistema', autor: 'Sistema', data: dataEnvio, mensagem: 'Ocorrencia aberta pela escola.' },
    { origem: 'seduc', autor: 'Ernesto Cavalcanti', data: addDays(dataEnvio, 1), mensagem: 'Protocolo homologado, estamos comecando as tratativas.' },
  ]
  if (status !== 'Aberta') {
    interacoes.push({ origem: 'escola', autor: 'Direcao da escola', data: addDays(dataEnvio, 2), mensagem: 'Os tecnicos vieram aqui hoje para avaliar o problema.' })
    interacoes.push({ origem: 'sistema', autor: 'Sistema', data: addDays(dataEnvio, 3), mensagem: `Status atualizado para "${status}".` })
  }
  if (status === 'Resolvida') {
    interacoes.push({ origem: 'seduc', autor: 'Ernesto Cavalcanti', data: dataResolucao, mensagem: 'Servico concluido. Ocorrencia finalizada.' })
  }

  return {
    id,
    protocolo: `2026-${String(index + 1).padStart(4, '0')}`,
    escolaId,
    escola: escola.nome,
    bairro: escola.bairro,
    endereco: escola.endereco,
    titulo,
    descricao: `${titulo}. Registro aprovado pela unidade escolar e encaminhado para acompanhamento da SEDUC.`,
    tipo,
    criticidade,
    status,
    localizacaoInterna,
    dataEnvio,
    dataAprovacao: addDays(dataEnvio, 4),
    ultimaAtualizacao: `2026-05-${String(15 + (index % 8)).padStart(2, '0')}`,
    dataResolucao,
    aprovadaPelaEscola,
    criadoPorEmail: index % 4 === 0 ? 'externo@escola.gov.br' : `externo.${escolaId}@escola.gov.br`,
    chatPendente: index % 3 === 0,
    fotos: ['Foto da area', 'Detalhe do problema', 'Contexto da sala'],
    interacoes,
  }
})

export const ocorrenciasAprovadas = ocorrencias.filter((item) => item.aprovadaPelaEscola)
const CATEGORIAS_STORAGE_KEY = 'ifsp-categorias-globais'
const CATEGORIAS_DESCRICOES_STORAGE_KEY = 'ifsp-categorias-descricoes'
const DESCRICAO_CATEGORIA_PADRAO = 'Categoria global disponivel para ocorrencias aprovadas no fluxo da SEDUC.'

function loadCategorias() {
  const baseCategorias = ['Eletrica', 'Hidraulica', 'Estrutural', 'Seguranca', 'Acessibilidade', 'Equipamento', 'Mobiliario', 'Limpeza', 'Tecnologia', 'Outros']
  if (typeof window === 'undefined') return baseCategorias

  try {
    const salvas = JSON.parse(window.localStorage.getItem(CATEGORIAS_STORAGE_KEY) || '[]')
    if (!Array.isArray(salvas)) return baseCategorias
    return [...new Set([...baseCategorias, ...salvas.filter(Boolean)])]
  } catch {
    return baseCategorias
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
export const statusValues = ['Aberta', 'Em analise', 'Em andamento', 'Aguardando orcamento', 'Aguardando visita tecnica', 'Resolvida']
export const criticidadeValues = ['Baixa', 'Media', 'Alta', 'Critica']
export const usuarios = [
  { nome: 'Ana Paula Ribeiro', email: 'ana.ribeiro@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Hoje, 09:18' },
  { nome: 'Carlos Henrique', email: 'carlos.henrique@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Ontem, 17:42' },
  { nome: 'Marina Souza', email: 'marina.souza@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-001', status: 'Ativo', ultimoAcesso: '02/07/2026' },
  { nome: 'Rafael Lima', email: 'rafael.lima@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-002', status: 'Inativo', ultimoAcesso: '18/06/2026' },
  { nome: 'Julia Ferreira', email: 'julia.ferreira@escola.gov.br', role: 'EXTERNO', escolaId: null, status: 'Ativo', ultimoAcesso: '01/07/2026' },
]
