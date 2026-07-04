import { bairros, escolas, ocorrenciasAprovadas } from '../data/mockData.js'
import { dashboardMetrics, groupCount, sortOcorrencias } from '../utils/metrics.js'
import { BarList, Card, MetricCard } from '../components/ui.jsx'

export function Dashboard({ onNavigate }) {
  const metrics = dashboardMetrics()
  const porBairro = Object.entries(groupCount(ocorrenciasAprovadas, 'bairro')).map(([label, value]) => ({ label, value }))
  const porTipo = Object.entries(groupCount(ocorrenciasAprovadas, 'tipo')).map(([label, value]) => ({ label, value }))
  const escolasRank = escolas.map((escola) => ({
    ...escola,
    total: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id).length,
    criticas: ocorrenciasAprovadas.filter((item) => item.escolaId === escola.id && item.criticidade === 'Critica').length,
  })).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Escolas" value={metrics.escolas} />
        <MetricCard label="Aprovadas" value={metrics.aprovadas} />
        <MetricCard label="Abertas" value={metrics.abertas} tone="red" />
        <MetricCard label="Em andamento" value={metrics.andamento} />
        <MetricCard label="Resolvidas" value={metrics.resolvidas} tone="green" />
        <MetricCard label="Criticas" value={metrics.criticas} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-800 text-slate-950">Escolas com mais ocorrencias</h2>
            <button onClick={() => onNavigate('/ocorrencias')} className="text-sm font-bold text-blue-700">Ver lista</button>
          </div>
          <div className="space-y-3">
            {escolasRank.slice(0, 5).map((escola) => (
              <div key={escola.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div><p className="font-bold text-slate-800">{escola.nome}</p><p className="text-sm text-slate-500">{escola.bairro}</p></div>
                <div className="text-right"><p className="font-800 text-slate-950">{escola.total}</p><p className="text-xs text-red-600">{escola.criticas} criticas</p></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Ocorrencias por bairro</h2>
          <BarList data={porBairro} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Ocorrencias por tipo</h2>
          <BarList data={porTipo} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-800 text-slate-950">Prioridades mais antigas</h2>
          <div className="space-y-3">
            {sortOcorrencias(ocorrenciasAprovadas).slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => onNavigate(`/ocorrencias/${item.id}`)} className="block w-full rounded-md border border-slate-100 px-3 py-2 text-left hover:bg-slate-50">
                <p className="font-bold text-slate-800">{item.titulo}</p>
                <p className="text-sm text-slate-500">{item.escola} - {item.dataEnvio}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
