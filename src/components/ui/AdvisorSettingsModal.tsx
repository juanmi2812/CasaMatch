import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import type { Perfil } from '../../types/database'

interface Props {
  perfil:    Perfil
  onSaved:   (updated: Perfil) => void
  onDismiss: () => void
}

const INPUT = {
  className: 'w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all',
  style:     { borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A' },
}

export default function AdvisorSettingsModal({ perfil, onSaved, onDismiss }: Props) {
  const [nombre,    setNombre]    = useState(perfil.nombre     ?? '')
  const [telefono,  setTelefono]  = useState(perfil.telefono   ?? '')
  const [agencia,   setAgencia]   = useState(perfil.agencia    ?? '')
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatar_url ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)

    const patch: Perfil = {
      ...perfil,
      nombre:    nombre.trim(),
      telefono:  telefono.trim()  || null,
      agencia:   agencia.trim()   || null,
      avatar_url: avatarUrl.trim() || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('perfiles')
      .update({
        nombre:     patch.nombre,
        telefono:   patch.telefono,
        agencia:    patch.agencia,
        avatar_url: patch.avatar_url,
      })
      .eq('id', perfil.id)

    if (err) { setError(err.message); setSaving(false); return }
    onSaved(patch)
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(3px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onDismiss}
      />

      {/* Bottom sheet */}
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-[201] bg-white rounded-t-[32px] px-6 pt-5 pb-10"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-[4px] rounded-full mx-auto mb-5" style={{ background: '#EDE4D7' }} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(194,113,79,0.10)' }}
          >
            <span className="text-[20px]">⚙️</span>
          </div>
          <div>
            <h2 className="font-display text-[20px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
              Configurar perfil
            </h2>
            <p className="text-[12px]" style={{ color: '#9B9B9B' }}>
              Visible para tus clientes y leads
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="text"
            placeholder="Nombre completo *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            {...INPUT}
          />
          <input
            type="tel"
            placeholder="WhatsApp (ej. 5551234567)"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            {...INPUT}
          />
          <input
            type="text"
            placeholder="Agencia / Inmobiliaria"
            value={agencia}
            onChange={(e) => setAgencia(e.target.value)}
            {...INPUT}
          />
          <input
            type="url"
            placeholder="URL de foto de perfil"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            {...INPUT}
          />

          {error && (
            <p className="text-[12px] px-1" style={{ color: '#DC2626' }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 mt-1"
            style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios →'}
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="w-full text-center text-[13px] cursor-pointer bg-transparent border-none py-1"
          style={{ color: '#9B9B9B' }}
        >
          Cancelar
        </button>
      </motion.div>
    </>
  )
}
