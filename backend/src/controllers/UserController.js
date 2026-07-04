import { UserModel } from '../models/UserModel.js'
import { AppError } from '../utils/AppError.js'

const ROLES = ['SEDUC', 'DIRETOR', 'EXTERNO']

function validateUserPayload(payload, { isUpdate = false } = {}) {
  const errors = {}

  if (!isUpdate || payload.nome !== undefined) {
    if (!payload.nome?.trim()) errors.nome = 'Informe o nome'
  }

  if (!isUpdate || payload.email !== undefined) {
    if (!payload.email?.trim()) errors.email = 'Informe o email'
  }

  if (!isUpdate || payload.senha !== undefined) {
    if (!isUpdate && !payload.senha) errors.senha = 'Informe a senha'
    if (payload.senha && payload.senha.length < 6) errors.senha = 'A senha deve ter ao menos 6 caracteres'
  }

  if (!isUpdate || payload.role !== undefined) {
    if (!ROLES.includes(payload.role)) errors.role = 'Perfil invalido'
  }

  const role = payload.role
  if (role && role !== 'SEDUC' && !payload.escolaId) {
    errors.escolaId = 'Informe a escola para este perfil'
  }
  if (role === 'SEDUC' && payload.escolaId) {
    errors.escolaId = 'Perfil SEDUC nao deve estar vinculado a uma escola'
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Dados invalidos', 422)
  }

  return {
    ...(payload.nome !== undefined ? { nome: payload.nome.trim() } : {}),
    ...(payload.email !== undefined ? { email: payload.email.trim().toLowerCase() } : {}),
    ...(payload.senha ? { senha: payload.senha } : {}),
    ...(payload.role !== undefined ? { role: payload.role } : {}),
    ...(payload.role !== undefined ? { escolaId: payload.role === 'SEDUC' ? null : payload.escolaId } : {}),
  }
}

export class UserController {
  static async getAll(request, response) {
    const { role, escolaId } = request.query
    const usuarios = await UserModel.findAll({ role, escolaId })
    return response.json(usuarios)
  }

  static async get(request, response) {
    const usuario = await UserModel.findById(request.params.id)
    return response.json(usuario)
  }

  static async create(request, response) {
    const payload = validateUserPayload(request.body)
    const usuario = await UserModel.create(payload)
    return response.status(201).json(usuario)
  }

  static async update(request, response) {
    const payload = validateUserPayload(request.body, { isUpdate: true })
    const usuario = await UserModel.update(request.params.id, payload)
    return response.json(usuario)
  }

  static async delete(request, response) {
    await UserModel.delete(request.params.id)
    return response.status(204).send()
  }
}
