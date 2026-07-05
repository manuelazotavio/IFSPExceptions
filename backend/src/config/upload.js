import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import multer from 'multer'

export const uploadsDir = join(process.cwd(), 'uploads')

const storage = multer.diskStorage({
  destination: (request, _file, callback) => {
    const dir = join(uploadsDir, 'ocorrencias', request.params.id)
    mkdirSync(dir, { recursive: true })
    callback(null, dir)
  },
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${extname(file.originalname)}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'))
  },
})
