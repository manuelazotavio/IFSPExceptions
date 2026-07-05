import { Router } from 'express'
import { OcorrenciaController } from '../controllers/OcorrenciaController.js'
import { upload } from '../config/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const ocorrenciaRoutes = Router()

ocorrenciaRoutes.get('/', asyncHandler(OcorrenciaController.getAll))
ocorrenciaRoutes.get('/:id', asyncHandler(OcorrenciaController.get))
ocorrenciaRoutes.post('/', asyncHandler(OcorrenciaController.create))
ocorrenciaRoutes.put('/:id', asyncHandler(OcorrenciaController.update))
ocorrenciaRoutes.post('/:id/fotos', upload.array('fotos', 10), asyncHandler(OcorrenciaController.uploadFotos))
ocorrenciaRoutes.post('/:id/interacoes', asyncHandler(OcorrenciaController.addInteracao))
ocorrenciaRoutes.delete('/:id', asyncHandler(OcorrenciaController.delete))
