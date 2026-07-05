import { z } from 'zod'
import { prisma } from '../database/prismaClient.js'
import { EscolaModel } from '../models/EscolaModel.js'
import { LogAuditoriaModel } from '../models/LogAuditoriaModel.js'
import { parseOrThrow } from '../utils/validate.js'

function bucketCriticidade(criticidade) {
  if (criticidade === 'Critica') return 'CRITICA'
  if (criticidade === 'Baixa') return 'BAIXA'
  return 'ATENCAO'
}

const escolaSchema = z.object({
  nome: z.string({ message: 'Informe o nome da escola' }).trim().min(1, 'Informe o nome da escola'),
  bairro: z.string({ message: 'Informe o bairro' }).trim().min(1, 'Informe o bairro'),
  endereco: z.string({ message: 'Informe o endereco' }).trim().min(1, 'Informe o endereco'),
  latitude: z.coerce.number({ message: 'Latitude invalida' }).min(-90, 'Latitude invalida').max(90, 'Latitude invalida'),
  longitude: z.coerce.number({ message: 'Longitude invalida' }).min(-180, 'Longitude invalida').max(180, 'Longitude invalida'),
})

export class EscolaController {
  static async getAll(_request, response) {
    const escolas = await EscolaModel.findAll()
    return response.json(escolas)
  }

  static async get(request, response) {
    const escola = await EscolaModel.findById(request.params.id)
    return response.json(escola)
  }

  static async create(request, response) {
    const payload = parseOrThrow(escolaSchema, request.body)
    const escola = await EscolaModel.create(payload)
    await LogAuditoriaModel.registrar({
      acao: 'CRIAR',
      entidade: 'Escola',
      entidadeId: escola.id,
      descricao: `Escola "${escola.nome}" cadastrada`,
      escolaId: escola.id,
      actor: request.actor,
    })
    return response.status(201).json(escola)
  }

  static async update(request, response) {
    const payload = parseOrThrow(escolaSchema, request.body)
    const escola = await EscolaModel.update(request.params.id, payload)
    await LogAuditoriaModel.registrar({
      acao: 'ATUALIZAR',
      entidade: 'Escola',
      entidadeId: escola.id,
      descricao: `Escola "${escola.nome}" atualizada`,
      escolaId: escola.id,
      actor: request.actor,
    })
    return response.json(escola)
  }

  static async delete(request, response) {
    const escola = await EscolaModel.findById(request.params.id)
    await EscolaModel.delete(request.params.id)
    await LogAuditoriaModel.registrar({
      acao: 'REMOVER',
      entidade: 'Escola',
      entidadeId: escola.id,
      descricao: `Escola "${escola.nome}" removida`,
      escolaId: null,
      actor: request.actor,
    })
    return response.status(204).send()
  }

  static async getOcorrencias(request, response) {
    const escola = await EscolaModel.findById(request.params.id)

    const ocorrencias = await prisma.ocorrencia.findMany({
      where: { escolaId: escola.id, aprovadaPelaEscola: true },
      orderBy: { dataEnvio: 'desc' },
    })

    let criticas = 0
    let atencao = 0
    let baixas = 0
    for (const ocorrencia of ocorrencias) {
      const grupo = bucketCriticidade(ocorrencia.criticidade)
      if (grupo === 'CRITICA') criticas += 1
      else if (grupo === 'BAIXA') baixas += 1
      else atencao += 1
    }

    return response.json({
      escola: {
        id: escola.id,
        nome: escola.nome,
        endereco: escola.endereco,
        latitude: escola.latitude,
        longitude: escola.longitude,
        totalOcorrencias: ocorrencias.length,
        criticas,
        atencao,
        baixas,
      },
      ocorrencias: ocorrencias.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        criticidade: item.criticidade,
        status: item.status,
        data: item.dataEnvio.toISOString().slice(0, 10),
        descricao: item.descricao,
      })),
    })
  }
}
