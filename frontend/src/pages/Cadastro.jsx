import { useState } from 'react'
import { registro } from '../services/api.js'

export function Cadastro({ onNavigate }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registro({ nome, email, senha, role: 'EXTERNO' })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-800 text-slate-950">Cadastro concluido</h1>
          <p className="mt-2 text-sm text-slate-500">Sua conta foi criada. Voce ja pode entrar.</p>
          <button className="cursor-pointer"
            type="button"
            onClick={() => onNavigate('/login')}
            className="mt-6 h-11 w-full cursor-pointer rounded-md bg-primary text-sm font-800 text-white transition hover:bg-primary-strong"
          >
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo_fundo_branco.svg" alt="ZelaMais" className="h-8 w-auto" />
        </div>

        <h1 className="text-xl font-800 text-slate-950">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-500">Cadastro para usuários externos da rede.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Nome</span>
            <input
              required
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Senha</span>
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full cursor-pointer rounded-md bg-primary text-sm font-800 text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ja tem uma conta?{' '}
          <button className="cursor-pointer" type="button" onClick={() => onNavigate('/login')} className="cursor-pointer font-bold text-primary-strong">
            Entrar
          </button>
        </p>
      </div>
    </div>
  )
}
