import { useState } from 'react'
import { categorias, ocorrenciasAprovadas, usuarios } from '../data/mockData.js'
import { dashboardMetrics, groupCount } from '../utils/metrics.js'
import { Badge, BarList, Card, MetricCard, Modal } from '../components/ui.jsx'

export function Indicadores() {
  const metrics = dashboardMetrics()
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Object.entries(metrics).map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-lg font-800">Por bairro</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'bairro')).map(([label, value]) => ({ label, value }))} /></Card><Card><h2 className="mb-4 text-lg font-800">Por criticidade</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'criticidade')).map(([label, value]) => ({ label, value }))} /></Card></div></div>
}

const PERMISSOES = [
  { value: 'SEDUC', label: 'SEDUC' },
  { value: 'DIRETOR', label: 'Diretor(a)' },
  { value: 'EXTERNO', label: 'Externo' },
]

export function Usuarios() {
  const [lista, setLista] = useState(usuarios)

  function alterarPermissao(email, role) {
    setLista((prev) => prev.map((user) => (user.email === email ? { ...user, role } : user)))
  }

  return (
    <div className="overflow-x-auto w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
      <table className="w-full min-w-[800px] border-collapse rounded-2 text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
          <tr className="divide-x divide-slate-200">
            {['Nome', 'Email', 'Permissão', 'Status', 'Último acesso'].map((head) => (
              <th key={head} className="px-4 py-3">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {lista.map((user) => (
            <tr key={user.email} className="divide-x divide-slate-200 border-x border-slate-200">
              <td className="px-4 py-3 font-bold text-slate-800">{user.nome}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(event) => alterarPermissao(user.email, event.target.value)}
                  className="h-10 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
                >
                  {PERMISSOES.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
                </select>
              </td>
              <td className="px-4 py-3"><Badge>{user.status}</Badge></td>
              <td className="px-4 py-3 text-slate-600">{user.ultimoAcesso}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Categorias() {
  const [lista, setLista] = useState(categorias)
  const [modalAberto, setModalAberto] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const contagem = groupCount(ocorrenciasAprovadas, 'tipo')

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
        <button
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
              {['Nome', 'Ocorrencias', 'Status', ''].map((head) => (
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
                  <button type="button" onClick={() => removerCategoria(categoria)} className="cursor-pointer text-sm font-bold text-red-600 hover:underline">
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
            <button type="button" onClick={() => setModalAberto(false)} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
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
  return <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-800">Preferencias gerais</h2><div className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Notificar novas ocorrencias criticas</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Destacar escolas com pendencias</label><label className="flex items-center gap-2"><input type="checkbox" /> Receber resumo diario mockado</label></div></Card><Card><h2 className="text-lg font-800">Mapa e auditoria</h2><p className="mt-3 text-sm text-slate-500">Configuracoes mockadas para visualizacao de bairros, marcadores e logs administrativos.</p><div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">Ultima sincronizacao visual: 04/07/2026 13:40</div></Card></div>
}
