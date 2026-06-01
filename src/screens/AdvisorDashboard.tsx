import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AIGeneratorModal from '../components/ui/AIGeneratorModal'

interface Metric {
  label: string
  value: string
  delta: string
  up:    boolean
  icon:  string
}

interface Lead {
  name:      string
  property:  string
  time:      string
  hot:       boolean
  avatar:    string
}

interface ActiveProperty {
  titulo:    string
  tipo:      string
  vistas:    number
  likes:     number
  maxVistas: number
  emoji:     string
  gradient:  [string, string]
}

const METRICS: Metric[] = [
  { label: 'Vistas hoy',  value: '1,284', delta: '+12%',  up: true,  icon: '👁' },
  { label: 'Leads',       value: '47',    delta: '+8',     up: true,  icon: '📩' },
  { label: 'Likes',       value: '312',   delta: '+23%',  up: true,  icon: '♥' },
  { label: 'Visitas ag.', value: '9',     delta: '-2',     up: false, icon: '📅' },
]

const LEADS: Lead[] = [
  { name: 'Ana Martínez',    property: 'Juriquilla · Casa',       time: 'Hace 5 min',  hot: true,  avatar: '👩' },
  { name: 'Luis Herrera',    property: 'Polanco · Loft',          time: 'Hace 18 min', hot: true,  avatar: '👨' },
  { name: 'Sofía Ramos',     property: 'Campanario · Penthouse',  time: 'Hace 1 h',    hot: false, avatar: '👩‍💼' },
  { name: 'Carlos Medina',   property: 'Chapultepec · PH',        time: 'Hace 2 h',    hot: false, avatar: '🧑' },
]

const ACTIVE_PROPERTIES: ActiveProperty[] = [
  { titulo: 'Juriquilla · Casa',       tipo: 'Casa',       vistas: 540, likes: 128, maxVistas: 600, emoji: '🏡', gradient: ['#C9A87C', '#6B7C5C'] },
  { titulo: 'Polanco · Loft',          tipo: 'Depto',      vistas: 380, likes:  94, maxVistas: 600, emoji: '🏙', gradient: ['#9B8EC4', '#C2714F'] },
  { titulo: 'Campanario · Casa',       tipo: 'Casa',       vistas: 290, likes:  67, maxVistas: 600, emoji: '🌲', gradient: ['#7B9E87', '#4A7C6F'] },
]

export default function AdvisorDashboard() {
  const [showAIModal, setShowAIModal] = useState(false)

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar" style={{ background: '#F5EFE6' }}>

      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-[14px] pb-[6px] text-[12px] font-semibold flex-shrink-0">
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <span>●●●</span><span>📶</span><span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-1 pb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[12px] font-medium mb-0.5" style={{ color: '#9B9B9B' }}>Bienvenido de vuelta,</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[22px] font-bold" style={{ color: '#1A1A1A' }}>
              Marco Fernández
            </h1>
            <div
              className="px-2 py-[3px] rounded-full text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
            >
              ✓ Pro
            </div>
          </div>
        </div>
        <div
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[20px]"
          style={{
            background:  'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
            boxShadow:   '0 4px 14px rgba(194,113,79,0.38)',
          }}
        >
          🧑‍💼
        </div>
      </div>

      {/* Metrics grid */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {METRICS.map((m) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-[20px] p-4"
              style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[18px]">{m.icon}</span>
                <span
                  className="text-[11px] font-semibold px-2 py-[2px] rounded-full"
                  style={{
                    background: m.up ? 'rgba(74,222,128,0.14)' : 'rgba(248,113,113,0.14)',
                    color:      m.up ? '#16A34A'               : '#DC2626',
                  }}
                >
                  {m.delta}
                </span>
              </div>
              <p className="font-display text-[24px] font-bold leading-none mb-1" style={{ color: '#1A1A1A' }}>
                {m.value}
              </p>
              <p className="text-[11px]" style={{ color: '#9B9B9B' }}>{m.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leads recientes */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-bold" style={{ color: '#1A1A1A' }}>Leads recientes</h2>
          <button className="text-[12px] font-semibold" style={{ color: '#C2714F' }}>Ver todos</button>
        </div>
        <div className="rounded-[20px] overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          {LEADS.map((lead, i) => (
            <div
              key={lead.name}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < LEADS.length - 1 ? '1px solid #F0EAE1' : 'none' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[18px]"
                style={{ background: '#F5EFE6' }}
              >
                {lead.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>{lead.name}</p>
                  {lead.hot ? (
                    <span className="text-[11px]">🔥</span>
                  ) : (
                    <span className="text-[11px]">🌡️</span>
                  )}
                  <span
                    className="text-[10px] font-bold px-1.5 py-[1px] rounded-full"
                    style={{
                      background: lead.hot ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
                      color:      lead.hot ? '#DC2626'              : '#92400E',
                    }}
                  >
                    {lead.hot ? 'Hot' : 'Warm'}
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: '#9B9B9B' }}>{lead.property}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px]" style={{ color: '#C8C8C8' }}>{lead.time}</p>
                <button
                  className="mt-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer"
                  style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
                >
                  Contactar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Propiedades activas */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-bold" style={{ color: '#1A1A1A' }}>Mis propiedades</h2>
          <button className="text-[12px] font-semibold" style={{ color: '#C2714F' }}>Agregar</button>
        </div>
        <div className="flex flex-col gap-3">
          {ACTIVE_PROPERTIES.map((prop) => (
            <div
              key={prop.titulo}
              className="rounded-[20px] overflow-hidden"
              style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Mini thumbnail */}
                <div
                  className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center flex-shrink-0 text-[24px]"
                  style={{ background: `linear-gradient(135deg, ${prop.gradient[0]} 0%, ${prop.gradient[1]} 100%)` }}
                >
                  {prop.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>{prop.titulo}</p>
                    <span
                      className="text-[10px] font-medium px-2 py-[2px] rounded-full ml-2 flex-shrink-0"
                      style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
                    >
                      {prop.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px]" style={{ color: '#9B9B9B' }}>👁 {prop.vistas.toLocaleString()}</span>
                    <span className="text-[11px]" style={{ color: '#9B9B9B' }}>♥ {prop.likes}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE1' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(prop.vistas / prop.maxVistas) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #E8A98A 0%, #C2714F 100%)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI promo card */}
      <div className="px-4 mb-6">
        <div
          className="rounded-[24px] p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #C2714F 0%, #9E5A3A 100%)',
            boxShadow:  '0 8px 28px rgba(194,113,79,0.40)',
          }}
        >
          {/* BG watermark */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] select-none pointer-events-none" style={{ opacity: 0.12 }}>
            ✨
          </div>
          <div className="relative z-10">
            <div
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold text-white mb-3"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              ✨ Nuevo · IA Generativa
            </div>
            <h3 className="font-display text-[18px] font-bold text-white leading-[1.3] mb-1.5">
              Descripciones que<br />venden más rápido
            </h3>
            <p className="text-[12px] text-white mb-4" style={{ opacity: 0.82 }}>
              Genera textos persuasivos y optimizados para tus propiedades en segundos.
            </p>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-5 py-[11px] rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all active:scale-[.96]"
              style={{ background: 'white', color: '#C2714F' }}
            >
              Probar ahora →
            </button>
          </div>
        </div>
      </div>

      {/* AI modal */}
      <AnimatePresence>
        {showAIModal && (
          <AIGeneratorModal onDismiss={() => setShowAIModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
