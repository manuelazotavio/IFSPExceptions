import { NotificacaoModel } from '../models/NotificacaoModel.js'

export class NotificacaoController {
  static async getAll(request, response) {
    const { escolaId, criadoPorEmail } = request.query
    const ocultarAguardandoAprovacao = request.user?.role !== 'DIRETOR' && request.user?.role !== 'EXTERNO'
    const notificacoes = await NotificacaoModel.findAll({ escolaId, criadoPorEmail, ocultarAguardandoAprovacao })
    return response.json(notificacoes)
  }

  static async marcarLida(request, response) {
    const notificacao = await NotificacaoModel.marcarComoLida(request.params.id)
    return response.json(notificacao)
  }

  static async marcarTodasLidas(request, response) {
    const { escolaId, criadoPorEmail } = request.query
    await NotificacaoModel.marcarTodasComoLidas({ escolaId, criadoPorEmail })
    return response.status(204).send()
  }
}
