import { Router } from 'express'
import { MapaController } from '../controllers/MapaController.js'
import { authenticate } from '../middlewares/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const mapaRoutes = Router()

mapaRoutes.use(authenticate)

mapaRoutes.get('/heatmap/ocorrencias', asyncHandler(MapaController.heatmap))
