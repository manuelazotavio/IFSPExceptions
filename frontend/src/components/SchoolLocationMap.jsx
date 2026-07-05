import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export function SchoolLocationMap({ escola, className = 'h-80 w-full rounded-md' }) {
  const latitude = Number(escola?.latitude)
  const longitude = Number(escola?.longitude)
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)

  if (!hasCoordinates) {
    return (
      <div className="flex h-80 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
        Esta escola ainda não possui latitude e longitude cadastradas para exibição no mapa.
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-md border border-slate-200 ${className}`}>
      <MapContainer center={[latitude, longitude]} zoom={17} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewSync latitude={latitude} longitude={longitude} />
        <Marker position={[latitude, longitude]}>
          <Tooltip direction="top" offset={[0, -16]} permanent>
            <div className="space-y-1">
              <strong>{escola.nome}</strong>
              <p>{escola.endereco}</p>
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  )
}

function MapViewSync({ latitude, longitude }) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], 17)
    map.invalidateSize()
  }, [latitude, longitude, map])

  return null
}
