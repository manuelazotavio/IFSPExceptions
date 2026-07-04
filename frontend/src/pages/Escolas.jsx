import { useEffect, useMemo, useState } from 'react'
import { getSchoolStats } from '../utils/metrics.js'
import { loadCustomSchools, loadSchoolCatalog, saveCustomSchool } from '../utils/schools.js'
import { Badge, Card, FilterSelect } from '../components/ui.jsx'

export function Escolas({ onNavigate, escolaIdFiltro = '' }) {
  const [schoolList, setSchoolList] = useState(loadCustomSchools)
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [novoCadastro, setNovoCadastro] = useState({
    nome: '',
    bairro: '',
    endereco: '',
    latitude: '',
    longitude: '',
    descricao: '',
    fotoNome: '',
    fotoUrl: '',
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

  function handleFotoSelecionada(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setNovoCadastro((prev) => ({
        ...prev,
        fotoNome: file.name,
        fotoUrl: typeof reader.result === 'string' ? reader.result : '',
      }))
    }
    reader.readAsDataURL(file)
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

    const createdSchool = {
      id: `esc-custom-${Date.now()}`,
      nome: novoCadastro.nome.trim(),
      bairro: novoCadastro.bairro.trim(),
      endereco: novoCadastro.endereco.trim(),
      latitude: Number(novoCadastro.latitude),
      longitude: Number(novoCadastro.longitude),
      descricao: novoCadastro.descricao.trim(),
      status: 'Ativo',
      fotoNome: novoCadastro.fotoNome,
      fotoUrl: novoCadastro.fotoUrl,
      comodos: novoCadastro.comodos,
      dataCadastro: new Date().toISOString().slice(0, 10),
      x: 50,
      y: 50,
    }

    saveCustomSchool(createdSchool)
    try {
      setSchoolList(await loadSchoolCatalog())
    } catch {
      setSchoolList(loadCustomSchools())
    }
    setNovoCadastro({
      nome: '',
      bairro: '',
      endereco: '',
      latitude: '',
      longitude: '',
      descricao: '',
      fotoNome: '',
      fotoUrl: '',
      comodos: [],
    })
    setNovoComodo({ nome: '', codigo: '' })
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="space-y-5">
      {escolaFiltrada ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Filtro aplicado pelo mapa</p>
            <p className="text-sm font-semibold text-slate-700">
              Exibindo a escola selecionada no mapa de calor.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/escolas')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Importar csv
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Cadastrar escola
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Busca</span>
            <input
              value={filters.busca}
              onChange={(event) => setFilter('busca', event.target.value)}
              placeholder="Nome, bairro ou endereco"
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
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

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
              <tr>
                {['Nome', 'Bairro', 'Endereco', 'Status', 'Ocorrencias', 'Criticas', 'Cadastro'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {escolasFiltradas.map((escola) => {
                const stats = getSchoolStats(escola.id)
                return (
                  <tr
                    key={escola.id}
                    onClick={() => onNavigate(`/escolas/${escola.id}`)}
                    className="cursor-pointer border-t border-slate-100 hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 font-bold">{escola.nome}</td>
                    <td className="px-4 py-3">{escola.bairro}</td>
                    <td className="px-4 py-3">{escola.endereco}</td>
                    <td className="px-4 py-3"><Badge>{escola.status}</Badge></td>
                    <td className="px-4 py-3">{stats.total}</td>
                    <td className="px-4 py-3">{stats.criticas}</td>
                    <td className="px-4 py-3">{escola.dataCadastro}</td>
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
      </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-800 text-slate-950">Cadastrar escola</h3>
                <p className="mt-1 text-sm text-slate-500">Adicione uma nova unidade para aparecer na listagem.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                Fechar
              </button>
            </div>
            <form onSubmit={handleCadastrarEscola} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nome</span>
                <input required value={novoCadastro.nome} onChange={(event) => updateNovoCadastro('nome', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Bairro</span>
                <input required value={novoCadastro.bairro} onChange={(event) => updateNovoCadastro('bairro', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Endereco</span>
                <input required value={novoCadastro.endereco} onChange={(event) => updateNovoCadastro('endereco', event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Latitude</span>
                  <input
                    required
                    type="number"
                    min="-90"
                    max="90"
                    step="any"
                    value={novoCadastro.latitude}
                    onChange={(event) => updateNovoCadastro('latitude', event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    placeholder="-23.633000"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Longitude</span>
                  <input
                    required
                    type="number"
                    min="-180"
                    max="180"
                    step="any"
                    value={novoCadastro.longitude}
                    onChange={(event) => updateNovoCadastro('longitude', event.target.value)}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    placeholder="-45.417000"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Descricao</span>
                <textarea value={novoCadastro.descricao} onChange={(event) => updateNovoCadastro('descricao', event.target.value)} className="min-h-24 w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" placeholder="Descreva a escola e seus ambientes principais..." />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Foto</span>
                <input type="file" accept="image/*" onChange={handleFotoSelecionada} className="block w-full text-sm font-semibold text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-700 hover:file:bg-slate-200" />
                {novoCadastro.fotoNome ? <p className="mt-2 text-xs font-semibold text-slate-500">Arquivo selecionado: {novoCadastro.fotoNome}</p> : null}
                {novoCadastro.fotoUrl ? (
                  <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
                    <img src={novoCadastro.fotoUrl} alt="Previa da escola" className="h-40 w-full object-cover" />
                  </div>
                ) : null}
              </label>
              <div className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Comodos cadastrados</span>
                <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_auto]">
                  <input
                    value={novoComodo.nome}
                    onChange={(event) => setNovoComodo((prev) => ({ ...prev, nome: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addComodo()
                      }
                    }}
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    placeholder="Ex.: Sala, Biblioteca, Banheiro"
                  />
                  <input
                    value={novoComodo.codigo}
                    onChange={(event) => setNovoComodo((prev) => ({ ...prev, codigo: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addComodo()
                      }
                    }}
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    placeholder="Codigo"
                  />
                  <button type="button" onClick={addComodo} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Adicionar
                  </button>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Cadastre cada ambiente como "Comodo - Codigo". No relatorio, comodos iguais sao somados automaticamente.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {novoCadastro.comodos.map((comodo) => (
                    <button key={`${comodo.nome}-${comodo.codigo}`} type="button" onClick={() => removeComodo(comodo)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      {comodo.nome} - {comodo.codigo} x
                    </button>
                  ))}
                  {!novoCadastro.comodos.length && <p className="text-xs font-semibold text-slate-500">Nenhum comodo adicionado ainda.</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
                  Cancelar
                </button>
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  Salvar escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function normalizeRoomKey(value) {
  return String(value || '').trim().toLowerCase()
}
