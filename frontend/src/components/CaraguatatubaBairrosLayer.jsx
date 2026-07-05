import L from 'leaflet'
import { GeoJSON } from 'react-leaflet'
import { getBairroKey } from '../utils/mapaBairros.js'

function hasValidBoundaryGeometry(feature) {
  const geometryType = feature?.geometry?.type
  return geometryType === 'Polygon' || geometryType === 'MultiPolygon'
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
        const bairroKey = getBairroKey(feature)
        const stats = bairroStats[bairroKey]
        const isSelected = selectedBairro === bairroKey
        const hasSchools = Number(stats?.totalEscolas || 0) > 0
        const baseFillOpacity = hasSchools
          ? (selectedSchoolId ? styleConfig.fillOpacitySelected : styleConfig.fillOpacity)
          : 0
        const selectedFillOpacity = hasSchools
          ? (selectedSchoolId ? styleConfig.fillOpacitySelected + 0.05 : styleConfig.fillOpacity + 0.06)
          : 0

        return {
          color: isSelected ? '#0f172a' : styleConfig.strokeColor,
          weight: isSelected ? styleConfig.strokeWeight + 0.8 : styleConfig.strokeWeight,
          opacity: hasSchools ? styleConfig.strokeOpacity : Math.min(0.55, styleConfig.strokeOpacity),
          dashArray: styleConfig.dashArray,
          fillColor: hasSchools ? (stats?.fillColor || styleConfig.defaultFillColor) : 'transparent',
          fillOpacity: isSelected ? selectedFillOpacity : baseFillOpacity,
        }
      }}
      onEachFeature={(feature, layer) => {
        if (!onSelectBairro) return

        layer.on('click', (event) => {
          L.DomEvent.stopPropagation(event)
          layer.bringToFront()
          onSelectBairro(feature)
        })
      }}
    />
  )
}
