import { GeoJSON } from 'react-leaflet'

function hasValidBoundaryGeometry(feature) {
  const geometryType = feature?.geometry?.type
  return geometryType === 'Polygon' || geometryType === 'MultiPolygon'
}

function getFeatureKey(feature) {
  return String(
    feature?.properties?.NM_BAIRRO
    || feature?.properties?.nome_bairro
    || feature?.properties?.nome_bairr
    || feature?.properties?.nome
    || feature?.properties?.name
    || feature?.properties?.id
    || 'bairro-sem-nome',
  )
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export const bairroStyleDefaults = {
  strokeColor: '#334155',
  municipioBoundaryWeight: 2.2,
  strokeWeight: 1.2,
  strokeOpacity: 0.65,
  dashArray: '6 4',
  municipioFillOpacity: 0.02,
  fillOpacity: 0.16,
  fillOpacitySelected: 0.1,
  defaultFillColor: '#16a34a',
}

export function CaraguatatubaBairrosLayer({
  data,
  bairroStats = {},
  styleConfig = bairroStyleDefaults,
  selectedSchoolId = '',
  selectedBairro = '',
  onSelectBairro,
}) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) return null

  const validFeatures = data.features.filter(hasValidBoundaryGeometry)
  if (validFeatures.length === 0) return null

  return (
    <GeoJSON
      data={{ ...data, features: validFeatures }}
      interactive={Boolean(onSelectBairro)}
      style={(feature) => {
        const bairroKey = getFeatureKey(feature)
        const stats = bairroStats[bairroKey]
        const isSelected = selectedBairro === bairroKey

        return {
          color: styleConfig.strokeColor,
          weight: isSelected ? styleConfig.strokeWeight + 0.8 : styleConfig.strokeWeight,
          opacity: styleConfig.strokeOpacity,
          dashArray: styleConfig.dashArray,
          fillColor: stats?.fillColor || styleConfig.defaultFillColor,
          fillOpacity: isSelected
            ? (selectedSchoolId ? styleConfig.fillOpacitySelected + 0.04 : styleConfig.fillOpacity + 0.05)
            : (selectedSchoolId ? styleConfig.fillOpacitySelected : styleConfig.fillOpacity),
        }
      }}
      onEachFeature={(feature, layer) => {
        if (!onSelectBairro) return

        layer.on('click', () => {
          onSelectBairro(feature)
        })
      }}
    />
  )
}
