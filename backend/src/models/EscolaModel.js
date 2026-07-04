import { prisma } from '../database/prismaClient.js'
import { AppError } from '../utils/AppError.js'

export class EscolaModel {
  static async findAll() {
    return prisma.escola.findMany({ orderBy: { nome: 'asc' } })
  }

  static async findById(id) {
    const escola = await prisma.escola.findUnique({ where: { id } })
    if (!escola) throw new AppError('Escola nao encontrada', 404)
    return escola
  }

  static async create(payload) {
    return prisma.escola.create({ data: payload })
  }

  static async update(id, payload) {
    await EscolaModel.findById(id)
    return prisma.escola.update({ where: { id }, data: payload })
  }

  static async delete(id) {
    await EscolaModel.findById(id)
    await prisma.escola.delete({ where: { id } })
  }
}
