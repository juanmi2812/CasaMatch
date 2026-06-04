import { useState, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { PropiedadMock } from '../services/mockData'
import Toast from './ui/Toast'

const FALLBACK_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-luxury-resort-with-swimming-pool-41617-large.mp4'

interface Props {
  property:        PropiedadMock
  isAuthenticated: boolean
  onAuthRequired:  () => void
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  return `$${(n / 1_000).toFixed(0)}k`
}

export default function ReelPlayer({ property, isAuthenticated, onAuthRequired }: Props) {
  const playerRef              = useRef<HTMLDivElement>(null)
  const videoRef               = useRef<HTMLVideoElement>(null)
  const [isActive,   setIsActive]   = useState(false)
  const [isLiked,    setIsLiked]    = useState(false)
  const [isSaved,    setIsSaved]    = useState(false)
  const [showToast,  setShowToast]  = useState(false)
  const [videoSrc,   setVideoSrc]   = useState<string | null>(property.urlVideo ?? null)

  // IntersectionObserver: activate when ≥ 80 % visible
  useEffect(() => {
    const el = playerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        setIsActive(e.isIntersecting && e.intersectionRatio >= 0.8)
      },
      { threshold: 0.8 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Play / pause video based on active state
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isActive) v.play().catch(() => {})
    else v.pause()
  }, [isActive])

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

  const likeCount  = property.compatibilidad * 4 + 17
  const saveCount  = Math.floor(property.m2 * 0.85)
  const shareCount = 31

  return (
    <div ref={playerRef} className="relative w-full h-full overflow-hidden">

      {/* ── Video background (when URL available) ───────────────── */}
      {videoSrc && (
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setVideoSrc(videoSrc === FALLBACK_VIDEO ? null : FALLBACK_VIDEO)}
          style={{
            filter:     isActive ? 'brightness(1)' : 'brightness(0.55) saturate(0.60)',
            transition: 'filter 0.5s ease',
          }}
        />
      )}

      {/* ── Static background (when no video) ───────────────────── */}
      {!videoSrc && (
        <div
          className="absolute inset-0"
          style={{
            ...(property.imagenes?.[0]
              ? { backgroundImage: `url(${property.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(160deg, ${property.gradientFrom} 0%, ${property.gradientTo} 100%)` }),
            animation:  isActive ? 'reelBreathe 3.5s ease-in-out infinite' : 'none',
            transition: 'filter 0.5s ease',
            filter:     isActive ? 'brightness(1)' : 'brightness(0.55) saturate(0.60)',
            willChange: 'filter',
          }}
        />
      )}

      {/* Emoji watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[220px] select-none" style={{ opacity: 0.07 }}>
          {property.emoji}
        </span>
      </div>

      {/* Bottom scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.42) 38%, transparent 68%)',
        }}
      />

      {/* Right scrim (behind action bar) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.55) 0%, transparent 38%)',
        }}
      />

      {/* Paused overlay */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-white text-[28px] ml-1">▶</span>
          </div>
        </div>
      )}

      {/* Match badge */}
      <div className="absolute top-20 right-4 z-20">
        <div
          className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
          style={{
            background:     'rgba(255,255,255,0.16)',
            backdropFilter: 'blur(12px)',
            border:         '1px solid rgba(255,255,255,0.24)',
          }}
        >
          ✦ {property.compatibilidad}% match
        </div>
      </div>

      {/* ── Action bar (right) ────────────────────────────────────── */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">

        {/* Like */}
        <ActionBtn
          onClick={handleLike}
          active={isLiked}
          count={likeCount}
          icon={isLiked ? '♥' : '♡'}
          iconSize={22}
        />

        {/* Save */}
        <ActionBtn
          onClick={handleSave}
          active={isSaved}
          count={saveCount}
          icon="🔖"
          iconSize={18}
        />

        {/* Share */}
        <ActionBtn
          onClick={handleShare}
          active={false}
          count={shareCount}
          icon="↗"
          iconSize={20}
        />
      </div>

      {/* ── Property info (bottom left) ──────────────────────────── */}
      <div className="absolute bottom-4 left-4 right-[72px] z-20">

        {/* Category pill */}
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-white mb-2"
          style={{ background: 'rgba(194,113,79,0.72)', backdropFilter: 'blur(8px)' }}
        >
          {property.tipo.charAt(0).toUpperCase() + property.tipo.slice(1)}
        </span>

        <h3
          className="font-display text-[18px] font-bold text-white leading-[1.2] mb-1"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}
        >
          {property.titulo}
        </h3>
        <p
          className="text-[12px] mb-2"
          style={{ color: 'rgba(255,255,255,0.72)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
        >
          📍 {property.ubicacion}
        </p>

        {/* Specs + price chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {property.recamaras > 0 && (
            <Chip>🛏 {property.recamaras} rec.</Chip>
          )}
          <Chip>📐 {property.m2} m²</Chip>
          <Chip highlight>{fmtPrice(property.precio)}</Chip>
        </div>

        {/* CTA */}
        <button
          className="px-5 py-[11px] rounded-full text-[13px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.96]"
          style={{
            background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
            boxShadow:  '0 4px 16px rgba(194,113,79,0.52)',
          }}
        >
          📅 Agendar visita
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <Toast message="🔗 Enlace copiado" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionBtnProps {
  onClick:   () => void
  active:    boolean
  count:     number
  icon:      string
  iconSize:  number
}

function ActionBtn({ onClick, active, count, icon, iconSize }: ActionBtnProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-[46px] h-[46px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.84]"
        style={{
          background:     active ? '#C2714F' : 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border:         '1px solid rgba(255,255,255,0.22)',
        }}
      >
        <span style={{ fontSize: iconSize, lineHeight: 1 }}>{icon}</span>
      </button>
      <span
        className="text-white text-[11px] font-medium"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}
      >
        {count}
      </span>
    </div>
  )
}

interface ChipProps {
  children:  React.ReactNode
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
