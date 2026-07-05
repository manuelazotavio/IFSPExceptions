import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { EscolaModel } from '../models/EscolaModel.js'
import { UserModel } from '../models/UserModel.js'
import { AppError } from '../utils/AppError.js'
import { parseOrThrow } from '../utils/validate.js'
import { signToken } from '../utils/jwt.js'

const REGISTRO_ROLES = ['DIRETOR', 'EXTERNO']

const loginSchema = z.object({
  email: z.string({ message: 'Informe email e senha' }).trim().toLowerCase().min(1, 'Informe email e senha'),
  senha: z.string({ message: 'Informe email e senha' }).min(1, 'Informe email e senha'),
})

const registroSchema = z.object({
  nome: z.string({ message: 'Informe o nome' }).trim().min(1, 'Informe o nome'),
  email: z.string({ message: 'Informe o email' }).trim().toLowerCase().email('Email invalido'),
  senha: z.string({ message: 'Informe a senha' }).min(6, 'A senha deve ter ao menos 6 caracteres'),
  role: z.enum(REGISTRO_ROLES, { message: 'Perfil invalido' }),
  escolaId: z.string().trim().min(1).optional(),
}).refine((data) => !(data.role === 'DIRETOR' && !data.escolaId), {
  message: 'Informe a escola para este perfil',
  path: ['escolaId'],
})

function sanitizeUser(user) {
  const { senha, ...rest } = user
  return rest
}

export class AuthController {
  static async login(request, response) {
    const { email, senha } = parseOrThrow(loginSchema, request.body)

    const user = await UserModel.findByEmail(email)
    if (!user) throw new AppError('Email ou senha inválidos', 401)

    const senhaValida = await bcrypt.compare(senha, user.senha)
    if (!senhaValida) throw new AppError('Email ou senha inválidos', 401)
    if (!user.ativo) throw new AppError('Usuario inativo', 403)

    const usuario = sanitizeUser(user)
    const token = signToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      escolaId: usuario.escolaId,
    })

    return response.json({ user: usuario, token })
  }

  static async registro(request, response) {
    const payload = parseOrThrow(registroSchema, request.body)
    const escolaId = payload.role === 'DIRETOR' ? payload.escolaId : null

    if (escolaId) {
      await EscolaModel.findById(escolaId)
    }

    const usuario = await UserModel.create({ ...payload, escolaId })
    return response.status(201).json(usuario)
  }
}
