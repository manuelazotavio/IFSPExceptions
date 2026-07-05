import { z } from 'zod'
import { UserModel } from '../models/UserModel.js'
import { parseOrThrow } from '../utils/validate.js'

const ROLES = ['SEDUC', 'DIRETOR', 'EXTERNO']

const userFieldsSchema = z.object({
  nome: z.string({ message: 'Informe o nome' }).trim().min(1, 'Informe o nome'),
  email: z.string({ message: 'Informe o email' }).trim().toLowerCase().email('Email invalido'),
  senha: z.string({ message: 'Informe a senha' }).min(6, 'A senha deve ter ao menos 6 caracteres'),
  role: z.enum(ROLES, { message: 'Perfil invalido' }),
  escolaId: z.string().trim().min(1).nullable().optional(),
})

function comRegraDeEscola(schema) {
  return schema
    .refine((data) => !(data.role === 'SEDUC' && data.escolaId), {
      message: 'Perfil SEDUC nao deve estar vinculado a uma escola',
      path: ['escolaId'],
    })
    .refine((data) => !(data.role && data.role !== 'SEDUC' && !data.escolaId), {
      message: 'Informe a escola para este perfil',
      path: ['escolaId'],
    })
    .transform((data) => ({
      ...data,
      ...(data.role !== undefined ? { escolaId: data.role === 'SEDUC' ? null : data.escolaId } : {}),
    }))
}

const criarUserSchema = comRegraDeEscola(userFieldsSchema)
const atualizarUserSchema = comRegraDeEscola(userFieldsSchema.partial())

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
    const payload = parseOrThrow(criarUserSchema, request.body)
    const usuario = await UserModel.create(payload)
    return response.status(201).json(usuario)
  }

  static async update(request, response) {
    const payload = parseOrThrow(atualizarUserSchema, request.body)
    const usuario = await UserModel.update(request.params.id, payload)
    return response.json(usuario)
  }

  static async delete(request, response) {
    await UserModel.delete(request.params.id)
    return response.status(204).send()
  }
}
