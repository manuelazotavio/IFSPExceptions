import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const finalPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_final.json')
const pendingPath = path.join(projectRoot, 'public', 'geo', 'unidades_seduc_caraguatatuba_pendencias.json')
const seedDir = path.join(projectRoot, 'src', 'seeds')
const seedPath = path.join(seedDir, 'escolasSeed.js')
const seedIndexPath = path.join(seedDir, 'index.js')

const DEFAULT_COMODOS = Object.freeze([
  { ambiente: 'Sala 1', codigo: 'SALA-01' },
  { ambiente: 'Sala 2', codigo: 'SALA-02' },
  { ambiente: 'Sala 3', codigo: 'SALA-03' },
  { ambiente: 'Banheiro Feminino', codigo: 'BAN-FEM-01' },
  { ambiente: 'Banheiro Masculino', codigo: 'BAN-MASC-01' },
  { ambiente: 'Cozinha', codigo: 'COZ-01' },
  { ambiente: 'Diretoria', codigo: 'DIR-01' },
  { ambiente: 'Biblioteca', codigo: 'BIB-01' },
  { ambiente: 'Refeitório', codigo: 'REF-01' },
])

const FORCED_GEO_PATCH = [
  {
    nome: 'EMEI/EMEF BENEDITO INÁCIO SOARES',
    bairro: 'Massaguaçu',
    endereco: 'Avenida Regina Margareth Passos, 400',
    cep: '11677-340',
    latitude: -23.58238,
    longitude: -45.33058,
  },
  {
    nome: 'CEI/EMEI DO SUMARÉ',
    bairro: 'Sumaré',
    endereco: 'Rua Sebastião Nepomuceno, 20',
    cep: '11661-160',
    latitude: -23.6208094,
    longitude: -45.3993334,
  },
  {
    nome: 'CEI PROF.ª ELISA BUTSCHKAU',
    bairro: 'Barranco Alto',
    endereco: 'Rua Manoel Severino de Castro, 720',
    cep: '11670-010',
    latitude: -23.68594,
    longitude: -45.44922,
  },
  {
    nome: 'CEI ESTER NUNES DE SOUZA',
    bairro: 'Sertão dos Tourinhos',
    endereco: 'Rua Manoel Francisco Ricardo, 360',
    cep: '11677-180',
    latitude: -23.5797,
    longitude: -45.3371,
  },
  {
    nome: 'CEI/EMEI PROF. FRANCISCO ASSIS DE CARVALHO',
    bairro: 'Perequê Mirim',
    endereco: 'Rua José Geraldo Fernandes da Silva Filho, 85',
    cep: '11669-470',
    latitude: -23.70548,
    longitude: -45.4487,
  },
  {
    nome: 'EMEF PROF. GERALDO DE LIMA',
    bairro: 'Perequê Mirim',
    endereco: 'Avenida Pedro Gonçalves Leite, 685',
    cep: '11668-015',
    latitude: -23.7089572,
    longitude: -45.4423111,
  },
  {
    nome: 'EMEI/EMEF PROF.ª JOÃO BENEDITO MARCONDES',
    bairro: 'Barranco Alto',
    endereco: 'Rua Benedito Severino Castro, 248',
    cep: '11670-150',
    latitude: -23.6886324,
    longitude: -45.4485423,
  },
  {
    nome: 'EMEI/EMEF JOÃO THIMÓTEO DO ROSÁRIO',
    bairro: 'Canta Galo',
    endereco: 'Avenida Antônio Francisco Paschoal Peliciari, 1985',
    cep: '11661-395',
    latitude: -23.6008,
    longitude: -45.4019,
  },
  {
    nome: 'EMEF PROF. JORGE PASSOS',
    bairro: 'Jaraguazinho',
    endereco: 'Rua Oziel Egídio de Faria, s/n.º',
    cep: '11675-300',
    latitude: -23.6129025,
    longitude: -45.433701,
  },
  {
    nome: 'EMEI/EMEF MASAKO SONE',
    bairro: 'Pegorelli',
    endereco: 'Rua Abra de Dentro, s/n.º',
    cep: '11667-826',
    latitude: -23.720365,
    longitude: -45.4580586,
  },
  {
    nome: 'CRECHE MEI MEI DE CARAGUATATUBA',
    bairro: 'Morro do Algodão',
    endereco: 'Rua Antônio Teles de Souza, 64',
    cep: '11671-470',
    latitude: -23.6822,
    longitude: -45.4498,
  },
  {
    nome: 'CEI/EMEI PROF.ª VERA DA SILVA SANTOS',
    bairro: 'Jetuba',
    endereco: 'Rua das Azaleias, 418',
    cep: '11676-250',
    latitude: -23.598,
    longitude: -45.35824,
  },
  {
    nome: 'EMEI/EMEF PROF. YASUTADA NASU',
    bairro: 'Perequê Mirim',
    endereco: 'Avenida Pedro Gonçalves Leite, 685',
    cep: '11668-015',
    latitude: -23.7090612,
    longitude: -45.4428357,
  },
  {
    nome: 'CRIES CASA BRANCA',
    bairro: 'Casa Branca',
    endereco: 'Rua Nicefaro Cabral de Melo, s/n.º',
    cep: '11667-255',
    latitude: -23.6079,
    longitude: -45.3802,
  },
  {
    nome: 'CRIES TINGA',
    bairro: 'Tinga',
    endereco: 'Rua Antônio dos Santos, 95',
    cep: '11674-480',
    latitude: -23.6288,
    longitude: -45.4359,
  },
  {
    nome: 'CRIES PEREQUÊ MIRIM',
    bairro: 'Perequê Mirim',
    endereco: 'Rua José Geraldo Fernandes da Silva Filho, 185',
    cep: '11669-470',
    latitude: -23.70548,
    longitude: -45.4487,
  },
]

function mojibakeScore(value) {
  return (String(value ?? '').match(/[ÃÂ]/g) || []).length
}

function repairText(value) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  if (!/[ÃÂ]/.test(text)) return text

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

function cleanText(value) {
  const text = repairText(value).replace(/\s+/g, ' ').trim()
  return text || null
}

function formatCep(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length !== 8) {
    throw new Error(`CEP inválido: ${value}`)
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function cloneDefaultComodos() {
  return DEFAULT_COMODOS.map((item) => ({ ...item }))
}

async function readJson(filePath) {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content)
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function buildRecord(record) {
  const nome = String(record?.nome ?? '').replace(/\s+/g, ' ').trim()
  if (!nome) {
    throw new Error('Registro encontrado sem nome.')
  }

  return {
    nome,
    cep: formatCep(record?.cep),
    bairro: cleanText(record?.bairro),
    endereco: cleanText(record?.endereco),
    latitude: toNullableNumber(record?.latitude),
    longitude: toNullableNumber(record?.longitude),
    fotos: null,
    comodosCadastrados: cloneDefaultComodos(),
  }
}

function validateRecord(record) {
  if (typeof record.nome !== 'string' || !record.nome.trim()) {
    throw new Error('Nome inválido em um dos registros.')
  }

  if (record.bairro !== null && typeof record.bairro !== 'string') {
    throw new Error(`Bairro inválido para ${record.nome}.`)
  }

  if (record.endereco !== null && typeof record.endereco !== 'string') {
    throw new Error(`Endereço inválido para ${record.nome}.`)
  }

  if (record.cep !== null && !/^\d{5}-\d{3}$/.test(record.cep)) {
    throw new Error(`CEP inválido para ${record.nome}.`)
  }

  if (record.latitude !== null && typeof record.latitude !== 'number') {
    throw new Error(`Latitude inválida para ${record.nome}.`)
  }

  if (record.longitude !== null && typeof record.longitude !== 'number') {
    throw new Error(`Longitude inválida para ${record.nome}.`)
  }

  if (record.fotos !== null) {
    throw new Error(`Campo fotos inválido para ${record.nome}.`)
  }

  const comodos = JSON.stringify(record.comodosCadastrados)
  const expected = JSON.stringify(DEFAULT_COMODOS)
  if (comodos !== expected) {
    throw new Error(`Cômodos inválidos para ${record.nome}.`)
  }
}

function buildPendingRecord(record) {
  const motivos = []
  if (record.latitude === null) motivos.push('latitude ausente')
  if (record.longitude === null) motivos.push('longitude ausente')
  if (record.cep === null) motivos.push('cep ausente')

  return {
    nome: record.nome,
    bairro: record.bairro,
    endereco: record.endereco,
    latitude: record.latitude,
    longitude: record.longitude,
    cep: record.cep,
    motivos,
  }
}

async function findPendingImports(rootDir, needle) {
  const entries = await readdir(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      const nested = await findPendingImports(fullPath, needle)
      if (nested) return true
      continue
    }

    if (!/\.(?:js|jsx|ts|tsx|mjs|cjs)$/i.test(entry.name)) {
      continue
    }

    const content = await readFile(fullPath, 'utf8')
    if (content.includes(needle)) {
      return true
    }
  }

  return false
}

async function writeSeed(records) {
  await mkdir(seedDir, { recursive: true })
  const seedContent = `export const escolasSeed = ${JSON.stringify(records, null, 2)}\n`
  const seedIndexContent = "export { escolasSeed } from './escolasSeed'\n"
  await writeFile(seedPath, seedContent, 'utf8')
  await writeFile(seedIndexPath, seedIndexContent, 'utf8')
}

async function main() {
  const originalRecords = await readJson(finalPath)
  if (!Array.isArray(originalRecords)) {
    throw new Error('O arquivo final não contém uma lista JSON.')
  }

  const patchByName = new Map(
    FORCED_GEO_PATCH.map((item) => [normalizeText(item.nome), item]),
  )

  const appliedPatchNames = new Set()
  const updatedRecords = originalRecords.map((record) => {
    const normalizedName = normalizeText(record?.nome)
    const forcedPatch = patchByName.get(normalizedName)

    const nextRecord = forcedPatch
      ? {
          ...record,
          bairro: forcedPatch.bairro,
          endereco: forcedPatch.endereco,
          cep: forcedPatch.cep,
          latitude: forcedPatch.latitude,
          longitude: forcedPatch.longitude,
        }
      : record

    if (forcedPatch) {
      appliedPatchNames.add(normalizedName)
    }

    return buildRecord(nextRecord)
  })

  const notFound = FORCED_GEO_PATCH
    .filter((item) => !appliedPatchNames.has(normalizeText(item.nome)))
    .map((item) => item.nome)

  if (updatedRecords.length !== 71) {
    throw new Error(`O arquivo final precisa continuar com 71 registros. Atual: ${updatedRecords.length}.`)
  }

  for (const record of updatedRecords) {
    validateRecord(record)
  }

  const pendingRecords = updatedRecords
    .filter((record) => record.latitude === null || record.longitude === null || record.cep === null)
    .map((record) => buildPendingRecord(record))

  await writeJson(finalPath, updatedRecords)

  const hasPendingImports = await findPendingImports(path.join(projectRoot, 'src'), 'unidades_seduc_caraguatatuba_pendencias.json')
  let pendingMessage = ''

  if (pendingRecords.length === 0) {
    if (hasPendingImports) {
      await writeJson(pendingPath, [])
      pendingMessage = 'Pendências zeradas em public/geo/unidades_seduc_caraguatatuba_pendencias.json'
    } else {
      await rm(pendingPath, { force: true })
      pendingMessage = 'Pendências removidas'
    }
  } else {
    await writeJson(pendingPath, pendingRecords)
    pendingMessage = `Pendências atualizadas: ${pendingRecords.length}`
  }

  await writeSeed(updatedRecords)

  const withCoordinates = updatedRecords.filter((record) => record.latitude !== null && record.longitude !== null).length
  const withCep = updatedRecords.filter((record) => record.cep !== null).length

  console.log(`Total de escolas: ${updatedRecords.length}`)
  console.log(`Patches aplicados: ${appliedPatchNames.size}`)
  console.log(`Patches não encontrados: ${notFound.length}`)
  console.log(`Com latitude/longitude: ${withCoordinates}`)
  console.log(`Sem latitude/longitude: ${updatedRecords.length - withCoordinates}`)
  console.log(`Com CEP: ${withCep}`)
  console.log(`Sem CEP: ${updatedRecords.length - withCep}`)
  console.log(`Arquivo final atualizado: ${finalPath}`)
  console.log(`Seed gerada: ${seedPath}`)
  console.log(`${pendingMessage}.`)

  if (notFound.length > 0) {
    console.log(`Patches não encontrados por nome: ${notFound.join(' | ')}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
