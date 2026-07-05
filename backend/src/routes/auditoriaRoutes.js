import { Router } from 'express'
import { AuditoriaController } from '../controllers/AuditoriaController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const auditoriaRoutes = Router()

auditoriaRoutes.get('/', asyncHandler(AuditoriaController.getAll))
