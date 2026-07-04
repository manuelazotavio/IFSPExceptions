import bcrypt from 'bcryptjs'
import { EscolaModel } from '../models/EscolaModel.js'
import { UserModel } from '../models/UserModel.js'
import { AppError } from '../utils/AppError.js'

const REGISTRO_ROLES = ['DIRETOR', 'EXTERNO']

function sanitizeUser(user) {
  const { senha, ...rest } = user
  return rest
}

export class AuthController {
  static async login(request, response) {
    const { email, senha } = request.body
    if (!email?.trim() || !senha) throw new AppError('Informe email e senha', 422)

    const user = await UserModel.findByEmail(email.trim().toLowerCase())
    if (!user) throw new AppError('Email ou senha invalidos', 401)

    const senhaValida = await bcrypt.compare(senha, user.senha)
    if (!senhaValida) throw new AppError('Email ou senha invalidos', 401)
    if (!user.ativo) throw new AppError('Usuario inativo', 403)

    return response.json({ user: sanitizeUser(user) })
  }

  static async registro(request, response) {
    const { nome, email, senha, role, escolaId } = request.body

    if (!nome?.trim()) throw new AppError('Informe o nome', 422)
    if (!email?.trim()) throw new AppError('Informe o email', 422)
    if (!senha || senha.length < 6) throw new AppError('A senha deve ter ao menos 6 caracteres', 422)
    if (!REGISTRO_ROLES.includes(role)) throw new AppError('Perfil invalido', 422)
    if (!escolaId) throw new AppError('Informe a escola', 422)

    await EscolaModel.findById(escolaId)

    const usuario = await UserModel.create({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      role,
      escolaId,
    })

    return response.status(201).json(usuario)
  }
}
