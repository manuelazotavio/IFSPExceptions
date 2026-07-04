
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Erro na requisicao: ${res.status}`)
  return res.json()
}
