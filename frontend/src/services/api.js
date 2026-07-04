const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || `Erro na requisicao: ${response.status}`)
  }

  return data
}

export function get(path) {
  return request(path)
}

export function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function put(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function del(path) {
  return request(path, {
    method: 'DELETE',
  })
}
