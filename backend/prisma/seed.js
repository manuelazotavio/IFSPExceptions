import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const escolasSeed = [
  { id: 'esc-001', nome: 'EMEF Dr. Carlos de Almeida Rodrigues', bairro: 'Indaia', endereco: 'Av. Pernambuco, 1101', latitude: -23.631425, longitude: -45.423699 },
  { id: 'esc-003', nome: 'EMEF Lucio Jacinto dos Santos', bairro: 'Tinga', endereco: 'Rua Denilza Sebastiana dos Santos, 75', latitude: -23.6286667, longitude: -45.4355698 },
  { id: 'esc-004', nome: 'EMEF Profa. Maria Aparecida Ujio', bairro: 'Porto Novo', endereco: 'Av. Primeiro de Maio, 285', latitude: -23.6914719, longitude: -45.4360238 },
  { id: 'esc-005', nome: 'EMEF Profa. Antonia Antunes Arouca', bairro: 'Massaguacu', endereco: 'Rua Italia Baffi Magni, 581', latitude: -23.581018, longitude: -45.3333415 },
  { id: 'esc-006', nome: 'EMEI Yasutada Nasu', bairro: 'Pereque Mirim', endereco: 'Av. Pedro Goncalves Leite, 685', latitude: -23.7090203, longitude: -45.4429127 },
  { id: 'esc-007', nome: 'EMEF Prof. Luiz Ribeiro Muniz', bairro: 'Martim de Sa', endereco: 'Rua Analandia, 355', latitude: -23.6174836, longitude: -45.3897454 },
  { id: 'esc-008', nome: 'EMEI/EMEF Prof. Alaor Xavier Junqueira', bairro: 'Travessao', endereco: 'Rua Jose Ferreira dos Santos, 381', latitude: -23.6981504, longitude: -45.4443438 },
  { id: 'esc-009', nome: 'EMEF Prof. Luiz Silvar do Prado (CIDE Casa Branca)', bairro: 'Jardim Casa Branca', endereco: 'Rua Jose Pedro de Oliveira Barbosa, 805', latitude: -23.6094773, longitude: -45.382068 },
  { id: 'esc-010', nome: 'CEI/EMEI Profa. Maria Eugenia Aranha Chodounsky', bairro: 'Jardim Casa Branca', endereco: 'Rua Jose Pedro de Oliveira Barbosa, S/N', latitude: -23.6090319, longitude: -45.3817271 },
]

const ocorrenciasSeed = [
  ['esc-001', 'Infiltracao na biblioteca', 'Hidraulica', 'Alta', 'Aberta', 'Biblioteca', '2026-05-02', true],
  ['esc-001', 'Quadro eletrico com faiscas', 'Eletrica', 'Critica', 'Em andamento', 'Bloco A', '2026-04-23', true],
  ['esc-009', 'Portao lateral danificado', 'Seguranca', 'Media', 'Em analise', 'Entrada lateral', '2026-05-04', true], // era esc-002
  ['esc-003', 'Telhado com risco de queda', 'Estrutural', 'Critica', 'Aberta', 'Patio coberto', '2026-04-18', true],
  ['esc-004', 'Banheiro sem descarga', 'Hidraulica', 'Media', 'Aguardando visita tecnica', 'Banheiro infantil', '2026-05-08', true],
  ['esc-005', 'Luminarias queimadas', 'Eletrica', 'Baixa', 'Resolvida', 'Corredor principal', '2026-04-29', true],
  ['esc-006', 'Rampa sem corrimao adequado', 'Acessibilidade', 'Alta', 'Em andamento', 'Entrada', '2026-04-14', true],
  ['esc-007', 'Computadores sem rede', 'Tecnologia', 'Media', 'Em andamento', 'Laboratorio', '2026-05-01', true],
  ['esc-008', 'Muro com rachadura', 'Estrutural', 'Alta', 'Aberta', 'Area externa', '2026-04-11', true],
  ['esc-003', 'Bebedouro quebrado', 'Equipamento', 'Baixa', 'Resolvida', 'Refeitorio', '2026-05-06', true],
  ['esc-004', 'Falta de limpeza no patio', 'Limpeza', 'Baixa', 'Em analise', 'Patio', '2026-05-09', true],
  ['esc-005', 'Carteiras danificadas', 'Mobiliario', 'Media', 'Aberta', 'Sala 3', '2026-04-30', true],
  ['esc-006', 'Curto em tomada', 'Eletrica', 'Critica', 'Em andamento', 'Sala 2', '2026-04-20', true],
  ['esc-007', 'Vidro trincado', 'Seguranca', 'Alta', 'Aberta', 'Secretaria', '2026-04-26', true],
  ['esc-010', 'Vazamento em pia', 'Hidraulica', 'Media', 'Aguardando visita tecnica', 'Cozinha', '2026-05-03', true], // era esc-002
  ['esc-001', 'Ar condicionado parado', 'Equipamento', 'Baixa', 'Aberta', 'Sala dos professores', '2026-05-07', true],
  ['esc-008', 'Iluminacao externa insuficiente', 'Seguranca', 'Alta', 'Em andamento', 'Area externa', '2026-04-17', true],
  ['esc-005', 'Piso solto', 'Estrutural', 'Media', 'Em analise', 'Sala 5', '2026-04-28', true],
  ['esc-006', 'Porta emperrada', 'Outros', 'Baixa', 'Resolvida', 'Almoxarifado', '2026-05-05', true],
  ['esc-004', 'Falta de tomada acessivel', 'Acessibilidade', 'Media', 'Aberta', 'Sala multifuncional', '2026-05-10', true],
  ['esc-007', 'Caixa d agua sem tampa', 'Hidraulica', 'Critica', 'Aberta', 'Cobertura', '2026-04-13', true],
  ['esc-003', 'Projetor queimado', 'Tecnologia', 'Baixa', 'Em andamento', 'Sala 1', '2026-05-11', true],
  ['esc-009', 'Extintor vencido', 'Seguranca', 'Critica', 'Aberta', 'Corredor', '2026-04-10', true], // era esc-002
  ['esc-008', 'Mesa quebrada', 'Mobiliario', 'Media', 'Em andamento', 'Diretoria', '2026-05-12', true],
  ['esc-005', 'Ocorrencia publica pendente', 'Outros', 'Alta', 'Aberta', 'Portaria', '2026-05-13', false],
]

const usuariosExternosSeed = [
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
function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function gerarProtocolo(usados) {
  let protocolo
  do {
    protocolo = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
  } while (usados.has(protocolo))
  usados.add(protocolo)
  return protocolo
}

async function main() {
  for (const escola of escolasSeed) {
    await prisma.escola.upsert({ where: { id: escola.id }, update: escola, create: escola })
  }

  const senhaHash = await bcrypt.hash('123456', 10)

  const usuarios = [
    { email: 'seduc@escola.gov.br', nome: 'JoÃ£o Beserra', role: 'SEDUC', escolaId: null },
    { email: 'diretor@escola.gov.br', nome: 'Diretora Alberto Souza', role: 'DIRETOR', escolaId: 'esc-001' },
    ...usuariosExternosSeed.map((usuario) => ({ ...usuario, role: 'EXTERNO' })),
  ]

  for (const usuario of usuarios) {
    await prisma.user.upsert({
      where: { email: usuario.email },
      update: usuario,
      create: { ...usuario, senha: senhaHash },
    })
  }

  const totalExistentes = await prisma.ocorrencia.count()
  if (totalExistentes > 0) return

  const protocolosUsados = new Set()

  for (const [index, [escolaId, titulo, tipo, criticidade, status, localizacaoInterna, dataEnvio, aprovadaPelaEscola]] of ocorrenciasSeed.entries()) {
    const escola = escolasSeed.find((item) => item.id === escolaId)
    const criador = index % 4 === 0
      ? usuariosExternosSeed[0]
      : usuariosExternosSeed.find((usuario) => usuario.escolaId === escolaId) || usuariosExternosSeed[0]
    const dataResolucao = status === 'Resolvida' ? addDays(dataEnvio, 8) : null

    const interacoes = [
      { origem: 'sistema', autor: 'Sistema', mensagem: 'Ocorrencia aberta pela escola.' },
      { origem: 'seduc', autor: 'Ernesto Cavalcanti', mensagem: 'Protocolo homologado, estamos comecando as tratativas.' },
    ]
    if (status !== 'Aberta') {
      interacoes.push({ origem: 'escola', autor: 'Direcao da escola', mensagem: 'Os tecnicos vieram aqui hoje para avaliar o problema.' })
      interacoes.push({ origem: 'sistema', autor: 'Sistema', mensagem: `Status atualizado para "${status}".` })
    }
    if (status === 'Resolvida') {
      interacoes.push({ origem: 'seduc', autor: 'Ernesto Cavalcanti', mensagem: 'Servico concluido. Ocorrencia finalizada.' })
    }

    await prisma.ocorrencia.create({
      data: {
        protocolo: gerarProtocolo(protocolosUsados),
        escolaId,
        titulo,
        descricao: `${titulo}. Registro aprovado pela unidade escolar e encaminhado para acompanhamento da SEDUC.`,
        tipo,
        criticidade,
        status,
        localizacaoInterna,
        endereco: escola.endereco,
        dataEnvio: new Date(dataEnvio),
        dataAprovacao: new Date(addDays(dataEnvio, 4)),
        dataResolucao: dataResolucao ? new Date(dataResolucao) : null,
        aprovadaPelaEscola,
        criadoPorEmail: criador.email,
        criadoPorNome: criador.nome,
        chatPendente: index % 3 === 0,
        fotos: JSON.stringify(['Foto da area', 'Detalhe do problema', 'Contexto da sala']),
        interacoes: { create: interacoes.map((item) => ({ ...item, anexos: '[]' })) },
      },
    })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

