import { prisma } from '../database/prismaClient.js'

export class LogAuditoriaModel {
  static async registrar({ acao, entidade, entidadeId, descricao, escolaId, actor }) {
    return prisma.logAuditoria.create({
      data: {
        acao,
        entidade,
        entidadeId: entidadeId || null,
        descricao,
        escolaId: escolaId || null,
        usuarioEmail: actor?.email || null,
        usuarioNome: actor?.nome || null,
      },
    })
  }

  static async findAll({ escolaId } = {}) {
    return prisma.logAuditoria.findMany({
      where: {
        ...(escolaId ? { escolaId } : {}),
      },
      include: { escola: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 300,
    })
  }
}
