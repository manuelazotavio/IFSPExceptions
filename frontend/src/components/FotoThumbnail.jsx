import { useState } from 'react'

function classificarAspecto(largura, altura) {
  const razao = largura / altura
  if (Math.abs(razao - 1) < 0.05) return 'aspect-square'
  if (razao > 1) return 'aspect-video'
  return 'aspect-[9/16]'
}

export function FotoThumbnail({ src, alt, className = '', children }) {
  const [aspecto, setAspecto] = useState('aspect-square')

  return (
    <div className={`group relative overflow-hidden rounded-md border border-slate-200 bg-slate-100 ${aspecto} ${className}`}>
      <img
        src={src}
        alt={alt}
        onLoad={(event) => setAspecto(classificarAspecto(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))}
        className="h-full w-full object-cover"
      />
      {children}
    </div>
  )
}
