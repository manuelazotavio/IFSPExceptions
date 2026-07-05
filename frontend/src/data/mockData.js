<<<<<<< HEAD
=======
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

const usuariosExternos = [
  { email: 'externo@escola.gov.br', nome: 'Usuario Externo', escolaId: 'esc-001' },
  { email: 'externo.esc-001@escola.gov.br', nome: 'Fernanda Souza', escolaId: 'esc-001' },
  { email: 'externo.esc-002@escola.gov.br', nome: 'Ricardo Almeida', escolaId: 'esc-002' },
  { email: 'externo.esc-003@escola.gov.br', nome: 'Juliana Costa', escolaId: 'esc-003' },
  { email: 'externo.esc-004@escola.gov.br', nome: 'Marcos Pereira', escolaId: 'esc-004' },
  { email: 'externo.esc-005@escola.gov.br', nome: 'Patricia Lima', escolaId: 'esc-005' },
  { email: 'externo.esc-006@escola.gov.br', nome: 'Anderson Santos', escolaId: 'esc-006' },
  { email: 'externo.esc-007@escola.gov.br', nome: 'Camila Rocha', escolaId: 'esc-007' },
  { email: 'externo.esc-008@escola.gov.br', nome: 'Diego Martins', escolaId: 'esc-008' },
]

>>>>>>> 1dbd2e8cff8e3a8fd78d1deb9fd281366dee91d8
function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

<<<<<<< HEAD
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
=======
export const ocorrencias = base.map(([id, escolaId, titulo, tipo, criticidade, status, localizacaoInterna, dataEnvio, aprovadaPelaEscola], index) => {
  const escola = escolas.find((item) => item.id === escolaId)
  const criador = index % 4 === 0
    ? usuariosExternos[0]
    : usuariosExternos.find((usuario) => usuario.escolaId === escolaId) || usuariosExternos[0]
  const dataResolucao = status === 'Resolvida' ? addDays(dataEnvio, 8) : ''
>>>>>>> 1dbd2e8cff8e3a8fd78d1deb9fd281366dee91d8

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

<<<<<<< HEAD
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
=======
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
    criadoPorEmail: criador.email,
    criadoPorNome: criador.nome,
    chatPendente: index % 3 === 0,
    fotos: ['Foto da area', 'Detalhe do problema', 'Contexto da sala'],
    interacoes,
  }
>>>>>>> 1dbd2e8cff8e3a8fd78d1deb9fd281366dee91d8
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

export const usuarios = [
  { nome: 'Ana Paula Ribeiro', email: 'ana.ribeiro@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Hoje, 09:18' },
  { nome: 'Carlos Henrique', email: 'carlos.henrique@seduc.gov.br', role: 'SEDUC', escolaId: null, status: 'Ativo', ultimoAcesso: 'Ontem, 17:42' },
  { nome: 'Marina Souza', email: 'marina.souza@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-001', status: 'Ativo', ultimoAcesso: '02/07/2026' },
  { nome: 'Rafael Lima', email: 'rafael.lima@escola.gov.br', role: 'DIRETOR', escolaId: 'esc-002', status: 'Inativo', ultimoAcesso: '18/06/2026' },
  ...usuariosExternos.map((usuario) => ({ ...usuario, role: 'EXTERNO', status: 'Ativo', ultimoAcesso: '01/07/2026' })),
]
