import { useEffect, useMemo, useRef, useState } from 'react'
import { bairros, categorias, criticidadeValues, statusValues } from '../data/mockData.js'
import { diasEmAberto, sortOcorrencias } from '../utils/metrics.js'
import { Card, FilterSelect, Modal, Select, Toast } from '../components/ui.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { Icon } from '../components/Icons.jsx'
import { ImageCropper } from '../components/ImageCropper.jsx'
import { FotoThumbnail } from '../components/FotoThumbnail.jsx'
import { atualizarOcorrencia, criarOcorrencia, listarOcorrencias, uploadFotosOcorrencia } from '../services/api.js'
import { formatDisplayLabel } from '../utils/labels.js'
import { loadSchoolCatalog } from '../utils/schools.js'
import { getComodoChave, getComodoRotulo, getSchoolRooms } from '../utils/comodos.js'

const CAMPOS_VAZIOS = { escolaId: '', titulo: '', tipo: '', criticidade: '', localizacaoInterna: '', descricao: '' }
const ITENS_POR_PAGINA = 10

const COR_LINHA_CRITICIDADE = {
  Critica: 'bg-red-500/15 hover:bg-red-500/25',
  Alta: 'bg-orange-500/15 hover:bg-orange-500/25',
  Media: 'bg-amber-400/15 hover:bg-amber-400/25',
  Baixa: 'bg-emerald-500/15 hover:bg-emerald-500/25',
}

const COR_KANBAN_CRITICIDADE = {
  Critica: 'bg-red-100/60 hover:border-red-100 hover:bg-red-100/80',
  Alta: 'bg-orange-100/60 hover:border-orange-100 hover:bg-orange-100/80',
  Media: 'bg-amber-100/60 hover:border-amber-100 hover:bg-amber-100/80',
  Baixa: 'bg-emerald-100/60 hover:border-emerald-100 hover:bg-emerald-100/80',
}

export function Ocorrencias({ onNavigate, user }) {
  const isDiretor = user?.role === 'DIRETOR'
  const isExterno = user?.role === 'EXTERNO'
  const statusOpcoes = (isDiretor || isExterno) ? statusValues : statusValues.filter((status) => status !== 'Aguardando aprovacao')
  const [filters, setFilters] = useState({ bairro: '', status: '', criticidade: '', tipo: '' })
  const setFilter = (key, value) => { setFilters((prev) => ({ ...prev, [key]: value })); setPagina(1) }
  const [ocorrencias, setOcorrencias] = useState([])
  const [escolas, setEscolas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')
  const [erroCadastro, setErroCadastro] = useState('')
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [toast, setToast] = useState(null)
  const [novaOcorrencia, setNovaOcorrencia] = useState(CAMPOS_VAZIOS)
  const setCampo = (key, value) => setNovaOcorrencia((prev) => ({ ...prev, [key]: value }))
  const [novasFotos, setNovasFotos] = useState([])
  const fotoInputRef = useRef(null)
  const [filaCorte, setFilaCorte] = useState([])
  const [arquivoEmCorte, setArquivoEmCorte] = useState(null)
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [visualizacao, setVisualizacao] = useState('listagem')
  const [expandidos, setExpandidos] = useState(() => new Set())
  const toggleExpandido = (id) => {
    setExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let ativo = true

    async function carregarOcorrencias() {
      setCarregando(true)
      setErroLista('')
      try {
        const filtrosApi = {
          ...(isDiretor && user?.escolaId ? { escolaId: user.escolaId } : {}),
          ...(isExterno && user?.email ? { criadoPorEmail: user.email } : {}),
        }
        const dados = await listarOcorrencias(filtrosApi)
        if (ativo) setOcorrencias(dados)
      } catch (error) {
        if (ativo) setErroLista(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregarOcorrencias()
    return () => {
      ativo = false
    }
  }, [isDiretor, isExterno, user?.escolaId, user?.email])

  useEffect(() => {
    let ativo = true
    loadSchoolCatalog()
      .then((dados) => { if (ativo) setEscolas(dados) })
      .catch(() => { if (ativo) setEscolas([]) })
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const handleChange = () => {
      if (media.matches) setVisualizacao('listagem')
    }
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isExterno && visualizacao !== 'listagem') setVisualizacao('listagem')
  }, [isExterno, visualizacao])

  const previewsFotos = useMemo(() => novasFotos.map((file) => URL.createObjectURL(file)), [novasFotos])
  const handleFotoInputClick = () => fotoInputRef.current?.click()
  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length) setFilaCorte((prev) => [...prev, ...files])
  }
  const removerFoto = (index) => setNovasFotos((prev) => prev.filter((_, i) => i !== index))
  const handleRecortarFoto = (index) => {
    const file = novasFotos[index]
    setArquivoEmCorte({ file, src: URL.createObjectURL(file), indexParaSubstituir: index })
  }

  useEffect(() => {
    if (!arquivoEmCorte && filaCorte.length > 0) {
      const [proximo, ...resto] = filaCorte
      setArquivoEmCorte({ file: proximo, src: URL.createObjectURL(proximo) })
      setFilaCorte(resto)
    }
  }, [filaCorte, arquivoEmCorte])

  function handleCropConfirm(arquivoCortado) {
    if (arquivoEmCorte.indexParaSubstituir != null) {
      setNovasFotos((prev) => prev.map((file, i) => (i === arquivoEmCorte.indexParaSubstituir ? arquivoCortado : file)))
    } else {
      setNovasFotos((prev) => [...prev, arquivoCortado])
    }
    URL.revokeObjectURL(arquivoEmCorte.src)
    setArquivoEmCorte(null)
  }

  function handleCropCancel() {
    URL.revokeObjectURL(arquivoEmCorte.src)
    setArquivoEmCorte(null)
  }
  const escolaSelecionada = useMemo(
    () => escolas.find((escola) => escola.id === novaOcorrencia.escolaId) || null,
    [escolas, novaOcorrencia.escolaId],
  )
  const comodosDaEscola = useMemo(
    () => getSchoolRooms(escolaSelecionada),
    [escolaSelecionada],
  )
  const alterarEscolaNovaOcorrencia = (escolaId) => {
    setNovaOcorrencia((prev) => ({ ...prev, escolaId, localizacaoInterna: '' }))
  }
  const opcoesVisualizacao = isExterno
    ? [['listagem', 'Listagem']]
    : [
        ['listagem', 'Listagem'],
        ['kanban', 'Kanban'],
      ]

  const lista = useMemo(() => sortOcorrencias(ocorrencias).filter((item) => {
    if (filters.bairro && item.bairro !== filters.bairro) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.criticidade && item.criticidade !== filters.criticidade) return false
    if (filters.tipo && item.tipo !== filters.tipo) return false
    if (busca && !`${item.protocolo} ${item.escola} ${item.titulo}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }), [filters, ocorrencias, busca])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / ITENS_POR_PAGINA))
  const listaPaginada = lista.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  const formularioValido = novaOcorrencia.escolaId && novaOcorrencia.titulo && novaOcorrencia.tipo && novaOcorrencia.criticidade && novaOcorrencia.descricao && novasFotos.length > 0

  const cancelarNovaOcorrencia = () => {
    setNovaOcorrencia(CAMPOS_VAZIOS)
    setNovasFotos([])
    setErroCadastro('')
    setModalAberto(false)
  }

  const cadastrarOcorrencia = async () => {
    if (!formularioValido) return
    setErroCadastro('')
    setSalvandoOcorrencia(true)

    try {
      const dataEnvio = new Date().toISOString().slice(0, 10)
      let ocorrenciaCriada = await criarOcorrencia({
        escolaId: novaOcorrencia.escolaId,
        titulo: novaOcorrencia.titulo,
        descricao: novaOcorrencia.descricao,
        tipo: novaOcorrencia.tipo,
        criticidade: novaOcorrencia.criticidade,
        localizacaoInterna: novaOcorrencia.localizacaoInterna,
        dataEnvio,
        criadoPorEmail: user?.email || '',
        criadoPorNome: user?.nome || '',
      })
      if (novasFotos.length > 0) {
        ocorrenciaCriada = await uploadFotosOcorrencia(ocorrenciaCriada.id, novasFotos)
      }
      setOcorrencias((prev) => [ocorrenciaCriada, ...prev])
      setNovaOcorrencia(CAMPOS_VAZIOS)
      setNovasFotos([])
      setModalAberto(false)
      setToast({
        type: 'success',
        title: 'Ocorrência criada com sucesso',
        message: `Protocolo ${ocorrenciaCriada.protocolo || 'gerado'}`,
      })
      onNavigate(`/ocorrencias/${ocorrenciaCriada.id}`)
    } catch (error) {
      setErroCadastro(error.message)
      setToast({
        type: 'error',
        title: 'Erro ao criar ocorrência',
        message: error.message,
      })
    } finally {
      setSalvandoOcorrencia(false)
    }
  }

  const alterarStatusKanban = async (ocorrenciaId, novoStatus) => {
    const ocorrenciaAtual = ocorrencias.find((item) => item.id === ocorrenciaId)
    if (!ocorrenciaAtual || ocorrenciaAtual.status === novoStatus) return

    setOcorrencias((prev) => prev.map((item) => (
      item.id === ocorrenciaId ? { ...item, status: novoStatus } : item
    )))

    try {
      const atualizada = await atualizarOcorrencia(ocorrenciaId, { status: novoStatus })
      setOcorrencias((prev) => prev.map((item) => (
        item.id === ocorrenciaId ? atualizada : item
      )))
      setToast({
        type: 'success',
        title: 'Status atualizado',
        message: `${ocorrenciaAtual.protocolo} movida para ${formatDisplayLabel(novoStatus)}.`,
      })
    } catch (error) {
      setOcorrencias((prev) => prev.map((item) => (
        item.id === ocorrenciaId ? ocorrenciaAtual : item
      )))
      setToast({
        type: 'error',
        title: 'Erro ao mover ocorrência',
        message: error.message,
      })
    }
  }

  const exportarCsv = () => {
    const cabecalho = ['Protocolo', 'Escola', 'Bairro', 'Tipo', 'Criticidade', 'Status', 'Localização', 'Envio']
    const linhas = lista.map((item) => [item.protocolo, item.escola, formatDisplayLabel(item.bairro), formatDisplayLabel(item.tipo), formatDisplayLabel(item.criticidade), formatDisplayLabel(item.status), item.localizacaoInterna ? formatDisplayLabel(item.localizacaoInterna) : 'Não informada', item.dataEnvio])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'ocorrencias.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full mb-4">
        <div className="relative w-full flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar ocorrências..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={exportarCsv}
            className="cursor-pointer w-full sm:w-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Exportar
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong sm:w-auto"
          >
            <span className="text-sm leading-none">+</span> Nova ocorrência
          </button>
        </div>
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <FilterSelect label="Bairro" value={filters.bairro} onChange={(v) => setFilter('bairro', v)} options={bairros} />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={statusOpcoes} />
          <FilterSelect label="Criticidade" value={filters.criticidade} onChange={(v) => setFilter('criticidade', v)} options={criticidadeValues} />
          <FilterSelect label="Tipo" value={filters.tipo} onChange={(v) => setFilter('tipo', v)} options={categorias} />
        </div>
      </Card>
      {erroLista && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erroLista}</p>
      )}
      {carregando && (
        <p className="text-sm font-semibold text-slate-500">Carregando ocorrências...</p>
      )}
      {!isExterno ? (
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {opcoesVisualizacao.map(([valor, label]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setVisualizacao(valor)}
              className={`w-full cursor-pointer rounded-md px-4 py-2 text-sm font-bold transition-colors ${valor === 'kanban' ? 'hidden sm:block' : ''} ${visualizacao === valor ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <div className={`${visualizacao === 'listagem' ? '' : 'hidden'} overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:hidden`}>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-700">
          Protocolo
        </div>
        <div className="divide-y divide-slate-200">
          {listaPaginada.map((item) => {
            const aberto = expandidos.has(item.id)
            return (
              <div key={item.id}>
                <button className="cursor-pointer"
                  type="button"
                  onClick={() => toggleExpandido(item.id)}
                  aria-expanded={aberto}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left ${COR_LINHA_CRITICIDADE[item.criticidade] || 'hover:bg-slate-50'}`}
                >
                  <span className="font-bold text-slate-800">{item.protocolo}</span>
                  <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                </button>
                {aberto && (
                  <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Escola:</span>
                      <span className="block font-semibold text-slate-800">{item.escola}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Bairro:</span>
                      <span className="block text-slate-700">{formatDisplayLabel(item.bairro)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Tipo:</span>
                      <span className="block text-slate-700">{formatDisplayLabel(item.tipo)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Criticidade:</span>
                      <span className="block text-slate-700">{formatDisplayLabel(item.criticidade)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Status:</span>
                      <span className="block text-slate-700">{formatDisplayLabel(item.status)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Localização:</span>
                      <span className="block text-slate-700">{item.localizacaoInterna ? formatDisplayLabel(item.localizacaoInterna) : 'Não informada'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Dias em aberto:</span>
                      <span className="block text-slate-700">{diasEmAberto(item.dataEnvio)}</span>
                    </div>
                    <button className="cursor-pointer"
                      type="button"
                      onClick={() => onNavigate(`/ocorrencias/${item.id}`)}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalhes
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!listaPaginada.length && (
            <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
              Nenhuma ocorrência encontrada.
            </p>
          )}
        </div>
      </div>
      <div className={`${visualizacao === 'listagem' ? 'hidden sm:block' : 'hidden'} w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm`}>
        <table className="w-full min-w-[1100px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
            <tr className="divide-x divide-slate-200">
              {['Protocolo', 'Escola', 'Bairro', 'Tipo', 'Criticidade', 'Status', 'Localização', 'Dias em aberto'].map((head) => (
                <th key={head} className="px-4 py-3">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {listaPaginada.map((item) => (
              <tr
                key={item.id}
                onClick={() => onNavigate(`/ocorrencias/${item.id}`)}
                className={`cursor-pointer divide-x divide-slate-200 border-x border-slate-200 ${COR_LINHA_CRITICIDADE[item.criticidade] || 'hover:bg-primary-50/40'}`}
              >
                <td className="px-4 py-3 font-bold text-slate-800">{item.protocolo}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{item.escola}</td>
                <td className="px-4 py-3 text-slate-600">{formatDisplayLabel(item.bairro)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDisplayLabel(item.tipo)}</td>
                <td className="px-4 py-3">{formatDisplayLabel(item.criticidade)}</td>
                <td className="px-4 py-3">{formatDisplayLabel(item.status)}</td>
                <td className="px-4 py-3 text-slate-600">{item.localizacaoInterna ? formatDisplayLabel(item.localizacaoInterna) : 'Não informada'}</td>
                <td className="px-4 py-3 text-slate-600">{diasEmAberto(item.dataEnvio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visualizacao === 'listagem' && (
        <Pagination page={pagina} totalPages={totalPaginas} onPageChange={setPagina} totalItems={lista.length} pageSize={ITENS_POR_PAGINA} />
      )}
      {visualizacao === 'kanban' && !isExterno && (
        <KanbanOcorrencias lista={lista} statusColunas={statusOpcoes} onNavigate={onNavigate} onStatusChange={alterarStatusKanban} />
      )}
      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title={arquivoEmCorte ? 'Cortar imagem' : 'Nova ocorrência'}>
        {arquivoEmCorte ? (
          <ImageCropper
            imageSrc={arquivoEmCorte.src}
            fileName={arquivoEmCorte.file?.name}
            onCancel={handleCropCancel}
            onConfirm={handleCropConfirm}
          />
        ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Escola <span className="text-red-500">*</span></span>
            <Select
              value={novaOcorrencia.escolaId}
              onChange={alterarEscolaNovaOcorrencia}
              options={escolas.map((escola) => ({ value: escola.id, label: `${escola.nome} - ${formatDisplayLabel(escola.bairro)}` }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Título <span className="text-red-500">*</span></span>
            <input value={novaOcorrencia.titulo} onChange={(e) => setCampo('titulo', e.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500" />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Tipo <span className="text-red-500">*</span></span>
              <Select value={novaOcorrencia.tipo} onChange={(value) => setCampo('tipo', value)} options={categorias} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Criticidade <span className="text-red-500">*</span></span>
              <Select value={novaOcorrencia.criticidade} onChange={(value) => setCampo('criticidade', value)} options={criticidadeValues} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Localização interna</span>
            <Select
              value={novaOcorrencia.localizacaoInterna}
              onChange={(value) => setCampo('localizacaoInterna', value)}
              disabled={!novaOcorrencia.escolaId || comodosDaEscola.length === 0}
              placeholder={
                !novaOcorrencia.escolaId
                  ? 'Selecione uma escola primeiro'
                  : comodosDaEscola.length === 0
                    ? 'Nenhum cômodo cadastrado para esta escola'
                    : 'Selecione...'
              }
              options={comodosDaEscola.map((comodo) => ({ value: getComodoChave(comodo), label: getComodoRotulo(comodo) }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Descrição <span className="text-red-500">*</span></span>
            <textarea value={novaOcorrencia.descricao} onChange={(e) => setCampo('descricao', e.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-primary-500" />
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Fotos <span className="text-red-500">*</span></span>
            <input ref={fotoInputRef} type="file" accept="image/*" multiple onChange={handleFotoChange} className="hidden" />
            <button type="button" onClick={handleFotoInputClick} className="cursor-pointer flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Icon name="image" className="h-4 w-4" />
              Adicionar fotos
            </button>
            {novasFotos.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {novasFotos.map((file, index) => (
                  <FotoThumbnail key={`${file.name}-${index}`} src={previewsFotos[index]} alt={file.name}>
                    <div className="absolute inset-x-1 top-1 flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleRecortarFoto(index)}
                        aria-label={`Recortar ${file.name}`}
                        className="cursor-pointer rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <Icon name="crop" className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerFoto(index)}
                        aria-label={`Remover ${file.name}`}
                        className="cursor-pointer rounded-full bg-black/60 px-1.5 text-xs font-bold text-white hover:bg-black/80"
                      >
                        &times;
                      </button>
                    </div>
                  </FotoThumbnail>
                ))}
              </div>
            )}
          </div>
          {erroCadastro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erroCadastro}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={cancelarNovaOcorrencia} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button>
            <button onClick={cadastrarOcorrencia} disabled={!formularioValido || salvandoOcorrencia} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50">
              {salvandoOcorrencia ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  )
}

function KanbanOcorrencias({ lista, statusColunas, onNavigate, onStatusChange }) {
  const [arrastandoId, setArrastandoId] = useState('')
  const [statusDestino, setStatusDestino] = useState('')

  function handleDrop(event, status) {
    event.preventDefault()
    const ocorrenciaId = event.dataTransfer.getData('text/plain')
    setStatusDestino('')
    setArrastandoId('')
    if (ocorrenciaId) onStatusChange(ocorrenciaId, status)
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:[grid-template-columns:repeat(${statusColunas.length},minmax(0,1fr))]`}>
      {statusColunas.map((status) => {
        const itens = lista.filter((item) => item.status === status)

        return (
          <section
            key={status}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setStatusDestino(status)
            }}
            onDragLeave={() => setStatusDestino((current) => (current === status ? '' : current))}
            onDrop={(event) => handleDrop(event, status)}
            className={`min-h-96 min-w-0 rounded-xl border bg-slate-50/70 transition ${statusDestino === status ? 'border-primary bg-primary-50/40' : 'border-slate-200'}`}
          >
            <div className="flex min-h-14 items-start justify-between gap-2 border-b border-slate-200 px-3 py-3">
              <h2 className="text-sm font-800 leading-tight text-slate-900">{formatDisplayLabel(status)}</h2>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-800 text-slate-500 ring-1 ring-slate-200">
                {itens.length}
              </span>
            </div>
            <div className="space-y-3 p-3">
              {itens.map((item) => (
                <button className="cursor-pointer"
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', item.id)
                    event.dataTransfer.effectAllowed = 'move'
                    setArrastandoId(item.id)
                  }}
                  onDragEnd={() => {
                    setArrastandoId('')
                    setStatusDestino('')
                  }}
                  onClick={() => onNavigate(`/ocorrencias/${item.id}`)}
                  className={`w-full cursor-pointer rounded-lg border border-slate-200 p-3 text-left shadow-sm transition ${arrastandoId === item.id ? 'opacity-50 ring-2 ring-primary/25' : ''} ${COR_KANBAN_CRITICIDADE[item.criticidade] || 'bg-white hover:border-blue-200 hover:bg-blue-50/40'}`}
                >
                  <strong className="block text-xs font-800 leading-snug text-slate-800">{item.titulo}</strong>
                  <p className="mt-2 text-xs font-bold text-slate-500">{item.protocolo}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600">{item.escola}</p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>{formatDisplayLabel(item.tipo)}</span>
                    <span>{diasEmAberto(item.dataEnvio)}</span>
                  </div>
                </button>
              ))}
              {!itens.length && (
                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-sm font-semibold text-slate-400">
                  Sem ocorrências
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
