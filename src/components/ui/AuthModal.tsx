import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

type EmailTab = 'login' | 'register'

interface Props {
  onRegister:   () => void
  onDismiss:    () => void
  initialMode?: EmailTab
}

export default function AuthModal({ onRegister, onDismiss, initialMode = 'login' }: Props) {
  const { signIn, signUp } = useAuth()

  const [emailTab,     setEmailTab]    = useState<EmailTab>(initialMode)
  const [email,        setEmail]       = useState('')
  const [password,     setPassword]    = useState('')
  const [rol,          setRol]         = useState<'usuario' | 'asesor'>('usuario')
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (emailTab === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, rol)
      }
      onRegister()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al autenticar'
      if (msg === 'CONFIRM_EMAIL') {
        setConfirmEmail(true)
      } else {
        setError(msg)
      }
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
        <div className="w-10 h-[4px] rounded-full mx-auto mb-5" style={{ background: '#EDE4D7' }} />

        <AnimatePresence mode="wait">

          {/* ── Email sent confirmation ──────────────────────── */}
          {confirmEmail ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <span className="text-[52px]">📬</span>
              <h2 className="font-display text-[22px] font-bold" style={{ color: '#1A1A1A' }}>
                Revisa tu correo
              </h2>
              <p className="text-[14px] leading-[1.6]" style={{ color: '#6B6B6B' }}>
                Enviamos un enlace de confirmación a <strong>{email}</strong>.
                Confirma tu cuenta y vuelve a iniciar sesión.
              </p>
              <button
                onClick={() => { setConfirmEmail(false); setEmailTab('login') }}
                className="mt-2 px-8 py-3.5 rounded-full text-[14px] font-semibold text-white border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
              >
                Iniciar sesión →
              </button>
            </motion.div>

          ) : (

            /* ── Login / Register form ───────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(194,113,79,0.10)' }}
                >
                  <span className="text-[22px]" style={{ color: '#C2714F' }}>♥</span>
                </div>
                <div>
                  <h2 className="font-display text-[20px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
                    {emailTab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
                  </h2>
                  <p className="text-[12px]" style={{ color: '#9B9B9B' }}>
                    {emailTab === 'login' ? 'Accede a tus propiedades guardadas' : 'Gratis · Sin tarjeta requerida'}
                  </p>
                </div>
              </div>

              {/* Tabs */}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-4">
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

                {/* Account type selector — register only */}
                {emailTab === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-semibold px-0.5" style={{ color: '#6B6B6B' }}>
                      Tipo de cuenta
                    </p>
                    <div className="flex gap-2">
                      {([
                        { value: 'usuario', label: '🏠 Soy Cliente',            sub: 'Busco propiedades'   },
                        { value: 'asesor',  label: '👔 Soy Asesor',             sub: 'Publico propiedades' },
                      ] as const).map(({ value, label, sub }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRol(value)}
                          className="flex-1 py-2.5 px-2 rounded-[14px] text-left border-2 cursor-pointer transition-all"
                          style={{
                            borderColor: rol === value ? '#C2714F' : '#EDE4D7',
                            background:  rol === value ? 'rgba(194,113,79,0.06)' : '#FAFAFA',
                          }}
                        >
                          <span className="block text-[13px] font-semibold" style={{ color: '#1A1A1A' }}>
                            {label}
                          </span>
                          <span className="block text-[11px]" style={{ color: '#9B9B9B' }}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-[12px] px-1" style={{ color: '#DC2626' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 mt-1"
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
          style={{ color: '#9B9B9B' }}
        >
          Seguir explorando sin cuenta →
        </button>
      </motion.div>
    </>
  )
}
