import { AppError } from './AppError.js'

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ')
    throw new AppError(message || 'Dados invalidos', 422)
  }
  return result.data
}
