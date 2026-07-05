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

export function obterEscola(id, options = {}) {
  return request(`/escolas/${id}`, options)
}

export function criarEscola(payload) {
  return request('/escolas', { method: 'POST', body: JSON.stringify(payload) })
}

export function atualizarEscola(id, payload) {
  return request(`/escolas/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function removerEscola(id) {
  return request(`/escolas/${id}`, { method: 'DELETE' })
}

export function listarUsuarios(filters = {}) {
  const params = new URLSearchParams(filters)
  const query = params.toString()
  return request(`/usuarios${query ? `?${query}` : ''}`)
}

export function criarUsuario(payload) {
  return request('/usuarios', { method: 'POST', body: JSON.stringify(payload) })
}

export function atualizarUsuario(id, payload) {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function removerUsuario(id) {
  return request(`/usuarios/${id}`, { method: 'DELETE' })
}

export function listarOcorrencias(filters = {}) {
  const params = new URLSearchParams(filters)
  const query = params.toString()
  return request(`/ocorrencias${query ? `?${query}` : ''}`)
}

export function obterOcorrencia(id) {
  return request(`/ocorrencias/${id}`)
}

export function criarOcorrencia(payload) {
  return request('/ocorrencias', { method: 'POST', body: JSON.stringify(payload) })
}

export function atualizarOcorrencia(id, payload) {
  return request(`/ocorrencias/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function adicionarInteracao(id, payload) {
  return request(`/ocorrencias/${id}/interacoes`, { method: 'POST', body: JSON.stringify(payload) })
}
