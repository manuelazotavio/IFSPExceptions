import { Router } from 'express'
import { OcorrenciaController } from '../controllers/OcorrenciaController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const ocorrenciaRoutes = Router()

ocorrenciaRoutes.get('/', asyncHandler(OcorrenciaController.getAll))
ocorrenciaRoutes.get('/:id', asyncHandler(OcorrenciaController.get))
ocorrenciaRoutes.post('/', asyncHandler(OcorrenciaController.create))
ocorrenciaRoutes.put('/:id', asyncHandler(OcorrenciaController.update))
ocorrenciaRoutes.post('/:id/interacoes', asyncHandler(OcorrenciaController.addInteracao))
ocorrenciaRoutes.delete('/:id', asyncHandler(OcorrenciaController.delete))
