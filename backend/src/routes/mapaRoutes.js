import { Router } from 'express'
import { MapaController } from '../controllers/MapaController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const mapaRoutes = Router()

mapaRoutes.get('/heatmap/ocorrencias', asyncHandler(MapaController.heatmap))
