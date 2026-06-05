import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PropiedadMock } from '../services/mockData'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ScheduleModal from './ui/ScheduleModal'
import Toast from './ui/Toast'

interface Props {
  property:        PropiedadMock
  isAuthenticated: boolean
  onAuthRequired:  () => void
}

interface AsesorInfo {
  telefono:   string | null
  avatar_url: string | null
  nombre:     string
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  return `$${(n / 1_000).toFixed(0)}k`
}

const hasVideo = (p: PropiedadMock) => Boolean(p.urlVideo)

// Safe numeric helpers — guard against NaN from mock/DB data
const safeNum = (n: number, fallback: number) => (Number.isFinite(n) ? n : fallback)

export default function ReelPlayer({ property, isAuthenticated, onAuthRequired }: Props) {
  const { session }                             = useAuth()
  const playerRef                               = useRef<HTMLDivElement>(null)
  const videoRef                                = useRef<HTMLVideoElement>(null)
  const [isPlaying,   setIsPlaying]             = useState(false)
  const [overlayIcon, setOverlayIcon]           = useState<'play' | 'pause' | null>(null)
  const [isLiked,     setIsLiked]               = useState(false)
  const [isSaved,     setIsSaved]               = useState(false)
  const [showToast,   setShowToast]             = useState(false)
  const [asesor,      setAsesor]                = useState<AsesorInfo | null>(null)
  const [showSched,   setShowSched]             = useState(false)

  const videoUrl = property.urlVideo || ''

  // Fetch asesor for contact/schedule buttons
  useEffect(() => {
    if (!property.asesorId) return
    supabase
      .from('perfiles')
      .select('nombre, telefono, avatar_url')
      .eq('id', property.asesorId)
      .single()
      .then(({ data }) => { if (data) setAsesor(data as AsesorInfo) })
  }, [property.asesorId])

  const showIcon = useCallback((type: 'play' | 'pause') => {
    setOverlayIcon(type)
    const t = setTimeout(() => setOverlayIcon(null), 900)
    return () => clearTimeout(t)
  }, [])

  // IntersectionObserver — play/pause directly in callback
  useEffect(() => {
    const el = playerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const e       = entries[0]
        const visible = e.isIntersecting && e.intersectionRatio >= 0.8
        const v       = videoRef.current
        if (visible) {
          if (v && hasVideo(property)) {
            v.play().catch((err) => console.error('Autoplay bloqueado:', err))
            setIsPlaying(true)
          }
        } else {
          if (v) v.pause()
          setIsPlaying(false)
        }
      },
      { threshold: 0.8 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [property])

  function handleContainerClick() {
    const v = videoRef.current
    if (!v || !hasVideo(property)) return
    if (v.paused) {
      v.play().catch((err) => console.error('Autoplay bloqueado:', err))
      setIsPlaying(true)
      showIcon('play')
    } else {
      v.pause()
      setIsPlaying(false)
      showIcon('pause')
    }
  }

  function handleLike() {
    if (!isAuthenticated) { onAuthRequired(); return }
    setIsLiked((v) => !v)
  }

  function handleSave() {
    if (!isAuthenticated) { onAuthRequired(); return }
    setIsSaved((v) => !v)
  }

  function handleShare() {
    const url = `${window.location.origin}?propertyId=${property.id}`
    navigator.clipboard.writeText(url).then(() => setShowToast(true))
  }

  function handleWhatsApp(e: React.MouseEvent) {
    e.stopPropagation()
    if (!asesor?.telefono) return
    const num  = asesor.telefono.replace(/\D/g, '')
    const text = encodeURIComponent(`Hola! Estoy interesado en tu propiedad: ${property.titulo}`)
    window.open(`https://wa.me/${num}?text=${text}`, '_blank')
  }

  function handleSchedule(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isAuthenticated) { onAuthRequired(); return }
    setShowSched(true)
  }

  // Guard NaN values
  const matchPct  = safeNum(property.compatibilidad, 75)
  const likeCount = safeNum(matchPct * 4 + 17, 0)
  const saveCount = safeNum(Math.floor((property.m2 ?? 100) * 0.85), 0)
  const shareCount = 31

  return (
    <div ref={playerRef} className="relative w-full h-full overflow-hidden">

      {/* ── Video background ─────────────────────────────────────── */}
      {hasVideo(property) ? (
        <video
          key={videoUrl}
          ref={videoRef}
          src={videoUrl}
          poster={property.imagenes?.[0] || ''}
          autoPlay loop muted playsInline preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => console.error('Error nativo del video:', e.currentTarget.error)}
          style={{
            filter:     isPlaying ? 'brightness(1)' : 'brightness(0.55) saturate(0.60)',
            transition: 'filter 0.5s ease',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            ...(property.imagenes?.[0]
              ? { backgroundImage: `url(${property.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(160deg, ${property.gradientFrom} 0%, ${property.gradientTo} 100%)` }),
            filter:     isPlaying ? 'brightness(1)' : 'brightness(0.55) saturate(0.60)',
            transition: 'filter 0.5s ease',
          }}
        />
      )}

      {/* Tap-to-play/pause zone */}
      <div className="absolute inset-0 z-10 cursor-pointer" onClick={handleContainerClick} />

      {/* Emoji watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <span className="text-[220px] select-none" style={{ opacity: 0.07 }}>{property.emoji}</span>
      </div>

      {/* Bottom scrim */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.42) 38%, transparent 68%)' }}
      />

      {/* Right scrim */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.55) 0%, transparent 38%)' }}
      />

      {/* Paused overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[6]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)' }}>
            <span className="text-white text-[28px] ml-1">▶</span>
          </div>
        </div>
      )}

      {/* Tap feedback icon */}
      <AnimatePresence>
        {overlayIcon && (
          <motion.div
            key={overlayIcon}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[7]"
            initial={{ opacity: 0.9, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.35 }}
          >
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(10px)' }}>
              <span className="text-white text-[32px] leading-none">{overlayIcon === 'play' ? '▶' : '⏸'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match badge */}
      <div className="absolute top-20 right-4 z-20">
        <div
          className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
          style={{ background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.24)' }}
          title={`${matchPct}% de compatibilidad con tu perfil`}
        >
          ✦ {matchPct}% match
        </div>
      </div>

      {/* ── Action bar (right) ────────────────────────────────────── */}
      <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-5">
        <ActionBtn onClick={handleLike} active={isLiked} count={likeCount} icon={isLiked ? '♥' : '♡'} iconSize={22} title="Dar me gusta a esta propiedad" />
        <ActionBtn onClick={handleSave} active={isSaved} count={saveCount} icon="🔖" iconSize={18} title="Guardar propiedad" />
        <ActionBtn onClick={handleShare} active={false} count={shareCount} icon="↗" iconSize={20} title="Compartir enlace" />
      </div>

      {/* ── Property info (bottom left) ──────────────────────────── */}
      <div className="absolute bottom-20 left-4 right-[72px] z-20">
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-white mb-2"
          style={{ background: 'rgba(194,113,79,0.72)', backdropFilter: 'blur(8px)' }}
        >
          {property.tipo.charAt(0).toUpperCase() + property.tipo.slice(1)}
        </span>

        <h3 className="font-display text-[18px] font-bold text-white leading-[1.2] mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}>
          {property.titulo}
        </h3>
        <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.72)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          📍 {property.ubicacion}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.recamaras > 0 && <Chip>🛏 {property.recamaras} rec.</Chip>}
          {safeNum(property.m2, 0) > 0 && <Chip>📐 {property.m2} m²</Chip>}
          <Chip highlight>{fmtPrice(property.precio)}</Chip>
        </div>

        {/* Contact / Schedule buttons */}
        <div className="flex gap-2">
          <button
            title="Contactar asesor por WhatsApp"
            className="flex-1 px-3 py-[10px] rounded-full text-[12px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.96] relative z-20 disabled:opacity-40"
            style={{ background: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.40)' }}
            disabled={!asesor?.telefono}
            onClick={handleWhatsApp}
          >
            💬 WhatsApp
          </button>
          <button
            title="Agendar una visita guiada"
            className="flex-1 px-3 py-[10px] rounded-full text-[12px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.96] relative z-20"
            style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)', boxShadow: '0 4px 16px rgba(194,113,79,0.52)' }}
            onClick={handleSchedule}
          >
            📅 Agendar cita
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && <Toast message="🔗 Enlace copiado" onDismiss={() => setShowToast(false)} />}
      </AnimatePresence>

      {/* ScheduleModal */}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionBtnProps {
  onClick:  () => void
  active:   boolean
  count:    number
  icon:     string
  iconSize: number
  title?:   string
}

function ActionBtn({ onClick, active, count, icon, iconSize, title }: ActionBtnProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        title={title}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className="w-[46px] h-[46px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.84]"
        style={{
          background:     active ? '#C2714F' : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border:         '1px solid rgba(255,255,255,0.22)',
        }}
      >
        <span style={{ fontSize: iconSize, lineHeight: 1 }}>{icon}</span>
      </button>
      <span className="text-white text-[11px] font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
        {count}
      </span>
    </div>
  )
}

interface ChipProps {
  children:   React.ReactNode
  highlight?: boolean
}

function Chip({ children, highlight }: ChipProps) {
  return (
    <span
      className="px-2.5 py-[3px] rounded-full text-[11px] font-medium text-white"
      style={{
        background:     highlight ? 'rgba(194,113,79,0.68)' : 'rgba(255,255,255,0.16)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </span>
  )
}
