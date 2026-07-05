import { useEffect, useState } from 'react'
import { categorias } from '../data/mockData.js'
import { dashboardMetrics, groupCount } from '../utils/metrics.js'
import { atualizarUsuario, listarAuditoria, listarEscolas, listarOcorrencias, listarUsuarios } from '../services/api.js'
import { Badge, BarList, Card, FilterSelect, MetricCard, Modal, Select } from '../components/ui.jsx'

export function Indicadores() {
  const [escolas, setEscolas] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])

  useEffect(() => {
    let ativo = true
    Promise.all([listarEscolas(), listarOcorrencias()])
      .then(([escolasApi, ocorrenciasApi]) => {
        if (!ativo) return
        setEscolas(escolasApi)
        setOcorrencias(ocorrenciasApi.filter((item) => item.aprovadaPelaEscola))
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  const metrics = dashboardMetrics(ocorrencias, escolas.length)
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Object.entries(metrics).map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-lg font-800">Por bairro</h2><BarList data={Object.entries(groupCount(ocorrencias, 'bairro')).map(([label, value]) => ({ label, value }))} /></Card><Card><h2 className="mb-4 text-lg font-800">Por criticidade</h2><BarList data={Object.entries(groupCount(ocorrencias, 'criticidade')).map(([label, value]) => ({ label, value }))} /></Card></div></div>
}

const PERMISSOES = [
  { value: 'SEDUC', label: 'SEDUC' },
  { value: 'DIRETOR', label: 'Diretor(a)' },
  { value: 'EXTERNO', label: 'Externo' },
]

export function Usuarios() {
  const [lista, setLista] = useState([])
  const [escolas, setEscolas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const [usuariosApi, escolasApi] = await Promise.all([listarUsuarios(), listarEscolas()])
        if (!ativo) return
        setLista(usuariosApi)
        setEscolas(escolasApi)
      } catch (error) {
        if (ativo) setErro(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  async function persistirUsuario(usuario) {
    try {
      const atualizado = await atualizarUsuario(usuario.id, { role: usuario.role, escolaId: usuario.escolaId })
      setLista((prev) => prev.map((item) => (item.id === usuario.id ? atualizado : item)))
    } catch (error) {
      setErro(error.message)
    }
  }

  function alterarPermissao(id, role) {
    const usuario = lista.find((item) => item.id === id)
    if (!usuario) return
    const atualizado = { ...usuario, role, escolaId: role === 'SEDUC' ? null : usuario.escolaId }
    setLista((prev) => prev.map((item) => (item.id === id ? atualizado : item)))
    persistirUsuario(atualizado)
  }

  function alterarEscola(id, escolaId) {
    const usuario = lista.find((item) => item.id === id)
    if (!usuario) return
    const atualizado = { ...usuario, escolaId: escolaId || null }
    setLista((prev) => prev.map((item) => (item.id === id ? atualizado : item)))
    persistirUsuario(atualizado)
  }

  return (
    <div className="space-y-3">
      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}
      {carregando ? (
        <p className="text-sm font-semibold text-slate-500">Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full min-w-[900px] border-collapse rounded-2 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
              <tr className="divide-x divide-slate-200">
                {['Nome', 'Email', 'Permissão', 'Escola vinculada', 'Status', 'Cadastro'].map((head) => (
                  <th key={head} className="px-4 py-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lista.map((user) => (
                <tr key={user.id} className="divide-x divide-slate-200 border-x border-slate-200">
                  <td className="px-4 py-3 font-bold text-slate-800">{user.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Select value={user.role} onChange={(value) => alterarPermissao(user.id, value)} options={PERMISSOES} className="inline-block w-auto min-w-[10rem]" />
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'DIRETOR' ? (
                      <Select
                        value={user.escolaId || ''}
                        onChange={(value) => alterarEscola(user.id, value)}
                        placeholder="Sem vinculo"
                        options={escolas.map((escola) => ({ value: escola.id, label: escola.nome }))}
                        className="w-full max-w-56"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge>{user.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{user.criadoEm?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const ACAO_CLASSES = {
  CRIAR: 'bg-emerald-50 text-emerald-700',
  ATUALIZAR: 'bg-blue-50 text-blue-700',
  REMOVER: 'bg-red-50 text-red-700',
}

export function Auditoria() {
  const [logs, setLogs] = useState([])
  const [escolas, setEscolas] = useState([])
  const [escolaId, setEscolaId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    listarEscolas().then((dados) => { if (ativo) setEscolas(dados) }).catch(() => {})
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const dados = await listarAuditoria(escolaId ? { escolaId } : {})
        if (ativo) setLogs(dados)
      } catch (error) {
        if (ativo) setErro(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => { ativo = false }
  }, [escolaId])

  const nomesEscolas = escolas.map((escola) => escola.nome)

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <FilterSelect
          label="Escola"
          value={escolas.find((escola) => escola.id === escolaId)?.nome || ''}
          onChange={(nome) => setEscolaId(escolas.find((escola) => escola.nome === nome)?.id || '')}
          options={nomesEscolas}
        />
      </div>

      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}

      {carregando ? (
        <p className="text-sm font-semibold text-slate-500">Carregando log de auditoria...</p>
      ) : (
        <div className="overflow-x-auto w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full min-w-[900px] border-collapse rounded-2 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
              <tr className="divide-x divide-slate-200">
                {['Data/Hora', 'Ação', 'Entidade', 'Descrição', 'Usuário', 'Escola'].map((head) => (
                  <th key={head} className="px-4 py-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="divide-x divide-slate-200 border-x border-slate-200">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {new Date(log.criadoEm).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${ACAO_CLASSES[log.acao] || 'bg-slate-100 text-slate-700'}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{log.entidade}</td>
                  <td className="px-4 py-3 text-slate-600">{log.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{log.usuarioNome || log.usuarioEmail || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{log.escola || '—'}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function Categorias() {
  const [lista, setLista] = useState(categorias)
  const [modalAberto, setModalAberto] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [ocorrencias, setOcorrencias] = useState([])

  useEffect(() => {
    let ativo = true
    listarOcorrencias()
      .then((dados) => { if (ativo) setOcorrencias(dados) })
      .catch(() => { if (ativo) setOcorrencias([]) })
    return () => {
      ativo = false
    }
  }, [])

  const contagem = groupCount(ocorrencias, 'tipo')

  function adicionarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome || lista.includes(nome)) return
    setLista((prev) => [...prev, nome])
    setNovaCategoria('')
    setModalAberto(false)
  }

  function removerCategoria(nome) {
    setLista((prev) => prev.filter((item) => item !== nome))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button className="cursor-pointer"
          type="button"
          onClick={() => setModalAberto(true)}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-strong"
        >
          + Nova categoria
        </button>
      </div>
      <div className="overflow-x-auto w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full min-w-[600px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
            <tr className="divide-x divide-slate-200">
              {['Nome', 'Ocorrências', 'Status', ''].map((head) => (
                <th key={head} className="px-4 py-3">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lista.map((categoria) => (
              <tr key={categoria} className="divide-x divide-slate-200 border-x border-slate-200">
                <td className="px-4 py-3 font-bold text-slate-800">{categoria}</td>
                <td className="px-4 py-3">{contagem[categoria] || 0}</td>
                <td className="px-4 py-3"><Badge>Global</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button className="cursor-pointer" type="button" onClick={() => removerCategoria(categoria)} className="cursor-pointer text-sm font-bold text-red-600 hover:underline">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova categoria">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nome</span>
            <input
              value={novaCategoria}
              onChange={(event) => setNovaCategoria(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button className="cursor-pointer" type="button" onClick={() => setModalAberto(false)} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
              Cancelar
            </button>
            <button
              type="button"
              onClick={adicionarCategoria}
              disabled={!novaCategoria.trim()}
              className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function Configuracoes() {
  return <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-800">Preferências gerais</h2><div className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Notificar novas ocorrências críticas</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Destacar escolas com pendências</label><label className="flex items-center gap-2"><input type="checkbox" /> Receber resumo diário mockado</label></div></Card><Card><h2 className="text-lg font-800">Mapa e auditoria</h2><p className="mt-3 text-sm text-slate-500">Configurações mockadas para visualização de bairros, marcadores e logs administrativos.</p><div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">Última sincronização visual: 04/07/2026 13:40</div></Card></div>
}
