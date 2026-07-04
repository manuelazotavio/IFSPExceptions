import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { escolasSeed } from './escolas.seed.js'

const databasePath = resolve('src/database/database.json')

const initialData = {
  escolas: escolasSeed,
}

async function ensureDatabase() {
  try {
    await readFile(databasePath, 'utf-8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await mkdir(dirname(databasePath), { recursive: true })
    await writeFile(databasePath, JSON.stringify(initialData, null, 2))
  }
}

export async function readDatabase() {
  await ensureDatabase()
  const raw = await readFile(databasePath, 'utf-8')
  return JSON.parse(raw)
}

export async function writeDatabase(data) {
  await mkdir(dirname(databasePath), { recursive: true })
  await writeFile(databasePath, JSON.stringify(data, null, 2))
}
