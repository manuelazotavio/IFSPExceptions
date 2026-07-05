import { Router } from 'express'
import { AuditoriaController } from '../controllers/AuditoriaController.js'
import { authenticate, requireRole } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const auditoriaRoutes = Router()

auditoriaRoutes.use(authenticate, requireRole('SEDUC'))

auditoriaRoutes.get('/', asyncHandler(AuditoriaController.getAll))
