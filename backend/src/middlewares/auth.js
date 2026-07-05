import { AppError } from '../utils/AppError.js'
import { verifyToken } from '../utils/jwt.js'

export function authenticate(request, _response, next) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Nao autenticado', 401)
  }

  try {
    const payload = verifyToken(token)
    request.user = payload
    request.actor = { email: payload.email, nome: payload.nome }
    next()
  } catch {
    throw new AppError('Sessao invalida ou expirada', 401)
  }
}

export function optionalAuthenticate(request, _response, next) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    next()
    return
  }

  try {
    const payload = verifyToken(token)
    request.user = payload
    request.actor = { email: payload.email, nome: payload.nome }
  } catch {
    throw new AppError('Sessao invalida ou expirada', 401)
  }

  next()
}

export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError('Voce nao tem permissao para esta acao', 403)
    }
    next()
  }
}
