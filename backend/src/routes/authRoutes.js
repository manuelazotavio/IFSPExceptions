import { Router } from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authRoutes = Router()

authRoutes.post('/login', asyncHandler(AuthController.login))
authRoutes.post('/registro', asyncHandler(AuthController.registro))
