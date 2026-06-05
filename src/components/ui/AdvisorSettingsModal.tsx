import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import type { Perfil } from '../../types/database'

interface Props {
  perfil:    Perfil
  onSaved:   (updated: Perfil) => void
  onDismiss: () => void
}

const INPUT_CLASS = 'w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all'
const INPUT_STYLE = { borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A' }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#C2714F' }}>
      {children}
    </p>
  )
}

export default function AdvisorSettingsModal({ perfil, onSaved, onDismiss }: Props) {
  const [nombre,           setNombre]           = useState(perfil.nombre             ?? '')
  const [telefono,         setTelefono]         = useState(perfil.telefono           ?? '')
  const [agencia,          setAgencia]          = useState(perfil.agencia            ?? '')
  const [avatarUrl,        setAvatarUrl]        = useState(perfil.avatar_url         ?? '')
  const [biografia,        setBiografia]        = useState(perfil.biografia          ?? '')
  const [instagramUrl,     setInstagramUrl]     = useState(perfil.instagram_url      ?? '')
  const [tiktokUrl,        setTiktokUrl]        = useState(perfil.tiktok_url         ?? '')
  const [aniosExperiencia, setAniosExperiencia] = useState(
    perfil.anios_experiencia != null ? String(perfil.anios_experiencia) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)

    const patch: Perfil = {
      ...perfil,
      nombre:             nombre.trim(),
      telefono:           telefono.trim()      || null,
      agencia:            agencia.trim()       || null,
      avatar_url:         avatarUrl.trim()     || null,
      biografia:          biografia.trim()     || null,
      instagram_url:      instagramUrl.trim()  || null,
      tiktok_url:         tiktokUrl.trim()     || null,
      anios_experiencia:  aniosExperiencia ? Number(aniosExperiencia) : null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('perfiles')
      .update({
        nombre:            patch.nombre,
        telefono:          patch.telefono,
        agencia:           patch.agencia,
        avatar_url:        patch.avatar_url,
        biografia:         patch.biografia,
        instagram_url:     patch.instagram_url,
        tiktok_url:        patch.tiktok_url,
        anios_experiencia: patch.anios_experiencia,
      })
      .eq('id', perfil.id)

    if (err) { setError(err.message); setSaving(false); return }
    onSaved(patch)
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(3px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onDismiss}
      />

      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-[201] bg-white rounded-t-[32px] flex flex-col"
        style={{ maxHeight: '92vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-[4px] rounded-full" style={{ background: '#EDE4D7' }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 flex-shrink-0">
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

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-6 pb-10 no-scrollbar">
          <div className="flex flex-col gap-3 mt-2">

            <Label>Información básica</Label>
            <input type="text"    placeholder="Nombre completo *"           value={nombre}    onChange={(e) => setNombre(e.target.value)}    className={INPUT_CLASS} style={INPUT_STYLE} />
            <input type="tel"     placeholder="WhatsApp (ej. 5551234567)"   value={telefono}  onChange={(e) => setTelefono(e.target.value)}  className={INPUT_CLASS} style={INPUT_STYLE} />
            <input type="text"    placeholder="Agencia / Inmobiliaria"      value={agencia}   onChange={(e) => setAgencia(e.target.value)}   className={INPUT_CLASS} style={INPUT_STYLE} />
            <input type="url"     placeholder="URL de foto de perfil"       value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
            <input
              type="number"
              placeholder="Años de experiencia"
              value={aniosExperiencia}
              onChange={(e) => setAniosExperiencia(e.target.value)}
              inputMode="numeric"
              min={0}
              max={60}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />

            <Label>Sobre ti</Label>
            <textarea
              placeholder="Cuéntale a tus clientes quién eres, tu especialidad y tus logros…"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-[14px] text-[14px] outline-none border-2 transition-all resize-none leading-relaxed"
              style={INPUT_STYLE}
            />

            <Label>Redes sociales</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">📸</span>
              <input
                type="url"
                placeholder="Instagram URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className={`${INPUT_CLASS} pl-10`}
                style={INPUT_STYLE}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">🎵</span>
              <input
                type="url"
                placeholder="TikTok URL"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className={`${INPUT_CLASS} pl-10`}
                style={INPUT_STYLE}
              />
            </div>

            {error && (
              <p className="text-[12px] px-1" style={{ color: '#DC2626' }}>{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios →'}
            </button>

            <button
              onClick={onDismiss}
              className="w-full text-center text-[13px] cursor-pointer bg-transparent border-none py-1 mb-2"
              style={{ color: '#9B9B9B' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
