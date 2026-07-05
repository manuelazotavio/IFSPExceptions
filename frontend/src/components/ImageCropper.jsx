import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedFile } from '../utils/imageCrop.js'

const PROPORCOES = [
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
]

export function ImageCropper({ imageSrc, fileName = 'foto.jpg', onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function confirmar() {
    if (!croppedAreaPixels) return
    setSalvando(true)
    try {
      const arquivo = await getCroppedFile(imageSrc, croppedAreaPixels, fileName)
      onConfirm(arquivo)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-lg bg-slate-900 sm:h-80">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, area) => setCroppedAreaPixels(area)}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <span className="mb-1 block text-xs font-bold tracking-wide text-slate-500">Proporção</span>
          <div className="flex flex-wrap gap-2">
            {PROPORCOES.map((proporcao) => (
              <button
                key={proporcao.label}
                type="button"
                onClick={() => setAspect(proporcao.value)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                  aspect === proporcao.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {proporcao.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="cursor-pointer w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:w-auto">
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={salvando}
          className="cursor-pointer w-full rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {salvando ? 'Salvando...' : 'Usar corte'}
        </button>
      </div>
    </div>
  )
}
