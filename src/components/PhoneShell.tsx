import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type Screen = 'landing' | 'onboarding' | 'feed' | 'reels' | 'saved' | 'advisor' | 'detail'

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: ReactNode
}

const NAV_ITEMS: Array<{ id: Screen; icon: string; label: string }> = [
  { id: 'feed',    icon: '⊞', label: 'Explorar'  },
  { id: 'reels',   icon: '▷', label: 'Reels'      },
  { id: 'saved',   icon: '🤍', label: 'Guardados' },
  { id: 'advisor', icon: '👤', label: 'Asesor'    },
]

const POST_ONBOARDING: Screen[] = ['feed', 'reels', 'saved', 'advisor']

export default function PhoneShell({ screen, onNavigate, children }: Props) {
  const showNav = POST_ONBOARDING.includes(screen)

  return (
    <div className="min-h-svh bg-[#F0EBE3] flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-svh bg-sand overflow-hidden flex flex-col">

        {/* Screen area with animated transitions */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar"
              style={{ paddingBottom: showNav ? 80 : 0 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation — only post-onboarding */}
        {showNav && (
          <nav
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] flex justify-around items-center pt-2.5 pb-5 z-[100] border-t border-black/[0.07]"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)' }}
          >
            {NAV_ITEMS.map(({ id, icon, label }) => {
              const active = screen === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl border-none bg-transparent cursor-pointer transition-all active:bg-sand-dark"
                >
                  <span
                    className="text-[22px] transition-transform"
                    style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}
                  >
                    {icon}
                  </span>
                  <span
                    className="text-[10px] font-medium font-body transition-colors"
                    style={{ color: active ? '#C2714F' : '#6B6B6B' }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
