import { useEffect, useState } from 'react'
import exteriorImage from '../assets/school-exterior.png'
import courtyardImage from '../assets/school-courtyard.png'
import corridorImage from '../assets/school-corridor.png'
import { Icon } from '../components/Icons.jsx'
import { listarEscolas, listarOcorrencias } from '../services/api.js'

const niceLabels = {
  Indaia: 'Indaia',
  'Jardim California': 'Jardim California',
  Tinga: 'Tinga',
  'Porto Novo': 'Porto Novo',
  Massaguacu: 'Massaguacu',
  'Pereque Mirim': 'Pereque Mirim',
  'Martim de Sa': 'Martim de Sa',
  Travessao: 'Travessao',
  Eletrica: 'Eletrica',
  Hidraulica: 'Hidraulica',
  Estrutural: 'Estrutural',
  Seguranca: 'Seguranca',
  Acessibilidade: 'Acessibilidade',
  Equipamento: 'Equipamento',
  Mobiliario: 'Mobiliario',
  Limpeza: 'Limpeza',
  Tecnologia: 'Tecnologia',
  Outros: 'Outros',
}

function formatLabel(value) {
  return niceLabels[value] || value
}

function uniqueCount(items, key) {
  return new Set(items.map((item) => item[key])).size
}

function positiveMetrics(escolas, ocorrenciasAprovadas) {
  const resolvidas = ocorrenciasAprovadas.filter((item) => item.status === 'Resolvida')
  const emTratativa = ocorrenciasAprovadas.filter((item) => item.status !== 'Aberta' && item.status !== 'Resolvida')
  const bairros = uniqueCount(escolas, 'bairro')
  const categorias = uniqueCount(ocorrenciasAprovadas, 'tipo')
  const diasResolucao = resolvidas
    .map((item) => {
      if (!item.dataResolucao) return null
      const inicio = new Date(`${item.dataEnvio}T00:00:00`)
      const fim = new Date(`${item.dataResolucao}T00:00:00`)
      return Math.max(1, Math.round((fim - inicio) / (1000 * 60 * 60 * 24)))
    })
    .filter(Boolean)
  const mediaResolucao = diasResolucao.length
    ? Math.round(diasResolucao.reduce((sum, value) => sum + value, 0) / diasResolucao.length)
    : 0

  return {
    escolas: escolas.length,
    bairros,
    acompanhadas: ocorrenciasAprovadas.length,
    resolvidas: resolvidas.length,
    emTratativa: emTratativa.length,
    categorias,
    mediaResolucao,
  }
}

function categoryHighlights(ocorrenciasAprovadas) {
  const counts = ocorrenciasAprovadas.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label: formatLabel(label), value }))
}

function neighborhoodCoverage(escolas, ocorrenciasAprovadas) {
  return escolas.slice(0, 6).map((escola) => ({
    id: escola.id,
    nome: escola.nome,
    bairro: formatLabel(escola.bairro),
    total: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id).length,
  }))
}

function goodNewsChartData(metrics, ocorrenciasAprovadas) {
  const movimentadas = ocorrenciasAprovadas.filter((item) => item.status !== 'Aberta').length
  const encaminhadas = ocorrenciasAprovadas.filter((item) => (
    item.status === 'Em andamento'
    || item.status === 'Aguardando orcamento'
    || item.status === 'Aguardando visita tecnica'
    || item.status === 'Resolvida'
  )).length

  return [
    { label: 'Escolas ativas', value: metrics.escolas, detail: 'unidades', tone: 'sky' },
    { label: 'Bairros cobertos', value: metrics.bairros, detail: 'territorios', tone: 'teal' },
    { label: 'Registros acompanhados', value: metrics.acompanhadas, detail: 'solicitacoes', tone: 'blue' },
    { label: 'Tratativas movimentadas', value: movimentadas, detail: 'com andamento', tone: 'emerald' },
    { label: 'Encaminhamentos tecnicos', value: encaminhadas, detail: 'em fluxo ativo', tone: 'amber' },
  ]
}

export function Landing({ onNavigate, user }) {
  const [escolas, setEscolas] = useState([])
  const [ocorrenciasAprovadas, setOcorrenciasAprovadas] = useState([])

  useEffect(() => {
    let ativo = true
    Promise.all([listarEscolas(), listarOcorrencias()])
      .then(([escolasApi, ocorrenciasApi]) => {
        if (!ativo) return
        setEscolas(escolasApi)
        setOcorrenciasAprovadas(ocorrenciasApi.filter((item) => item.aprovadaPelaEscola))
      })
      .catch(() => {
        if (ativo) {
          setEscolas([])
          setOcorrenciasAprovadas([])
        }
      })
    return () => {
      ativo = false
    }
  }, [])

  const metrics = positiveMetrics(escolas, ocorrenciasAprovadas)
  const categorias = categoryHighlights(ocorrenciasAprovadas)
  const cobertura = neighborhoodCoverage(escolas, ocorrenciasAprovadas)
  const dadosBons = goodNewsChartData(metrics, ocorrenciasAprovadas)
  const primaryRoute = '/login'

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden bg-slate-950 text-white">
        <img
          src={exteriorImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-62"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/72 to-teal-950/20" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <button className="cursor-pointer"
            type="button"
            onClick={() => onNavigate('/publico')}
            className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-left"
          >
            <span className="flex h-10 items-center rounded-md px-2.5">
              <img src="/geo/logo_fundo_escuro.svg" alt="Escola em Dia" className="h-6 w-auto" />
            </span>
            <span className="block text-xs font-semibold text-slate-200">Rede municipal monitorada</span>
          </button>

          <nav className="flex items-center gap-2">
           
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-20 text-center lg:px-8 lg:pb-28 lg:pt-28">
          <div>
            <p className="mb-5 inline-flex rounded-md bg-emerald-400/18 px-3 py-1 text-sm font-800 text-emerald-100 ring-1 ring-emerald-200/25">
              Transparencia com foco no que esta andando bem
            </p>
            <h1 className="mx-auto max-w-4xl text-5xl font-800 leading-tight tracking-normal md:text-7xl">
              Escola em Dia
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-100">
              Um panorama publico dos avancos da manutencao escolar: escolas acompanhadas, bairros atendidos,
              melhorias concluidas e frentes de trabalho em movimento.
            </p>
            <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
              <button className="cursor-pointer"
                type="button"
                onClick={() => onNavigate(primaryRoute)}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-300 px-6 text-sm font-800 text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200"
              >
                <Icon name="chart" className="h-4 w-4" />
                Entrar
              </button>
              <button className="cursor-pointer"
                type="button"
                onClick={() => onNavigate('/login')}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/30 px-5 text-sm font-800 text-white transition hover:bg-white/10"
              >
                <Icon name="plus" className="h-4 w-4" />
                Enviar solicitacao
              </button>
            </div>
          </div>

          <div className="mt-14 grid w-full max-w-3xl gap-3 rounded-lg border border-white/14 bg-slate-950/36 p-3 backdrop-blur-sm sm:grid-cols-3">
            <HeroInlineStat label="Escolas ativas" value={metrics.escolas} />
            <HeroInlineStat label="Bairros cobertos" value={metrics.bairros} />
            <HeroInlineStat label="Melhorias concluidas" value={metrics.resolvidas} />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <SignalCard icon="school" label="Rede acompanhada" value={`${metrics.escolas} unidades`} text={`${metrics.bairros} bairros com escolas ativas no monitoramento.`} />
          <SignalCard icon="chart" label="Trabalho em movimento" value={`${metrics.emTratativa} tratativas`} text="Demandas ja analisadas, encaminhadas ou em execucao pelas equipes." />
          <SignalCard icon="tag" label="Visão organizada" value={`${metrics.categorias} temas`} text="Categorias padronizadas para priorizar investimento e manutenção." />
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-800 uppercase text-primary-strong">Dados publicos selecionados</p>
            <h2 className="mt-3 text-3xl font-800 leading-tight text-slate-950 md:text-4xl">
              Indicadores que ajudam a comunidade a enxergar progresso.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              A area publica mostra apenas informacoes agregadas e construtivas. O detalhe operacional fica protegido
              no painel interno, onde a equipe acompanha prioridades, mensagens e histórico.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Tempo medio das conclusoes" value={`${metrics.mediaResolucao} dias`} />
              <MiniMetric label="Solicitacoes aprovadas" value={metrics.acompanhadas} />
            </div>

            <GoodNewsChart data={dadosBons} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <img src={courtyardImage} alt="" className="h-72 w-full rounded-lg object-cover shadow-sm md:h-full" />
            <div className="grid gap-4">
              <img src={corridorImage} alt="" className="h-48 w-full rounded-lg object-cover shadow-sm" />
              <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-800 text-slate-950">Principais frentes atendidas</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Temas com mais acompanhamento publico consolidado.
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-800 text-emerald-700">
                    {categorias.length} frentes
                  </span>
                </div>
                <div className="mt-5 flex-1 space-y-4">
                  {categorias.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm font-bold text-slate-600">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(item.value / categorias[0].value) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-md bg-slate-50 p-4">
                  <strong className="block text-2xl font-800 text-slate-950">{metrics.emTratativa}</strong>
                  <span className="mt-1 block text-sm font-bold text-slate-500">
                    tratativas ja analisadas, encaminhadas ou em execucao
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div>
              <p className="text-sm font-800 uppercase text-cyan-200">Cobertura territorial</p>
              <h2 className="mt-3 text-3xl font-800">Escolas visiveis por bairro</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cobertura.map((escola) => (
              <article key={escola.id} className="rounded-lg border border-white/12 bg-white/8 p-4">
                <p className="text-sm font-bold text-cyan-100">{escola.bairro}</p>
                <h3 className="mt-2 min-h-12 text-base font-800 leading-6 text-white">{escola.nome}</h3>
                <p className="mt-4 text-sm font-semibold text-slate-300">{escola.total} registros acompanhados pela rede</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function SignalCard({ icon, label, value, text }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-strong">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <strong className="block text-xl font-800 text-slate-950">{value}</strong>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{text}</p>
    </article>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <strong className="block text-3xl font-800 text-slate-950">{value}</strong>
      <span className="mt-2 block text-sm font-bold text-slate-500">{label}</span>
    </div>
  )
}

function HeroInlineStat({ label, value }) {
  return (
    <div className="rounded-md bg-white/10 px-4 py-3">
      <strong className="block text-2xl font-800 text-white">{value}</strong>
      <span className="mt-1 block text-xs font-bold leading-4 text-slate-300">{label}</span>
    </div>
  )
}

function GoodNewsChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  const tones = {
    sky: 'from-sky-400 to-cyan-300',
    teal: 'from-teal-400 to-emerald-300',
    blue: 'from-primary-500 to-sky-300',
    emerald: 'from-emerald-500 to-lime-300',
    amber: 'from-amber-400 to-orange-300',
  }

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-800 uppercase text-cyan-200">Grafico positivo</p>
          <h3 className="mt-1 text-xl font-800">Avancos visiveis da rede</h3>
        </div>
        <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-800 text-cyan-100">
          Dados agregados
        </span>
      </div>

      <div className="mt-6 grid h-64 grid-cols-5 items-end gap-3 border-b border-white/12 pb-3">
        {data.map((item) => {
          const height = Math.max(18, (item.value / max) * 100)
          return (
            <div key={item.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
              <strong className="text-lg font-800 text-white">{item.value}</strong>
              <div className="flex h-44 w-full items-end justify-center">
                <div
                  className={`w-full max-w-14 rounded-t-md bg-gradient-to-t ${tones[item.tone]} shadow-lg shadow-cyan-950/20 transition hover:scale-[1.03]`}
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value} ${item.detail}`}
                />
              </div>
              <span className="min-h-10 text-center text-[11px] font-bold leading-tight text-slate-300">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-300 sm:grid-cols-2">
        <p>Mostra apenas sinais construtivos e consolidados para consulta publica.</p>
        <p className="sm:text-right">Detalhes operacionais ficam no painel interno.</p>
      </div>
    </section>
  )
}
