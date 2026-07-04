import { EscolaModel } from '../models/EscolaModel.js'
import { AppError } from '../utils/AppError.js'

function validateEscolaPayload(payload) {
  const errors = {}

  if (!payload.nome?.trim()) errors.nome = 'Informe o nome da escola'
  if (!payload.bairro?.trim()) errors.bairro = 'Informe o bairro'
  if (!payload.endereco?.trim()) errors.endereco = 'Informe o endereco'

  const latitude = Number(payload.latitude)
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude invalida'
  }

  const longitude = Number(payload.longitude)
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude invalida'
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Dados invalidos', 422)
  }

  return {
    nome: payload.nome.trim(),
    bairro: payload.bairro.trim(),
    endereco: payload.endereco.trim(),
    latitude,
    longitude,
  }
}

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
    const payload = validateEscolaPayload(request.body)
    const escola = await EscolaModel.create(payload)
    return response.status(201).json(escola)
  }

  static async update(request, response) {
    const payload = validateEscolaPayload(request.body)
    const escola = await EscolaModel.update(request.params.id, payload)
    return response.json(escola)
  }

  static async delete(request, response) {
    await EscolaModel.delete(request.params.id)
    return response.status(204).send()
  }
}
