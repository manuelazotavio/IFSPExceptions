import { Router } from 'express'
import { EscolaController } from '../controllers/EscolaController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const escolaRoutes = Router()

escolaRoutes.get('/', asyncHandler(EscolaController.getAll))
escolaRoutes.get('/:id', asyncHandler(EscolaController.get))
escolaRoutes.get('/:id/ocorrencias', asyncHandler(EscolaController.getOcorrencias))
escolaRoutes.post('/', asyncHandler(EscolaController.create))
escolaRoutes.put('/:id', asyncHandler(EscolaController.update))
escolaRoutes.delete('/:id', asyncHandler(EscolaController.delete))
