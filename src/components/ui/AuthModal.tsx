import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

type View     = 'options' | 'email'
type EmailTab = 'login' | 'register'

interface Props {
  onRegister: () => void
  onDismiss:  () => void
}

export default function AuthModal({ onRegister, onDismiss }: Props) {
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [view,         setView]        = useState<View>('options')
  const [emailTab,     setEmailTab]    = useState<EmailTab>('login')
  const [email,        setEmail]       = useState('')
  const [password,     setPassword]    = useState('')
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
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
      if (emailTab === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onRegister()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al autenticar'
      if (msg === 'CONFIRM_EMAIL') {
        setConfirmEmail(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function resetEmail() {
    setView('options')
    setError(null)
    setConfirmEmail(false)
    setEmail('')
    setPassword('')
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
        <div className="w-10 h-[4px] rounded-full mx-auto mb-6" style={{ background: '#EDE4D7' }} />

        <AnimatePresence mode="wait">

          {/* ── Options view ──────────────────────────────────── */}
          {view === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="w-[68px] h-[68px] rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(194,113,79,0.10)' }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-[32px]" style={{ color: '#C2714F' }}>♥</span>
              </motion.div>

              <h2 className="font-display text-[26px] font-bold text-center mb-2 leading-[1.2]" style={{ color: '#1A1A1A' }}>
                ¡No pierdas este match!
              </h2>
              <p className="text-[14px] text-center mb-7 leading-[1.55]" style={{ color: '#6B6B6B' }}>
                Accede a tu cuenta o crea una gratis para guardar propiedades.
              </p>

              <div className="flex flex-col gap-3 mb-5">
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold cursor-pointer transition-all active:scale-[.97] border-2 disabled:opacity-60"
                  style={{ borderColor: '#EDE4D7', background: 'white', color: '#1A1A1A' }}
                >
                  <span className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0" style={{ background: '#4285F4', color: 'white' }}>G</span>
                  Continuar con Google
                </button>

                <button
                  onClick={() => { setEmailTab('login'); setView('email') }}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold cursor-pointer transition-all active:scale-[.97] border-2"
                  style={{ borderColor: '#EDE4D7', background: 'white', color: '#1A1A1A' }}
                >
                  <span className="text-[18px] flex-shrink-0">✉</span>
                  Iniciar sesión con Email
                </button>

                <button
                  onClick={() => { setEmailTab('register'); setView('email') }}
                  className="w-full flex items-center gap-3 px-5 py-[14px] rounded-[16px] text-[14px] font-semibold text-white cursor-pointer transition-all active:scale-[.97] border-none"
                  style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
                >
                  <span className="text-[18px] flex-shrink-0">🏠</span>
                  Crear cuenta gratis
                </button>
              </div>

              {error && (
                <p className="text-[12px] text-center mb-3" style={{ color: '#DC2626' }}>{error}</p>
              )}
            </motion.div>
          )}

          {/* ── Email-sent confirmation ────────────────────────── */}
          {confirmEmail && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <span className="text-[56px]">📬</span>
              <h2 className="font-display text-[22px] font-bold" style={{ color: '#1A1A1A' }}>
                Revisa tu correo
              </h2>
              <p className="text-[14px] leading-[1.6]" style={{ color: '#6B6B6B' }}>
                Te enviamos un enlace de confirmación a <strong>{email}</strong>.
                Confirma tu cuenta y luego inicia sesión.
              </p>
              <button
                onClick={() => { setConfirmEmail(false); setEmailTab('login') }}
                className="mt-2 px-8 py-3.5 rounded-full text-[14px] font-semibold text-white border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
              >
                Iniciar sesión →
              </button>
            </motion.div>
          )}

          {/* ── Email form ────────────────────────────────────── */}
          {view === 'email' && !confirmEmail && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
            >
              <button
                onClick={resetEmail}
                className="flex items-center gap-1.5 text-[13px] font-medium mb-4 bg-transparent border-none cursor-pointer p-0"
                style={{ color: '#9B9B9B' }}
              >
                ← Volver
              </button>

              {/* Login / Register tabs */}
              <div className="flex gap-1 p-1 rounded-[14px] mb-5" style={{ background: '#F5EFE6' }}>
                {(['login', 'register'] as EmailTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setEmailTab(tab); setError(null) }}
                    className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold border-none cursor-pointer transition-all"
                    style={{
                      background: emailTab === tab ? 'white' : 'transparent',
                      color:      emailTab === tab ? '#1A1A1A' : '#9B9B9B',
                      boxShadow:  emailTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {tab === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 mb-4">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all"
                  style={{ borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A' }}
                />
                <input
                  type="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all"
                  style={{ borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A' }}
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
                  {loading
                    ? (emailTab === 'login' ? 'Ingresando...' : 'Creando cuenta...')
                    : (emailTab === 'login' ? 'Ingresar →' : 'Crear cuenta →')}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

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
