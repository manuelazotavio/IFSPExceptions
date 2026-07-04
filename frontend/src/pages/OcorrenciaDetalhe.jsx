import { useEffect, useRef, useState } from 'react'
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
  const [form, setForm] = useState({
    titulo: ocorrencia.titulo,
    descricao: ocorrencia.descricao,
    endereco: ocorrencia.endereco,
    localizacaoInterna: ocorrencia.localizacaoInterna,
    tipo: ocorrencia.tipo,
    dataEnvio: ocorrencia.dataEnvio,
    dataAprovacao: ocorrencia.dataAprovacao,
    dataResolucao: ocorrencia.dataResolucao,
  })
  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const [savedAt, setSavedAt] = useState('')

  const handleSalvar = () => {
    // Front-only: sem backend ainda. Quando existir API, disparar aqui o PUT/PATCH de ocorrencia com { ...form, status, criticidade }.
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  const [fotoIndex, setFotoIndex] = useState(0)
  const fotos = ocorrencia.fotos
  const prevFoto = () => setFotoIndex((i) => (i - 1 + fotos.length) % fotos.length)
  const nextFoto = () => setFotoIndex((i) => (i + 1) % fotos.length)

  const [interacoes, setInteracoes] = useState(ocorrencia.interacoes)
  const [mensagem, setMensagem] = useState('')
  const [anexos, setAnexos] = useState([])
  const fileInputRef = useRef(null)
  const chatFimRef = useRef(null)

  useEffect(() => {
    chatFimRef.current?.scrollIntoView({ block: 'end' })
  }, [interacoes])

  const handleAnexarClick = () => fileInputRef.current?.click()
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAnexos((prev) => [...prev, ...files])
    e.target.value = ''
  }
  const removerAnexo = (index) => setAnexos((prev) => prev.filter((_, i) => i !== index))

  const enviarMensagem = () => {
    if (!mensagem.trim() && anexos.length === 0) return
    setInteracoes((prev) => [...prev, { origem: 'seduc', autor: 'Voce', data: 'Agora', mensagem, anexos: anexos.map((file) => file.name) }])
    setMensagem('')
    setAnexos([])
  }

  return (
    <div className="space-y-5 xl:flex xl:h-[calc(100vh-8rem)] xl:flex-col xl:space-y-0 xl:gap-5 xl:overflow-hidden">
      <div className="flex flex-wrap gap-2 xl:shrink-0">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[7fr_3fr] xl:flex-1 xl:items-stretch xl:overflow-hidden">
        <div className="space-y-5 xl:overflow-y-auto xl:pr-1">

          <Card>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <input
                  value={form.titulo}
                  onChange={(e) => updateForm('titulo', e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-extrabold text-slate-950 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-sm text-slate-500">{ocorrencia.escola} - {ocorrencia.bairro}</p>
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

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Descricao</span>
              <textarea value={form.descricao} onChange={(e) => updateForm('descricao', e.target.value)} className="min-h-20 w-full rounded-md border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <EditableField label="Endereco" value={form.endereco} onChange={(v) => updateForm('endereco', v)} />
              <EditableField label="Localizacao" value={form.localizacaoInterna} onChange={(v) => updateForm('localizacaoInterna', v)} />
              <EditableField label="Tipo" value={form.tipo} onChange={(v) => updateForm('tipo', v)} />
              <EditableField label="Envio" type="date" value={form.dataEnvio} onChange={(v) => updateForm('dataEnvio', v)} />
              <EditableField label="Aprovacao" type="date" value={form.dataAprovacao} onChange={(v) => updateForm('dataAprovacao', v)} />
              <EditableField label="Resolucao" type="date" value={form.dataResolucao} onChange={(v) => updateForm('dataResolucao', v)} />
            </div>
          </Card>
          <Card>
            <h3 className="mb-3 text-lg font-800 text-slate-950">Fotos</h3>
            <div className="relative">
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-bold text-slate-500">{fotos[fotoIndex]}</div>
              {fotos.length > 1 && (
                <>
                  <button onClick={prevFoto} aria-label="Foto anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg font-bold text-slate-700 shadow hover:bg-white">&lsaquo;</button>
                  <button onClick={nextFoto} aria-label="Proxima foto" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg font-bold text-slate-700 shadow hover:bg-white">&rsaquo;</button>
                </>
              )}
            </div>
            <div className="mt-3 flex justify-center gap-1.5">
              {fotos.map((foto, index) => (
                <button key={foto} onClick={() => setFotoIndex(index)} aria-label={`Ir para foto ${index + 1}`} className={`h-1.5 w-1.5 rounded-full transition ${index === fotoIndex ? 'bg-blue-600' : 'bg-slate-300'}`} />
              ))}
            </div>
          </Card>
          <div className="flex items-center justify-end gap-3">
            {savedAt && <span className="text-xs font-semibold text-emerald-600">Alteracoes salvas as {savedAt}</span>}
            <button onClick={handleSalvar} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Salvar</button>
          </div>
        </div>
        <Card className="flex flex-col p-0 xl:h-full">
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-lg font-800 text-slate-950">Historico da ocorrencia</h3>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {interacoes.map((entry, index) => (
              <div key={index} className={ORIGEM_STYLES[entry.origem]}>
                {entry.origem !== 'sistema' && <p className="mb-0.5 text-xs font-bold opacity-80">{entry.autor}</p>}
                {entry.mensagem && <p className="text-sm">{entry.mensagem}</p>}
                {entry.anexos?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {entry.anexos.map((nome) => <span key={nome} className={`rounded px-2 py-1 text-[11px] font-bold ${entry.origem === 'seduc' ? 'bg-blue-500' : 'bg-white'}`}>📎 {nome}</span>)}
                  </div>
                )}
                <p className={`mt-1 text-[11px] ${entry.origem === 'seduc' ? 'text-blue-100' : 'text-slate-400'}`}>{entry.data}</p>
              </div>
            ))}
            <div ref={chatFimRef} />
          </div>
          <div className="border-t border-slate-200 p-4">
            {anexos.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {anexos.map((file, index) => (
                  <span key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    📎 {file.name}
                    <button onClick={() => removerAnexo(index)} aria-label={`Remover ${file.name}`} className="text-slate-400 hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm" placeholder="Enviar mensagem..." />
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
            <div className="mt-2 flex gap-2">
              <button onClick={handleAnexarClick} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">📎 Anexar arquivo</button>
              <button onClick={enviarMensagem} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Enviar mensagem</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function EditableField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}
