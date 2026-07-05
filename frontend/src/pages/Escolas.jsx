import { useEffect, useMemo, useState } from 'react'
import { getSchoolStats } from '../utils/metrics.js'
import { loadCustomSchools, loadSchoolCatalog, saveCustomSchool } from '../utils/schools.js'
import { criarEscola, listarOcorrencias } from '../services/api.js'
import { Card, FilterSelect } from '../components/ui.jsx'
import { Pagination } from '../components/Pagination.jsx'
import { Icon } from '../components/Icons.jsx'
import { ImageCropper } from '../components/ImageCropper.jsx'
import { FotoThumbnail } from '../components/FotoThumbnail.jsx'
import { formatDisplayLabel } from '../utils/labels.js'

const ITENS_POR_PAGINA = 10

export function Escolas({ onNavigate, escolaIdFiltro = '' }) {
  const [schoolList, setSchoolList] = useState(loadCustomSchools)
  const [ocorrencias, setOcorrencias] = useState([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [salvandoEscola, setSalvandoEscola] = useState(false)
  const [erroCadastro, setErroCadastro] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepFeedback, setCepFeedback] = useState('')
  const [novoCadastro, setNovoCadastro] = useState({
    nome: '',
    cep: '',
    bairro: '',
    endereco: '',
    latitude: '',
    longitude: '',
    fotoNome: '',
    fotoUrl: '',
    fotos: [],
    comodos: [],
  })
  const [novoComodo, setNovoComodo] = useState({ nome: '', codigo: '' })
  const [filaCorte, setFilaCorte] = useState([])
  const [arquivoEmCorte, setArquivoEmCorte] = useState(null)
  const escolaFiltrada = escolaIdFiltro ? schoolList.find((item) => item.id === escolaIdFiltro) : null
  const [filters, setFilters] = useState({
    busca: escolaFiltrada?.nome || '',
    bairro: escolaFiltrada?.bairro || '',
    status: escolaFiltrada?.status || '',
  })
  const setFilter = (key, value) => { setFilters((prev) => ({ ...prev, [key]: value })); setPagina(1) }
  const [pagina, setPagina] = useState(1)
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
    setFilters({
      busca: escolaFiltrada?.nome || '',
      bairro: escolaFiltrada?.bairro || '',
      status: escolaFiltrada?.status || '',
    })
  }, [escolaFiltrada])

  useEffect(() => {
    let active = true

    async function refreshSchoolList() {
      setLoadingSchools(true)

      try {
        const nextSchools = await loadSchoolCatalog()
        if (active) setSchoolList(nextSchools)
      } catch {
        if (active) setSchoolList(loadCustomSchools())
      } finally {
        if (active) setLoadingSchools(false)
      }
    }

    refreshSchoolList()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    listarOcorrencias()
      .then((dados) => { if (active) setOcorrencias(dados) })
      .catch(() => { if (active) setOcorrencias([]) })
    return () => {
      active = false
    }
  }, [])

  const bairroOptions = useMemo(
    () => [...new Set(schoolList.map((escola) => escola.bairro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [schoolList],
  )
  const statusOptions = useMemo(() => [...new Set(schoolList.map((escola) => escola.status))], [schoolList])
  const escolasFiltradas = useMemo(() => {
    const busca = filters.busca.trim().toLowerCase()

    return schoolList.filter((escola) => {
      if (filters.bairro && escola.bairro !== filters.bairro) return false
      if (filters.status && escola.status !== filters.status) return false

      if (busca) {
        const texto = `${escola.nome} ${escola.bairro} ${escola.endereco}`.toLowerCase()
        if (!texto.includes(busca)) return false
      }

      return true
    })
  }, [filters, schoolList])
  const totalPaginas = Math.max(1, Math.ceil(escolasFiltradas.length / ITENS_POR_PAGINA))
  const escolasPaginadas = escolasFiltradas.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA)

  function updateNovoCadastro(key, value) {
    setNovoCadastro((prev) => ({ ...prev, [key]: value }))
  }

  async function preencherEnderecoPorCep() {
    const cep = normalizeCep(novoCadastro.cep)
    if (cep.length !== 8) {
      setCepFeedback('Informe um CEP válido com 8 dígitos.')
      return
    }

    setLoadingCep(true)
    setCepFeedback('')

    try {
      const cepData = await fetchCepData(cep)
      const endereco = buildAddressLine(cepData)
      const geocode = await fetchAddressCoordinates({
        endereco,
        bairro: cepData.bairro,
        cidade: cepData.localidade,
        estado: cepData.uf,
      })

      setNovoCadastro((prev) => ({
        ...prev,
        cep,
        bairro: cepData.bairro || prev.bairro,
        endereco: endereco || prev.endereco,
        latitude: geocode?.latitude || prev.latitude,
        longitude: geocode?.longitude || prev.longitude,
      }))

      setCepFeedback(geocode ? 'Endereço preenchido com latitude e longitude.' : 'Endereço preenchido. Ajuste latitude e longitude se necessário.')
    } catch (error) {
      setCepFeedback(error.message || 'Não foi possível localizar o CEP informado.')
    } finally {
      setLoadingCep(false)
    }
  }

  async function handleFotoSelecionada(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return

    const pendentes = await Promise.all(files.map((file) => readImageFile(file)))
    setFilaCorte((prev) => [...prev, ...pendentes])
  }

  useEffect(() => {
    if (!arquivoEmCorte && filaCorte.length > 0) {
      const [proximo, ...resto] = filaCorte
      setArquivoEmCorte({ nome: proximo.nome, src: proximo.url })
      setFilaCorte(resto)
    }
  }, [filaCorte, arquivoEmCorte])

  function aplicarFotoCadastro(novaFoto, indexParaSubstituir) {
    setNovoCadastro((prev) => {
      const fotos = indexParaSubstituir != null
        ? prev.fotos.map((foto, i) => (i === indexParaSubstituir ? novaFoto : foto))
        : [...prev.fotos, novaFoto]
      const capa = fotos[0] || { nome: '', url: '' }
      return { ...prev, fotoNome: capa.nome, fotoUrl: capa.url, fotos }
    })
  }

  async function handleCropConfirm(arquivoCortado) {
    const dataUrl = await fileToDataUrl(arquivoCortado)
    aplicarFotoCadastro({ nome: arquivoEmCorte.nome, url: dataUrl }, arquivoEmCorte.indexParaSubstituir)
    setArquivoEmCorte(null)
  }

  function handleCropCancel() {
    setArquivoEmCorte(null)
  }

  function handleRecortarFotoCadastro(index) {
    const foto = novoCadastro.fotos[index]
    setArquivoEmCorte({ nome: foto.nome, src: foto.url, indexParaSubstituir: index })
  }

  function removerFotoCadastro(index) {
    setNovoCadastro((prev) => {
      const fotos = prev.fotos.filter((_, itemIndex) => itemIndex !== index)
      const capa = fotos[0] || { nome: '', url: '' }
      return {
        ...prev,
        fotoNome: capa.nome,
        fotoUrl: capa.url,
        fotos,
      }
    })
  }

  function addComodo() {
    const nome = novoComodo.nome.trim()
    const codigo = novoComodo.codigo.trim()

    if (!nome || !codigo) return
    if (novoCadastro.comodos.some((item) => normalizeRoomKey(item.nome) === normalizeRoomKey(nome) && normalizeRoomKey(item.codigo) === normalizeRoomKey(codigo))) {
      setNovoComodo({ nome: '', codigo: '' })
      return
    }

    setNovoCadastro((prev) => ({
      ...prev,
      comodos: [...prev.comodos, { nome, codigo }],
    }))
    setNovoComodo({ nome: '', codigo: '' })
  }

  function removeComodo(comodo) {
    setNovoCadastro((prev) => ({
      ...prev,
      comodos: prev.comodos.filter((item) => !(item.nome === comodo.nome && item.codigo === comodo.codigo)),
    }))
  }

  async function handleCadastrarEscola(event) {
    event.preventDefault()
    setErroCadastro('')
    setSalvandoEscola(true)

    let escolaCriada
    try {
      escolaCriada = await criarEscola({
        nome: novoCadastro.nome.trim(),
        bairro: novoCadastro.bairro.trim(),
        endereco: novoCadastro.endereco.trim(),
        latitude: Number(novoCadastro.latitude),
        longitude: Number(novoCadastro.longitude),
        comodos: novoCadastro.comodos,
      })
    } catch (error) {
      setErroCadastro(error.message)
      setSalvandoEscola(false)
      return
    }

    saveCustomSchool({
      ...escolaCriada,
      cep: normalizeCep(novoCadastro.cep),
      descricao: '',
      status: 'Ativo',
      fotoNome: novoCadastro.fotoNome,
      fotoUrl: novoCadastro.fotoUrl,
      fotos: novoCadastro.fotos,
      comodos: novoCadastro.comodos,
      dataCadastro: escolaCriada.criadoEm?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      x: 50,
      y: 50,
    })

    try {
      setSchoolList(await loadSchoolCatalog())
    } catch {
      setSchoolList(loadCustomSchools())
    }
    setNovoCadastro({
      nome: '',
      cep: '',
      bairro: '',
      endereco: '',
      latitude: '',
      longitude: '',
      fotoNome: '',
      fotoUrl: '',
      fotos: [],
      comodos: [],
    })
    setNovoComodo({ nome: '', codigo: '' })
    setSalvandoEscola(false)
    setCepFeedback('')
    setIsModalOpen(false)
  }

  function exportarCsv() {
    const cabecalho = ['Nome', 'Bairro', 'Endereço', 'Status', 'Cadastro']
    const linhas = escolasFiltradas.map((escola) => [escola.nome, formatDisplayLabel(escola.bairro), escola.endereco, escola.status, escola.dataCadastro])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'escolas.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="space-y-5">
      {escolaFiltrada ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-primary">Filtro aplicado pelo mapa</p>
            <p className="text-sm font-semibold text-slate-700">
              Exibindo a escola selecionada no mapa de calor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/escolas')}
            className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpar filtro
          </button>
        </Card>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full mb-4">
        <div className="relative w-full flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar escolas..."
            value={filters.busca}
            onChange={(event) => setFilter('busca', event.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={exportarCsv}
            className="cursor-pointer w-full sm:w-auto rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong sm:w-auto"
          >
            <span className="text-sm leading-none">+</span> Cadastrar escola
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FilterSelect label="Bairro" value={filters.bairro} onChange={(value) => setFilter('bairro', value)} options={bairroOptions} />
          <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter('status', value)} options={statusOptions} />
        </div>
        {loadingSchools ? <p className="mt-1 text-xs font-semibold text-slate-400">Carregando escolas do banco...</p> : null}
      </Card>

      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-700">
          Nome
        </div>
        <div className="divide-y divide-slate-200">
          {escolasPaginadas.map((escola) => {
            const stats = getSchoolStats(escola.id, ocorrencias)
            const aberto = expandidos.has(escola.id)
            return (
              <div key={escola.id}>
                <button
                  type="button"
                  onClick={() => toggleExpandido(escola.id)}
                  aria-expanded={aberto}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="font-bold text-slate-800">{escola.nome}</span>
                  <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                </button>
                {aberto && (
                  <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Bairro:</span>
                      <span className="block text-slate-700">{formatDisplayLabel(escola.bairro)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Endereço:</span>
                      <span className="block text-slate-700">{escola.endereco}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Status:</span>
                      <span className="block text-slate-700">{escola.status}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Ocorrências:</span>
                      <span className="block text-slate-700">{stats.total}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold tracking-wide text-slate-500">Críticas:</span>
                      <span className="block text-slate-700">{stats.criticas}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/escolas/${escola.id}`)}
                      className="mt-2 w-full cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Ver detalhes
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!escolasPaginadas.length && (
            <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
              Nenhuma escola encontrada com os filtros selecionados.
            </p>
          )}
        </div>
      </div>

      <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm sm:block">
        <table className="w-full min-w-[1000px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-600">
            <tr className="divide-x divide-slate-200">
              {['Nome', 'Bairro', 'Endereço', 'Status', 'Ocorrências', 'Críticas'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {escolasPaginadas.map((escola) => {
              const stats = getSchoolStats(escola.id, ocorrencias)
              return (
                <tr
                  key={escola.id}
                  onClick={() => onNavigate(`/escolas/${escola.id}`)}
                  className="cursor-pointer divide-x divide-slate-200 border-x border-slate-200 hover:bg-primary-50/40"
                >
                  <td className="px-4 py-3 font-bold text-slate-800">{escola.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDisplayLabel(escola.bairro)}</td>
                  <td className="px-4 py-3 text-slate-600">{escola.endereco}</td>
                  <td className="px-4 py-3 text-slate-600">{escola.status}</td>
                  <td className="px-4 py-3 text-slate-600">{stats.total}</td>
                  <td className="px-4 py-3 text-slate-600">{stats.criticas}</td>
                </tr>
              )
            })}
            {!escolasFiltradas.length && (
              <tr>
                <td colSpan="6" className="border-t border-slate-100 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Nenhuma escola encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={pagina} totalPages={totalPaginas} onPageChange={setPagina} totalItems={escolasFiltradas.length} pageSize={ITENS_POR_PAGINA} />

      {isModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 sm:items-center sm:px-4 sm:py-8"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-4rem)]"
          >
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h3 className="text-lg font-800 text-slate-950">{arquivoEmCorte ? 'Cortar imagem' : 'Cadastrar escola'}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {arquivoEmCorte ? 'Ajuste o enquadramento antes de salvar a foto.' : 'Adicione uma nova unidade para aparecer na listagem.'}
                </p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Fechar" className="cursor-pointer self-end rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 sm:self-auto">
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            {arquivoEmCorte ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                <ImageCropper
                  imageSrc={arquivoEmCorte.src}
                  fileName={arquivoEmCorte.nome}
                  onCancel={handleCropCancel}
                  onConfirm={handleCropConfirm}
                />
              </div>
            ) : (
            <form onSubmit={handleCadastrarEscola} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Nome <span className="text-red-500">*</span></span>
                <input required value={novoCadastro.nome} onChange={(event) => updateNovoCadastro('nome', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500" />
              </label>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">CEP <span className="text-red-500">*</span></span>
                  <input
                    required
                    value={novoCadastro.cep}
                    onChange={(event) => updateNovoCadastro('cep', formatCepInput(event.target.value))}
                    onBlur={() => {
                      if (normalizeCep(novoCadastro.cep).length === 8) {
                        preencherEnderecoPorCep()
                      }
                    }}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    placeholder="00000-000"
                  />
                </label>
                <button
                  type="button"
                  onClick={preencherEnderecoPorCep}
                  disabled={loadingCep}
                  className="cursor-pointer mt-[22px] rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {loadingCep ? 'Buscando...' : 'Preencher'}
                </button>
              </div>
              {cepFeedback ? <p className="text-xs font-semibold text-slate-500">{cepFeedback}</p> : null}
              <label className="block">
                <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Bairro <span className="text-red-500">*</span></span>
                <input required value={novoCadastro.bairro} onChange={(event) => updateNovoCadastro('bairro', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Endereço <span className="text-red-500">*</span></span>
                <input required value={novoCadastro.endereco} onChange={(event) => updateNovoCadastro('endereco', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Latitude <span className="text-red-500">*</span></span>
                  <input
                    required
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={novoCadastro.latitude}
                    onChange={(event) => updateNovoCadastro('latitude', event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
                    placeholder="-23.633000"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Longitude <span className="text-red-500">*</span></span>
                  <input
                    required
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={novoCadastro.longitude}
                    onChange={(event) => updateNovoCadastro('longitude', event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
                    placeholder="-45.417000"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Fotos</span>
                <input type="file" accept="image/*" multiple onChange={handleFotoSelecionada} className="block w-full text-sm font-semibold text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 hover:file:bg-slate-200" />
                {novoCadastro.fotos.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {novoCadastro.fotos.map((foto, index) => (
                      <FotoThumbnail key={`${foto.nome}-${index}`} src={foto.url} alt={`Prévia ${index + 1}`}>
                        <div className="absolute inset-x-1 top-1 flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleRecortarFotoCadastro(index)}
                            aria-label={`Recortar ${foto.nome}`}
                            className="cursor-pointer rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                          >
                            <Icon name="crop" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removerFotoCadastro(index)}
                            aria-label={`Remover ${foto.nome}`}
                            className="cursor-pointer rounded-full bg-black/60 px-1.5 text-xs font-bold text-white hover:bg-black/80"
                          >
                            &times;
                          </button>
                        </div>
                      </FotoThumbnail>
                    ))}
                  </div>
                ) : null}
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-sm font-800 text-slate-800">Cômodos cadastrados</span>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Adicione os ambientes da escola para organizar ocorrências por local.</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-800 text-slate-500 ring-1 ring-slate-200">
                    {novoCadastro.comodos.length}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">Ambiente</span>
                    <input
                      value={novoComodo.nome}
                      onChange={(event) => setNovoComodo((prev) => ({ ...prev, nome: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addComodo()
                        }
                      }}
                      className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
                      placeholder="Ex.: Biblioteca"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-slate-500">Código</span>
                    <input
                      value={novoComodo.codigo}
                      onChange={(event) => setNovoComodo((prev) => ({ ...prev, codigo: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addComodo()
                        }
                      }}
                      className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary-500"
                      placeholder="A01"
                    />
                  </label>
                  <button type="button" onClick={addComodo} className="h-11 cursor-pointer self-end rounded-md bg-primary px-4 text-sm font-bold text-white hover:bg-primary-strong">
                    Adicionar
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {novoCadastro.comodos.map((comodo) => (
                    <div key={`${comodo.nome}-${comodo.codigo}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{comodo.nome}</p>
                        <p className="text-xs font-semibold text-slate-500">Código {comodo.codigo}</p>
                      </div>
                      <button type="button" onClick={() => removeComodo(comodo)} className="cursor-pointer rounded-md px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                        Remover
                      </button>
                    </div>
                  ))}
                  {!novoCadastro.comodos.length && (
                    <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-400">
                      Nenhum cômodo adicionado ainda.
                    </div>
                  )}
                </div>
              </div>
              {erroCadastro && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erroCadastro}</p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 sm:w-auto">
                  Cancelar
                </button>
                <button type="submit" disabled={salvandoEscola} className="cursor-pointer w-full rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                  {salvandoEscola ? 'Salvando...' : 'Salvar escola'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

function normalizeRoomKey(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeCep(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 8)
}

function readImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      nome: file.name,
      url: typeof reader.result === 'string' ? reader.result : '',
    })
    reader.readAsDataURL(file)
  })
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  })
}

function formatCepInput(value) {
  const digits = normalizeCep(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

async function fetchCepData(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP.')
  }

  const data = await response.json()
  if (data.erro) {
    throw new Error('CEP não encontrado.')
  }

  return data
}

function buildAddressLine(data) {
  const parts = [data.logradouro, data.localidade && data.uf ? `${data.localidade} - ${data.uf}` : data.localidade || data.uf]
  return parts.filter(Boolean).join(', ')
}

async function fetchAddressCoordinates({ endereco, bairro, cidade, estado }) {
  const query = [endereco, bairro, cidade, estado, 'Brasil'].filter(Boolean).join(', ')
  if (!query) return null

  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'br',
    q: query,
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
  if (!response.ok) return null

  const data = await response.json()
  const first = Array.isArray(data) ? data[0] : null
  if (!first) return null

  return {
    latitude: String(first.lat || ''),
    longitude: String(first.lon || ''),
  }
}
