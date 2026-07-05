import { useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { login } from '../services/api.js'

export function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await login(email, senha)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Icon name="school" className="h-5 w-5" />
          </div>
          <div>
            <strong className="block text-sm font-800 text-slate-950">Zela+</strong>
          </div>
        </div>

        <h1 className="text-xl font-800 text-slate-950">Entrar</h1>
        <p className="mt-1 text-sm text-slate-500">Acesse com seu email institucional.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@escola.gov.br"
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Senha</span>
            <input
              type="password"
              required
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="********"
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
            />
          </label>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-md bg-blue-600 text-sm font-800 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Nao tem uma conta?{' '}
          <button type="button" onClick={() => onNavigate('/cadastro')} className="cursor-pointer font-bold text-blue-700">
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  )
}
