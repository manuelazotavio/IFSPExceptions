import { Router } from 'express'
import { NotificacaoController } from '../controllers/NotificacaoController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const notificacaoRoutes = Router()

notificacaoRoutes.get('/', asyncHandler(NotificacaoController.getAll))
notificacaoRoutes.patch('/lidas', asyncHandler(NotificacaoController.marcarTodasLidas))
notificacaoRoutes.patch('/:id/lida', asyncHandler(NotificacaoController.marcarLida))
