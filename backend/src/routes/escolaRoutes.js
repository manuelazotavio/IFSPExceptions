import { Router } from 'express'
import { EscolaController } from '../controllers/EscolaController.js'
import { authenticate, requireRole } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const escolaRoutes = Router()

escolaRoutes.get('/', asyncHandler(EscolaController.getAll))
escolaRoutes.get('/:id', asyncHandler(EscolaController.get))
escolaRoutes.get('/:id/ocorrencias', asyncHandler(EscolaController.getOcorrencias))
escolaRoutes.post('/', authenticate, requireRole('SEDUC'), asyncHandler(EscolaController.create))
escolaRoutes.put('/:id', authenticate, requireRole('SEDUC'), asyncHandler(EscolaController.update))
escolaRoutes.delete('/:id', authenticate, requireRole('SEDUC'), asyncHandler(EscolaController.delete))
