import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type Screen = 'landing' | 'onboarding' | 'feed' | 'reels' | 'saved' | 'advisor' | 'admin' | 'detail' | 'profile'

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: ReactNode
}

const NAV_ITEMS: Array<{ id: Screen; icon: string; label: string; title: string }> = [
  { id: 'feed',    icon: '⊞', label: 'Explorar',  title: 'Explorar propiedades con swipe'    },
  { id: 'reels',   icon: '▷', label: 'Reels',     title: 'Ver Reels de videos de propiedades' },
  { id: 'saved',   icon: '🤍', label: 'Guardados', title: 'Ver propiedades guardadas'          },
  { id: 'advisor', icon: '👤', label: 'Asesor',    title: 'Acceder a tu panel de asesor'      },
]

const POST_ONBOARDING: Screen[] = ['feed', 'reels', 'saved', 'advisor', 'admin', 'profile']

export default function PhoneShell({ screen, onNavigate, children }: Props) {
  const showNav = POST_ONBOARDING.includes(screen)

  return (
    // md+: render a "phone device" centered on a warm desktop background
    // <md : pure full-screen native web-app experience (no chrome)
    <div className="
      w-full h-screen overflow-hidden flex flex-col bg-sand
      md:h-auto md:min-h-screen md:overflow-visible
      md:bg-[#E0D8CE] md:flex md:flex-col md:items-center md:justify-start md:py-8
    ">
      {/* Phone frame */}
      <div className="
        relative flex flex-col overflow-hidden bg-sand
        w-full h-screen
        md:h-auto md:min-h-[844px] md:w-[390px]
        md:rounded-[44px]
        md:shadow-[0_36px_72px_rgba(0,0,0,0.22),0_8px_24px_rgba(0,0,0,0.10)]
        md:border md:border-black/[0.08]
      ">

        {/* Screen area with animated transitions */}
        <div className="relative flex-1 min-h-0">
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

        {/* Bottom Navigation — only post-onboarding
            mobile:  fixed to viewport bottom
            desktop: absolute to phone-frame bottom (clipped by rounded corners) */}
        {showNav && (
          <nav
            className="
              fixed bottom-0 left-1/2 -translate-x-1/2 z-[100]
              w-full max-w-[390px]
              flex justify-around items-center pt-2.5 pb-5
              border-t border-black/[0.07]
              md:absolute md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none
            "
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)' }}
          >
            {NAV_ITEMS.map(({ id, icon, label, title }) => {
              const active = id === 'advisor'
                ? screen === 'advisor' || screen === 'admin' || screen === 'profile'
                : screen === id
              return (
                <button
                  key={id}
                  title={title}
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
