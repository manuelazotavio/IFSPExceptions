import { bairros, categorias, escolas, ocorrenciasAprovadas, usuarios } from '../data/mockData.js'
import { dashboardMetrics, getSchoolStats, groupCount } from '../utils/metrics.js'
import { Badge, BarList, Card, MetricCard } from '../components/ui.jsx'

export function Escolas({ escolaIdFiltro = '', onNavigate }) {
  const escolasFiltradas = escolaIdFiltro
    ? escolas.filter((escola) => escola.id === escolaIdFiltro)
    : escolas

  return (
    <div className="space-y-4">
      {escolaIdFiltro ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Filtro aplicado</p>
            <p className="text-sm font-semibold text-slate-700">
              Exibindo os dados cadastrais da escola selecionada no mapa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('/escolas')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpar filtro
          </button>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="overflow-x-auto">
          {escolasFiltradas.length > 0 ? (
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500">
                <tr>
                  {['Nome', 'Bairro', 'Endereco', 'Status', 'Ocorrencias', 'Criticas', 'Cadastro'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {escolasFiltradas.map((escola) => {
                  const stats = getSchoolStats(escola.id)
                  return (
                    <tr key={escola.id} className="border-t border-slate-100">
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
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-sm font-semibold text-slate-500">
              Nenhuma escola encontrada para o filtro informado.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export function Indicadores() {
  const metrics = dashboardMetrics()
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{Object.entries(metrics).map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="mb-4 text-lg font-800">Por bairro</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'bairro')).map(([label, value]) => ({ label, value }))} /></Card><Card><h2 className="mb-4 text-lg font-800">Por criticidade</h2><BarList data={Object.entries(groupCount(ocorrenciasAprovadas, 'criticidade')).map(([label, value]) => ({ label, value }))} /></Card></div></div>
}

export function Usuarios() {
  return <Card className="p-0"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs font-800 uppercase text-slate-500"><tr>{['Nome', 'Email', 'Perfil', 'Status', 'Ultimo acesso'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{usuarios.map((user) => <tr key={user.email} className="border-t border-slate-100"><td className="px-4 py-3 font-bold">{user.nome}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.perfil}</td><td className="px-4 py-3"><Badge>{user.status}</Badge></td><td className="px-4 py-3">{user.ultimoAcesso}</td></tr>)}</tbody></table></Card>
}

export function Categorias() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categorias.map((categoria) => <Card key={categoria}><div className="flex items-center justify-between"><h2 className="font-800 text-slate-900">{categoria}</h2><Badge>Global</Badge></div><p className="mt-3 text-sm text-slate-500">Categoria global disponivel para ocorrencias aprovadas no fluxo da SEDUC.</p></Card>)}</div>
}

export function Configuracoes() {
  return <div className="grid gap-5 xl:grid-cols-2"><Card><h2 className="text-lg font-800">Preferencias gerais</h2><div className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Notificar novas ocorrencias criticas</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Destacar escolas com pendencias</label><label className="flex items-center gap-2"><input type="checkbox" /> Receber resumo diario mockado</label></div></Card><Card><h2 className="text-lg font-800">Mapa e auditoria</h2><p className="mt-3 text-sm text-slate-500">Configuracoes mockadas para visualizacao de bairros, marcadores e logs administrativos.</p><div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">Ultima sincronizacao visual: 04/07/2026 13:40</div></Card></div>
}
