export function actor(request, _response, next) {
  request.actor = {
    email: request.get('x-user-email') || null,
    nome: request.get('x-user-nome') || null,
  }
  next()
}
