import { LogAuditoriaModel } from '../models/LogAuditoriaModel.js'

export class AuditoriaController {
  static async getAll(request, response) {
    const { escolaId } = request.query
    const logs = await LogAuditoriaModel.findAll({ escolaId })
    return response.json(logs.map((log) => ({ ...log, escola: log.escola?.nome })))
  }
}
