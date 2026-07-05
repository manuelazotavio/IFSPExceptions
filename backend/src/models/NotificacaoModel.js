import { prisma } from '../database/prismaClient.js'

export class NotificacaoModel {
  static async criar({ tipo, titulo, descricao, protocolo, ocorrenciaId, escolaId, criadoPorEmail }) {
    return prisma.notificacao.create({
      data: {
        tipo,
        titulo,
        descricao,
        protocolo: protocolo || null,
        ocorrenciaId: ocorrenciaId || null,
        escolaId: escolaId || null,
        criadoPorEmail: criadoPorEmail || null,
      },
    })
  }

  static async findAll({ escolaId, criadoPorEmail } = {}) {
    return prisma.notificacao.findMany({
      where: {
        ...(escolaId ? { escolaId } : {}),
        ...(criadoPorEmail ? { criadoPorEmail } : {}),
      },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    })
  }

  static async marcarComoLida(id) {
    return prisma.notificacao.update({ where: { id }, data: { lida: true } })
  }

  static async marcarTodasComoLidas({ escolaId, criadoPorEmail } = {}) {
    await prisma.notificacao.updateMany({
      where: {
        lida: false,
        ...(escolaId ? { escolaId } : {}),
        ...(criadoPorEmail ? { criadoPorEmail } : {}),
      },
      data: { lida: true },
    })
  }
}
