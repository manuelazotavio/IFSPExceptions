import { useEffect, useState } from 'react'
import { categorias } from '../data/mockData.js'
import { dashboardMetrics, groupCount } from '../utils/metrics.js'
import { atualizarUsuario, criarUsuario, listarAuditoria, listarEscolas, listarOcorrencias, listarUsuarios } from '../services/api.js'
import { Badge, BarList, Card, FilterSelect, MetricCard, Modal, Select } from '../components/ui.jsx'
import { Icon } from '../components/Icons.jsx'

export function Indicadores() {
  const [escolas, setEscolas] = useState([])
  const [ocorrencias, setOcorrencias] = useState([])

  useEffect(() => {
    let ativo = true
    Promise.all([listarEscolas(), listarOcorrencias()])
      .then(([escolasApi, ocorrenciasApi]) => {
        if (!ativo) return
        setEscolas(escolasApi)
        setOcorrencias(ocorrenciasApi.filter((item) => item.aprovadaPelaEscola))
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  const metrics = dashboardMetrics(ocorrencias, escolas.length)
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Object.entries(metrics).map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-lg font-800">Por bairro</h2><BarList data={Object.entries(groupCount(ocorrencias, 'bairro')).map(([label, value]) => ({ label, value }))} /></Card><Card><h2 className="mb-4 text-lg font-800">Por criticidade</h2><BarList data={Object.entries(groupCount(ocorrencias, 'criticidade')).map(([label, value]) => ({ label, value }))} /></Card></div></div>
}

const PERMISSOES = [
  { value: 'SEDUC', label: 'SEDUC' },
  { value: 'DIRETOR', label: 'Diretor(a)' },
  { value: 'EXTERNO', label: 'Externo' },
]

const USUARIO_VAZIO = { nome: '', email: '', senha: '', role: 'EXTERNO', escolaId: '' }

function formatarDataBR(dataIso) {
  if (!dataIso) return ''
  const [ano, mes, dia] = dataIso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

async function svgUrlParaPngDataUrl(url, width = 240, height = 240) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
      const drawWidth = image.naturalWidth * scale
      const drawHeight = image.naturalHeight * scale
      const drawX = (width - drawWidth) / 2
      const drawY = (height - drawHeight) / 2
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}

export function Usuarios() {
  const [lista, setLista] = useState([])
  const [escolas, setEscolas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState(USUARIO_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroCriar, setErroCriar] = useState('')
  const [busca, setBusca] = useState('')
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

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const [usuariosApi, escolasApi] = await Promise.all([listarUsuarios(), listarEscolas()])
        if (!ativo) return
        setLista(usuariosApi)
        setEscolas(escolasApi)
      } catch (error) {
        if (ativo) setErro(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [])

  async function persistirUsuario(usuario) {
    try {
      const atualizado = await atualizarUsuario(usuario.id, { role: usuario.role, escolaId: usuario.escolaId })
      setLista((prev) => prev.map((item) => (item.id === usuario.id ? atualizado : item)))
    } catch (error) {
      setErro(error.message)
    }
  }

  function alterarPermissao(id, role) {
    const usuario = lista.find((item) => item.id === id)
    if (!usuario) return
    const atualizado = { ...usuario, role, escolaId: role === 'DIRETOR' ? usuario.escolaId : null }
    setLista((prev) => prev.map((item) => (item.id === id ? atualizado : item)))
    persistirUsuario(atualizado)
  }

  function alterarEscola(id, escolaId) {
    const usuario = lista.find((item) => item.id === id)
    if (!usuario) return
    const atualizado = { ...usuario, escolaId: escolaId || null }
    setLista((prev) => prev.map((item) => (item.id === id ? atualizado : item)))
    persistirUsuario(atualizado)
  }

  function updateNovoUsuario(key, value) {
    setNovoUsuario((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'role' && value !== 'DIRETOR' ? { escolaId: '' } : {}),
    }))
  }

  function fecharModal() {
    setModalAberto(false)
    setNovoUsuario(USUARIO_VAZIO)
    setErroCriar('')
  }

  async function handleCriarUsuario() {
    setErroCriar('')
    setSalvando(true)
    try {
      const criado = await criarUsuario({
        nome: novoUsuario.nome.trim(),
        email: novoUsuario.email.trim(),
        senha: novoUsuario.senha,
        role: novoUsuario.role,
        escolaId: novoUsuario.role === 'DIRETOR' ? novoUsuario.escolaId : null,
      })
      setLista((prev) => [criado, ...prev])
      fecharModal()
    } catch (error) {
      setErroCriar(error.message)
    } finally {
      setSalvando(false)
    }
  }

  const formularioValido = novoUsuario.nome.trim() && novoUsuario.email.trim() && novoUsuario.senha.length >= 6
    && (novoUsuario.role !== 'DIRETOR' || novoUsuario.escolaId)

  const listaFiltrada = lista.filter((user) => {
    if (!busca.trim()) return true
    const texto = `${user.nome} ${user.email}`.toLowerCase()
    return texto.includes(busca.trim().toLowerCase())
  })

  async function exportarUsuariosPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const logo = await svgUrlParaPngDataUrl('/prefeitura-de-caraguatatuba-seeklogo.svg')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14

    function drawHeader() {
      doc.setFillColor(0, 18, 156)
      doc.rect(0, 0, pageWidth, 34, 'F')
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(pageWidth - margin - 22, 7, 22, 20, 2, 2, 'F')
      if (logo) doc.addImage(logo, 'PNG', pageWidth - margin - 19, 9, 16, 16)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Usuários cadastrados', margin, 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text('Secretaria Municipal de Educação - Caraguatatuba', margin, 21)
      doc.text('Relatório administrativo de acessos do sistema', margin, 27)
      doc.setTextColor(23, 32, 51)
    }

    function drawFooter() {
      const pageCount = doc.internal.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page)
        doc.setDrawColor(219, 228, 240)
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('Zela+ - IFSP Exceptions', margin, pageHeight - 8)
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
      }
      doc.setTextColor(23, 32, 51)
    }

    function quebrarPagina(y, alturaNecessaria) {
      if (y + alturaNecessaria <= pageHeight - 16) return y
      doc.addPage()
      drawHeader()
      return 42
    }

    drawHeader()
    let y = 42

    listaFiltrada.forEach((user) => {
      const escolaNome = escolas.find((escola) => escola.id === user.escolaId)?.nome || 'Sem vínculo'
      const linhas = [
        `Email: ${user.email}`,
        `Permissão: ${PERMISSOES.find((item) => item.value === user.role)?.label || user.role}`,
        `Escola vinculada: ${escolaNome}`,
        `Status: ${user.ativo ? 'Ativo' : 'Inativo'}`,
        `Cadastro: ${formatarDataBR(user.criadoEm)}`,
      ]
      const altura = 8 + linhas.length * 5 + 6

      y = quebrarPagina(y, altura)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(23, 32, 51)
      doc.text(user.nome, margin, y + 5)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      linhas.forEach((linha) => {
        doc.text(linha, margin, y + 4)
        y += 5
      })

      y += 4
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y - 2, pageWidth - margin, y - 2)
    })

    drawFooter()
    doc.save('usuarios.pdf')
  }

  return (
    <div className="space-y-3">
      <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="relative w-full flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary text-sm"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={exportarUsuariosPdf}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors duration-200 hover:bg-slate-50 sm:w-auto"
          >
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-primary-strong sm:w-auto"
          >
            <span className="text-sm leading-none">+</span> Novo usuário
          </button>
        </div>
      </div>
      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}
      {carregando ? (
        <p className="text-sm font-semibold text-slate-500">Carregando usuários...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-700">
              Nome
            </div>
            <div className="divide-y divide-slate-200">
              {listaFiltrada.map((user) => {
                const aberto = expandidos.has(user.id)
                return (
                  <div key={user.id}>
                    <button
                      type="button"
                      onClick={() => toggleExpandido(user.id)}
                      aria-expanded={aberto}
                      className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="font-bold text-slate-800">{user.nome}</span>
                      <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {aberto && (
                      <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Email:</span>
                          <span className="block text-slate-700">{user.email}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Permissão:</span>
                          <Select value={user.role} onChange={(value) => alterarPermissao(user.id, value)} options={PERMISSOES} />
                        </div>
                        {user.role === 'DIRETOR' && (
                          <div>
                            <span className="block text-xs font-bold tracking-wide text-slate-500">Escola vinculada:</span>
                            <Select
                              value={user.escolaId || ''}
                              onChange={(value) => alterarEscola(user.id, value)}
                              placeholder="Sem vinculo"
                              options={escolas.map((escola) => ({ value: escola.id, label: escola.nome }))}
                            />
                          </div>
                        )}
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Status:</span>
                          <span className="block text-slate-700">{user.ativo ? 'Ativo' : 'Inativo'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Cadastro:</span>
                          <span className="block text-slate-700">{formatarDataBR(user.criadoEm)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {!listaFiltrada.length && (
                <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Nenhum usuário encontrado.</p>
              )}
            </div>
          </div>

          <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm sm:block">
            <table className="w-full min-w-[900px] border-collapse rounded-2 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
                <tr className="divide-x divide-slate-200">
                  {['Nome', 'Email', 'Permissão', 'Escola vinculada', 'Status', 'Cadastro'].map((head) => (
                    <th key={head} className="px-4 py-3">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {listaFiltrada.map((user) => (
                  <tr key={user.id} className="divide-x divide-slate-200 border-x border-slate-200">
                    <td className="px-4 py-3 font-bold text-slate-800">{user.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Select value={user.role} onChange={(value) => alterarPermissao(user.id, value)} options={PERMISSOES} className="inline-block w-auto min-w-[10rem]" />
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'DIRETOR' ? (
                        <Select
                          value={user.escolaId || ''}
                          onChange={(value) => alterarEscola(user.id, value)}
                          placeholder="Sem vinculo"
                          options={escolas.map((escola) => ({ value: escola.id, label: escola.nome }))}
                          className="w-full max-w-56"
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatarDataBR(user.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modalAberto} onClose={fecharModal} title="Novo usuário">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Nome</span>
            <input
              value={novoUsuario.nome}
              onChange={(event) => updateNovoUsuario('nome', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Email</span>
            <input
              type="email"
              value={novoUsuario.email}
              onChange={(event) => updateNovoUsuario('email', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Senha</span>
            <input
              type="password"
              minLength={6}
              value={novoUsuario.senha}
              onChange={(event) => updateNovoUsuario('senha', event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold  text-slate-500">Permissão</span>
            <Select value={novoUsuario.role} onChange={(value) => updateNovoUsuario('role', value)} options={PERMISSOES} />
          </label>
          {novoUsuario.role === 'DIRETOR' && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold  text-slate-500">Escola</span>
              <Select
                value={novoUsuario.escolaId}
                onChange={(value) => updateNovoUsuario('escolaId', value)}
                placeholder="Selecione"
                options={escolas.map((escola) => ({ value: escola.id, label: escola.nome }))}
              />
            </label>
          )}
          {erroCriar && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erroCriar}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={fecharModal} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCriarUsuario}
              disabled={!formularioValido || salvando}
              className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function Auditoria() {
  const [logs, setLogs] = useState([])
  const [escolas, setEscolas] = useState([])
  const [escolaId, setEscolaId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
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
    listarEscolas().then((dados) => { if (ativo) setEscolas(dados) }).catch(() => {})
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro('')
      try {
        const dados = await listarAuditoria(escolaId ? { escolaId } : {})
        if (ativo) setLogs(dados)
      } catch (error) {
        if (ativo) setErro(error.message)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()
    return () => { ativo = false }
  }, [escolaId])

  const nomesEscolas = escolas.map((escola) => escola.nome)

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <FilterSelect
          label="Escola"
          value={escolas.find((escola) => escola.id === escolaId)?.nome || ''}
          onChange={(nome) => setEscolaId(escolas.find((escola) => escola.nome === nome)?.id || '')}
          options={nomesEscolas}
        />
      </div>

      {erro && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}

      {carregando ? (
        <p className="text-sm font-semibold text-slate-500">Carregando log de auditoria...</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-700">
              Ação
            </div>
            <div className="divide-y divide-slate-200">
              {logs.map((log) => {
                const aberto = expandidos.has(log.id)
                return (
                  <div key={log.id}>
                    <button
                      type="button"
                      onClick={() => toggleExpandido(log.id)}
                      aria-expanded={aberto}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="font-bold text-slate-800">{log.acao}</span>
                        <span className="ml-2 font-bold text-slate-800">{log.entidade}</span>
                      </span>
                      <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {aberto && (
                      <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-sm">
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Data/Hora:</span>
                          <span className="block text-slate-700">{new Date(log.criadoEm).toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Descrição:</span>
                          <span className="block text-slate-700">{log.descricao}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Usuário:</span>
                          <span className="block text-slate-700">{log.usuarioNome || log.usuarioEmail || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold tracking-wide text-slate-500">Escola:</span>
                          <span className="block text-slate-700">{log.escola || '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {!logs.length && (
                <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Nenhum registro de auditoria encontrado.</p>
              )}
            </div>
          </div>

          <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm sm:block">
            <table className="w-full min-w-[900px] border-collapse rounded-2 text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
                <tr className="divide-x divide-slate-200">
                  {['Data/Hora', 'Ação', 'Entidade', 'Descrição', 'Usuário', 'Escola'].map((head) => (
                    <th key={head} className="px-4 py-3">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="divide-x divide-slate-200 border-x border-slate-200">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(log.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.acao}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{log.entidade}</td>
                    <td className="px-4 py-3 text-slate-600">{log.descricao}</td>
                    <td className="px-4 py-3 text-slate-600">{log.usuarioNome || log.usuarioEmail || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{log.escola || '—'}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      Nenhum registro de auditoria encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export function Categorias() {
  const [lista, setLista] = useState(categorias)
  const [modalAberto, setModalAberto] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [ocorrencias, setOcorrencias] = useState([])

  useEffect(() => {
    let ativo = true
    listarOcorrencias()
      .then((dados) => { if (ativo) setOcorrencias(dados) })
      .catch(() => { if (ativo) setOcorrencias([]) })
    return () => {
      ativo = false
    }
  }, [])

  const contagem = groupCount(ocorrencias, 'tipo')

  function adicionarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome || lista.includes(nome)) return
    setLista((prev) => [...prev, nome])
    setNovaCategoria('')
    setModalAberto(false)
  }

  function removerCategoria(nome) {
    setLista((prev) => prev.filter((item) => item !== nome))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-strong"
        >
          + Nova categoria
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold tracking-wide text-slate-700">
          Nome
        </div>
        <div className="divide-y divide-slate-200">
          {lista.map((categoria) => (
            <div key={categoria} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-800">{categoria}</p>
                <p className="mt-1 text-xs text-slate-500">{contagem[categoria] || 0} ocorrências · Global</p>
              </div>
              <button type="button" onClick={() => removerCategoria(categoria)} className="cursor-pointer shrink-0 text-sm font-bold text-red-600 hover:underline">
                Remover
              </button>
            </div>
          ))}
          {!lista.length && (
            <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Nenhuma categoria cadastrada.</p>
          )}
        </div>
      </div>

      <div className="hidden w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm sm:block">
        <table className="w-full min-w-[600px] border-collapse rounded-2 text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-extrabold tracking-wide">
            <tr className="divide-x divide-slate-200">
              {['Nome', 'Ocorrências', 'Status', ''].map((head) => (
                <th key={head} className="px-4 py-3">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lista.map((categoria) => (
              <tr key={categoria} className="divide-x divide-slate-200 border-x border-slate-200">
                <td className="px-4 py-3 font-bold text-slate-800">{categoria}</td>
                <td className="px-4 py-3">{contagem[categoria] || 0}</td>
                <td className="px-4 py-3"><Badge>Global</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => removerCategoria(categoria)} className="cursor-pointer text-sm font-bold text-red-600 hover:underline">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova categoria">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nome</span>
            <input
              value={novaCategoria}
              onChange={(event) => setNovaCategoria(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-primary-500"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalAberto(false)} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
              Cancelar
            </button>
            <button
              type="button"
              onClick={adicionarCategoria}
              disabled={!novaCategoria.trim()}
              className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function Configuracoes() {
  return <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-800">Preferências gerais</h2><div className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Notificar novas ocorrências críticas</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Destacar escolas com pendências</label><label className="flex items-center gap-2"><input type="checkbox" /> Receber resumo diário mockado</label></div></Card><Card><h2 className="text-lg font-800">Mapa e auditoria</h2><p className="mt-3 text-sm text-slate-500">Configurações mockadas para visualização de bairros, marcadores e logs administrativos.</p><div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">Última sincronização visual: 04/07/2026 13:40</div></Card></div>
}
