import { useEffect, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { listarEscolas, listarOcorrencias } from '../services/api.js'

const niceLabels = {
  Indaia: 'Indaiá',
  'Jardim California': 'Jardim Califórnia',
  Tinga: 'Tinga',
  'Porto Novo': 'Porto Novo',
  Massaguacu: 'Massaguaçu',
  'Pereque Mirim': 'Perequê Mirim',
  'Martim de Sa': 'Martim de Sá',
  Travessao: 'Travessão',
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
}

function formatLabel(value) {
  return niceLabels[value] || value
}

function uniqueCount(items, key) {
  return new Set(items.map((item) => item[key])).size
}

function positiveMetrics(escolas, ocorrenciasAprovadas) {
  const resolvidas = ocorrenciasAprovadas.filter((item) => item.status === 'Resolvida')
  const bairros = uniqueCount(escolas, 'bairro')
  const categorias = uniqueCount(ocorrenciasAprovadas, 'tipo')
  const escolasAtendidas = uniqueCount(resolvidas, 'escolaId')
  const bairrosAtendidos = uniqueCount(
    escolas.filter((escola) => resolvidas.some((item) => item.escolaId === escola.id)),
    'bairro',
  )

  return {
    escolas: escolas.length,
    bairros,
    acompanhadas: ocorrenciasAprovadas.length,
    resolvidas: resolvidas.length,
    categorias,
    escolasAtendidas,
    bairrosAtendidos,
  }
}

function recentResolutionRanking(escolas, ocorrenciasAprovadas) {
  const resolvidas = ocorrenciasAprovadas.filter((item) => item.status === 'Resolvida' && item.dataResolucao)

  const comData = escolas
    .map((escola) => {
      const dataResolucao = resolvidas
        .filter((item) => item.escolaId === escola.id)
        .reduce((maisRecente, item) => (!maisRecente || item.dataResolucao > maisRecente ? item.dataResolucao : maisRecente), null)

      return {
        id: escola.id,
        nome: escola.nome,
        bairro: formatLabel(escola.bairro),
        dataResolucao,
      }
    })

  const comResolucao = comData
    .filter((escola) => escola.dataResolucao)
    .sort((a, b) => (a.dataResolucao < b.dataResolucao ? 1 : -1))

  const semResolucao = comData.filter((escola) => !escola.dataResolucao)

  return [...comResolucao, ...semResolucao].slice(0, 6)
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
  const ranking = recentResolutionRanking(escolas, ocorrenciasAprovadas)
  const percentualResolvidas = metrics.acompanhadas ? Math.round((metrics.resolvidas / metrics.acompanhadas) * 100) : 0
  const primaryRoute = '/login'

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden bg-slate-950 text-white">
        <img
          src="/school-exterior.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-62"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/72 to-teal-950/20" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-end px-5 py-5 lg:px-8">
          <nav className="flex items-center gap-2">

          </nav>
        </header>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-20 text-center lg:px-8 lg:pb-28 lg:pt-28">
          <div>
          
            <h1 className="flex justify-center">
              <img src="/logo_fundo_escuro.svg" alt="Zela+" className="h-14 w-auto md:h-20" />
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-100">
              Um panorama público dos avanços da manutenção escolar: escolas acompanhadas, bairros atendidos,
              melhorias concluídas e frentes de trabalho em movimento.
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
                Enviar solicitação
              </button>
            </div>
          </div>

          <div className="mt-14 grid w-full max-w-3xl gap-3 rounded-lg border border-white/14 bg-slate-950/36 p-3 backdrop-blur-sm sm:grid-cols-3">
            <HeroInlineStat label="Escolas ativas" value={metrics.escolas} />
            <HeroInlineStat label="Bairros cobertos" value={metrics.bairros} />
            <HeroInlineStat label="Melhorias concluídas" value={metrics.resolvidas} />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <SignalCard icon="school" label="Rede acompanhada" value={`${percentualResolvidas}%`} text="Das solicitações já concluídas com sucesso." />
          <SignalCard icon="chart" label="Transparência pública" value={`${metrics.acompanhadas} registros`} text="Solicitações acompanhadas publicamente, do envio à conclusão." />
          <SignalCard icon="tag" label="Visão organizada" value={`${metrics.categorias} temas`} text="Categorias padronizadas para priorizar investimento e manutenção." />
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-800 uppercase text-primary-strong">Dados públicos selecionados</p>
            <h2 className="mt-3 text-3xl font-800 leading-tight text-slate-950 md:text-4xl">
              Indicadores que ajudam a comunidade a enxergar progresso.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              A área pública mostra apenas informações agregadas e construtivas. O detalhe operacional fica protegido
              no painel interno, onde a equipe acompanha prioridades, mensagens e histórico.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Escolas com melhorias concluídas" value={metrics.escolasAtendidas} />
              <MiniMetric label="Bairros com melhorias concluídas" value={metrics.bairrosAtendidos} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <img src="/school-courtyard.png" alt="" className="h-72 w-full rounded-lg object-cover shadow-sm md:h-full" />
            <div className="grid gap-4">
              <img src="/school-corridor.png" alt="" className="h-48 w-full rounded-lg object-cover shadow-sm" />
              <img src="/1-13.jpg" alt="" className="h-64 w-full rounded-lg object-cover shadow-sm" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div>
              <p className="text-sm font-800 uppercase text-cyan-200">Melhorias recentes</p>
              <h2 className="mt-3 text-3xl font-800">Escolas com resoluções mais recentes</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ranking.map((escola) => (
              <article key={escola.id} className="rounded-lg border border-white/12 bg-white/8 p-4">
                <p className="text-sm font-bold text-cyan-100">{escola.bairro}</p>
                <h3 className="mt-2 min-h-12 text-base font-800 leading-6 text-white">{escola.nome}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs font-semibold text-slate-400 lg:px-8">
        IFSP Exceptions © {new Date().getFullYear()} — Todos os direitos reservados.
      </footer>
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

