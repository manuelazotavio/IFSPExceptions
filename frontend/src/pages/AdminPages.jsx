import { useEffect, useMemo, useState } from 'react'
import { bairros, categorias, escolas, ocorrenciasAprovadas, usuarios } from '../data/mockData.js'
import { dashboardMetrics, getSchoolStats, groupCount } from '../utils/metrics.js'
import { Badge, BarList, Card, FilterSelect, MetricCard, Modal } from '../components/ui.jsx'

export function Escolas({ onNavigate, escolaIdFiltro = '' }) {
  const escolaFiltrada = escolaIdFiltro ? escolas.find((item) => item.id === escolaIdFiltro) : null
  const [filters, setFilters] = useState({
    busca: escolaFiltrada?.nome || '',
    bairro: escolaFiltrada?.bairro || '',
    status: escolaFiltrada?.status || '',
  })
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    setFilters({
      busca: escolaFiltrada?.nome || '',
      bairro: escolaFiltrada?.bairro || '',
      status: escolaFiltrada?.status || '',
    })
  }, [escolaFiltrada])

  const statusOptions = useMemo(() => [...new Set(escolas.map((escola) => escola.status))], [])
  const escolasFiltradas = useMemo(() => {
    const busca = filters.busca.trim().toLowerCase()

    return escolas.filter((escola) => {
      if (filters.bairro && escola.bairro !== filters.bairro) return false
      if (filters.status && escola.status !== filters.status) return false

      if (busca) {
        const texto = `${escola.nome} ${escola.bairro} ${escola.endereco}`.toLowerCase()
        if (!texto.includes(busca)) return false
      }

      return true
    })
  }, [filters])

  return (
    <div className="space-y-5">
      {escolaFiltrada ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Filtro aplicado pelo mapa</p>
            <p className="text-sm font-semibold text-slate-700">
              Exibindo a escola selecionada no mapa de calor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/escolas')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpar filtro
          </button>
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Busca</span>
            <input
              value={filters.busca}
              onChange={(event) => setFilter('busca', event.target.value)}
              placeholder="Nome, bairro ou endereco"
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            />
          </label>
          <FilterSelect label="Bairro" value={filters.bairro} onChange={(value) => setFilter('bairro', value)} options={bairros} />
          <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter('status', value)} options={statusOptions} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          {escolasFiltradas.length} de {escolas.length} escolas encontradas
        </p>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
              <tr>
                {['Nome', 'Bairro', 'Endereco', 'Status', 'Ocorrencias', 'Criticas', 'Cadastro'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {escolasFiltradas.map((escola) => {
                const stats = getSchoolStats(escola.id)
                return (
                  <tr
                    key={escola.id}
                    onClick={() => onNavigate(`/escolas/${escola.id}`)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 font-bold">{escola.nome}</td>
                    <td className="px-4 py-3">{escola.bairro}</td>
                    <td className="px-4 py-3">{escola.endereco}</td>
                    <td className="px-4 py-3"><Badge>{escola.status}</Badge></td>
                    <td className="px-4 py-3">{stats.total}</td>
                    <td className="px-4 py-3">{stats.criticas}</td>
                    <td className="px-4 py-3">{escola.dataCadastro}</td>
                  </tr>
                )
              })}
              {!escolasFiltradas.length && (
                <tr>
                  <td colSpan="7" className="border-t border-slate-100 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    Nenhuma escola encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function Indicadores() {
  const metrics = dashboardMetrics()
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Object.entries(metrics).map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-lg font-800">Por bairro</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'bairro')).map(([label, value]) => ({ label, value }))} /></Card><Card><h2 className="mb-4 text-lg font-800">Por criticidade</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'criticidade')).map(([label, value]) => ({ label, value }))} /></Card></div></div>
}

export function Usuarios() {
  return <Card className="p-0"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500"><tr>{['Nome', 'Email', 'Perfil', 'Status', 'Ultimo acesso'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{usuarios.map((user) => <tr key={user.email} className="border-t border-slate-100"><td className="px-4 py-3 font-bold">{user.nome}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.perfil}</td><td className="px-4 py-3"><Badge>{user.status}</Badge></td><td className="px-4 py-3">{user.ultimoAcesso}</td></tr>)}</tbody></table></Card>
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
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
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
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
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
              className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
