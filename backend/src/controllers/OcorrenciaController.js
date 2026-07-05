import { z } from 'zod'
import { OcorrenciaModel } from '../models/OcorrenciaModel.js'
import { parseOrThrow } from '../utils/validate.js'

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
    return response.status(201).json(ocorrencia)
  }

  static async update(request, response) {
    const payload = parseOrThrow(atualizarOcorrenciaSchema, request.body)
    const ocorrencia = await OcorrenciaModel.update(request.params.id, payload)
    return response.json(ocorrencia)
  }

  static async addInteracao(request, response) {
    const payload = parseOrThrow(interacaoSchema, request.body)
    const ocorrencia = await OcorrenciaModel.addInteracao(request.params.id, payload)
    return response.status(201).json(ocorrencia)
  }

  static async delete(request, response) {
    await OcorrenciaModel.delete(request.params.id)
    return response.status(204).send()
  }
}
