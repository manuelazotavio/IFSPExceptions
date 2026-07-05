import { useEffect, useState } from 'react'
import { dashboardMetrics, groupCount, sortOcorrencias } from '../utils/metrics.js'
import { listarEscolas, listarOcorrencias } from '../services/api.js'
import { BarList, Card } from '../components/ui.jsx'
import { Icon } from '../components/Icons.jsx'

function ThickBarList({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between text-sm font-semibold text-slate-600"><span>{item.label}</span><span>{item.value}</span></div>
          <div className="h-4 rounded-full bg-slate-100"><div className="h-4 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

const urgencyColumns = [
  { key: 'Baixa', label: 'Baixa', color: 'bg-emerald-500', hover: 'hover:bg-emerald-600' },
  { key: 'Media', label: 'Média', color: 'bg-amber-400', hover: 'hover:bg-amber-500' },
  { key: 'Alta', label: 'Alta', color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
  { key: 'Critica', label: 'Crítica', color: 'bg-red-600', hover: 'hover:bg-red-700' },
]

function NeighborhoodColumnChart({ data }) {
  const max = Math.max(...data.flatMap((item) => urgencyColumns.map((column) => item[column.key] || 0)), 1)
  const chartMax = Math.max(Math.ceil(max / 2) * 2, 2)
  const ticks = Array.from({ length: 5 }, (_, index) => Math.round((chartMax / 4) * (4 - index)))

  return (
    <div className="px-1 pb-1 pt-2">
      <div className="overflow-x-auto">
        <div className="grid min-w-[38rem] grid-cols-[34px_1fr] gap-3">
          <div className="flex h-64 flex-col justify-between pb-12 text-right text-xs font-semibold text-slate-400">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>

          <div className="relative h-64 border-b border-l border-slate-200">
            <div className="absolute inset-x-0 top-0 flex h-52 flex-col justify-between">
              {ticks.map((tick) => (
                <div key={tick} className="border-t border-slate-100" />
              ))}
            </div>

            <div className="relative flex h-full items-end gap-5 px-4">
              {data.map((item) => {
                return (
                  <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-48 w-full items-end justify-center gap-0.5">
                      {urgencyColumns.map((column) => {
                        const value = item[column.key] || 0
                        const height = value ? Math.max((value / chartMax) * 100, 8) : 0

                        return (
                          <div key={column.key} className="relative flex h-full w-3 items-end justify-center">
                            {value > 0 && (
                              <strong
                                className="absolute text-[10px] font-800 leading-none text-slate-600"
                                style={{ bottom: `calc(${height}% + 4px)` }}
                              >
                                {value}
                              </strong>
                            )}
                            <div
                              className={`w-full rounded-t-sm shadow-sm transition ${column.color} ${column.hover}`}
                              style={{ height: `${height}%` }}
                              title={`${item.label} - ${column.label}: ${value} ocorrências`}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <span className="line-clamp-2 min-h-9 text-center text-[11px] font-semibold leading-tight text-slate-500">
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
        {urgencyColumns.map((column) => (
          <span key={column.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${column.color}`} />
            {column.label}
          </span>
        ))}
      </div>
    </div>
  )
}

const labelMap = {
  Centro: 'Centro',
  'Martim de Sa': 'Martim de Sá',
  Massaguacu: 'Massaguaçu',
  'Porto Novo': 'Porto Novo',
  Travessao: 'Travessão',
  Tinga: 'Tinga',
  'Pereque-Mirim': 'Perequê-Mirim',
  Eletrica: 'Elétrica',
  Hidraulica: 'Hidráulica',
  Estrutural: 'Estrutural',
  Seguranca: 'Segurança',
  Acessibilidade: 'Acessibilidade',
  Equipamento: 'Equipamento',
  Mobiliario: 'Mobiliário',
  Limpeza: 'Limpeza',
  Tecnologia: 'Tecnologia',
  Outros: 'Outros',
  Critica: 'Crítica',
  Media: 'Média',
}

function formatLabel(label) {
  return (labelMap[label] || label)
    .replaceAll('Massaguacu', 'Massaguaçu')
    .replaceAll('Pereque-Mirim', 'Perequê-Mirim')
    .replaceAll('Martim de Sa', 'Martim de Sá')
    .replaceAll('ocorrencias', 'ocorrências')
    .replaceAll('Ocorrencias', 'Ocorrências')
    .replaceAll('Eletrica', 'Elétrica')
    .replaceAll('Hidraulica', 'Hidráulica')
    .replaceAll('Seguranca', 'Segurança')
    .replaceAll('Mobiliario', 'Mobiliário')
    .replaceAll('Infiltracao', 'Infiltração')
    .replaceAll('eletrico', 'elétrico')
    .replaceAll('faiscas', 'faíscas')
    .replaceAll('Portao', 'Portão')
    .replaceAll('analise', 'análise')
    .replaceAll('Iluminacao', 'Iluminação')
    .replaceAll('Area', 'Área')
    .replaceAll('agua', 'água')
}

export function Dashboard({ onNavigate, user }) {
  const isDiretor = user?.role === 'DIRETOR'
  const [escolas, setEscolas] = useState([])
  const [ocorrenciasAprovadas, setOcorrenciasAprovadas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      setCarregando(true)
      setErro('')
      try {
        const [escolasApi, ocorrenciasApi] = await Promise.all([
          listarEscolas(),
          listarOcorrencias(isDiretor && user?.escolaId ? { escolaId: user.escolaId } : {}),
        ])
        if (!ativo) return
        setEscolas(escolasApi)
        setOcorrenciasAprovadas(ocorrenciasApi.filter((item) => item.aprovadaPelaEscola))
      } catch (error) {
        if (ativo) setErro(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarDados()
    return () => {
      ativo = false
    }
  }, [isDiretor, user?.escolaId])

  const minhaEscola = isDiretor ? escolas.find((escola) => escola.id === user.escolaId) : null
  const escopo = isDiretor ? ocorrenciasAprovadas.filter((item) => item.escolaId === user.escolaId) : ocorrenciasAprovadas

  const [chartEscolaId, setChartEscolaId] = useState('')
  const metrics = dashboardMetrics(escopo, isDiretor ? 1 : escolas.length)
  const porBairro = Object.values(escopo.reduce((acc, item) => {
    const bairro = item.bairro
    if (!acc[bairro]) {
      acc[bairro] = { label: formatLabel(bairro), Baixa: 0, Media: 0, Alta: 0, Critica: 0 }
    }
    acc[bairro][item.criticidade] += 1
    return acc
  }, {}))
  const porTipo = Object.entries(groupCount(escopo, 'tipo')).map(([label, value]) => ({ label: formatLabel(label), value }))
  const ocorrenciasDoChart = isDiretor
    ? escopo
    : chartEscolaId
      ? escopo.filter((item) => item.escolaId === chartEscolaId)
      : escopo
  const porCriticidade = Object.entries(groupCount(ocorrenciasDoChart, 'criticidade')).map(([label, value]) => ({ label: formatLabel(label), value }))
  const chartEscola = isDiretor ? minhaEscola : escolas.find((escola) => escola.id === chartEscolaId)
  const escolasRank = escolas.map((escola) => ({
    ...escola,
    total: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id).length,
    criticas: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id && item.criticidade === 'Critica').length,
  })).sort((a, b) => b.total - a.total)

  if (carregando) {
    return <Card><p className="text-sm font-semibold text-slate-500">Carregando dados do dashboard...</p></Card>
  }

  return (
    <div className="space-y-6">
      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}
      <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${isDiretor ? 'xl:grid-cols-5' : 'xl:grid-cols-6'}`}>
        {!isDiretor && <StatCard label="Escolas" value={metrics.escolas} tone="pink" />}
        <StatCard label="Aprovadas" value={metrics.aprovadas} tone="primary" />
        <StatCard label="Abertas" value={metrics.abertas} tone="red" />
        <StatCard label="Em andamento" value={metrics.andamento} tone="amber" />
        <StatCard label="Resolvidas" value={metrics.resolvidas} tone="green" />
        <StatCard label="Críticas" value={metrics.criticas} tone="critical" />
      </div>

      <div className={`grid grid-cols-1 gap-4 ${isDiretor ? '' : 'xl:grid-cols-[420px_1fr]'}`}>
        <Card>
          <div className="mb-5 flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-800 text-slate-950">Ocorrências por criticidade</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {chartEscola
                  ? `Distribuição das ocorrências aprovadas em ${formatLabel(chartEscola.nome)}.`
                  : 'Distribuição geral das ocorrências aprovadas pela escola.'}
              </p>
            </div>
            {!isDiretor && <SchoolChartSelect value={chartEscolaId} onChange={setChartEscolaId} escolas={escolas} />}
          </div>
          <PieChart data={porCriticidade} />
        </Card>

        {!isDiretor && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-800 text-slate-950">Escolas com mais ocorrências</h2>
              <button onClick={() => onNavigate('/ocorrencias')} className="cursor-pointer text-sm font-bold text-primary-strong">Ver lista</button>
            </div>
            <div className="space-y-3">
              {escolasRank.slice(0, 5).map((escola) => (
                <div key={escola.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{formatLabel(escola.nome)}</p>
                    <p className="truncate text-sm text-slate-500">{formatLabel(escola.bairro)}</p>
                  </div>
                  <div className="shrink-0 text-right"><p className="font-800 text-slate-950">{escola.total}</p><p className="text-xs text-red-600">{escola.criticas} críticas</p></div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {!isDiretor && (
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Ocorrências por bairro</h2>
          <NeighborhoodColumnChart data={porBairro} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Ocorrências por tipo</h2>
          <BarList data={porTipo} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Prioridades mais antigas</h2>
          <div className="space-y-3">
            {sortOcorrencias(escopo).slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="block w-full cursor-pointer rounded-md border border-slate-100 px-3 py-2 text-left hover:bg-slate-50">
                <p className="font-bold text-slate-800">{formatLabel(item.titulo)}</p>
                <p className="text-sm text-slate-500">{formatLabel(item.escola)} - {item.dataEnvio}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 border-slate-200',
    blue: 'bg-primary-50 border-primary-100',
    green: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
    critical: 'bg-red-100 border-red-200',
    pink: 'bg-pink-50 border-pink-100'
  }

  return (
    <section className={`rounded-lg border p-5 ${tones[tone] || tones.slate}`}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-3 block text-3xl font-800 text-slate-950">{value}</strong>
    </section>
  )
}

function SchoolChartSelect({ value, onChange, escolas }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = escolas.find((escola) => escola.id === value)
  const label = selected ? formatLabel(selected.nome) : 'Geral'
  const bairro = selected ? formatLabel(selected.bairro) : 'Todas as escolas cadastradas'
  const normalizedSearch = search.trim().toLowerCase()
  const filteredEscolas = normalizedSearch
    ? escolas.filter((escola) => formatLabel(escola.nome).toLowerCase().includes(normalizedSearch))
    : escolas

  function selectValue(nextValue) {
    onChange(nextValue)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-left transition ${open ? 'border-primary-500 ring-4 ring-primary-50' : 'border-slate-200 hover:border-primary-300'
          }`}
      >
        <span className="min-w-0">
          <strong className="block truncate text-sm font-800 text-slate-900">{label}</strong>
          <span className="block truncate text-xs font-semibold text-slate-500">{bairro}</span>
        </span>
        <Icon name="chevron-down" className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          <div className="border-b border-slate-100 bg-white p-2">
            <label className="block">
              <span className="sr-only">Pesquisar escola</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                autoFocus
                placeholder="Pesquisar escola..."
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => selectValue('')}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm font-bold transition ${value === '' ? 'bg-primary-50 text-primary-strong' : 'text-slate-700 hover:bg-slate-50'
              }`}
          >
            <span>
              <span className="block">Geral</span>
              <span className="text-xs font-semibold text-slate-500">Todas as escolas cadastradas</span>
            </span>
            {value === '' && <span>✓</span>}
          </button>

          {filteredEscolas.map((escola) => (
            <button
              key={escola.id}
              type="button"
              onClick={() => selectValue(escola.id)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm font-bold transition ${value === escola.id ? 'bg-primary-50 text-primary-strong' : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{formatLabel(escola.nome)}</span>
                <span className="block truncate text-xs font-semibold text-slate-500">{formatLabel(escola.bairro)}</span>
              </span>
              {value === escola.id && <span className="ml-3">✓</span>}
            </button>
          ))}

          {filteredEscolas.length === 0 && (
            <div className="px-3 py-4 text-sm font-semibold text-slate-500">
              Nenhuma escola encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PieChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = {
    Baixa: '#16a34a',
    Média: '#f59e0b',
    Media: '#f59e0b',
    Alta: '#f97316',
    Crítica: '#dc2626',
    Critica: '#dc2626',
  }
  let offset = 25
  const activeItem = hovered ? data.find((item) => item.label === hovered) : null
  const activeLabel = activeItem ? formatLabel(activeItem.label) : null
  const activePercent = activeItem && total ? Math.round((activeItem.value / total) * 100) : null

  return (
    <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eef2f7" strokeWidth="8" />
          {data.map((item) => {
            const label = formatLabel(item.label)
            const value = total ? (item.value / total) * 100 : 0
            const isHovered = hovered === item.label
            const circle = (
              <circle
                key={item.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={colors[label] || colors[item.label] || '#64748b'}
                strokeWidth={isHovered ? '9.5' : '8'}
                strokeDasharray={`${value} ${100 - value}`}
                strokeDashoffset={offset}
                className="cursor-pointer transition-all duration-200"
                opacity={hovered && !isHovered ? 0.38 : 1}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
              />
            )
            offset -= value
            return circle
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <strong className="text-3xl font-800 text-slate-950">{activeItem ? activeItem.value : total}</strong>
          <span className="max-w-28 text-xs font-bold  text-slate-500">
            {activeItem ? `${activeLabel} · ${activePercent}%` : 'total'}
          </span>
        </div>
        {activeItem && (
          <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-lg">
            {activeLabel}: {activeItem.value} ocorrências ({activePercent}%)
          </div>
        )}
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const label = formatLabel(item.label)
          const percent = total ? Math.round((item.value / total) * 100) : 0
          const isHovered = hovered === item.label
          return (
            <div
              key={item.label}
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-1.5 transition ${isHovered ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${hovered && !isHovered ? 'opacity-45' : 'opacity-100'}`}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <i className={`h-3 w-3 rounded-full transition-transform ${isHovered ? 'scale-125' : ''}`} style={{ backgroundColor: colors[label] || colors[item.label] || '#64748b' }} />
                {label}
              </span>
              <span className="text-sm font-800 text-slate-950">{item.value} · {percent}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
