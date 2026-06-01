import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AuthModal from '../components/ui/AuthModal'
import ReelPlayer from '../components/ReelPlayer'
import { MOCK_PROPERTIES } from '../services/mockData'

const CATEGORIES = ['Para ti', 'Casas', 'Deptos', 'Comercial', 'Inversión', 'Lujo'] as const

export default function ReelsScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal,   setShowAuthModal]   = useState(false)
  const [activeCategory,  setActiveCategory]  = useState<string>('Para ti')

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: '#000' }}>

      {/* ── Top overlay: status bar + categories ──────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-30"
        style={{
          background:    'linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, transparent 100%)',
          paddingBottom: 20,
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-5 pt-[14px] pb-2">
          <span className="text-white text-[12px] font-semibold">9:41</span>
          <div className="flex gap-1 items-center">
            <span className="text-white text-[12px] font-semibold">●●●</span>
            <span className="text-white text-[11px]">📶</span>
            <span className="text-white text-[11px]">🔋</span>
          </div>
        </div>

        {/* Logo + search */}
        <div className="flex items-center justify-between px-5 pb-2">
          <p className="font-display text-white text-[19px] font-bold leading-none">
            Casa<span style={{ color: '#E8A98A' }}>Reels</span>
          </p>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.88]"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
          >
            <span className="text-white text-[14px]">🔍</span>
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3.5 py-[6px] rounded-full text-[12px] font-semibold border-none cursor-pointer transition-all"
                style={{
                  background:     active ? 'white' : 'rgba(255,255,255,0.16)',
                  color:          active ? '#1A1A1A' : 'white',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Snap scroll container ─────────────────────────────── */}
      <div
        className="w-full h-full overflow-y-scroll no-scrollbar"
        style={{
          scrollSnapType:     'y mandatory',
          overscrollBehavior: 'contain',
          display:            'flex',
          flexDirection:      'column',
        }}
      >
        {MOCK_PROPERTIES.map((property) => (
          <div
            key={property.id}
            style={{ flex: '0 0 100%', scrollSnapAlign: 'start' }}
          >
            <ReelPlayer
              property={property}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </div>
        ))}
      </div>

      {/* ── Lazy Auth modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onRegister={() => { setIsAuthenticated(true); setShowAuthModal(false) }}
            onDismiss={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
