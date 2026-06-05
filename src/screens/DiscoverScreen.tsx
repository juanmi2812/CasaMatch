import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  animate,
} from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import AuthModal from '../components/ui/AuthModal'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { getProperties, mapPropiedadToMock, recordSwipe } from '../services/propertyService'
import { MOCK_PROPERTIES, type PropiedadMock } from '../services/mockData'

const SWIPE_THRESHOLD = 100
const EXIT_X          = 650

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraggableCardHandle {
  swipeLeft:  () => void
  swipeRight: () => void
}

interface DraggableCardProps {
  card:           PropiedadMock
  isTop:          boolean
  requiresAuth:   boolean
  onSwipeLeft:    () => void
  onSwipeRight:   () => void
  onAuthRequired: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M MXN`
  }
  return `$${(n / 1_000).toFixed(0)}k MXN`
}

// ─── DraggableCard ────────────────────────────────────────────────────────────

const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(
  ({ card, isTop, requiresAuth, onSwipeLeft, onSwipeRight, onAuthRequired }, ref) => {
    const x         = useMotionValue(0)
    const rotate    = useTransform(x, [-300, 0, 300], [-16, 0, 16])
    const likeAlpha = useTransform(x, [40, 130], [0, 1])
    const nopeAlpha = useTransform(x, [-130, -40], [1, 0])

    const images    = card.imagenes && card.imagenes.length > 0 ? card.imagenes : []
    const multiImg  = images.length > 1
    const [imgIdx, setImgIdx] = useState(0)

    useImperativeHandle(ref, () => ({
      swipeLeft: () => {
        animate(x, -EXIT_X, {
          type: 'tween',
          duration: 0.32,
          onComplete: onSwipeLeft,
        })
      },
      swipeRight: () => {
        animate(x, EXIT_X, {
          type: 'tween',
          duration: 0.32,
          onComplete: onSwipeRight,
        })
      },
    }))

    return (
      <motion.div
        style={{ x, rotate, touchAction: 'none' }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: -600, right: 600 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={(_e, info: PanInfo) => {
          const committed =
            Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
            Math.abs(info.velocity.x) > 500

          if (!committed) {
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
            return
          }

          const goRight = info.offset.x > 0

          if (goRight && requiresAuth) {
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 28 })
            onAuthRequired()
            return
          }

          animate(x, goRight ? EXIT_X : -EXIT_X, {
            type: 'tween',
            duration: 0.32,
            onComplete: goRight ? onSwipeRight : onSwipeLeft,
          })
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Card surface */}
        <div
          className="absolute inset-0 rounded-[28px] overflow-hidden"
          style={{
            ...(images[imgIdx]
              ? { backgroundImage: `url(${images[imgIdx]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(160deg, ${card.gradientFrom} 0%, ${card.gradientTo} 100%)` }),
            boxShadow: '0 20px 60px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.10)',
          }}
        >
          {/* Image carousel indicators */}
          {multiImg && (
            <>
              <div className="absolute top-3 left-3 right-3 z-20 flex gap-[3px] pointer-events-none">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] rounded-full flex-1 transition-all duration-200"
                    style={{ background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.35)' }}
                  />
                ))}
              </div>
              {imgIdx > 0 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => i - 1) }}
                >
                  <span className="text-white text-[20px] leading-none">‹</span>
                </button>
              )}
              {imgIdx < images.length - 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(4px)' }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => i + 1) }}
                >
                  <span className="text-white text-[20px] leading-none">›</span>
                </button>
              )}
            </>
          )}

          {/* Emoji watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="text-[160px] select-none"
              style={{ opacity: 0.09 }}
            >
              {card.emoji}
            </span>
          </div>

          {/* Bottom scrim */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.22) 48%, transparent 70%)',
            }}
          />

          {/* Compatibility badge */}
          <div className="absolute top-5 right-5 z-10">
            <div
              className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold tracking-[0.3px]"
              style={{
                background:     'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(14px)',
                border:         '1px solid rgba(255,255,255,0.28)',
              }}
            >
              ✦ {card.compatibilidad}% match
            </div>
          </div>

          {/* Property info */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <h3 className="font-display text-[21px] font-bold text-white leading-[1.2] mb-1">
              {card.titulo}
            </h3>
            <p
              className="text-[12px] mb-2.5"
              style={{ color: 'rgba(255,255,255,0.70)' }}
            >
              📍 {card.ubicacion}
            </p>
            <div className="flex gap-3 mb-2.5 text-white text-[12px]">
              {card.recamaras > 0 && <span>🛏 {card.recamaras} rec.</span>}
              <span>🚿 {card.banos} baños</span>
              <span>📐 {card.m2} m²</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-[3px] rounded-full text-[11px] font-medium text-white"
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border:     '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[20px] font-bold text-white">{formatPrice(card.precio)}</p>
          </div>

          {/* LIKE stamp */}
          <motion.div
            style={{ opacity: likeAlpha }}
            className="absolute top-[26%] left-5 pointer-events-none z-20"
          >
            <div
              className="px-4 py-2 rounded-[14px] text-[22px] font-black"
              style={{
                transform:  'rotate(-15deg)',
                border:     '4px solid #4ADE80',
                color:      '#4ADE80',
                textShadow: '0 0 14px rgba(74,222,128,0.55)',
              }}
            >
              ♥ LIKE
            </div>
          </motion.div>

          {/* NOPE stamp */}
          <motion.div
            style={{ opacity: nopeAlpha }}
            className="absolute top-[26%] right-5 pointer-events-none z-20"
          >
            <div
              className="px-4 py-2 rounded-[14px] text-[22px] font-black"
              style={{
                transform:  'rotate(15deg)',
                border:     '4px solid #F87171',
                color:      '#F87171',
                textShadow: '0 0 14px rgba(248,113,113,0.55)',
              }}
            >
              ✕ NOPE
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }
)

DraggableCard.displayName = 'DraggableCard'

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS = ['Todos', 'Casas', 'Deptos', 'Comercial'] as const
type FilterTab = (typeof FILTER_TABS)[number]

const CITY_LABELS: Record<string, string> = {
  queretaro:   'Querétaro',
  cdmx:        'CDMX',
  guadalajara: 'Guadalajara',
  leon:        'León',
}

function filterToTipos(tab: FilterTab): string[] | undefined {
  switch (tab) {
    case 'Casas':     return ['casa']
    case 'Deptos':    return ['departamento']
    case 'Comercial': return ['local', 'oficina']
    default:          return undefined
  }
}

function tipoToFilter(tipo: string | undefined): FilterTab {
  switch (tipo) {
    case 'casa':         return 'Casas'
    case 'departamento': return 'Deptos'
    case 'local':
    case 'oficina':      return 'Comercial'
    default:             return 'Todos'
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onViewDetail:   (property: PropiedadMock) => void
  ciudadInicial?: string
  tipoInicial?:   string
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen({ onViewDetail, ciudadInicial, tipoInicial }: Props) {
  const { session } = useAuth()
  const isAuthenticated = !!session

  const [cards,         setCards]        = useState<PropiedadMock[]>([])
  const [loading,       setLoading]      = useState(true)
  const [fetchKey,      setFetchKey]     = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'like' | null>(null)
  const [activeFilter,  setActiveFilter] = useState<FilterTab>(() => tipoToFilter(tipoInicial))
  const [showToast,     setShowToast]    = useState(false)

  useEffect(() => {
    setLoading(true)
    getProperties({ ciudad: ciudadInicial, tipos: filterToTipos(activeFilter) })
      .then((data) => setCards(data.map(mapPropiedadToMock)))
      .catch((err) => { console.error('Error detallado de Supabase en Discover:', err); setCards(MOCK_PROPERTIES) })
      .finally(() => setLoading(false))
  }, [activeFilter, ciudadInicial, fetchKey])

  const topCardRef = useRef<DraggableCardHandle>(null)

  function removeTopCard() {
    setCards((prev) => prev.slice(1))
  }

  function handleNope() {
    topCardRef.current?.swipeLeft()
  }

  function handleLike() {
    if (!isAuthenticated) {
      setPendingAction('like')
      setShowAuthModal(true)
      return
    }
    topCardRef.current?.swipeRight()
  }

  function handleAuthRequired() {
    setPendingAction('like')
    setShowAuthModal(true)
  }

  function handleRegister() {
    setShowAuthModal(false)
    if (pendingAction === 'like') {
      setPendingAction(null)
      setTimeout(() => topCardRef.current?.swipeRight(), 100)
    }
  }

  function handleDismiss() {
    setShowAuthModal(false)
    setPendingAction(null)
  }

  function handleSwipeRight() {
    if (cards.length > 0) {
      recordSwipe(cards[0].id, 'like')
    }
    removeTopCard()
  }

  function handleShare() {
    if (cards.length === 0) return
    const url = `${window.location.origin}?propertyId=${cards[0].id}`
    navigator.clipboard.writeText(url).then(() => setShowToast(true))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: '#F5EFE6' }}>

      {/* Header */}
      <div className="px-5 pt-1 pb-2 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="font-display text-[22px] font-bold leading-none">
            Casa<span style={{ color: '#E8A98A' }}>Match</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px]" style={{ color: '#6B6B6B' }}>
              📍 {ciudadInicial ? (CITY_LABELS[ciudadInicial] ?? ciudadInicial) : 'México'}
            </span>
            <span style={{ color: '#C8C8C8', fontSize: 10 }}>·</span>
            <span className="text-[11px] font-medium" style={{ color: '#C2714F' }}>
              {cards.length} {cards.length === 1 ? 'propiedad' : 'propiedades'}
            </span>
          </div>
        </div>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.90]"
          style={{ background: 'rgba(194,113,79,0.10)' }}
        >
          <span className="text-[15px]">🔔</span>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-2.5 overflow-x-auto no-scrollbar flex-shrink-0">
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className="flex-shrink-0 px-4 py-[6px] rounded-full text-[12px] font-medium cursor-pointer transition-all border-none"
              style={{
                background: active ? '#C2714F' : 'rgba(194,113,79,0.10)',
                color:      active ? 'white'   : '#6B6B6B',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Card stack */}
      <div className="relative flex-1 mx-4 mb-3 min-h-0 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: '#E8D5C8', borderTopColor: '#C2714F' }}
            />
            <p className="text-[13px] font-medium" style={{ color: '#9B9B9B' }}>Cargando propiedades…</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
            {activeFilter !== 'Todos' ? (
              <>
                <span className="text-[72px]">🔍</span>
                <p className="font-display text-[22px] font-bold" style={{ color: '#1A1A1A' }}>
                  Sin resultados
                </p>
                <p className="text-[14px] leading-[1.6]" style={{ color: '#6B6B6B' }}>
                  No hay propiedades en esta categoría.
                </p>
                <button
                  onClick={() => setActiveFilter('Todos')}
                  className="mt-2 px-7 py-3.5 rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: '#C2714F' }}
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <span className="text-[72px]">🏡</span>
                <p className="font-display text-[22px] font-bold" style={{ color: '#1A1A1A' }}>
                  ¡Eso es todo!
                </p>
                <p className="text-[14px] leading-[1.6]" style={{ color: '#6B6B6B' }}>
                  Has revisado todas las propiedades disponibles.
                </p>
                <button
                  onClick={() => {
                    setActiveFilter('Todos')
                    setFetchKey((k) => k + 1)
                  }}
                  className="mt-2 px-7 py-3.5 rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: '#C2714F' }}
                >
                  Ver de nuevo
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Back card — depth shadow */}
            {cards[1] && (
              <div
                className="absolute inset-0 rounded-[28px]"
                style={{
                  ...(cards[1].imagenes?.[0]
                    ? { backgroundImage: `url(${cards[1].imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: `linear-gradient(160deg, ${cards[1].gradientFrom} 0%, ${cards[1].gradientTo} 100%)` }),
                  transform:       'scale(0.93) translateY(14px)',
                  transformOrigin: 'center top',
                  opacity:         0.58,
                }}
              />
            )}

            {/* Top card */}
            <DraggableCard
              ref={topCardRef}
              key={cards[0].id}
              card={cards[0]}
              isTop
              requiresAuth={!isAuthenticated}
              onSwipeLeft={removeTopCard}
              onSwipeRight={handleSwipeRight}
              onAuthRequired={handleAuthRequired}
            />
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex justify-center items-center gap-5 pb-5">
        {/* NOPE */}
        <button
          title="No me interesa esta propiedad"
          onClick={handleNope}
          disabled={cards.length === 0}
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.87] disabled:opacity-30"
          style={{ background: 'white', boxShadow: '0 4px 18px rgba(0,0,0,0.11)' }}
        >
          <span className="text-[22px] leading-none" style={{ color: '#F87171' }}>✕</span>
        </button>

        {/* INFO */}
        <button
          title="Ver detalles completos de la propiedad"
          onClick={() => cards.length > 0 && onViewDetail(cards[0])}
          disabled={cards.length === 0}
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.87] disabled:opacity-30"
          style={{ background: 'white', boxShadow: '0 4px 14px rgba(0,0,0,0.09)' }}
        >
          <span className="text-[17px] leading-none" style={{ color: '#C2714F' }}>ℹ</span>
        </button>

        {/* SHARE */}
        <button
          title="Compartir enlace de esta propiedad"
          onClick={handleShare}
          disabled={cards.length === 0}
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.87] disabled:opacity-30"
          style={{ background: 'white', boxShadow: '0 4px 14px rgba(0,0,0,0.09)' }}
        >
          <span className="text-[17px] leading-none" style={{ color: '#6B6B6B' }}>↗</span>
        </button>

        {/* LIKE */}
        <button
          title="Me gusta esta propiedad"
          onClick={handleLike}
          disabled={cards.length === 0}
          className="w-[66px] h-[66px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.87] disabled:opacity-30"
          style={{
            background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
            boxShadow:  '0 6px 22px rgba(194,113,79,0.42)',
          }}
        >
          <span className="text-[26px] leading-none" style={{ color: 'white' }}>♥</span>
        </button>
      </div>

      {/* Lazy Auth modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal onRegister={handleRegister} onDismiss={handleDismiss} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <Toast message="🔗 Enlace copiado" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
