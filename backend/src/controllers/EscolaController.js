import { z } from 'zod'
import { EscolaModel } from '../models/EscolaModel.js'
import { parseOrThrow } from '../utils/validate.js'

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
    return response.status(201).json(escola)
  }

  static async update(request, response) {
    const payload = parseOrThrow(escolaSchema, request.body)
    const escola = await EscolaModel.update(request.params.id, payload)
    return response.json(escola)
  }

  static async delete(request, response) {
    await EscolaModel.delete(request.params.id)
    return response.status(204).send()
  }
}
