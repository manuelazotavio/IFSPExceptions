import { GeoJSON } from 'react-leaflet'

function hasValidBoundaryGeometry(feature) {
  const geometryType = feature?.geometry?.type
  return geometryType === 'Polygon' || geometryType === 'MultiPolygon'
}

export function CaraguatatubaBoundary({ data, styleConfig }) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    return null
  }

  const validFeatures = data.features.filter(hasValidBoundaryGeometry)
  if (validFeatures.length === 0) {
    return null
  }

  return (
    <GeoJSON
      data={{ ...data, features: validFeatures }}
      interactive={false}
      style={{
        color: styleConfig?.strokeColor || '#334155',
        weight: styleConfig?.municipioBoundaryWeight || 2.2,
        opacity: styleConfig?.strokeOpacity || 0.75,
        fillColor: styleConfig?.strokeColor || '#334155',
        fillOpacity: styleConfig?.municipioFillOpacity || 0.02,
        dashArray: styleConfig?.dashArray || '6 4',
      }}
    />
  )
}
