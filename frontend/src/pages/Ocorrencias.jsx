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

export function Ocorrencias({ onNavigate, user }) {
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const [filters, setFilters] = useState({ bairro: '', status: '', criticidade: '', tipo: '', tratativa: '' })
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))
  const base = isExterno
    ? ocorrenciasAprovadas.filter((item) => item.criadoPorEmail === user.email)
    : isDiretor
      ? ocorrenciasAprovadas.filter((item) => item.escolaId === user.escolaId)
      : ocorrenciasAprovadas
  const lista = useMemo(() => sortOcorrencias(base).filter((item) => {
    if (isExterno) return true
    if (!isDiretor && filters.bairro && item.bairro !== filters.bairro) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.criticidade && item.criticidade !== filters.criticidade) return false
    if (filters.tipo && item.tipo !== filters.tipo) return false
    if (filters.tratativa === 'Pendente' && !item.tratativaPendente) return false
    if (filters.tratativa === 'Sem pendencia' && item.tratativaPendente) return false
    return true
  }), [base, filters, isExterno, isDiretor])

  return (
    <div className="space-y-5">
      {!isExterno && (
        <Card>
          <div className={`grid gap-3 ${isDiretor ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}>
            {!isDiretor && <FilterSelect label="Bairro" value={filters.bairro} onChange={(v) => setFilter('bairro', v)} options={bairros} />}
            <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={statusValues} />
            <FilterSelect label="Criticidade" value={filters.criticidade} onChange={(v) => setFilter('criticidade', v)} options={criticidadeValues} />
            <FilterSelect label="Tipo" value={filters.tipo} onChange={(v) => setFilter('tipo', v)} options={categorias} />
            <FilterSelect label="Tratativa" value={filters.tratativa} onChange={(v) => setFilter('tratativa', v)} options={['Pendente', 'Sem pendencia']} />
          </div>
        </Card>
      )}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-800 uppercase tracking-wide text-slate-500">
              <tr>
                {['Escola', 'Bairro', 'Titulo', 'Tipo', 'Criticidade', 'Status', 'Localizacao', 'Envio', 'Aprovacao', 'Pendencias'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => (
                <tr key={item.id} onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="cursor-pointer border-b border-slate-100 hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-bold text-slate-800">{item.escola}</td>
                  <td className="px-4 py-3 text-slate-600">{item.bairro}</td>
                  <td className="px-4 py-3 text-slate-700">{item.titulo}</td>
                  <td className="px-4 py-3 text-slate-600">{item.tipo}</td>
                  <td className="px-4 py-3"><Badge>{item.criticidade}</Badge></td>
                  <td className="px-4 py-3"><Badge>{item.status}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{item.localizacaoInterna}</td>
                  <td className="px-4 py-3 text-slate-600">{item.dataEnvio}</td>
                  <td className="px-4 py-3 text-slate-600">{item.dataAprovacao}</td>
                  <td className="px-4 py-3 text-slate-600">{item.chatPendente ? 'Chat' : ''} {item.tratativaPendente ? 'Tratativa' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
