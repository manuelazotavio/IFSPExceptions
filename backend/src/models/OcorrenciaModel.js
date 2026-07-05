import { prisma } from '../database/prismaClient.js'
import { AppError } from '../utils/AppError.js'

const includeRelacoes = {
  escola: { select: { nome: true, bairro: true, endereco: true } },
  interacoes: { orderBy: { criadoEm: 'asc' } },
}

function serialize(ocorrencia) {
  const { escola, interacoes, fotos, ...rest } = ocorrencia
  return {
    ...rest,
    escola: escola?.nome,
    bairro: escola?.bairro,
    fotos: JSON.parse(fotos || '[]'),
    interacoes: interacoes?.map((item) => ({
      ...item,
      anexos: JSON.parse(item.anexos || '[]'),
    })),
  }
}

async function proximoProtocolo() {
  const ano = new Date().getFullYear()
  const total = await prisma.ocorrencia.count()
  return `${ano}-${String(total + 1).padStart(4, '0')}`
}

export class OcorrenciaModel {
  static async findAll({ escolaId, criadoPorEmail } = {}) {
    const lista = await prisma.ocorrencia.findMany({
      where: {
        ...(escolaId ? { escolaId } : {}),
        ...(criadoPorEmail ? { criadoPorEmail } : {}),
      },
      include: includeRelacoes,
      orderBy: { dataEnvio: 'desc' },
    })
    return lista.map(serialize)
  }

  static async findById(id) {
    const ocorrencia = await prisma.ocorrencia.findUnique({ where: { id }, include: includeRelacoes })
    if (!ocorrencia) throw new AppError('Ocorrencia nao encontrada', 404)
    return serialize(ocorrencia)
  }

  static async create(payload) {
    const escola = await prisma.escola.findUnique({ where: { id: payload.escolaId } })
    if (!escola) throw new AppError('Escola nao encontrada', 404)

    const protocolo = await proximoProtocolo()
    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        protocolo,
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        criticidade: payload.criticidade,
        localizacaoInterna: payload.localizacaoInterna,
        endereco: payload.endereco || escola.endereco,
        dataEnvio: new Date(payload.dataEnvio),
        criadoPorEmail: payload.criadoPorEmail,
        escolaId: escola.id,
        interacoes: {
          create: [{ origem: 'sistema', autor: 'Sistema', mensagem: 'Ocorrencia aberta pela escola.' }],
        },
      },
      include: includeRelacoes,
    })
    return serialize(ocorrencia)
  }

  static async update(id, payload) {
    await OcorrenciaModel.findById(id)
    const ocorrencia = await prisma.ocorrencia.update({
      where: { id },
      data: {
        ...(payload.titulo !== undefined ? { titulo: payload.titulo } : {}),
        ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
        ...(payload.tipo !== undefined ? { tipo: payload.tipo } : {}),
        ...(payload.criticidade !== undefined ? { criticidade: payload.criticidade } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.localizacaoInterna !== undefined ? { localizacaoInterna: payload.localizacaoInterna } : {}),
        ...(payload.endereco !== undefined ? { endereco: payload.endereco } : {}),
        ...(payload.dataEnvio !== undefined ? { dataEnvio: new Date(payload.dataEnvio) } : {}),
        ...(payload.dataAprovacao !== undefined ? { dataAprovacao: payload.dataAprovacao ? new Date(payload.dataAprovacao) : null } : {}),
        ...(payload.dataResolucao !== undefined ? { dataResolucao: payload.dataResolucao ? new Date(payload.dataResolucao) : null } : {}),
        ...(payload.chatPendente !== undefined ? { chatPendente: payload.chatPendente } : {}),
      },
      include: includeRelacoes,
    })
    return serialize(ocorrencia)
  }

  static async addInteracao(id, payload) {
    await OcorrenciaModel.findById(id)
    await prisma.interacao.create({
      data: {
        ocorrenciaId: id,
        origem: payload.origem,
        autor: payload.autor,
        mensagem: payload.mensagem,
        anexos: JSON.stringify(payload.anexos || []),
      },
    })
    return OcorrenciaModel.findById(id)
  }

  static async delete(id) {
    await OcorrenciaModel.findById(id)
    await prisma.ocorrencia.delete({ where: { id } })
  }
}
