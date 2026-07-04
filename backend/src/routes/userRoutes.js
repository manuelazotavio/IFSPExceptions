import { Router } from 'express'
import { UserController } from '../controllers/UserController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const userRoutes = Router()

userRoutes.get('/', asyncHandler(UserController.getAll))
userRoutes.get('/:id', asyncHandler(UserController.get))
userRoutes.post('/', asyncHandler(UserController.create))
userRoutes.put('/:id', asyncHandler(UserController.update))
userRoutes.delete('/:id', asyncHandler(UserController.delete))
