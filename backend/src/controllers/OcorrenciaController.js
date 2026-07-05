import { z } from 'zod'
import { OcorrenciaModel } from '../models/OcorrenciaModel.js'
import { LogAuditoriaModel } from '../models/LogAuditoriaModel.js'
import { NotificacaoModel } from '../models/NotificacaoModel.js'
import { AppError } from '../utils/AppError.js'
import { parseOrThrow } from '../utils/validate.js'

function estaCriticaEmAberto(ocorrencia) {
  return ocorrencia.criticidade === 'Critica' && ocorrencia.status !== 'Resolvida'
}

function assertOcorrenciaAccess(user, ocorrencia) {
  if (user.role === 'DIRETOR' && ocorrencia.escolaId !== user.escolaId) {
    throw new AppError('Voce nao tem permissao para esta ocorrencia', 403)
  }
  if (user.role === 'EXTERNO' && ocorrencia.criadoPorEmail !== user.email) {
    throw new AppError('Voce nao tem permissao para esta ocorrencia', 403)
  }
}

const CRITICIDADES = ['Baixa', 'Media', 'Alta', 'Critica']
const STATUS_VALUES = ['Aguardando aprovacao', 'Aberta', 'Em analise', 'Em andamento', 'Aguardando visita tecnica', 'Resolvida']

const criarOcorrenciaSchema = z.object({
  escolaId: z.string({ message: 'Informe a escola' }).trim().min(1, 'Informe a escola'),
  titulo: z.string({ message: 'Informe o titulo' }).trim().min(1, 'Informe o titulo'),
  descricao: z.string().trim().default(''),
  tipo: z.string({ message: 'Informe o tipo' }).trim().min(1, 'Informe o tipo'),
  criticidade: z.enum(CRITICIDADES, { message: 'Criticidade invalida' }),
  localizacaoInterna: z.string().trim().default(''),
  endereco: z.string().trim().optional(),
  dataEnvio: z.string({ message: 'Informe a data de envio' }).trim().min(1, 'Informe a data de envio'),
  criadoPorEmail: z.string({ message: 'Email invalido' }).trim().toLowerCase().email('Email invalido'),
  criadoPorNome: z.string().trim().optional(),
  fotos: z.array(z.string()).optional(),
})

const atualizarOcorrenciaSchema = z.object({
  escolaId: z.string().trim().min(1, 'Informe a escola').optional(),
  titulo: z.string().trim().min(1, 'Informe o titulo').optional(),
  descricao: z.string().trim().optional(),
  tipo: z.string().trim().min(1, 'Informe o tipo').optional(),
  criticidade: z.enum(CRITICIDADES, { message: 'Criticidade invalida' }).optional(),
  status: z.enum(STATUS_VALUES, { message: 'Status invalido' }).optional(),
  localizacaoInterna: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  dataEnvio: z.string().trim().min(1).optional(),
  dataAprovacao: z.string().nullable().optional(),
  dataResolucao: z.string().nullable().optional(),
  chatPendente: z.boolean().optional(),
  fotos: z.array(z.string()).optional(),
})

const interacaoSchema = z.object({
  origem: z.string().trim().min(1, 'Informe a origem'),
  autor: z.string().trim().min(1, 'Informe o autor'),
  mensagem: z.string().trim().default(''),
  status: z.string().trim().optional(),
  anexos: z.array(z.union([
    z.string(),
    z.object({
      nome: z.string(),
      url: z.string(),
      tipo: z.string().optional(),
    }),
  ])).optional(),
}).refine((data) => data.mensagem || data.anexos?.length, {
  message: 'Informe a mensagem ou envie ao menos um anexo',
  path: ['mensagem'],
})

export class OcorrenciaController {
  static async getAll(request, response) {
    const filters = {
      escolaId: request.query.escolaId,
      criadoPorEmail: request.query.criadoPorEmail,
    }

    if (request.user?.role === 'DIRETOR') {
      filters.escolaId = request.user.escolaId
      filters.criadoPorEmail = undefined
    }

    if (request.user?.role === 'EXTERNO') {
      filters.escolaId = undefined
      filters.criadoPorEmail = request.user.email
    }

    const lista = await OcorrenciaModel.findAll(filters)
    return response.json(lista)
  }

  static async get(request, response) {
    const ocorrencia = await OcorrenciaModel.findById(request.params.id)
    if (request.user) assertOcorrenciaAccess(request.user, ocorrencia)
    return response.json(ocorrencia)
  }

  static async create(request, response) {
    const payload = parseOrThrow(criarOcorrenciaSchema, request.body)

    if (request.user.role === 'DIRETOR' && payload.escolaId !== request.user.escolaId) {
      throw new AppError('Voce so pode registrar ocorrencias da sua escola', 403)
    }
    if (request.user.role === 'EXTERNO') {
      payload.criadoPorEmail = request.user.email
      payload.status = 'Aguardando aprovacao'
      payload.aprovadaPelaEscola = false
    }

    const ocorrencia = await OcorrenciaModel.create(payload)
    await LogAuditoriaModel.registrar({
      acao: 'CRIAR',
      entidade: 'Ocorrencia',
      entidadeId: ocorrencia.id,
      descricao: `Ocorrencia ${ocorrencia.protocolo} "${ocorrencia.titulo}" criada`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })

    if (estaCriticaEmAberto(ocorrencia)) {
      await NotificacaoModel.criar({
        tipo: 'URGENTE',
        titulo: 'Ocorrência crítica registrada',
        descricao: `${ocorrencia.titulo} - ${ocorrencia.escola}`,
        protocolo: ocorrencia.protocolo,
        ocorrenciaId: ocorrencia.id,
        escolaId: ocorrencia.escolaId,
        criadoPorEmail: ocorrencia.criadoPorEmail,
      })
    }

    return response.status(201).json(ocorrencia)
  }

  static async update(request, response) {
    const payload = parseOrThrow(atualizarOcorrenciaSchema, request.body)
    const anterior = await OcorrenciaModel.findById(request.params.id)
    assertOcorrenciaAccess(request.user, anterior)
    if (request.user.role === 'EXTERNO') {
      throw new AppError('Usuarios externos podem apenas comentar na ocorrencia', 403)
    }
    if (request.user.role === 'DIRETOR' && payload.escolaId !== undefined && payload.escolaId !== request.user.escolaId) {
      throw new AppError('Voce so pode mover ocorrencias para a sua escola', 403)
    }

    let ocorrencia = await OcorrenciaModel.update(request.params.id, payload)
    await LogAuditoriaModel.registrar({
      acao: 'ATUALIZAR',
      entidade: 'Ocorrencia',
      entidadeId: ocorrencia.id,
      descricao: `Ocorrencia ${ocorrencia.protocolo} atualizada (status: ${ocorrencia.status}, criticidade: ${ocorrencia.criticidade})`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })

    if (payload.status !== undefined && payload.status !== anterior.status) {
      ocorrencia = await OcorrenciaModel.addInteracao(ocorrencia.id, {
        origem: 'sistema',
        autor: 'Sistema',
        mensagem: `Status atualizado para "${ocorrencia.status}".`,
        status: ocorrencia.status,
      })
    }

    if (estaCriticaEmAberto(ocorrencia) && !estaCriticaEmAberto(anterior)) {
      await NotificacaoModel.criar({
        tipo: 'URGENTE',
        titulo: 'Ocorrência crítica em aberto',
        descricao: `${ocorrencia.titulo} - ${ocorrencia.escola}`,
        protocolo: ocorrencia.protocolo,
        ocorrenciaId: ocorrencia.id,
        escolaId: ocorrencia.escolaId,
        criadoPorEmail: ocorrencia.criadoPorEmail,
      })
    }

    return response.json(ocorrencia)
  }

  static async uploadFotos(request, response) {
    const arquivos = request.files || []
    if (arquivos.length === 0) throw new AppError('Envie ao menos uma foto', 422)

    const atual = await OcorrenciaModel.findById(request.params.id)
    assertOcorrenciaAccess(request.user, atual)
    if (request.user.role === 'EXTERNO') {
      throw new AppError('Usuarios externos podem apenas comentar na ocorrencia', 403)
    }

    const baseUrl = `${request.protocol}://${request.get('host')}`
    const urls = arquivos.map((file) => `${baseUrl}/uploads/ocorrencias/${request.params.id}/${file.filename}`)

    const ocorrencia = await OcorrenciaModel.addFotos(request.params.id, urls)
    await LogAuditoriaModel.registrar({
      acao: 'ATUALIZAR',
      entidade: 'Ocorrencia',
      entidadeId: ocorrencia.id,
      descricao: `${urls.length} foto(s) adicionada(s) na ocorrencia ${ocorrencia.protocolo}`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })
    return response.status(201).json(ocorrencia)
  }

  static async addInteracao(request, response) {
    const baseUrl = `${request.protocol}://${request.get('host')}`
    const anexosUpload = (request.files || []).map((file) => ({
      nome: file.originalname,
      url: `${baseUrl}/uploads/ocorrencias/${request.params.id}/${file.filename}`,
      tipo: file.mimetype,
    }))
    const payload = parseOrThrow(interacaoSchema, {
      ...request.body,
      anexos: anexosUpload.length ? anexosUpload : request.body.anexos,
    })
    const atual = await OcorrenciaModel.findById(request.params.id)
    assertOcorrenciaAccess(request.user, atual)

    const ocorrencia = await OcorrenciaModel.addInteracao(request.params.id, payload)
    await LogAuditoriaModel.registrar({
      acao: 'CRIAR',
      entidade: 'Interacao',
      entidadeId: ocorrencia.id,
      descricao: `Mensagem registrada na ocorrencia ${ocorrencia.protocolo} por ${payload.autor}`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })

    await NotificacaoModel.criar({
      tipo: 'MOVIMENTACAO',
      titulo: 'Nova mensagem na ocorrência',
      descricao: `${payload.autor}: ${payload.mensagem}`,
      protocolo: ocorrencia.protocolo,
      ocorrenciaId: ocorrencia.id,
      escolaId: ocorrencia.escolaId,
      criadoPorEmail: ocorrencia.criadoPorEmail,
    })

    return response.status(201).json(ocorrencia)
  }

  static async delete(request, response) {
    const ocorrencia = await OcorrenciaModel.findById(request.params.id)
    assertOcorrenciaAccess(request.user, ocorrencia)
    if (request.user.role === 'EXTERNO') {
      throw new AppError('Usuarios externos podem apenas comentar na ocorrencia', 403)
    }
    await OcorrenciaModel.delete(request.params.id)
    await LogAuditoriaModel.registrar({
      acao: 'REMOVER',
      entidade: 'Ocorrencia',
      entidadeId: ocorrencia.id,
      descricao: `Ocorrencia ${ocorrencia.protocolo} removida`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })
    return response.status(204).send()
  }
}
