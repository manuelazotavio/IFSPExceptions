import bcrypt from 'bcryptjs'
import { prisma } from '../database/prismaClient.js'
import { AppError } from '../utils/AppError.js'

const publicSelect = {
  id: true,
  nome: true,
  email: true,
  role: true,
  ativo: true,
  escolaId: true,
  criadoEm: true,
  escola: { select: { id: true, nome: true, bairro: true } },
}

export class UserModel {
  static async findAll({ role, escolaId } = {}) {
    return prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(escolaId ? { escolaId } : {}),
      },
      select: publicSelect,
      orderBy: { nome: 'asc' },
    })
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({ where: { id }, select: publicSelect })
    if (!user) throw new AppError('Usuario nao encontrado', 404)
    return user
  }

  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  }

  static async create({ senha, ...payload }) {
    const emailEmUso = await UserModel.findByEmail(payload.email)
    if (emailEmUso) throw new AppError('Ja existe um usuario com este email', 409)

    const senhaHash = await bcrypt.hash(senha, 10)
    return prisma.user.create({
      data: { ...payload, senha: senhaHash },
      select: publicSelect,
    })
  }

  static async update(id, { senha, ...payload }) {
    await UserModel.findById(id)
    return prisma.user.update({
      where: { id },
      data: {
        ...payload,
        ...(senha ? { senha: await bcrypt.hash(senha, 10) } : {}),
      },
      select: publicSelect,
    })
  }

  static async delete(id) {
    await UserModel.findById(id)
    await prisma.user.delete({ where: { id } })
  }
}
