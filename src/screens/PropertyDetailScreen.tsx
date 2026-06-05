import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import type { PropiedadMock } from '../services/mockData'

interface Props {
  property: PropiedadMock
  onBack:   () => void
}

interface AsesorInfo {
  nombre:     string
  telefono:   string | null
  avatar_url: string | null
  agencia:    string | null
}

const LIFESTYLE_BARS = [
  { key: 'seguridad',          label: 'Seguridad',       icon: '🔐' },
  { key: 'trafico',            label: 'Sin tráfico',     icon: '🚗' },
  { key: 'vida_social',        label: 'Vida social',     icon: '🍕' },
  { key: 'tranquilidad',       label: 'Tranquilidad',    icon: '🤫' },
  { key: 'plusvalia',          label: 'Plusvalía',       icon: '📈' },
  { key: 'servicios_cercanos', label: 'Servicios cerca', icon: '🏪' },
] as const

type LifestyleKey = (typeof LIFESTYLE_BARS)[number]['key']

function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M MXN`
  }
  return `$${(n / 1_000).toFixed(0)}k MXN`
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function PropertyDetailScreen({ property, onBack }: Props) {
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [asesor,     setAsesor]     = useState<AsesorInfo | null>(null)
  const pointerStart                = useRef(0)

  useEffect(() => {
    if (!property.asesorId) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('perfiles')
      .select('nombre,telefono,avatar_url,agencia')
      .eq('id', property.asesorId)
      .single()
      .then(({ data }: { data: AsesorInfo | null }) => {
        if (data) setAsesor(data)
      })
  }, [property.asesorId])

  const slides: Array<{ imageUrl?: string; from?: string; to?: string }> =
    property.imagenes && property.imagenes.length > 0
      ? property.imagenes.map((url) => ({ imageUrl: url }))
      : [
          { from: property.gradientFrom, to: property.gradientTo   },
          { from: property.gradientTo,   to: '#2C2C3E'             },
          { from: '#5C6E4A',             to: property.gradientFrom },
          { from: '#1A1A1A',             to: property.gradientTo   },
        ]

  const GALLERY_COUNT = slides.length

  const asesorName = asesor?.nombre ?? 'Asesor'
  const waLink     = asesor?.telefono
    ? `https://wa.me/${asesor.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Estoy interesado en tu propiedad: ${property.titulo}`)}`
    : null

  return (
    <div className="flex flex-col bg-white">

      {/* ── Gallery ────────────────────────────────────────────── */}
      <div
        className="relative select-none flex-shrink-0"
        style={{ height: 280, overflow: 'hidden' }}
        onPointerDown={(e) => { pointerStart.current = e.clientX }}
        onPointerUp={(e) => {
          const diff = e.clientX - pointerStart.current
          if (diff < -40) setGalleryIdx((i) => Math.min(i + 1, GALLERY_COUNT - 1))
          else if (diff > 40) setGalleryIdx((i) => Math.max(i - 1, 0))
        }}
      >
        <div
          className="flex h-full"
          style={{
            width:      `${GALLERY_COUNT * 100}%`,
            transform:  `translateX(-${galleryIdx * (100 / GALLERY_COUNT)}%)`,
            transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: `${100 / GALLERY_COUNT}%`,
                ...(s.imageUrl
                  ? { backgroundImage: `url(${s.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: `linear-gradient(160deg, ${s.from} 0%, ${s.to} 100%)` }),
              }}
            >
              {!s.imageUrl && (
                <span className="text-[110px] select-none pointer-events-none" style={{ opacity: 0.10 }}>
                  {property.emoji}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="absolute top-5 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.88]"
          style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)' }}
        >
          <span className="text-white text-[18px] font-bold leading-none">←</span>
        </button>

        <div className="absolute top-5 right-4 z-10">
          <div
            className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
            style={{
              background:     'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              border:         '1px solid rgba(255,255,255,0.28)',
            }}
          >
            ✦ {property.compatibilidad}% match
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {Array.from({ length: GALLERY_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => setGalleryIdx(i)}
              className="border-none cursor-pointer p-0 transition-all"
              style={{
                width:        i === galleryIdx ? 20 : 6,
                height:       6,
                borderRadius: 3,
                background:   i === galleryIdx ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Header info ────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-1">
          <h1
            className="font-display text-[22px] font-bold leading-[1.2] flex-1"
            style={{ color: '#1A1A1A' }}
          >
            {property.titulo}
          </h1>
          <p className="font-display text-[20px] font-bold flex-shrink-0" style={{ color: '#C2714F' }}>
            {formatPrice(property.precio)}
          </p>
        </div>
        <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>
          📍 {property.ubicacion}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {property.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(194,113,79,0.08)',
                color:      '#C2714F',
                border:     '1px solid rgba(194,113,79,0.20)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className="flex rounded-[20px] p-4"
          style={{ background: '#F5EFE6', border: '1px solid rgba(194,113,79,0.12)' }}
        >
          {[
            { icon: '📐', value: `${property.m2}`,        unit: 'm²'   },
            { icon: '🛏', value: `${property.recamaras}`, unit: 'rec.' },
            { icon: '🚿', value: `${property.banos}`,     unit: 'baños'},
          ].map((spec, i) => (
            <div
              key={spec.unit}
              className="flex-1 text-center"
              style={i > 0 ? { borderLeft: '1px solid rgba(194,113,79,0.15)' } : {}}
            >
              <span className="text-[18px] block mb-0.5">{spec.icon}</span>
              <span className="font-display text-[20px] font-bold block" style={{ color: '#1A1A1A' }}>
                {spec.value}
              </span>
              <span className="text-[11px]" style={{ color: '#6B6B6B' }}>{spec.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lifestyle section ──────────────────────────────────── */}
      <div
        className="mx-5 rounded-[24px] p-5 mb-5"
        style={{ background: 'linear-gradient(140deg, #1A1A1A 0%, #2C2C3E 100%)' }}
      >
        <h2 className="font-display text-[18px] font-bold text-white mb-0.5">
          Cómo se siente vivir aquí
        </h2>
        <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.48)' }}>
          Basado en datos del vecindario
        </p>

        <div className="flex flex-col gap-4">
          {LIFESTYLE_BARS.map(({ key, label, icon }, idx) => {
            const raw   = property.caracteristicas[key as LifestyleKey] as number
            const pct   = (raw / 5) * 100
            const color = pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FBD249' : '#F87171'
            const grad  = pct >= 70
              ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
              : pct >= 40
              ? 'linear-gradient(90deg, #FBD249, #F59E0B)'
              : 'linear-gradient(90deg, #F87171, #EF4444)'
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[13px] text-white">{icon} {label}</span>
                  <span className="text-[12px] font-bold" style={{ color }}>{raw}/5</span>
                </div>
                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: grad }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.75, delay: idx * 0.07, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {(property.caracteristicas.pet_friendly || property.caracteristicas.familias || property.caracteristicas.home_office) && (
          <div className="flex flex-wrap gap-2 mt-5">
            {property.caracteristicas.pet_friendly && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>
                🐾 Pet friendly
              </span>
            )}
            {property.caracteristicas.familias && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>
                👨‍👩‍👧 Zona familiar
              </span>
            )}
            {property.caracteristicas.home_office && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>
                💻 Home office
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Asesor ─────────────────────────────────────────────── */}
      <div
        className="mx-5 rounded-[24px] p-5 mb-8"
        style={{
          background: 'white',
          border:     '1.5px solid #EDE4D7',
          boxShadow:  '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[16px] font-bold text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E8A98A, #C2714F)', flexShrink: 0 }}
          >
            {asesor?.avatar_url ? (
              <img src={asesor.avatar_url} alt={asesorName} className="w-full h-full object-cover" />
            ) : (
              initials(asesorName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[15px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                {asesorName}
              </p>
              <span
                className="px-1.5 py-[2px] rounded text-[9px] font-black flex-shrink-0 tracking-[0.4px]"
                style={{ background: '#C2714F', color: 'white' }}
              >
                ✓ VERIFICADO
              </span>
            </div>
            <p className="text-[12px]" style={{ color: '#6B6B6B' }}>
              {asesor?.agencia ?? 'Asesor inmobiliario'}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-[13px] rounded-[16px] text-[14px] font-semibold text-white text-center no-underline transition-all active:scale-[.97]"
              style={{ background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              💬 WhatsApp
            </a>
          ) : (
            <button
              className="flex-1 py-[13px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #E8A98A, #C2714F)' }}
            >
              💬 Contactar asesor
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
