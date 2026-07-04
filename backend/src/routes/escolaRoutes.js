import { Router } from 'express'
import { EscolaController } from '../controllers/EscolaController.js'

export const escolaRoutes = Router()

escolaRoutes.get('/', EscolaController.getAll)
escolaRoutes.get('/:id', EscolaController.get)
escolaRoutes.post('/', EscolaController.create)
escolaRoutes.put('/:id', EscolaController.update)
escolaRoutes.delete('/:id', EscolaController.delete)
