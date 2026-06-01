import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

type View = 'options' | 'email'

interface Props {
  onRegister: () => void
  onDismiss:  () => void
}

export default function AuthModal({ onRegister, onDismiss }: Props) {
  const { signIn, signInWithGoogle } = useAuth()

  const [view,     setView]     = useState<View>('options')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // OAuth redirects the page — onRegister fires on return via AuthContext
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error con Google')
      setLoading(false)
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      onRegister()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(3px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onDismiss}
      />

      {/* Bottom sheet */}
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-[201] bg-white rounded-t-[32px] px-6 pt-5 pb-10"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="w-10 h-[4px] rounded-full mx-auto mb-6"
          style={{ background: '#EDE4D7' }}
        />

        <AnimatePresence mode="wait">
          {view === 'options' ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {/* Pulsing heart */}
              <motion.div
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(194,113,79,0.10)' }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-[32px]" style={{ color: '#C2714F' }}>♥</span>
              </motion.div>

              <h2
                className="font-display text-[26px] font-bold text-center mb-2 leading-[1.2]"
                style={{ color: '#1A1A1A' }}
              >
                ¡No pierdas este match!
              </h2>
              <p
                className="text-[14px] text-center mb-7 leading-[1.55]"
                style={{ color: '#6B6B6B' }}
              >
                Crea tu cuenta gratis para guardar propiedades y ver todos tus matches.
              </p>

              <div className="flex flex-col gap-3 mb-5">
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold cursor-pointer transition-all active:scale-[.97] border-2 disabled:opacity-60"
                  style={{ borderColor: '#EDE4D7', background: 'white', color: '#1A1A1A' }}
                >
                  <span
                    className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0"
                    style={{ background: '#4285F4', color: 'white' }}
                  >
                    G
                  </span>
                  Continuar con Google
                </button>

                {/* Email */}
                <button
                  onClick={() => setView('email')}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold text-white cursor-pointer transition-all active:scale-[.97] border-none"
                  style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
                >
                  <span className="text-[18px] flex-shrink-0">✉</span>
                  Registrarse con Email
                </button>

                {/* Phone (stub) */}
                <button
                  onClick={() => setError('Autenticación por teléfono próximamente')}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold cursor-pointer transition-all active:scale-[.97] border-2"
                  style={{ borderColor: '#EDE4D7', background: 'white', color: '#1A1A1A' }}
                >
                  <span className="text-[18px] flex-shrink-0">📱</span>
                  Continuar con Teléfono
                </button>
              </div>

              {error && (
                <p className="text-[12px] text-center mb-3" style={{ color: '#DC2626' }}>{error}</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <button
                onClick={() => { setView('options'); setError(null) }}
                className="flex items-center gap-1.5 text-[13px] font-medium mb-5 bg-transparent border-none cursor-pointer p-0"
                style={{ color: '#9B9B9B' }}
              >
                ← Volver
              </button>

              <h2
                className="font-display text-[22px] font-bold mb-1"
                style={{ color: '#1A1A1A' }}
              >
                Acceder con Email
              </h2>
              <p className="text-[13px] mb-6" style={{ color: '#9B9B9B' }}>
                Usa tu cuenta existente o crea una nueva.
              </p>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 mb-5">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all"
                  style={{
                    borderColor: '#EDE4D7',
                    background:  '#FAFAFA',
                    color:       '#1A1A1A',
                  }}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all"
                  style={{
                    borderColor: '#EDE4D7',
                    background:  '#FAFAFA',
                    color:       '#1A1A1A',
                  }}
                />

                {error && (
                  <p className="text-[12px]" style={{ color: '#DC2626' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar →'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dismiss link */}
        <button
          onClick={onDismiss}
          className="w-full text-center text-[13px] cursor-pointer bg-transparent border-none py-1 transition-all active:opacity-60"
          style={{ color: '#6B6B6B' }}
        >
          Seguir explorando sin cuenta →
        </button>
      </motion.div>
    </>
  )
}
