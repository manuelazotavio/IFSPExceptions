const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || 'Erro inesperado')
  return data
}

export function login(email, senha) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) })
}

export function registro(payload) {
  return request('/auth/registro', { method: 'POST', body: JSON.stringify(payload) })
}

export function listarEscolas() {
  return request('/escolas')
}
