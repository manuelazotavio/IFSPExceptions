import { prisma } from '../database/prismaClient.js'

function bucketCriticidade(criticidade) {
  if (criticidade === 'Critica') return 'CRITICA'
  if (criticidade === 'Baixa') return 'BAIXA'
  return 'ATENCAO'
}

export class MapaController {
  static async heatmap(request, response) {
    const { escolaId, status, criticidade, dataInicial, dataFinal } = request.query

    const ocorrencias = await prisma.ocorrencia.findMany({
      where: {
        aprovadaPelaEscola: true,
        ...(escolaId ? { escolaId } : {}),
        ...(status ? { status } : {}),
        ...(dataInicial || dataFinal
          ? {
              dataEnvio: {
                ...(dataInicial ? { gte: new Date(dataInicial) } : {}),
                ...(dataFinal ? { lte: new Date(dataFinal) } : {}),
              },
            }
          : {}),
      },
    })

    const escolas = await prisma.escola.findMany()
    const porEscola = new Map(
      escolas.map((escola) => [
        escola.id,
        {
          escolaId: escola.id,
          escolaNome: escola.nome,
          latitude: escola.latitude,
          longitude: escola.longitude,
          totalOcorrencias: 0,
          criticas: 0,
          atencao: 0,
          baixas: 0,
        },
      ]),
    )

    const criticidadeFiltro = criticidade ? criticidade.toUpperCase() : null

    for (const ocorrencia of ocorrencias) {
      const grupo = bucketCriticidade(ocorrencia.criticidade)
      if (criticidadeFiltro && grupo !== criticidadeFiltro) continue

      const item = porEscola.get(ocorrencia.escolaId)
      if (!item) continue

      item.totalOcorrencias += 1
      if (grupo === 'CRITICA') item.criticas += 1
      else if (grupo === 'BAIXA') item.baixas += 1
      else item.atencao += 1
    }

    const resultado = [...porEscola.values()].filter((item) => item.totalOcorrencias > 0)
    return response.json(resultado)
  }
}
