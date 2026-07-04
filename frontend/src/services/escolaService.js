import { del, get, post, put } from './api.js'

export async function listEscolas() {
  return get('/escolas')
}

export async function getEscola(id) {
  return get(`/escolas/${id}`)
}

export async function createEscola(payload) {
  return post('/escolas', payload)
}

export async function updateEscola(id, payload) {
  return put(`/escolas/${id}`, payload)
}

export async function deleteEscola(id) {
  return del(`/escolas/${id}`)
}
