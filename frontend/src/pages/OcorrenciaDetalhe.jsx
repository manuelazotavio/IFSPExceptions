import { useEffect, useState } from 'react'
import { criticidadeValues, ocorrenciasAprovadas, statusValues } from '../data/mockData.js'
import { Badge, Card } from '../components/ui.jsx'

const ORIGEM_STYLES = {
  sistema: 'mx-auto max-w-[85%] rounded-full bg-slate-100 px-4 py-1.5 text-center text-xs font-bold text-slate-500',
  escola: 'max-w-[80%] rounded-lg rounded-tl-none bg-slate-100 px-4 py-2.5 text-slate-800',
  seduc: 'ml-auto max-w-[80%] rounded-lg rounded-tr-none bg-blue-600 px-4 py-2.5 text-white',
}

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

  const [form, setForm] = useState({ titulo: ocorrencia?.titulo || '' })
  const [status, setStatus] = useState(ocorrencia?.status)
  const [criticidade, setCriticidade] = useState(ocorrencia?.criticidade)
  const [mensagem, setMensagem] = useState('')
  const [tratativa, setTratativa] = useState('')

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!podeVisualizar) return null

  return (
    <div className="space-y-5 xl:flex xl:h-[calc(100vh-8rem)] xl:flex-col xl:space-y-0 xl:gap-5 xl:overflow-hidden">
      <div className="flex flex-wrap gap-2 xl:shrink-0">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
        {!isExterno && !isDiretor && (
          <button onClick={() => onNavigate('/mapa')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para mapa</button>
        )}
        {!isExterno && (
          <button onClick={() => setStatus('Resolvida')} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Marcar como resolvida</button>
        )}
      </div>
      <div className={`grid gap-5 xl:flex-1 xl:items-stretch xl:overflow-hidden ${isExterno ? '' : 'xl:grid-cols-[7fr_3fr]'}`}>
        <div className="space-y-5 xl:overflow-y-auto xl:pr-1">
          <Card>
            <p className="mb-3 text-base font-800 text-slate-800">{ocorrencia.escola} - {ocorrencia.bairro}</p>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                {isExterno ? (
                  <h2 className="text-lg font-800 text-slate-950">{form.titulo}</h2>
                ) : (
                  <input
                    value={form.titulo}
                    onChange={(e) => updateForm('titulo', e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-950 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              {isExterno ? (
                <div className="flex gap-2"><Badge>{criticidade}</Badge><Badge>{status}</Badge></div>
              ) : (
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
              )}
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

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-lg font-800">Evidencias</h3>
              <div className="grid gap-3">
                {ocorrencia.fotos.map((foto) => (
                  <div key={foto} className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">{foto}</div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="mb-4 text-lg font-800">Historico</h3>
              <div className="space-y-4">
                {ocorrencia.historico.map((event) => (
                  <div key={event.titulo} className="border-l-2 border-blue-200 pl-3">
                    <p className="font-bold">{event.titulo}</p>
                    <p className="text-xs text-slate-500">{event.data}</p>
                    <p className="text-sm text-slate-600">{event.descricao}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="mb-4 text-lg font-800">Chat interno</h3>
            <div className="space-y-3">
              {ocorrencia.mensagens.map((msg) => (
                <div key={msg.data + msg.autor} className={ORIGEM_STYLES[msg.origem?.toLowerCase()] || ORIGEM_STYLES.escola}>
                  <p className="text-sm font-bold">{msg.autor}</p>
                  <p className="text-sm">{msg.mensagem}</p>
                </div>
              ))}
            </div>
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="mt-3 min-h-20 w-full rounded-md border border-slate-200 p-3" placeholder="Enviar mensagem..." />
            <button onClick={() => setMensagem('')} className="mt-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Enviar mensagem</button>
          </Card>
        </div>

        {!isExterno && (
          <Card>
            <h3 className="mb-3 text-lg font-800 text-slate-950">Registrar tratativa</h3>
            <label className="block text-sm font-bold text-slate-600">Nova tratativa<textarea value={tratativa} onChange={(e) => setTratativa(e.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3" placeholder="Registrar encaminhamento..." /></label>
            <button onClick={() => setTratativa('')} className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">Registrar tratativa</button>
          </Card>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd></div>
}
