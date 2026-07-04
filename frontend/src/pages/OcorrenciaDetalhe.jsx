import { useEffect, useState } from 'react'
import { criticidadeValues, ocorrenciasAprovadas, statusValues } from '../data/mockData.js'
import { Badge, Card } from '../components/ui.jsx'

export function OcorrenciaDetalhe({ id, onNavigate, user }) {
  const isExterno = user?.role === 'EXTERNO'
  const isDiretor = user?.role === 'DIRETOR'
  const ocorrencia = ocorrenciasAprovadas.find((item) => item.id === id)
  const podeVisualizar = ocorrencia && (
    (isExterno && ocorrencia.criadoPorEmail === user.email) ||
    (isDiretor && ocorrencia.escolaId === user.escolaId) ||
    (!isExterno && !isDiretor)
  )

  useEffect(() => {
    if (!podeVisualizar) onNavigate('/ocorrencias')
  }, [podeVisualizar, onNavigate])

  const [status, setStatus] = useState(ocorrencia?.status)
  const [criticidade, setCriticidade] = useState(ocorrencia?.criticidade)
  const [mensagem, setMensagem] = useState('')
  const [tratativa, setTratativa] = useState('')

  if (!podeVisualizar) return null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
        {!isExterno && !isDiretor && (
          <button onClick={() => onNavigate('/mapa')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para mapa</button>
        )}
        {!isExterno && (
          <button onClick={() => setStatus('Resolvida')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Marcar como resolvida</button>
        )}
      </div>
      <div className={`grid gap-5 ${isExterno ? '' : 'xl:grid-cols-[1.2fr_.8fr]'}`}>
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-800 text-slate-950">{ocorrencia.titulo}</h2>
              <p className="mt-1 text-slate-500">{ocorrencia.escola} - {ocorrencia.bairro}</p>
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
        {!isExterno && (
          <Card>
            <h3 className="mb-3 text-lg font-800 text-slate-950">Acoes da SEDUC</h3>
            <label className="mb-3 block text-sm font-bold text-slate-600">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3">{statusValues.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="mb-3 block text-sm font-bold text-slate-600">Criticidade<select value={criticidade} onChange={(e) => setCriticidade(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3">{criticidadeValues.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block text-sm font-bold text-slate-600">Nova tratativa<textarea value={tratativa} onChange={(e) => setTratativa(e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3" placeholder="Registrar encaminhamento..." /></label>
            <button onClick={() => setTratativa('')} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Registrar tratativa</button>
          </Card>
        )}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card><h3 className="mb-4 text-lg font-800">Evidencias</h3><div className="grid gap-3">{ocorrencia.fotos.map((foto) => <div key={foto} className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">{foto}</div>)}</div></Card>
        <Card><h3 className="mb-4 text-lg font-800">Historico</h3><div className="space-y-4">{ocorrencia.historico.map((event) => <div key={event.titulo} className="border-l-2 border-blue-200 pl-3"><p className="font-bold">{event.titulo}</p><p className="text-xs text-slate-500">{event.data}</p><p className="text-sm text-slate-600">{event.descricao}</p></div>)}</div></Card>
        <Card><h3 className="mb-4 text-lg font-800">Chat interno</h3><div className="space-y-3">{ocorrencia.mensagens.map((msg) => <div key={msg.data + msg.autor} className="rounded-md bg-slate-50 p-3"><p className="text-sm font-bold">{msg.autor}</p><p className="text-sm text-slate-600">{msg.mensagem}</p></div>)}</div><textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="mt-3 min-h-20 w-full rounded-md border border-slate-200 p-3" placeholder="Enviar mensagem..." /><button onClick={() => setMensagem('')} className="mt-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Enviar mensagem</button></Card>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return <div><dt className="text-xs font-bold  text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>
}
