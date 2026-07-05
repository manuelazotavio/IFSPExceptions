import { GeoJSON } from 'react-leaflet'

function hasValidBoundaryGeometry(feature) {
  const geometryType = feature?.geometry?.type
  return geometryType === 'Polygon' || geometryType === 'MultiPolygon'
}

export function CaraguatatubaBoundary({ data }) {
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
        color: '#dc2626',
        weight: 3,
        opacity: 0.95,
        fillColor: '#dc2626',
        fillOpacity: 0.04,
        dashArray: '6 6',
      }}
    />
  )
}
