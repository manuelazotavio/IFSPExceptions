import { useEffect, useRef, useState } from 'react'
import { categorias, criticidadeValues, locaisInternos, statusValues } from '../data/mockData.js'
import { adicionarInteracao, atualizarOcorrencia, listarEscolas, obterOcorrencia } from '../services/api.js'
import { Card, Modal } from '../components/ui.jsx'
import { Icon } from '../components/Icons.jsx'

function formatarDataBR(dataIso) {
  if (!dataIso) return ''
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

function campoClasse(extra = '') {
  return `w-full rounded-md border border-slate-300 bg-white px-3 outline-none transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${extra}`
}

function lerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function OcorrenciaDetalhe({ id, onNavigate, user }) {
  const [ocorrencia, setOcorrencia] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    obterOcorrencia(id)
      .then((dados) => { if (ativo) setOcorrencia(dados) })
      .catch((error) => { if (ativo) setErro(error.message) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => {
      ativo = false
    }
  }, [id])

  if (carregando) {
    return <Card><p className="text-sm font-semibold text-slate-500">Carregando ocorrência...</p></Card>
  }

  if (erro || !ocorrencia) {
    return (
      <div className="space-y-4">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
        <Card><p className="text-sm font-semibold text-red-600">{erro || 'Ocorrência não encontrada.'}</p></Card>
      </div>
    )
  }

  return (
    <OcorrenciaDetalheConteudo
      key={ocorrencia.id}
      ocorrencia={ocorrencia}
      onNavigate={onNavigate}
      user={user}
      onAtualizar={setOcorrencia}
    />
  )
}

function OcorrenciaDetalheConteudo({ ocorrencia, onNavigate, user, onAtualizar }) {
  const [escolas, setEscolas] = useState([])
  useEffect(() => {
    let ativo = true
    listarEscolas()
      .then((dados) => { if (ativo) setEscolas(dados) })
      .catch(() => { if (ativo) setEscolas([]) })
    return () => {
      ativo = false
    }
  }, [])

  const [status, setStatus] = useState(ocorrencia.status)
  const [criticidade, setCriticidade] = useState(ocorrencia.criticidade)
  const [form, setForm] = useState({
    escolaId: ocorrencia.escolaId,
    titulo: ocorrencia.titulo,
    descricao: ocorrencia.descricao,
    localizacaoInterna: ocorrencia.localizacaoInterna,
    tipo: ocorrencia.tipo,
    dataEnvio: ocorrencia.dataEnvio,
    dataAprovacao: ocorrencia.dataAprovacao || '',
    dataResolucao: ocorrencia.dataResolucao || '',
  })
  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const escolaSelecionada = escolas.find((item) => item.id === form.escolaId) || { nome: ocorrencia.escola, bairro: ocorrencia.bairro, endereco: ocorrencia.endereco }
  const [savedAt, setSavedAt] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)

  const handleSalvar = async () => {
    setSalvando(true)
    setErroSalvar('')
    try {
      const atualizada = await atualizarOcorrencia(ocorrencia.id, {
        escolaId: form.escolaId,
        titulo: form.titulo,
        descricao: form.descricao,
        tipo: form.tipo,
        criticidade,
        status,
        localizacaoInterna: form.localizacaoInterna,
        dataAprovacao: form.dataAprovacao || null,
        dataResolucao: form.dataResolucao || null,
        fotos,
      })
      onAtualizar(atualizada)
      setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setModalEdicaoAberto(false)
    } catch (error) {
      setErroSalvar(error.message)
    } finally {
      setSalvando(false)
    }
  }

  async function exportarPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const labelWidth = 34

    function drawHeader() {
      doc.setFillColor(10, 37, 64)
      doc.rect(0, 0, pageWidth, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text(`Ocorrência ${ocorrencia.protocolo}`, margin, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`${escolaSelecionada.nome} - ${escolaSelecionada.bairro}`, margin, 20)
      doc.setTextColor(23, 32, 51)
    }

    function drawFooter() {
      const pageCount = doc.internal.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }
      doc.setTextColor(23, 32, 51)
    }

    function quebrarPagina(y, alturaNecessaria) {
      if (y + alturaNecessaria <= pageHeight - 16) return y
      doc.addPage()
      drawHeader()
      return 38
    }

    drawHeader()
    let y = 38

    const campos = [
      ['Título', form.titulo],
      ['Criticidade', criticidade],
      ['Status', status],
      ['Descrição', form.descricao],
      ['Endereço', escolaSelecionada.endereco],
      ['Localização', form.localizacaoInterna],
      ['Tipo', form.tipo],
      ['Envio', formatarDataBR(form.dataEnvio)],
      ['Aprovação', formatarDataBR(form.dataAprovacao)],
      ['Resolução', formatarDataBR(form.dataResolucao)],
    ]

    campos.forEach(([label, valor]) => {
      const linhas = doc.splitTextToSize(String(valor || '-'), pageWidth - margin * 2 - labelWidth)
      const altura = Math.max(8, linhas.length * 5 + 3)
      y = quebrarPagina(y, altura)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 64, 175)
      doc.text(label, margin, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(23, 32, 51)
      doc.text(linhas, margin + labelWidth, y + 5)
      y += altura
    })

    if (fotos.length > 0) {
      y = quebrarPagina(y + 6, 10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.text('Fotos', margin, y + 5)
      y += 10

      const fotoAltura = 60
      fotos.forEach((foto, index) => {
        y = quebrarPagina(y, fotoAltura)
        if (typeof foto === 'string' && foto.startsWith('data:image')) {
          doc.addImage(foto, 'JPEG', margin, y, pageWidth - margin * 2, fotoAltura)
        } else {
          doc.setDrawColor(203, 213, 225)
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, y, pageWidth - margin * 2, fotoAltura, 'FD')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(100, 116, 139)
          doc.text(`Foto ${index + 1}: ${foto}`, pageWidth / 2, y + fotoAltura / 2, { align: 'center' })
        }
        y += fotoAltura + 6
      })
    }

    drawFooter()
    doc.save(`ocorrencia-${ocorrencia.protocolo}.pdf`)
  }

  async function exportarHistoricoPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    function drawHeader() {
      doc.setFillColor(10, 37, 64)
      doc.rect(0, 0, pageWidth, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text('Histórico da ocorrência', margin, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Protocolo ${ocorrencia.protocolo} - ${escolaSelecionada.nome}`, margin, 20)
      doc.setTextColor(23, 32, 51)
    }

    function drawFooter() {
      const pageCount = doc.internal.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }
      doc.setTextColor(23, 32, 51)
    }

    function quebrarPagina(y, alturaNecessaria) {
      if (y + alturaNecessaria <= pageHeight - 16) return y
      doc.addPage()
      drawHeader()
      return 38
    }

    drawHeader()
    let y = 38
    const larguraTexto = pageWidth - margin * 2

    interacoes.forEach((entry) => {
      const cabecalho = entry.origem === 'sistema' ? 'Sistema' : entry.autor
      const linhasMensagem = entry.mensagem ? doc.splitTextToSize(entry.mensagem, larguraTexto) : []
      const linhasAnexos = entry.anexos?.length > 0 ? doc.splitTextToSize(`Anexos: ${entry.anexos.join(', ')}`, larguraTexto) : []
      const altura = 7 + linhasMensagem.length * 5 + (linhasAnexos.length ? linhasAnexos.length * 5 + 2 : 0) + 8

      y = quebrarPagina(y, altura)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(30, 64, 175)
      doc.text(`${cabecalho} - ${entry.data}`, margin, y + 5)
      y += 7

      if (linhasMensagem.length) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(23, 32, 51)
        doc.text(linhasMensagem, margin, y + 4)
        y += linhasMensagem.length * 5 + 2
      }

      if (linhasAnexos.length) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8.5)
        doc.setTextColor(100, 116, 139)
        doc.text(linhasAnexos, margin, y + 4)
        y += linhasAnexos.length * 5 + 2
      }

      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y + 2, pageWidth - margin, y + 2)
      y += 8
    })

    drawFooter()
    doc.save(`historico-ocorrencia-${ocorrencia.protocolo}.pdf`)
  }

  const [fotoIndex, setFotoIndex] = useState(0)
  const [fotos, setFotos] = useState(ocorrencia.fotos)
  const prevFoto = () => setFotoIndex((i) => (i - 1 + fotos.length) % fotos.length)
  const nextFoto = () => setFotoIndex((i) => (i + 1) % fotos.length)
  const fotoInputRef = useRef(null)
  const handleFotoInputClick = () => fotoInputRef.current?.click()
  const handleFotoChange = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    const novasFotos = await Promise.all(files.map(lerComoDataUrl))
    setFotos((prev) => [...prev, ...novasFotos])
  }
  const removerFoto = (index) => {
    setFotos((prev) => prev.filter((_, i) => i !== index))
    setFotoIndex((prev) => (prev >= index && prev > 0 ? prev - 1 : prev))
  }

  const [interacoes, setInteracoes] = useState(ocorrencia.interacoes)
  const [mensagem, setMensagem] = useState('')
  const [anexos, setAnexos] = useState([])
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
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

  const enviarMensagem = async () => {
    if (!mensagem.trim() && anexos.length === 0) return
    setEnviandoMensagem(true)
    try {
      const atualizada = await adicionarInteracao(ocorrencia.id, {
        origem: 'seduc',
        autor: user?.nome || 'Você',
        mensagem,
        status,
        anexos: anexos.map((file) => file.name),
      })
      onAtualizar(atualizada)
      setInteracoes(atualizada.interacoes)
      setMensagem('')
      setAnexos([])
    } catch (error) {
      setErroSalvar(error.message)
    } finally {
      setEnviandoMensagem(false)
    }
  }

  return (
    <div className="space-y-5 xl:flex xl:h-[calc(100vh-8rem)] xl:flex-col xl:space-y-0 xl:gap-5 xl:overflow-hidden">
      <div className="flex flex-wrap gap-2 xl:shrink-0">
        <button onClick={() => onNavigate('/ocorrencias')} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold">Voltar para lista</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[7fr_3fr] xl:flex-1 xl:items-stretch xl:overflow-hidden xl:min-h-0">
        <div className="space-y-5 xl:overflow-y-auto xl:pr-1">

          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-md font-bold text-blue-600">Protocolo {ocorrencia.protocolo}</p>
              <div className="flex items-center gap-2">
                {savedAt && <span className="text-xs font-semibold text-emerald-600">Salvo às {savedAt}</span>}
                <button
                  onClick={exportarPdf}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => setModalEdicaoAberto(true)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <InfoField label="Escola" value={escolaSelecionada.nome} />
              <InfoField label="Bairro" value={escolaSelecionada.bairro} />
            </div>
            <div className="mt-4">
              <InfoField label="Solicitante" value={ocorrencia.criadoPorNome} />
            </div>
            <div className="mt-4">
              <InfoField label="Título" value={form.titulo} />
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <InfoField label="Criticidade" value={criticidade} />
              <InfoField label="Status" value={status} />
            </div>
            <div className="mt-4">
              <InfoField label="Descrição" value={form.descricao} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoField label="Endereço" value={escolaSelecionada.endereco} />
              <InfoField label="Localização" value={form.localizacaoInterna} />
              <InfoField label="Tipo" value={form.tipo} />
              <InfoField label="Envio" value={formatarDataBR(form.dataEnvio)} />
              <InfoField label="Aprovação" value={formatarDataBR(form.dataAprovacao)} />
              <InfoField label="Resolução" value={formatarDataBR(form.dataResolucao)} />
            </div>
            <h3 className="mb-3 mt-4 text-lg font-800 text-slate-950">Fotos</h3>
            <div className="relative">
              {fotos.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-bold text-slate-500">Nenhuma foto</div>
              ) : typeof fotos[fotoIndex] === 'string' && fotos[fotoIndex].startsWith('data:image') ? (
                <img src={fotos[fotoIndex]} alt={`Foto ${fotoIndex + 1}`} className="h-48 w-full rounded-md border border-slate-300 object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-center text-sm font-bold text-slate-500">{fotos[fotoIndex]}</div>
              )}
              {fotos.length > 1 && (
                <>
                  <button onClick={prevFoto} aria-label="Foto anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg font-bold text-slate-700 shadow hover:bg-white">&lsaquo;</button>
                  <button onClick={nextFoto} aria-label="Próxima foto" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-lg font-bold text-slate-700 shadow hover:bg-white">&rsaquo;</button>
                </>
              )}
            </div>
            <div className="mt-3 flex justify-center gap-1.5">
              {fotos.map((foto, index) => (
                <button key={foto} onClick={() => setFotoIndex(index)} aria-label={`Ir para foto ${index + 1}`} className={`h-1.5 w-1.5 rounded-full transition ${index === fotoIndex ? 'bg-blue-600' : 'bg-slate-300'}`} />
              ))}
            </div>
          </Card>
        </div>
        <Card className="flex flex-col p-0 xl:h-full xl:min-h-0">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 pb-3 shrink-0">
            <h3 className="text-lg font-800 text-slate-950">Histórico da ocorrência</h3>
            <button
              onClick={exportarHistoricoPdf}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Exportar PDF
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div>
              {interacoes.map((entry, index) => {
                const ultimo = index === interacoes.length - 1
                const fechado = status === 'Resolvida'
                const mostrarLinha = !ultimo || !fechado
                return (
                  <div key={entry.id || index} className={`relative ${ultimo && fechado ? 'pb-0' : 'pb-5'}`}>
                    {mostrarLinha && <span className="absolute left-[4px] top-1 bottom-0 w-0.5 bg-slate-200" />}
                    <span className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 ring-1 ring-blue-200" />
                    <div className="pl-5">
                      <p className="text-base font-bold text-slate-700">
                        {index === 0 ? `Cadastro da ocorrência por ${ocorrencia.criadoPorNome}` : entry.origem === 'sistema' ? 'Sistema' : entry.autor}
                      </p>
                      <p className="text-sm text-slate-500">
                        Em {formatarDataBR(entry.data)}{entry.hora ? ` às ${entry.hora}` : ''}
                      </p>
                      {entry.status && <p className="mt-0.5 text-sm font-semibold text-blue-600">Status: {entry.status}</p>}
                      {entry.mensagem && <p className="mt-0.5 text-sm text-slate-600">{entry.mensagem}</p>}
                      {entry.anexos?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {entry.anexos.map((nome) => (
                            <span key={nome} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                              <Icon name="paperclip" className="h-3 w-3" />
                              {nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div ref={chatFimRef} />
          </div>
          <div className="border-t border-slate-200 p-3 shrink-0">
            {anexos.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {anexos.map((file, index) => (
                  <span key={`${file.name}-${index}`} className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    <Icon name="paperclip" className="h-3.5 w-3.5" />
                    {file.name}
                    <button onClick={() => removerAnexo(index)} aria-label={`Remover ${file.name}`} className="text-slate-400 hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-1.5 rounded-2xl border border-slate-300 bg-white p-1.5 focus-within:border-blue-500">
              <button
                onClick={handleAnexarClick}
                aria-label="Anexar arquivo"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <Icon name="paperclip" className="h-5 w-5" />
              </button>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviarMensagem()
                  }
                }}
                placeholder="Escreva uma mensagem..."
                rows={1}
                className="max-h-32 flex-1 resize-none border-0 bg-transparent py-2 text-sm outline-none"
              />
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} className="hidden" />
              <button
                onClick={enviarMensagem}
                disabled={enviandoMensagem || (!mensagem.trim() && anexos.length === 0)}
                aria-label="Enviar mensagem"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="send" className="h-4 w-4 -rotate-270 transition-transform" />

              </button>
            </div>
          </div>
        </Card>
      </div>
      <Modal open={modalEdicaoAberto} onClose={() => setModalEdicaoAberto(false)} title="Editar ocorrência">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Escola</span>
            <select value={form.escolaId} onChange={(e) => updateForm('escolaId', e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')}>
              {escolas.map((item) => <option key={item.id} value={item.id}>{item.nome} - {item.bairro}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Título</span>
            <input value={form.titulo} onChange={(e) => updateForm('titulo', e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Criticidade</span>
              <select value={criticidade} onChange={(e) => setCriticidade(e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')}>
                {criticidadeValues.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')}>
                {statusValues.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Descrição</span>
            <textarea value={form.descricao} onChange={(e) => updateForm('descricao', e.target.value)} className={campoClasse('min-h-20 py-2 text-sm leading-6 text-slate-700')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Endereço</span>
            <input value={escolaSelecionada.endereco || ''} readOnly className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Localização</span>
              <select value={form.localizacaoInterna} onChange={(e) => updateForm('localizacaoInterna', e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')}>
                {locaisInternos.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Tipo</span>
              <select value={form.tipo} onChange={(e) => updateForm('tipo', e.target.value)} className={campoClasse('h-9 text-sm font-semibold text-slate-800')}>
                {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Envio</span>
              <input type="date" value={form.dataEnvio} readOnly className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 outline-none" />
            </label>
            <EditableField label="Aprovação" type="date" value={form.dataAprovacao} onChange={(v) => updateForm('dataAprovacao', v)} />
            <EditableField label="Resolução" type="date" value={form.dataResolucao} onChange={(v) => updateForm('dataResolucao', v)} />
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Fotos</span>
            <input ref={fotoInputRef} type="file" accept="image/*" multiple onChange={handleFotoChange} className="hidden" />
            <button type="button" onClick={handleFotoInputClick} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Icon name="image" className="h-4 w-4" />
              Adicionar fotos
            </button>
            {fotos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {fotos.map((foto, index) => (
                  <div key={index} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {typeof foto === 'string' && foto.startsWith('data:image') ? (
                      <img src={foto} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center p-1 text-center text-[10px] font-bold text-slate-500">{foto}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removerFoto(index)}
                      aria-label={`Remover foto ${index + 1}`}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs font-bold text-white hover:bg-black/80"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {erroSalvar && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erroSalvar}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalEdicaoAberto(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function EditableField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={campoClasse('h-9 text-sm font-semibold text-slate-800')}
      />
    </label>
  )
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 px-3 py-2">
      <p className="text-xs font-bold tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  )
}
