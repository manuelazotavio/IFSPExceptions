import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const escolasJsonPath = path.resolve(__dirname, 'seeds/unidades_seduc_caraguatatuba.json')
const ocorrenciasJsonPath = path.resolve(__dirname, 'seeds/ocorrencias_seduc_caraguatatuba_seed.json')

// Preserve ids already referenced by ocorrencias and usuarios seeds.
const LEGACY_ESCOLA_IDS = new Map([
  ['emef dr. carlos de almeida rodrigues', 'esc-001'],
  ['emei/emef profa. alaor xavier junqueira', 'esc-008'],
  ['emei/emef prof. lucio jacinto dos santos', 'esc-003'],
  ['emef prof. luiz ribeiro muniz', 'esc-007'],
  ['emef prof. luiz silvar do prado', 'esc-009'],
  ['emef profa. antonia antunes arouca', 'esc-005'],
  ['emef profa. maria aparecida ujio', 'esc-004'],
  ['cei/emei profa. maria eugenia aranha chodounsky', 'esc-010'],
  ['emei/emef prof. yasutada nasu', 'esc-006'],
])

function mojibakeScore(value) {
  return (String(value ?? '').match(/[\u00C3\u00C2]/g) || []).length
}

function repairText(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (!/[\u00C3\u00C2]/.test(text)) return text

  try {
    const repaired = Buffer.from(text, 'latin1').toString('utf8')
    return mojibakeScore(repaired) < mojibakeScore(text) ? repaired : text
  } catch {
    return text
  }
}

function normalizeText(value) {
  return repairText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanRequiredText(value, fieldName, escolaNome = 'registro') {
  const text = repairText(value).replace(/\s+/g, ' ').trim()
  if (!text) {
    throw new Error(`Campo obrigatorio ausente (${fieldName}) para ${escolaNome}.`)
  }
  return text
}

function cleanOptionalText(value) {
  return repairText(value).replace(/\s+/g, ' ').trim()
}

function cleanOptionalAsciiText(value) {
  return cleanOptionalText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function cleanRequiredAsciiText(value, fieldName, recordName = 'registro') {
  const text = cleanOptionalAsciiText(value)
  if (!text) {
    throw new Error(`Campo obrigatorio ausente (${fieldName}) para ${recordName}.`)
  }
  return text
}

function toRequiredNumber(value, fieldName, escolaNome) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`Campo numerico invalido (${fieldName}) para ${escolaNome}.`)
  }
  return number
}

function toOptionalComodos(record, escolaNome) {
  const rawComodos = Array.isArray(record?.comodosCadastrados)
    ? record.comodosCadastrados
    : (Array.isArray(record?.comodos) ? record.comodos : [])

  const seenCodes = new Set()

  return rawComodos.map((item, index) => {
    const codigo = cleanRequiredAsciiText(item?.codigo, 'codigo', `${escolaNome} / comodo ${index + 1}`)
    const nome = cleanRequiredAsciiText(item?.ambiente ?? item?.nome, 'nome', `${escolaNome} / comodo ${index + 1}`)

    if (seenCodes.has(codigo)) {
      throw new Error(`Codigo de comodo duplicado detectado para ${escolaNome}: ${codigo}.`)
    }

    seenCodes.add(codigo)
    return { nome, codigo }
  })
}

const CRITICIDADE_SEED_MAP = new Map([
  ['baixa', 'Baixa'],
  ['atencao', 'Media'],
  ['media', 'Media'],
  ['alta', 'Alta'],
  ['critica', 'Critica'],
])

const STATUS_SEED_MAP = new Map([
  ['aberta', 'Aberta'],
  ['aguardando_aprovacao', 'Aguardando aprovacao'],
  ['em_analise', 'Em analise'],
  ['analise', 'Em analise'],
  ['em_execucao', 'Em andamento'],
  ['em_andamento', 'Em andamento'],
  ['andamento', 'Em andamento'],
  ['aguardando_visita_tecnica', 'Aguardando visita tecnica'],
  ['resolvida', 'Resolvida'],
  ['concluida', 'Resolvida'],
  ['fechada', 'Resolvida'],
])

function mapSeedEnum(value, fieldName, optionsMap, recordName) {
  const normalizedValue = normalizeText(value).replace(/[^a-z0-9]+/g, '_')
  const mappedValue = optionsMap.get(normalizedValue)

  if (!mappedValue) {
    throw new Error(`Valor invalido para ${fieldName} em ${recordName}: ${value}.`)
  }

  return mappedValue
}

async function loadEscolasSeed() {
  const content = await readFile(escolasJsonPath, 'utf8')
  const records = JSON.parse(content)

  if (!Array.isArray(records)) {
    throw new Error('O arquivo oficial de escolas nao contem uma lista JSON.')
  }

  if (records.length !== 71) {
    throw new Error(`O arquivo oficial de escolas deveria conter 71 registros, mas veio com ${records.length}.`)
  }

  const reservedIds = new Set(LEGACY_ESCOLA_IDS.values())
  const assignedIds = new Set()
  const matchedLegacyNames = new Set()
  let nextGeneratedNumber = 1

  function getNextGeneratedId() {
    while (true) {
      const candidate = `esc-${String(nextGeneratedNumber).padStart(3, '0')}`
      nextGeneratedNumber += 1

      if (reservedIds.has(candidate) || assignedIds.has(candidate)) {
        continue
      }

      return candidate
    }
  }

  const escolas = records.map((record) => {
    const nome = cleanRequiredText(record?.nome, 'nome')
    const normalizedName = normalizeText(nome)
    const legacyId = LEGACY_ESCOLA_IDS.get(normalizedName)
    const id = legacyId || getNextGeneratedId()

    if (assignedIds.has(id)) {
      throw new Error(`Id duplicado detectado no seed de escolas: ${id}.`)
    }

    assignedIds.add(id)
    if (legacyId) {
      matchedLegacyNames.add(normalizedName)
    }

    return {
      id,
      nome,
      bairro: cleanRequiredText(record?.bairro, 'bairro', nome),
      endereco: cleanRequiredText(record?.endereco, 'endereco', nome),
      latitude: toRequiredNumber(record?.latitude, 'latitude', nome),
      longitude: toRequiredNumber(record?.longitude, 'longitude', nome),
      comodos: toOptionalComodos(record, nome),
    }
  })

  const missingLegacyNames = [...LEGACY_ESCOLA_IDS.keys()].filter((name) => !matchedLegacyNames.has(name))
  if (missingLegacyNames.length > 0) {
    throw new Error(`Nao foi possivel preservar ids legados para: ${missingLegacyNames.join(', ')}`)
  }

  return escolas
}

const escolasSeed = await loadEscolasSeed()

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

async function loadOcorrenciasSeed(escolas) {
  const content = await readFile(ocorrenciasJsonPath, 'utf8')
  const records = JSON.parse(content)

  if (!Array.isArray(records)) {
    throw new Error('O arquivo oficial de ocorrencias nao contem uma lista JSON.')
  }

  if (records.length === 0) {
    throw new Error('O arquivo oficial de ocorrencias esta vazio.')
  }

  const escolaIdsValidos = new Set(escolas.map((escola) => escola.id))

  return records.map((record, index) => {
    const seedIndex = String(index + 1).padStart(4, '0')
    const escolaId = cleanRequiredText(record?.escolaId, 'escolaId', `ocorrencia ${seedIndex}`)
    if (!escolaIdsValidos.has(escolaId)) {
      throw new Error(`Ocorrencia com escola invalida no arquivo oficial: ${escolaId}.`)
    }

    const titulo = cleanRequiredAsciiText(record?.titulo, 'titulo', `ocorrencia ${seedIndex}`)
    const dataEnvio = cleanRequiredText(record?.dataEnvio, 'dataEnvio', titulo)
    const aprovadaPelaEscola = record?.aprovadaPelaEscola !== false
    const status = mapSeedEnum(record?.status, 'status', STATUS_SEED_MAP, titulo)

    return {
      id: `oco-seed-${seedIndex}`,
      protocolo: String(700000 + index + 1),
      escolaId,
      titulo,
      descricao: cleanRequiredAsciiText(record?.descricao, 'descricao', titulo),
      tipo: cleanRequiredAsciiText(record?.tipo, 'tipo', titulo),
      criticidade: mapSeedEnum(record?.criticidade, 'criticidade', CRITICIDADE_SEED_MAP, titulo),
      status,
      localizacaoInterna: cleanOptionalAsciiText(record?.localizacaoInterna),
      endereco: cleanOptionalAsciiText(record?.endereco),
      dataEnvio,
      dataAprovacao: aprovadaPelaEscola ? addDays(dataEnvio, 4) : null,
      dataResolucao: status === 'Resolvida' ? addDays(dataEnvio, 8) : null,
      aprovadaPelaEscola,
      criadoPorEmail: cleanRequiredText(record?.criadoPorEmail, 'criadoPorEmail', titulo).toLowerCase(),
      criadoPorNome: cleanOptionalAsciiText(record?.criadoPorNome),
      fotos: Array.isArray(record?.fotos)
        ? record.fotos.map((item) => cleanOptionalAsciiText(item)).filter(Boolean)
        : [],
    }
  })
}

const ocorrenciasSeed = await loadOcorrenciasSeed(escolasSeed)

const usuariosExternosSeed = [
  { email: 'externo@escola.gov.br', nome: 'Usuario Externo', escolaId: 'esc-001' },
  { email: 'externo.esc-001@escola.gov.br', nome: 'Fernanda Souza', escolaId: 'esc-001' },
  { email: 'externo.esc-003@escola.gov.br', nome: 'Juliana Costa', escolaId: 'esc-003' },
  { email: 'externo.esc-004@escola.gov.br', nome: 'Marcos Pereira', escolaId: 'esc-004' },
  { email: 'externo.esc-005@escola.gov.br', nome: 'Patricia Lima', escolaId: 'esc-005' },
  { email: 'externo.esc-006@escola.gov.br', nome: 'Anderson Santos', escolaId: 'esc-006' },
  { email: 'externo.esc-007@escola.gov.br', nome: 'Camila Rocha', escolaId: 'esc-007' },
  { email: 'externo.esc-008@escola.gov.br', nome: 'Diego Martins', escolaId: 'esc-008' },
  { email: 'externo.esc-009@escola.gov.br', nome: 'Ricardo Almeida', escolaId: 'esc-009' },
  { email: 'externo.esc-010@escola.gov.br', nome: 'Bruna Azevedo', escolaId: 'esc-010' },
]

const escolaIdsValidos = new Set(escolasSeed.map((escola) => escola.id))

function buildOcorrenciaInteracoes(ocorrencia) {
  const interacoes = [{
    origem: 'sistema',
    autor: 'Sistema',
    mensagem: ocorrencia.aprovadaPelaEscola
      ? 'Ocorrencia aberta pela escola.'
      : 'Ocorrencia enviada e aguardando aprovacao.',
    status: ocorrencia.aprovadaPelaEscola ? 'Aberta' : 'Aguardando aprovacao',
  }]

  if (ocorrencia.aprovadaPelaEscola) {
    interacoes.push({
      origem: 'seduc',
      autor: 'Ernesto Cavalcanti',
      mensagem: 'Protocolo homologado, estamos comecando as tratativas.',
    })
  }

  if (ocorrencia.status !== 'Aberta' && ocorrencia.status !== 'Aguardando aprovacao') {
    interacoes.push({
      origem: 'escola',
      autor: 'Direcao da escola',
      mensagem: 'Os tecnicos vieram aqui hoje para avaliar o problema.',
    })
    interacoes.push({
      origem: 'sistema',
      autor: 'Sistema',
      mensagem: `Status atualizado para "${ocorrencia.status}".`,
      status: ocorrencia.status,
    })
  }

  if (ocorrencia.status === 'Resolvida') {
    interacoes.push({
      origem: 'seduc',
      autor: 'Ernesto Cavalcanti',
      mensagem: 'Servico concluido. Ocorrencia finalizada.',
      status: 'Resolvida',
    })
  }

  return interacoes
}

async function main() {
  for (const usuario of usuariosExternosSeed) {
    if (!escolaIdsValidos.has(usuario.escolaId)) {
      throw new Error(`Usuario externo com escola invalida no seed: ${usuario.email} -> ${usuario.escolaId}`)
    }
  }

  for (const ocorrencia of ocorrenciasSeed) {
    if (!escolaIdsValidos.has(ocorrencia.escolaId)) {
      throw new Error(`Ocorrencia com escola invalida no seed: ${ocorrencia.titulo} -> ${ocorrencia.escolaId}`)
    }
  }

  for (const escola of escolasSeed) {
    const { comodos, ...escolaPayload } = escola

    await prisma.escola.upsert({
      where: { id: escola.id },
      update: escolaPayload,
      create: {
        ...escolaPayload,
        ...(comodos.length ? { comodos: { create: comodos } } : {}),
      },
    })
  }

  const senhaHash = await bcrypt.hash('123456', 10)

  const usuarios = [
    { email: 'seduc@escola.gov.br', nome: 'Joao Beserra', role: 'SEDUC', escolaId: null },
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
  const totalOcorrenciasOficiais = await prisma.ocorrencia.count({
    where: { id: { startsWith: 'oco-seed-' } },
  })

  if (totalExistentes > 0 && totalOcorrenciasOficiais === 0) {
    throw new Error(
      `Ja existem ${totalExistentes} ocorrencias no banco sem a seed oficial aplicada. ` +
      'Recrie o banco ou limpe a tabela de ocorrencias antes de rodar a seed oficial.',
    )
  }

  if (totalOcorrenciasOficiais > 0) {
    console.log(`Seed oficial de ocorrencias ja aplicada (${totalOcorrenciasOficiais} registros). Pulando nova insercao.`)
    return
  }

  for (const [index, ocorrencia] of ocorrenciasSeed.entries()) {
    const escola = escolasSeed.find((item) => item.id === ocorrencia.escolaId)
    const interacoes = buildOcorrenciaInteracoes(ocorrencia)

    await prisma.ocorrencia.create({
      data: {
        id: ocorrencia.id,
        protocolo: ocorrencia.protocolo,
        escolaId: ocorrencia.escolaId,
        titulo: ocorrencia.titulo,
        descricao: ocorrencia.descricao,
        tipo: ocorrencia.tipo,
        criticidade: ocorrencia.criticidade,
        status: ocorrencia.status,
        localizacaoInterna: ocorrencia.localizacaoInterna,
        endereco: ocorrencia.endereco || escola.endereco,
        dataEnvio: new Date(ocorrencia.dataEnvio),
        dataAprovacao: ocorrencia.dataAprovacao ? new Date(ocorrencia.dataAprovacao) : null,
        dataResolucao: ocorrencia.dataResolucao ? new Date(ocorrencia.dataResolucao) : null,
        aprovadaPelaEscola: ocorrencia.aprovadaPelaEscola,
        criadoPorEmail: ocorrencia.criadoPorEmail,
        criadoPorNome: ocorrencia.criadoPorNome || '',
        chatPendente: ocorrencia.status !== 'Resolvida' && index % 3 === 0,
        fotos: JSON.stringify(ocorrencia.fotos),
        interacoes: {
          create: interacoes.map((item) => ({ ...item, anexos: '[]' })),
        },
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

