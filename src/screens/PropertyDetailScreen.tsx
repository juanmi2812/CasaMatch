import { useState, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { PropiedadMock } from '../services/mockData'
import ScheduleModal from '../components/ui/ScheduleModal'

interface Props {
  property:            PropiedadMock
  onBack:              () => void
  onViewAsesorPerfil?: (asesorId: string) => void
}

interface AsesorInfo {
  nombre:            string
  telefono:          string | null
  avatar_url:        string | null
  agencia:           string | null
  instagram_url:     string | null
  tiktok_url:        string | null
  facebook_url:      string | null
  anios_experiencia: number | null
}


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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PropertyDetailScreen({ property, onBack, onViewAsesorPerfil }: Props) {
  const { session }                 = useAuth()
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [asesor,     setAsesor]     = useState<AsesorInfo | null>(null)
  const [showSched,  setShowSched]  = useState(false)
  const pointerStart                = useRef(0)

  useEffect(() => {
    if (!property.asesorId) return
    supabase
      .from('perfiles')
      .select('nombre, telefono, avatar_url, agencia, instagram_url, tiktok_url, facebook_url, anios_experiencia')
      .eq('id', property.asesorId)
      .single()
      .then(({ data, error }) => {
        if (error) { console.error('[asesor fetch]', error.message); return }
        if (data) setAsesor(data as AsesorInfo)
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
  const asesorName    = asesor?.nombre ?? '—'

  function handleWhatsApp() {
    if (!asesor?.telefono) return
    const num  = asesor.telefono.replace(/\D/g, '')
    const text = encodeURIComponent(`Hola! Estoy interesado en tu propiedad: ${property.titulo}`)
    window.open(`https://wa.me/${num}?text=${text}`, '_blank')
  }

  return (
    <div className="flex flex-col bg-white overflow-x-hidden" style={{ minHeight: '100%' }}>

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
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.28)' }}
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
                width: i === galleryIdx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === galleryIdx ? 'white' : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Header info ────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3 mb-1">
          <h1 className="font-display text-[22px] font-bold leading-[1.2] flex-1" style={{ color: '#1A1A1A' }}>
            {property.titulo}
          </h1>
          <p className="font-display text-[20px] font-bold flex-shrink-0" style={{ color: '#C2714F' }}>
            {formatPrice(property.precio)}
          </p>
        </div>
        <p className="text-[13px] mb-4" style={{ color: '#6B6B6B' }}>📍 {property.ubicacion}</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {property.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(194,113,79,0.08)', color: '#C2714F', border: '1px solid rgba(194,113,79,0.20)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex rounded-[20px] p-4" style={{ background: '#F5EFE6', border: '1px solid rgba(194,113,79,0.12)' }}>
          {[
            { icon: '📐', value: `${property.m2}`,        unit: 'm²'   },
            { icon: '🛏', value: `${property.recamaras}`, unit: 'rec.' },
            { icon: '🚿', value: `${property.banos}`,     unit: 'baños'},
          ].map((spec, i) => (
            <div key={spec.unit} className="flex-1 text-center" style={i > 0 ? { borderLeft: '1px solid rgba(194,113,79,0.15)' } : {}}>
              <span className="text-[18px] block mb-0.5">{spec.icon}</span>
              <span className="font-display text-[20px] font-bold block" style={{ color: '#1A1A1A' }}>{spec.value}</span>
              <span className="text-[11px]" style={{ color: '#6B6B6B' }}>{spec.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lifestyle ──────────────────────────────────────────── */}
      <div className="mx-5 rounded-[24px] p-5 mb-5" style={{ background: 'linear-gradient(140deg, #1A1A1A 0%, #2C2C3E 100%)' }}>
        <h2 className="font-display text-[18px] font-bold text-white mb-0.5">Cómo se siente vivir aquí</h2>
        <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.48)' }}>Basado en datos del vecindario</p>

        {(() => {
          const c = property.caracteristicas
          console.log('Data de características:', c)

          const BARS = [
            { key: 'seguridad',          val: c?.seguridad          || 0, label: 'Seguridad',       icon: '🔐' },
            { key: 'trafico',            val: c?.trafico            || 0, label: 'Sin tráfico',     icon: '🚗' },
            { key: 'vida_social',        val: c?.vida_social        || 0, label: 'Vida social',     icon: '🍕' },
            { key: 'tranquilidad',       val: c?.tranquilidad       || 0, label: 'Tranquilidad',    icon: '🤫' },
            { key: 'plusvalia',          val: c?.plusvalia          || 0, label: 'Plusvalía',       icon: '📈' },
            { key: 'servicios_cercanos', val: c?.servicios_cercanos || 0, label: 'Servicios cerca', icon: '🏪' },
          ]

          return (
            <div className="flex flex-col gap-4">
              {BARS.map(({ key, val, label, icon }) => {
                const pct   = Math.min(((val / 5) * 100), 100)
                const color = pct >= 70 ? '#4ADE80' : pct >= 40 ? '#FBD249' : '#F87171'
                const grad  = pct >= 70
                  ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                  : pct >= 40 ? 'linear-gradient(90deg, #FBD249, #F59E0B)'
                  : 'linear-gradient(90deg, #F87171, #EF4444)'
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] text-white">{icon} {label}</span>
                      <span className="text-[12px] font-bold" style={{ color }}>{val}/5</span>
                    </div>
                    <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ background: grad, width: `${((val / 5) * 100)}%`, transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {(property.caracteristicas?.pet_friendly || property.caracteristicas?.familias || property.caracteristicas?.home_office) && (
          <div className="flex flex-wrap gap-2 mt-5">
            {property.caracteristicas?.pet_friendly && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>🐾 Pet friendly</span>
            )}
            {property.caracteristicas?.familias && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>👨‍👩‍👧 Zona familiar</span>
            )}
            {property.caracteristicas?.home_office && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>💻 Home office</span>
            )}
          </div>
        )}
      </div>

      {/* ── Asesor card ─────────────────────────────────────────── */}
      <div
        className="mx-5 rounded-[24px] p-5 pb-28"
        style={{ background: 'white', border: '1.5px solid #EDE4D7', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C2714F' }}>
          Tu asesor asignado
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[16px] font-bold text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E8A98A, #C2714F)' }}
          >
            {asesor?.avatar_url ? (
              <img src={asesor.avatar_url} alt={asesorName} className="w-full h-full object-cover" />
            ) : (
              initials(asesorName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[15px] font-semibold truncate" style={{ color: '#1A1A1A' }}>{asesorName}</p>
              <span className="px-1.5 py-[2px] rounded text-[9px] font-black flex-shrink-0 tracking-[0.4px]" style={{ background: '#C2714F', color: 'white' }}>
                ✓ VERIFICADO
              </span>
            </div>
            <p className="text-[12px]" style={{ color: '#6B6B6B' }}>
              {asesor?.agencia ?? 'Asesor inmobiliario'}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {asesor?.telefono && (
                <p className="text-[11px]" style={{ color: '#9B9B9B' }}>📱 {asesor.telefono}</p>
              )}
              {asesor?.anios_experiencia != null && (
                <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full" style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}>
                  {asesor.anios_experiencia} años exp.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Social links */}
        {(asesor?.instagram_url || asesor?.tiktok_url || asesor?.facebook_url) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {asesor.instagram_url && (
              <a href={asesor.instagram_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(225,48,108,0.10)', color: '#E1306C', textDecoration: 'none' }}>
                📸 Instagram
              </a>
            )}
            {asesor.tiktok_url && (
              <a href={asesor.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.07)', color: '#1A1A1A', textDecoration: 'none' }}>
                🎵 TikTok
              </a>
            )}
            {asesor.facebook_url && (
              <a href={asesor.facebook_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(24,119,242,0.10)', color: '#1877F2', textDecoration: 'none' }}>
                👤 Facebook
              </a>
            )}
          </div>
        )}

        {/* Ver perfil completo */}
        {property.asesorId && onViewAsesorPerfil && (
          <button
            onClick={() => onViewAsesorPerfil(property.asesorId!)}
            className="w-full py-2.5 rounded-[14px] text-[12px] font-semibold border-none cursor-pointer transition-all active:scale-[.97]"
            style={{ background: '#F5EFE6', color: '#C2714F', border: '1px solid rgba(194,113,79,0.20)' }}
          >
            Ver perfil completo →
          </button>
        )}
      </div>

      {/* ── Sticky bottom action bar ────────────────────────────── */}
      <div
        className="sticky bottom-0 left-0 right-0 flex gap-3 px-5 py-4"
        style={{ background: 'rgba(253,250,246,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid #EDE4D7' }}
      >
        <button
          onClick={handleWhatsApp}
          disabled={!asesor?.telefono}
          className="flex-1 py-[14px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-40"
          style={{ background: '#25D366' }}
        >
          💬 Contactar asesor
        </button>

        <button
          onClick={() => setShowSched(true)}
          disabled={!session?.user || !property.asesorId}
          className="flex-1 py-[14px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
        >
          📅 Agendar cita
        </button>
      </div>

      {/* ── ScheduleModal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showSched && session?.user && property.asesorId && (
          <ScheduleModal
            property={property}
            asesorId={property.asesorId}
            clientId={session.user.id}
            onDismiss={() => setShowSched(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
