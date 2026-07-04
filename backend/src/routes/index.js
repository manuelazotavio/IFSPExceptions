import { Router } from 'express'
import { escolaRoutes } from './escolaRoutes.js'
import { userRoutes } from './userRoutes.js'

export const routes = Router()

routes.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

routes.use('/escolas', escolaRoutes)
routes.use('/usuarios', userRoutes)
