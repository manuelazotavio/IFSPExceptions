import { Router } from 'express'
import { escolaRoutes } from './escolaRoutes.js'

export const routes = Router()

routes.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

routes.use('/escolas', escolaRoutes)
