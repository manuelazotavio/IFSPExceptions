import { z } from 'zod'
import { OcorrenciaModel } from '../models/OcorrenciaModel.js'
import { LogAuditoriaModel } from '../models/LogAuditoriaModel.js'
import { NotificacaoModel } from '../models/NotificacaoModel.js'
import { AppError } from '../utils/AppError.js'
import { parseOrThrow } from '../utils/validate.js'

function estaCriticaEmAberto(ocorrencia) {
  return ocorrencia.criticidade === 'Critica' && ocorrencia.status !== 'Resolvida'
}

const CRITICIDADES = ['Baixa', 'Media', 'Alta', 'Critica']
const STATUS_VALUES = ['Aberta', 'Em analise', 'Em andamento', 'Aguardando orcamento', 'Aguardando visita tecnica', 'Resolvida']

const criarOcorrenciaSchema = z.object({
  escolaId: z.string({ message: 'Informe a escola' }).trim().min(1, 'Informe a escola'),
  titulo: z.string({ message: 'Informe o titulo' }).trim().min(1, 'Informe o titulo'),
  descricao: z.string().trim().default(''),
  tipo: z.string({ message: 'Informe o tipo' }).trim().min(1, 'Informe o tipo'),
  criticidade: z.enum(CRITICIDADES, { message: 'Criticidade invalida' }),
  localizacaoInterna: z.string({ message: 'Informe a localizacao' }).trim().min(1, 'Informe a localizacao'),
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
  localizacaoInterna: z.string().trim().min(1, 'Informe a localizacao').optional(),
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
  mensagem: z.string().trim().min(1, 'Informe a mensagem'),
  status: z.string().trim().optional(),
  anexos: z.array(z.string()).optional(),
})

export class OcorrenciaController {
  static async getAll(request, response) {
    const { escolaId, criadoPorEmail } = request.query
    const lista = await OcorrenciaModel.findAll({ escolaId, criadoPorEmail })
    return response.json(lista)
  }

  static async get(request, response) {
    const ocorrencia = await OcorrenciaModel.findById(request.params.id)
    return response.json(ocorrencia)
  }

  static async create(request, response) {
    const payload = parseOrThrow(criarOcorrenciaSchema, request.body)
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
    const ocorrencia = await OcorrenciaModel.update(request.params.id, payload)
    await LogAuditoriaModel.registrar({
      acao: 'ATUALIZAR',
      entidade: 'Ocorrencia',
      entidadeId: ocorrencia.id,
      descricao: `Ocorrencia ${ocorrencia.protocolo} atualizada (status: ${ocorrencia.status}, criticidade: ${ocorrencia.criticidade})`,
      escolaId: ocorrencia.escolaId,
      actor: request.actor,
    })

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
    const payload = parseOrThrow(interacaoSchema, request.body)
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
