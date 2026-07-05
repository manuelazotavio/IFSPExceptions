import { Router } from 'express'
import { OcorrenciaController } from '../controllers/OcorrenciaController.js'
import { upload } from '../config/upload.js'
import { authenticate, optionalAuthenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const ocorrenciaRoutes = Router()

ocorrenciaRoutes.get('/', optionalAuthenticate, asyncHandler(OcorrenciaController.getAll))
ocorrenciaRoutes.get('/:id', optionalAuthenticate, asyncHandler(OcorrenciaController.get))
ocorrenciaRoutes.post('/', authenticate, asyncHandler(OcorrenciaController.create))
ocorrenciaRoutes.put('/:id', authenticate, asyncHandler(OcorrenciaController.update))
ocorrenciaRoutes.post('/:id/fotos', authenticate, upload.array('fotos', 10), asyncHandler(OcorrenciaController.uploadFotos))
ocorrenciaRoutes.post('/:id/interacoes', authenticate, asyncHandler(OcorrenciaController.addInteracao))
ocorrenciaRoutes.delete('/:id', authenticate, asyncHandler(OcorrenciaController.delete))
