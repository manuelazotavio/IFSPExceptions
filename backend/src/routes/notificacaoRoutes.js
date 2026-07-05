import { Router } from 'express'
import { NotificacaoController } from '../controllers/NotificacaoController.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const notificacaoRoutes = Router()

notificacaoRoutes.use(authenticate)

notificacaoRoutes.get('/', asyncHandler(NotificacaoController.getAll))
notificacaoRoutes.patch('/lidas', asyncHandler(NotificacaoController.marcarTodasLidas))
notificacaoRoutes.patch('/:id/lida', asyncHandler(NotificacaoController.marcarLida))
