import { useState } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedFile } from '../utils/imageCrop.js'

const PROPORCOES = [
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
]

export function ImageCropperModal({ imageSrc, fileName = 'foto.jpg', onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [personalizadoAtivo, setPersonalizadoAtivo] = useState(false)
  const [larguraPersonalizada, setLarguraPersonalizada] = useState(4)
  const [alturaPersonalizada, setAlturaPersonalizada] = useState(3)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [salvando, setSalvando] = useState(false)

  function aplicarPersonalizado() {
    const largura = Number(larguraPersonalizada) || 1
    const altura = Number(alturaPersonalizada) || 1
    setAspect(largura / altura)
    setPersonalizadoAtivo(true)
  }

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
                onClick={() => { setAspect(proporcao.value); setPersonalizadoAtivo(false) }}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                  !personalizadoAtivo && aspect === proporcao.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {proporcao.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPersonalizadoAtivo(true)}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                personalizadoAtivo ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {personalizadoAtivo && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">Largura</span>
              <input
                type="number"
                min="1"
                value={larguraPersonalizada}
                onChange={(event) => setLarguraPersonalizada(event.target.value)}
                className="h-9 w-20 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <span className="pb-2 text-sm font-bold text-slate-400">:</span>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">Altura</span>
              <input
                type="number"
                min="1"
                value={alturaPersonalizada}
                onChange={(event) => setAlturaPersonalizada(event.target.value)}
                className="h-9 w-20 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-primary-500"
              />
            </label>
            <button type="button" onClick={aplicarPersonalizado} className="h-9 cursor-pointer rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Aplicar
            </button>
          </div>
        )}

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

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmar}
          disabled={salvando}
          className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Usar corte'}
        </button>
      </div>
    </div>
  )
}
