import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { uploadsDir } from './config/upload.js'
import { actor } from './middlewares/actor.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { routes } from './routes/index.js'

export const app = express()

app.use(cors({ origin: env.frontendOrigin }))
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(uploadsDir))
app.use(actor)
app.use('/api', routes)
app.use(errorHandler)
