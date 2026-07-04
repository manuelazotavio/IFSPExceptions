export const bairros = ['Centro', 'Martim de Sa', 'Massaguacu', 'Porto Novo', 'Travessao', 'Tinga', 'Pereque-Mirim']

export const escolas = [
  { id: 'esc-001', nome: 'EMEF Professora Maria Aparecida', bairro: 'Centro', endereco: 'Rua das Palmeiras, 245', status: 'Ativa', dataCadastro: '2026-01-12', x: 50, y: 36, latitude: -23.633, longitude: -45.417 },
  { id: 'esc-002', nome: 'EMEI Jardim das Palmeiras', bairro: 'Centro', endereco: 'Av. Brasil, 1120', status: 'Ativa', dataCadastro: '2026-01-20', x: 42, y: 43, latitude: -23.642, longitude: -45.429 },
  { id: 'esc-003', nome: 'EMEF Bairro do Tinga', bairro: 'Tinga', endereco: 'Rua Sete de Setembro, 88', status: 'Ativa', dataCadastro: '2026-02-03', x: 62, y: 50, latitude: -23.621, longitude: -45.466 },
  { id: 'esc-004', nome: 'CEI Porto Novo', bairro: 'Porto Novo', endereco: 'Av. Jose Herculano, 900', status: 'Ativa', dataCadastro: '2026-02-11', x: 73, y: 66, latitude: -23.704, longitude: -45.428 },
  { id: 'esc-005', nome: 'EMEF Massaguacu', bairro: 'Massaguacu', endereco: 'Rua Italia Baffi Magni, 74', status: 'Ativa', dataCadastro: '2026-02-14', x: 28, y: 24, latitude: -23.567, longitude: -45.327 },
  { id: 'esc-006', nome: 'EMEI Pereque-Mirim', bairro: 'Pereque-Mirim', endereco: 'Rua Benedito Bento, 338', status: 'Ativa', dataCadastro: '2026-03-01', x: 78, y: 78, latitude: -23.724, longitude: -45.394 },
  { id: 'esc-007', nome: 'EMEF Martim de Sa', bairro: 'Martim de Sa', endereco: 'Rua das Gaivotas, 55', status: 'Ativa', dataCadastro: '2026-03-12', x: 39, y: 18, latitude: -23.603, longitude: -45.389 },
  { id: 'esc-008', nome: 'EMEI Travessao', bairro: 'Travessao', endereco: 'Rua Pedro de Oliveira, 320', status: 'Ativa', dataCadastro: '2026-04-02', x: 67, y: 34, latitude: -23.672, longitude: -45.468 },
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

export const ocorrencias = base.map(([id, escolaId, titulo, tipo, criticidade, status, localizacaoInterna, dataEnvio, aprovadaPelaEscola], index) => {
  const escola = escolas.find((item) => item.id === escolaId)
  return {
    id,
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
    dataAprovacao: '2026-05-14',
    ultimaAtualizacao: `2026-05-${String(15 + (index % 8)).padStart(2, '0')}`,
    dataResolucao: status === 'Resolvida' ? '2026-05-18' : '',
    aprovadaPelaEscola,
    chatPendente: index % 3 === 0,
    tratativaPendente: index % 4 === 0,
    fotos: ['Foto da area', 'Detalhe do problema', 'Contexto da sala'],
    historico: [
      { titulo: 'Criada', data: dataEnvio, descricao: 'Ocorrencia registrada pela escola.' },
      { titulo: 'Aprovada', data: '2026-05-14', descricao: 'Aprovada pela direcao da unidade.' },
      { titulo: 'Tratativa registrada', data: `2026-05-${String(15 + (index % 8)).padStart(2, '0')}`, descricao: 'Encaminhada para equipe responsavel.' },
    ],
    mensagens: [
      { autor: 'Escola', origem: 'Escola', data: dataEnvio, mensagem: 'Solicitamos apoio para avaliacao da situacao.' },
      { autor: 'SEDUC', origem: 'SEDUC', data: '2026-05-15', mensagem: 'Ocorrencia recebida e em triagem pela equipe tecnica.' },
    ],
    tratativas: [
      { responsavel: 'Equipe SEDUC', data: '2026-05-15', texto: 'Encaminhado para equipe responsavel.' },
      { responsavel: 'Manutencao', data: '2026-05-17', texto: status === 'Resolvida' ? 'Servico executado.' : 'Aguardando visita tecnica.' },
    ],
  }
})

export const ocorrenciasAprovadas = ocorrencias.filter((item) => item.aprovadaPelaEscola)
export const categorias = ['Eletrica', 'Hidraulica', 'Estrutural', 'Seguranca', 'Acessibilidade', 'Equipamento', 'Mobiliario', 'Limpeza', 'Tecnologia', 'Outros']
export const statusValues = ['Aberta', 'Em analise', 'Em andamento', 'Aguardando orcamento', 'Aguardando visita tecnica', 'Resolvida']
export const criticidadeValues = ['Baixa', 'Media', 'Alta', 'Critica']
export const usuarios = [
  { nome: 'Ana Paula Ribeiro', email: 'ana.ribeiro@seduc.gov.br', perfil: 'Administrador SEDUC', status: 'Ativo', ultimoAcesso: 'Hoje, 09:18' },
  { nome: 'Carlos Henrique', email: 'carlos.henrique@seduc.gov.br', perfil: 'Administrador SEDUC', status: 'Ativo', ultimoAcesso: 'Ontem, 17:42' },
  { nome: 'Marina Souza', email: 'marina.souza@seduc.gov.br', perfil: 'Administrador SEDUC', status: 'Ativo', ultimoAcesso: '02/07/2026' },
  { nome: 'Rafael Lima', email: 'rafael.lima@seduc.gov.br', perfil: 'Administrador SEDUC', status: 'Inativo', ultimoAcesso: '18/06/2026' },
]
