import { useEffect, useRef, useEffect, useState } from 'react'
import { criticidadeValues, ocorrenciasAprovadas, statusValues } from '../data/mockData.js'
import { Card } from '../components/ui.jsx'

const ORIGEM_STYLES = {
  sistema: 'mx-auto max-w-[85%] rounded-full bg-slate-100 px-4 py-1.5 text-center text-xs font-bold text-slate-500',
  escola: 'max-w-[80%] rounded-lg rounded-tl-none bg-slate-100 px-4 py-2.5 text-slate-800',
  seduc: 'ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-blue-600 px-4 py-2.5 text-white',
}

export function OcorrenciaDetalhe({ id, onNavigate }) {
  const ocorrencia = ocorrenciasAprovadas.find((item) => item.id === id) || ocorrenciasAprovadas[0]
  const [status, setStatus] = useState(ocorrencia.status)
  const [criticidade, setCriticidade] = useState(ocorrencia.criticidade)
  const [mensagem, setMensagem] = useState('')
  const [tratativa, setTratativa] = useState('')

  return (
    <div className="space-y-5 xl:flex xl:h-[calc(100vh-8rem)] xl:flex-col xl:space-y-0 xl:gap-5 xl:overflow-hidden">
      <div className="flex flex-wrap gap-2 xl:shrink-0">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
        <button onClick={() => onNavigate('/mapa')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para mapa</button>
        <button onClick={() => setStatus('Resolvida')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Marcar como resolvida</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[7fr_3fr] xl:flex-1 xl:items-stretch xl:overflow-hidden">
        <div className="space-y-5 xl:overflow-y-auto xl:pr-1">

          <Card>
            <p className="mb-3 text-base font-800 text-slate-800">{ocorrencia.escola} - {ocorrencia.bairro}</p>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <input
                  value={form.titulo}
                  onChange={(e) => updateForm('titulo', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-950 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              
              </div>

              <div className="flex gap-2">
                <select
                  value={criticidade}
                  onChange={(e) => setCriticidade(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {criticidadeValues.map((item) => <option key={item}>{item}</option>)}
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {statusValues.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2"><Badge>{criticidade}</Badge><Badge>{status}</Badge></div>
          </div>
          <p className="text-sm leading-6 text-slate-700">{ocorrencia.descricao}</p>
          <dl className="mt-5 grid gap-4 md:grid-cols-3">
            <Info label="Endereco" value={ocorrencia.endereco} />
            <Info label="Localizacao" value={ocorrencia.localizacaoInterna} />
            <Info label="Tipo" value={ocorrencia.tipo} />
            <Info label="Envio" value={ocorrencia.dataEnvio} />
            <Info label="Aprovacao" value={ocorrencia.dataAprovacao} />
            <Info label="Resolucao" value={ocorrencia.dataResolucao || 'Nao resolvida'} />
          </dl>
        </Card>
        <Card>
          <h3 className="mb-3 text-lg font-800 text-slate-950">Acoes da SEDUC</h3>
          <label className="mb-3 block text-sm font-bold text-slate-600">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3">{statusValues.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="mb-3 block text-sm font-bold text-slate-600">Criticidade<select value={criticidade} onChange={(e) => setCriticidade(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3">{criticidadeValues.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block text-sm font-bold text-slate-600">Nova tratativa<textarea value={tratativa} onChange={(e) => setTratativa(e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3" placeholder="Registrar encaminhamento..." /></label>
          <button onClick={() => setTratativa('')} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Registrar tratativa</button>
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>
}
