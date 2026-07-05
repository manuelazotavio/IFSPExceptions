export const env = {
  port: Number(process.env.PORT) || 3333,
  frontendOrigin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
}

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET nao configurado. Defina a variavel de ambiente JWT_SECRET.')
}
