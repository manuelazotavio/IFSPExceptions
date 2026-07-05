import { useEffect, useMemo, useState } from 'react'
import { getSchoolStats } from '../utils/metrics.js'
import { loadCustomSchools, loadSchoolCatalog, saveCustomSchool } from '../utils/schools.js'
import { criarEscola, listarOcorrencias } from '../services/api.js'
import { Badge, Card, FilterSelect } from '../components/ui.jsx'
import { formatDisplayLabel } from '../utils/labels.js'

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
  const escolaFiltrada = escolaIdFiltro ? schoolList.find((item) => item.id === escolaIdFiltro) : null
  const [filters, setFilters] = useState({
    busca: escolaFiltrada?.nome || '',
    bairro: escolaFiltrada?.bairro || '',
    status: escolaFiltrada?.status || '',
  })
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

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
    if (!files.length) return

    const novasFotos = await Promise.all(files.map((file) => readImageFile(file)))
    setNovoCadastro((prev) => {
      const fotos = [...prev.fotos, ...novasFotos]
      const capa = fotos[0] || { nome: '', url: '' }
      return {
        ...prev,
        fotoNome: capa.nome,
        fotoUrl: capa.url,
        fotos,
      }
    })
    event.target.value = ''
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

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-800 text-slate-950">Lista de escolas</h2>
            <p className="mt-1 text-sm text-slate-500">Gerencie as unidades cadastradas e abra o detalhe de cada escola.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Importar csv
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong"
            >
              Cadastrar escola
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Busca</span>
            <input
              value={filters.busca}
              onChange={(event) => setFilter('busca', event.target.value)}
              placeholder="Nome, bairro ou endereco"
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <FilterSelect label="Bairro" value={filters.bairro} onChange={(value) => setFilter('bairro', value)} options={bairroOptions} />
          <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter('status', value)} options={statusOptions} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-500">
          {escolasFiltradas.length} de {schoolList.length} escolas encontradas
        </p>
        {loadingSchools ? <p className="mt-1 text-xs font-semibold text-slate-400">Carregando escolas do banco...</p> : null}
      </Card>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full min-w-[1000px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide text-slate-600">
            <tr className="divide-x divide-slate-200">
              {['Nome', 'Bairro', 'Endereço', 'Status', 'Ocorrências', 'Críticas', 'Cadastro'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {escolasFiltradas.map((escola) => {
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
                  <td className="px-4 py-3"><Badge>{escola.status}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{stats.total}</td>
                  <td className="px-4 py-3 text-slate-600">{stats.criticas}</td>
                  <td className="px-4 py-3 text-slate-600">{escola.dataCadastro}</td>
                </tr>
              )
            })}
            {!escolasFiltradas.length && (
              <tr>
                <td colSpan="7" className="border-t border-slate-100 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Nenhuma escola encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-3 py-4 sm:items-center sm:px-4 sm:py-8">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-4rem)]">
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h3 className="text-lg font-800 text-slate-950">Cadastrar escola</h3>
                <p className="mt-1 text-sm text-slate-500">Adicione uma nova unidade para aparecer na listagem.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 sm:w-auto">
                Fechar
              </button>
            </div>
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
                      <div key={`${foto.nome}-${index}`} className="group relative aspect-video overflow-hidden rounded-md border border-slate-200">
                        <img src={foto.url} alt={`Prévia ${index + 1}`} className="h-full w-full object-cover" />
                        <button className="cursor-pointer"
                          type="button"
                          onClick={() => removerFotoCadastro(index)}
                          aria-label={`Remover ${foto.nome}`}
                          className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 px-1.5 text-xs font-bold text-white hover:bg-black/80"
                        >
                          &times;
                        </button>
                      </div>
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
