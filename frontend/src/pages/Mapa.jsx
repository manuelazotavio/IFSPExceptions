import { useMemo, useState } from 'react'
import { bairros, escolas, ocorrenciasAprovadas, statusValues, criticidadeValues, categorias } from '../data/mockData.js'
import { getSchoolSeverity, getSchoolStats, sortOcorrencias } from '../utils/metrics.js'
import { Badge, Card, FilterSelect, MetricCard } from '../components/ui.jsx'

const colors = { red: 'bg-red-600', yellow: 'bg-amber-500', green: 'bg-emerald-600' }

export function Mapa({ onNavigate }) {
  const [bairro, setBairro] = useState('')
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [criticidade, setCriticidade] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')

  const filteredSchools = useMemo(() => escolas.filter((escola) => !bairro || escola.bairro === bairro), [bairro])
  const totalAbertas = ocorrenciasAprovadas.filter((item) => item.status !== 'Resolvida').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Escolas no mapa" value={filteredSchools.length} />
        <MetricCard label="Ocorrencias abertas" value={totalAbertas} tone="red" />
        <MetricCard label="Bairros" value={bairros.length} />
        <MetricCard label="Criticas abertas" value={ocorrenciasAprovadas.filter((o) => o.criticidade === 'Critica' && o.status !== 'Resolvida').length} tone="red" />
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect label="Bairro" value={bairro} onChange={setBairro} options={bairros} />
          <FilterSelect label="Criticidade" value={criticidade} onChange={setCriticidade} options={criticidadeValues} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statusValues} />
          <FilterSelect label="Tipo" value={tipo} onChange={setTipo} options={categorias} />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="relative min-h-[520px] overflow-hidden">
          <div className="absolute inset-5 rounded-2xl border border-blue-100 bg-blue-50/50" />
          {bairros.map((item, index) => (
            <button
              key={item}
              onClick={() => setBairro(bairro === item ? '' : item)}
              className={`absolute rounded-xl border px-5 py-4 text-sm font-bold transition ${
                bairro === item ? 'border-blue-500 bg-white text-blue-700 shadow-sm' : 'border-slate-200 bg-white/80 text-slate-500'
              }`}
              style={{ left: `${8 + (index % 3) * 28}%`, top: `${12 + Math.floor(index / 3) * 28}%` }}
            >
              {item}
            </button>
          ))}
          {escolas.map((escola) => {
            const severity = getSchoolSeverity(escola.id)
            const faded = bairro && escola.bairro !== bairro
            return (
              <button
                key={escola.id}
                onClick={() => setSelectedSchool(escola)}
                className={`absolute h-5 w-5 rounded-full border-2 border-white shadow transition ${colors[severity]} ${faded ? 'opacity-25' : 'opacity-100 ring-2 ring-white'}`}
                style={{ left: `${escola.x}%`, top: `${escola.y}%` }}
                title={escola.nome}
              />
            )
          })}
          <div className="absolute bottom-5 left-5 flex gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-emerald-600" /> Baixa</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-amber-500" /> Atencao</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-red-600" /> Critica</span>
          </div>
        </Card>
        <SchoolSidePanel escola={selectedSchool} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

function SchoolSidePanel({ escola, onNavigate }) {
  if (!escola) return <Card><p className="text-sm font-semibold text-slate-500">Clique em uma escola no mapa para abrir o resumo da unidade.</p></Card>
  const stats = getSchoolStats(escola.id)
  const ocorrencias = sortOcorrencias(ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id)).slice(0, 4)
  return (
    <Card className="h-fit">
      <h2 className="text-xl font-800 text-slate-950">{escola.nome}</h2>
      <p className="mt-1 text-sm text-slate-500">{escola.bairro} - {escola.endereco}</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <MetricMini label="Total" value={stats.total} />
        <MetricMini label="Abertas" value={stats.abertas} />
        <MetricMini label="Criticas" value={stats.criticas} />
      </div>
      <h3 className="mt-6 mb-3 text-sm font-800  text-slate-500">Principais problemas</h3>
      <div className="space-y-3">
        {ocorrencias.map((item) => (
          <button key={item.id} onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="w-full rounded-md border border-slate-100 p-3 text-left hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-800">{item.titulo}</p><Badge>{item.criticidade}</Badge></div>
            <p className="mt-1 text-sm text-slate-500">{item.status} - {item.dataEnvio}</p>
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        <button onClick={() => onNavigate('/escolas')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Acessar detalhes da escola</button>
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Ver ocorrencias da escola</button>
      </div>
    </Card>
  )
}

function MetricMini({ label, value }) {
  return <div className="rounded-md bg-slate-50 p-3 text-center"><strong className="block text-xl font-800 text-slate-950">{value}</strong><span className="text-xs font-bold text-slate-500">{label}</span></div>
}
