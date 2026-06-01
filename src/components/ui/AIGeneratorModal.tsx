import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onDismiss: () => void
}

type Phase = 'idle' | 'generating' | 'done'

const PROPERTY_TYPES = ['Casa', 'Depto', 'Penthouse', 'Local', 'Oficina'] as const

const GENERATED_DESCRIPTIONS: Record<string, string> = {
  Casa:       'Descubre el equilibrio perfecto entre elegancia y funcionalidad. Esta residencia te ofrece espacios diseñados para vivir con plenitud, donde cada rincón invita a la tranquilidad. Su arquitectura contemporánea, combinada con acabados de primer nivel, crea un ambiente donde cada detalle importa. Ideal para familias que buscan calidad de vida sin compromisos.',
  Depto:      'Un refugio urbano pensado para quienes valoran el tiempo y el estilo. Este departamento redefine la vida en ciudad: accesible, moderno y estratégicamente ubicado. Sus amplias ventanas bañan cada espacio de luz natural, creando una atmósfera abierta que invita a relajarse después de un largo día.',
  Penthouse:  'Eleva tu estándar de vida. Este penthouse exclusivo ofrece vistas panorámicas que conquistan desde el primer momento, terrazas privadas para disfrutar el atardecer y una privacidad que difícilmente encontrarás en otro lugar. El lujo no es exceso — es la experiencia diaria de vivir exactamente como mereces.',
  Local:      'Una oportunidad de negocio estratégicamente posicionada en uno de los corredores comerciales más dinámicos de la ciudad. Con flujo peatonal garantizado, fachada atractiva y distribución flexible, este espacio está listo para transformarse en el escenario de tu próximo éxito empresarial.',
  Oficina:    'Diseñada para potenciar la productividad de equipos que aspiran a más. Esta oficina combina ergonomía, tecnología y un ambiente inspirador que atrae talento y retiene clientes. Con infraestructura de punta y ubicación de primer nivel, es el punto de partida ideal para llevar tu empresa al siguiente nivel.',
}

export default function AIGeneratorModal({ onDismiss }: Props) {
  const [selectedType, setSelectedType] = useState<string>('Casa')
  const [phase,        setPhase]        = useState<Phase>('idle')
  const [copied,       setCopied]       = useState(false)

  function handleGenerate() {
    setPhase('generating')
    setTimeout(() => setPhase('done'), 2500)
  }

  function handleCopy() {
    const text = GENERATED_DESCRIPTIONS[selectedType] ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const generatedText = GENERATED_DESCRIPTIONS[selectedType] ?? ''

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{    opacity: 0 }}
        onClick={onDismiss}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(3px)' }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{    y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[210] w-full max-w-[390px] rounded-t-[28px] overflow-hidden"
        style={{ background: '#FAFAFA' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: '#D4D4D4' }} />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-[20px] font-bold" style={{ color: '#1A1A1A' }}>
                Descripción con IA
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#9B9B9B' }}>
                Genera texto persuasivo en segundos
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(194,113,79,0.10)' }}
            >
              <span className="text-[20px]">✨</span>
            </div>
          </div>

          {/* Property type pills */}
          <p className="text-[12px] font-semibold mb-2.5" style={{ color: '#6B6B6B' }}>
            Tipo de propiedad
          </p>
          <div className="flex gap-2 flex-wrap mb-5">
            {PROPERTY_TYPES.map((type) => {
              const active = selectedType === type
              return (
                <button
                  key={type}
                  onClick={() => { setSelectedType(type); setPhase('idle') }}
                  className="px-4 py-[7px] rounded-full text-[13px] font-medium border-none cursor-pointer transition-all"
                  style={{
                    background: active ? '#C2714F' : 'rgba(194,113,79,0.10)',
                    color:      active ? 'white'   : '#6B6B6B',
                  }}
                >
                  {type}
                </button>
              )
            })}
          </div>

          {/* Result area */}
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[120px] rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(194,113,79,0.06)', border: '1.5px dashed rgba(194,113,79,0.30)' }}
              >
                <p className="text-[13px] text-center px-6" style={{ color: '#B89080' }}>
                  Selecciona el tipo y presiona<br />
                  <strong>Generar</strong> para crear la descripción
                </p>
              </motion.div>
            )}

            {phase === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-4 mb-5 overflow-hidden"
                style={{ background: '#F5EFE6' }}
              >
                {/* Skeleton bars */}
                {[100, 88, 95, 72, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded-full mb-2.5"
                    style={{
                      width:              `${w}%`,
                      background:         'linear-gradient(90deg, #E8D5C8 25%, #F5EFE6 50%, #E8D5C8 75%)',
                      backgroundSize:     '200% 100%',
                      animation:          `shimmer 1.4s ease-in-out infinite`,
                      animationDelay:     `${i * 0.08}s`,
                    }}
                  />
                ))}
                {/* Typing indicator */}
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-[11px] font-medium" style={{ color: '#C2714F' }}>
                    IA escribiendo
                  </span>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: '#C2714F',
                        animation: `shimmer 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.18}s`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-4 mb-5"
                style={{ background: '#F5EFE6', border: '1.5px solid rgba(194,113,79,0.22)' }}
              >
                <p className="text-[13px] leading-[1.65]" style={{ color: '#3A3A3A' }}>
                  {generatedText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3">
            {phase === 'done' ? (
              <>
                <button
                  onClick={() => setPhase('idle')}
                  className="flex-1 py-[13px] rounded-full text-[14px] font-semibold border-none cursor-pointer transition-all"
                  style={{ background: 'rgba(194,113,79,0.12)', color: '#C2714F' }}
                >
                  Regenerar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-[2] py-[13px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97]"
                  style={{
                    background: copied
                      ? 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)'
                      : 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
                    boxShadow: '0 4px 16px rgba(194,113,79,0.38)',
                    transition: 'background 0.3s',
                  }}
                >
                  {copied ? '✓ Copiado' : '📋 Copiar texto'}
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={phase === 'generating'}
                className="w-full py-[14px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
                  boxShadow:  '0 4px 16px rgba(194,113,79,0.38)',
                }}
              >
                {phase === 'generating' ? '✨ Generando...' : '✨ Generar descripción'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
