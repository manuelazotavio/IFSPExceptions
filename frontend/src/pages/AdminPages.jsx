import { categorias, ocorrenciasAprovadas, usuarios } from '../data/mockData.js'
import { dashboardMetrics, groupCount } from '../utils/metrics.js'
import { Badge, BarList, Card, MetricCard } from '../components/ui.jsx'

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
