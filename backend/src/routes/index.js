import { Router } from 'express'
import { auditoriaRoutes } from './auditoriaRoutes.js'
import { authRoutes } from './authRoutes.js'
import { escolaRoutes } from './escolaRoutes.js'
import { mapaRoutes } from './mapaRoutes.js'
import { ocorrenciaRoutes } from './ocorrenciaRoutes.js'
import { userRoutes } from './userRoutes.js'

export const routes = Router()

routes.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

routes.use('/auth', authRoutes)
routes.use('/escolas', escolaRoutes)
routes.use('/usuarios', userRoutes)
routes.use('/ocorrencias', ocorrenciaRoutes)
routes.use('/mapa', mapaRoutes)
routes.use('/auditoria', auditoriaRoutes)
