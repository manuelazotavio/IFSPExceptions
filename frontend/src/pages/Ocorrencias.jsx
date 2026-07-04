import { useMemo, useState } from 'react'
import { bairros, categorias, criticidadeValues, escolas, ocorrenciasAprovadas, statusValues } from '../data/mockData.js'
import { diasEmAberto, sortOcorrencias } from '../utils/metrics.js'
import { Badge, Card, FilterSelect, Modal } from '../components/ui.jsx'
import { Pagination } from '../components/Pagination.jsx'

const CAMPOS_VAZIOS = { escolaId: '', titulo: '', tipo: '', criticidade: '', localizacaoInterna: '', descricao: '', dataEnvio: new Date().toISOString().slice(0, 10) }
const ITENS_POR_PAGINA = 10

const COR_LINHA_CRITICIDADE = {
  Critica: 'bg-red-500/15 hover:bg-red-500/25',
  Alta: 'bg-orange-500/15 hover:bg-orange-500/25',
  Media: 'bg-amber-400/15 hover:bg-amber-400/25',
  Baixa: 'bg-emerald-500/15 hover:bg-emerald-500/25',
}

export function Ocorrencias({ onNavigate }) {
  const [filters, setFilters] = useState({ bairro: '', status: '', criticidade: '', tipo: '' })
  const setFilter = (key, value) => { setFilters((prev) => ({ ...prev, [key]: value })); setPagina(1) }
  const [ocorrencias, setOcorrencias] = useState(ocorrenciasAprovadas)
  const [modalAberto, setModalAberto] = useState(false)
  const [novaOcorrencia, setNovaOcorrencia] = useState(CAMPOS_VAZIOS)
  const setCampo = (key, value) => setNovaOcorrencia((prev) => ({ ...prev, [key]: value }))
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)

  const lista = useMemo(() => sortOcorrencias(ocorrencias).filter((item) => {
    if (filters.bairro && item.bairro !== filters.bairro) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.criticidade && item.criticidade !== filters.criticidade) return false
    if (filters.tipo && item.tipo !== filters.tipo) return false
    if (busca && !`${item.escola} ${item.titulo}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }), [filters, ocorrencias, busca])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA))
  const listaPaginada = lista.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const formularioValido = novaOcorrencia.escolaId && novaOcorrencia.titulo && novaOcorrencia.tipo && novaOcorrencia.criticidade && novaOcorrencia.localizacaoInterna

  const cadastrarOcorrencia = () => {
    if (!formularioValido) return
    const escola = escolas.find((item) => item.id === novaOcorrencia.escolaId)
    const ocorrencia = {
      id: `occ-${Date.now()}`,
      escolaId: escola.id,
      escola: escola.nome,
      bairro: escola.bairro,
      endereco: escola.endereco,
      titulo: novaOcorrencia.titulo,
      descricao: novaOcorrencia.descricao,
      tipo: novaOcorrencia.tipo,
      criticidade: novaOcorrencia.criticidade,
      status: 'Aberta',
      localizacaoInterna: novaOcorrencia.localizacaoInterna,
      dataEnvio: novaOcorrencia.dataEnvio,
      dataAprovacao: '',
      dataResolucao: '',
      aprovadaPelaEscola: true,
      chatPendente: false,
      fotos: [],
      interacoes: [{ origem: 'sistema', autor: 'Sistema', data: novaOcorrencia.dataEnvio, mensagem: 'Ocorrencia aberta pela escola.' }],
    }
    // Front-only: sem backend ainda, guardamos no array compartilhado para a tela de detalhe enxergar o item.
    ocorrenciasAprovadas.push(ocorrencia)
    setOcorrencias((prev) => [...prev, ocorrencia])
    setNovaOcorrencia(CAMPOS_VAZIOS)
    setModalAberto(false)
  }

  const exportarCsv = () => {
    const cabecalho = ['Escola', 'Bairro', 'Tipo', 'Criticidade', 'Status', 'Localizacao', 'Envio']
    const linhas = lista.map((item) => [item.escola, item.bairro, item.tipo, item.criticidade, item.status, item.localizacaoInterna, item.dataEnvio])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'ocorrencias.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full mb-4">
        <div className="relative w-full flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar ocorrências..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm"
          />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={exportarCsv}
            className="w-full sm:w-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Exportar
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-sm leading-none">+</span> Nova ocorrência
          </button>
        </div>
      </div>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect label="Bairro" value={filters.bairro} onChange={(v) => setFilter('bairro', v)} options={bairros} />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={statusValues} />
          <FilterSelect label="Criticidade" value={filters.criticidade} onChange={(v) => setFilter('criticidade', v)} options={criticidadeValues} />
          <FilterSelect label="Tipo" value={filters.tipo} onChange={(v) => setFilter('tipo', v)} options={categorias} />
        </div>
      </Card>
      <div className="overflow-x-auto w-full overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
            <tr className="divide-x divide-slate-200">
              {['Escola', 'Bairro', 'Tipo', 'Criticidade', 'Status', 'Localizacao', 'Dias em aberto'].map((head) => (
                <th key={head} className="px-4 py-3">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {listaPaginada.map((item) => (
              <tr
                key={item.id}
                onClick={() => onNavigate(`/ocorrencias/${item.id}`)}
                className={`cursor-pointer divide-x divide-slate-200 border-x border-slate-200 ${COR_LINHA_CRITICIDADE[item.criticidade] || 'hover:bg-blue-50/40'}`}
              >
                <td className="px-4 py-3 font-bold text-slate-800">{item.escola}</td>
                <td className="px-4 py-3 text-slate-600">{item.bairro}</td>
                <td className="px-4 py-3 text-slate-600">{item.tipo}</td>
                <td className="px-4 py-3">{item.criticidade}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3 text-slate-600">{item.localizacaoInterna}</td>
                <td className="px-4 py-3 text-slate-600">{diasEmAberto(item.dataEnvio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pagina} totalPages={totalPaginas} onPageChange={setPagina} totalItems={lista.length} pageSize={ITENS_POR_PAGINA} />
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova ocorrencia">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Escola</span>
            <select value={novaOcorrencia.escolaId} onChange={(e) => setCampo('escolaId', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="">Selecione...</option>
              {escolas.map((escola) => <option key={escola.id} value={escola.id}>{escola.nome} - {escola.bairro}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Titulo</span>
            <input value={novaOcorrencia.titulo} onChange={(e) => setCampo('titulo', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Tipo</span>
              <select value={novaOcorrencia.tipo} onChange={(e) => setCampo('tipo', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
                <option value="">Selecione...</option>
                {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Criticidade</span>
              <select value={novaOcorrencia.criticidade} onChange={(e) => setCampo('criticidade', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
                <option value="">Selecione...</option>
                {criticidadeValues.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Localizacao interna</span>
              <input value={novaOcorrencia.localizacaoInterna} onChange={(e) => setCampo('localizacaoInterna', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Data de envio</span>
              <input type="date" value={novaOcorrencia.dataEnvio} onChange={(e) => setCampo('dataEnvio', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Descricao</span>
            <textarea value={novaOcorrencia.descricao} onChange={(e) => setCampo('descricao', e.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalAberto(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button>
            <button onClick={cadastrarOcorrencia} disabled={!formularioValido} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Cadastrar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
