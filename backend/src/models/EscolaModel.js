import { readDatabase, writeDatabase } from '../database/jsonDatabase.js'
import { AppError } from '../utils/AppError.js'

function sortByName(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR')
}

function createId() {
  return `esc-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

export class EscolaModel {
  static async findAll() {
    const database = await readDatabase()
    return [...database.escolas].sort(sortByName)
  }

  static async findById(id) {
    const database = await readDatabase()
    const escola = database.escolas.find((item) => item.id === id)
    if (!escola) throw new AppError('Escola nao encontrada', 404)
    return escola
  }

  static async create(payload) {
    const database = await readDatabase()
    const escola = {
      id: createId(),
      criadoEm: new Date().toISOString(),
      ...payload,
    }

    database.escolas.push(escola)
    await writeDatabase(database)
    return escola
  }

  static async update(id, payload) {
    const database = await readDatabase()
    const index = database.escolas.findIndex((item) => item.id === id)
    if (index === -1) throw new AppError('Escola nao encontrada', 404)

    database.escolas[index] = {
      ...database.escolas[index],
      ...payload,
    }

    await writeDatabase(database)
    return database.escolas[index]
  }

  static async delete(id) {
    const database = await readDatabase()
    const exists = database.escolas.some((item) => item.id === id)
    if (!exists) throw new AppError('Escola nao encontrada', 404)

    database.escolas = database.escolas.filter((item) => item.id !== id)
    await writeDatabase(database)
  }
}
