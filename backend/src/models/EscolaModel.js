import { prisma } from '../database/prismaClient.js'
import { AppError } from '../utils/AppError.js'

const includeComodos = { comodos: { orderBy: { criadoEm: 'asc' } } }

export class EscolaModel {
  static async findAll() {
    return prisma.escola.findMany({ orderBy: { nome: 'asc' }, include: includeComodos })
  }

  static async findById(id) {
    const escola = await prisma.escola.findUnique({ where: { id }, include: includeComodos })
    if (!escola) throw new AppError('Escola nao encontrada', 404)
    return escola
  }

  static async create({ comodos, ...payload }) {
    return prisma.escola.create({
      data: {
        ...payload,
        ...(comodos?.length ? { comodos: { create: comodos.map((item) => ({ nome: item.nome, codigo: item.codigo })) } } : {}),
      },
      include: includeComodos,
    })
  }

  static async update(id, { comodos, ...payload }) {
    await EscolaModel.findById(id)
    return prisma.escola.update({ where: { id }, data: payload, include: includeComodos })
  }

  static async delete(id) {
    await EscolaModel.findById(id)
    await prisma.escola.delete({ where: { id } })
  }
}
