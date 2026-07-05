import { clearStoredUser, getStoredToken } from '../auth/session.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'

function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleSessaoExpirada() {
  clearStoredUser()
  window.location.hash = '/login'
  window.location.reload()
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
  })

  if (response.status === 401 && !path.startsWith('/auth/')) {
    handleSessaoExpirada()
  }

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
  if (payload.anexosArquivos?.length) {
    const formData = new FormData()
    formData.append('origem', payload.origem)
    formData.append('autor', payload.autor)
    formData.append('mensagem', payload.mensagem || '')
    if (payload.status) formData.append('status', payload.status)
    payload.anexosArquivos.forEach((arquivo) => formData.append('anexos', arquivo))
    return requestFormData(`/ocorrencias/${id}/interacoes`, formData)
  }

  return request(`/ocorrencias/${id}/interacoes`, { method: 'POST', body: JSON.stringify(payload) })
}

async function requestFormData(path, formData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers: authHeaders(),
  })

  if (response.status === 401 && !path.startsWith('/auth/')) {
    handleSessaoExpirada()
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || 'Erro inesperado')
  return data
}

export async function uploadFotosOcorrencia(id, arquivos) {
  const formData = new FormData()
  arquivos.forEach((arquivo) => formData.append('fotos', arquivo))

  const response = await fetch(`${API_URL}/ocorrencias/${id}/fotos`, { method: 'POST', body: formData, headers: authHeaders() })

  if (response.status === 401) {
    handleSessaoExpirada()
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || 'Erro inesperado')
  return data
}

export function listarAuditoria(filters = {}) {
  const params = new URLSearchParams(filters)
  const query = params.toString()
  return request(`/auditoria${query ? `?${query}` : ''}`)
}

export function listarNotificacoes(filters = {}) {
  const params = new URLSearchParams(filters)
  const query = params.toString()
  return request(`/notificacoes${query ? `?${query}` : ''}`)
}

export function marcarNotificacaoLida(id) {
  return request(`/notificacoes/${id}/lida`, { method: 'PATCH' })
}

export function marcarNotificacoesLidas(filters = {}) {
  const params = new URLSearchParams(filters)
  const query = params.toString()
  return request(`/notificacoes/lidas${query ? `?${query}` : ''}`, { method: 'PATCH' })
}
