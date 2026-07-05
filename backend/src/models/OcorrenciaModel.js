import { prisma } from '../database/prismaClient.js'
import { AppError } from '../utils/AppError.js'

const includeRelacoes = {
  escola: { select: { nome: true, bairro: true, endereco: true } },
  interacoes: { orderBy: { criadoEm: 'asc' } },
}

function serializeInteracao(interacao) {
  const { criadoEm, anexos, ...rest } = interacao
  return {
    ...rest,
    data: criadoEm.toISOString().slice(0, 10),
    hora: criadoEm.toISOString().slice(11, 16),
    anexos: JSON.parse(anexos || '[]'),
  }
}

function toDateStr(date) {
  return date ? date.toISOString().slice(0, 10) : null
}

function serialize(ocorrencia) {
  const { escola, interacoes, fotos, atualizadoEm, dataEnvio, dataAprovacao, dataResolucao, ...rest } = ocorrencia
  return {
    ...rest,
    dataEnvio: toDateStr(dataEnvio),
    dataAprovacao: toDateStr(dataAprovacao),
    dataResolucao: toDateStr(dataResolucao),
    atualizadoEm,
    ultimaAtualizacao: atualizadoEm.toISOString().slice(0, 10),
    escola: escola?.nome,
    bairro: escola?.bairro,
    fotos: JSON.parse(fotos || '[]'),
    interacoes: interacoes?.map(serializeInteracao),
  }
}

async function proximoProtocolo() {
  let protocolo
  let existente = true

  while (existente) {
    protocolo = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    existente = await prisma.ocorrencia.findUnique({ where: { protocolo } })
  }

  return protocolo
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
        ...(payload.status ? { status: payload.status } : {}),
        localizacaoInterna: payload.localizacaoInterna,
        endereco: payload.endereco || escola.endereco,
        dataEnvio: new Date(payload.dataEnvio),
        ...(payload.aprovadaPelaEscola !== undefined ? { aprovadaPelaEscola: payload.aprovadaPelaEscola } : {}),
        criadoPorEmail: payload.criadoPorEmail,
        criadoPorNome: payload.criadoPorNome || '',
        fotos: JSON.stringify(payload.fotos || []),
        escolaId: escola.id,
        interacoes: {
          create: [{
            origem: 'sistema',
            autor: 'Sistema',
            mensagem: payload.status === 'Aguardando aprovacao' ? 'Ocorrencia enviada e aguardando aprovacao.' : 'Ocorrencia aberta pela escola.',
            status: payload.status || 'Aberta',
            anexos: '[]',
          }],
        },
      },
      include: includeRelacoes,
    })
    return serialize(ocorrencia)
  }

  static async update(id, payload) {
    await OcorrenciaModel.findById(id)

    let escolaDestino = null
    if (payload.escolaId !== undefined) {
      escolaDestino = await prisma.escola.findUnique({ where: { id: payload.escolaId } })
      if (!escolaDestino) throw new AppError('Escola nao encontrada', 404)
    }

    const ocorrencia = await prisma.ocorrencia.update({
      where: { id },
      data: {
        ...(escolaDestino ? { escolaId: escolaDestino.id, endereco: payload.endereco || escolaDestino.endereco } : {}),
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
        ...(payload.fotos !== undefined ? { fotos: JSON.stringify(payload.fotos) } : {}),
      },
      include: includeRelacoes,
    })
    return serialize(ocorrencia)
  }

  static async addFotos(id, urls) {
    const atual = await prisma.ocorrencia.findUnique({ where: { id } })
    if (!atual) throw new AppError('Ocorrencia nao encontrada', 404)

    const fotosAtuais = JSON.parse(atual.fotos || '[]')
    const ocorrencia = await prisma.ocorrencia.update({
      where: { id },
      data: { fotos: JSON.stringify([...fotosAtuais, ...urls]) },
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
        status: payload.status,
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
