import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import type { Perfil } from '../../types/database'

interface Props {
  perfil:    Perfil
  onSaved:   (updated: Perfil) => void
  onDismiss: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toHandle(url: string | null | undefined): string {
  if (!url) return ''
  if (!url.startsWith('http')) return url.replace(/^@/, '')
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    return (segments.at(-1) ?? '').replace(/^@/, '')
  } catch { return url }
}

function normalizeUrl(handle: string, base: string, withAt = false): string | null {
  const v = handle.trim().replace(/^@/, '')
  if (!v) return null
  if (v.startsWith('http')) return v
  return `${base}${withAt ? '@' : ''}${v}`
}

function initials(name: string): string {
  if (!name.trim()) return '?'
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9B9B9B' }}>
      {children}
    </p>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mt-4 mb-2" style={{ color: '#C2714F' }}>
      {children}
    </p>
  )
}

const I_CLASS = 'w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2 transition-all'
const I_STYLE = { borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvisorSettingsModal({ perfil, onSaved, onDismiss }: Props) {
  const [nombre,           setNombre]           = useState(perfil.nombre             ?? '')
  const [telefono,         setTelefono]         = useState(perfil.telefono           ?? '')
  const [agencia,          setAgencia]          = useState(perfil.agencia            ?? '')
  const [aniosExperiencia, setAniosExperiencia] = useState(
    perfil.anios_experiencia != null ? String(perfil.anios_experiencia) : ''
  )
  const [biografia,        setBiografia]        = useState(perfil.biografia          ?? '')
  const [instagramHandle,  setInstagramHandle]  = useState(toHandle(perfil.instagram_url))
  const [tiktokHandle,     setTiktokHandle]     = useState(toHandle(perfil.tiktok_url))
  const [facebookHandle,   setFacebookHandle]   = useState(toHandle(perfil.facebook_url))
  const [avatarUrl,        setAvatarUrl]        = useState(perfil.avatar_url         ?? '')
  const [avatarUploading,  setAvatarUploading]  = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setError(null)
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${perfil.id}/${Date.now()}.${ext}`
      const { data, error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setAvatarUrl(urlData.publicUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      alert(`Error al subir imagen: ${msg}`)
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)

    const patch: Perfil = {
      ...perfil,
      nombre:            nombre.trim(),
      telefono:          telefono.trim()     || null,
      agencia:           agencia.trim()      || null,
      avatar_url:        avatarUrl.trim()    || null,
      biografia:         biografia.trim()    || null,
      instagram_url:     normalizeUrl(instagramHandle, 'https://instagram.com/'),
      tiktok_url:        normalizeUrl(tiktokHandle,    'https://tiktok.com/', true),
      facebook_url:      normalizeUrl(facebookHandle,  'https://facebook.com/'),
      anios_experiencia: aniosExperiencia ? Number(aniosExperiencia) : null,
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
        facebook_url:      patch.facebook_url,
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
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-[4px] rounded-full" style={{ background: '#EDE4D7' }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-2 pb-1 flex-shrink-0">
          <div>
            <h2 className="font-display text-[20px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
              Configurar perfil
            </h2>
            <p className="text-[12px]" style={{ color: '#9B9B9B' }}>Visible para tus clientes y leads</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-6 pb-10 no-scrollbar">

          {/* ── Avatar ──────────────────────────────────────────── */}
          <SectionLabel>Foto de perfil</SectionLabel>
          <div className="flex flex-col items-center gap-3 mb-1">
            <div className="relative">
              <div
                className="w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center font-display text-[24px] font-bold text-white"
                style={{
                  background: avatarUrl
                    ? 'transparent'
                    : 'linear-gradient(135deg, #E8A98A, #C2714F)',
                  boxShadow: '0 0 0 3px rgba(194,113,79,0.20)',
                }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt={nombre} className="w-full h-full object-cover" />
                  : initials(nombre)
                }
              </div>
              {avatarUploading && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <span className="text-white text-[11px] font-semibold">…</span>
                </div>
              )}
            </div>
            <label
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold cursor-pointer transition-all active:scale-[.95]"
              style={{
                background: avatarUploading ? 'rgba(0,0,0,0.06)' : 'rgba(194,113,79,0.10)',
                color:      avatarUploading ? '#9B9B9B' : '#C2714F',
              }}
            >
              {avatarUploading ? 'Subiendo...' : '📷 Cambiar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={avatarUploading}
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* URL fallback */}
          <div className="flex items-center gap-2 w-full mt-3">
            <div className="flex-1 h-px" style={{ background: '#EDE4D7' }} />
            <span className="text-[10px] flex-shrink-0" style={{ color: '#9B9B9B' }}>O pega una URL:</span>
            <div className="flex-1 h-px" style={{ background: '#EDE4D7' }} />
          </div>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://imagen.com/foto.jpg"
            className={`${I_CLASS} mt-2 text-[13px]`}
            style={I_STYLE}
          />

          {/* ── Información básica ──────────────────────────────── */}
          <SectionLabel>Información básica</SectionLabel>

          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Nombre completo *</FieldLabel>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos Reyes" className={I_CLASS} style={I_STYLE} />
            </div>
            <div>
              <FieldLabel>WhatsApp</FieldLabel>
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                placeholder="5551234567" className={I_CLASS} style={I_STYLE} />
            </div>
            <div>
              <FieldLabel>Agencia / Inmobiliaria</FieldLabel>
              <input type="text" value={agencia} onChange={(e) => setAgencia(e.target.value)}
                placeholder="Ej. Century21, RE/MAX…" className={I_CLASS} style={I_STYLE} />
            </div>
            <div>
              <FieldLabel>Años de experiencia</FieldLabel>
              <input
                type="number"
                value={aniosExperiencia}
                onChange={(e) => setAniosExperiencia(e.target.value)}
                placeholder="Ej. 5"
                inputMode="numeric"
                min={0}
                max={60}
                className={I_CLASS}
                style={I_STYLE}
              />
            </div>
          </div>

          {/* ── Biografía ───────────────────────────────────────── */}
          <SectionLabel>Sobre ti</SectionLabel>

          <div>
            <FieldLabel>Biografía</FieldLabel>
            <textarea
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              placeholder="Cuéntale a tus clientes quién eres, tu especialidad y tus logros…"
              rows={4}
              className="w-full px-4 py-3 rounded-[14px] text-[14px] outline-none border-2 transition-all resize-none leading-relaxed"
              style={I_STYLE}
            />
          </div>

          {/* ── Redes sociales ──────────────────────────────────── */}
          <SectionLabel>Redes sociales</SectionLabel>
          <p className="text-[11px] mb-3" style={{ color: '#9B9B9B' }}>
            Escribe solo tu usuario (ej. <em>carlos_realtor</em>) o pega la URL completa.
          </p>

          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel>Instagram</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">📸</span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@tu_usuario"
                  className={`${I_CLASS} pl-10`}
                  style={I_STYLE}
                />
              </div>
            </div>
            <div>
              <FieldLabel>TikTok</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">🎵</span>
                <input
                  type="text"
                  value={tiktokHandle}
                  onChange={(e) => setTiktokHandle(e.target.value)}
                  placeholder="@tu_usuario"
                  className={`${I_CLASS} pl-10`}
                  style={I_STYLE}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Facebook</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] pointer-events-none">👤</span>
                <input
                  type="text"
                  value={facebookHandle}
                  onChange={(e) => setFacebookHandle(e.target.value)}
                  placeholder="@tu_usuario"
                  className={`${I_CLASS} pl-10`}
                  style={I_STYLE}
                />
              </div>
            </div>
          </div>

          {/* ── Error + actions ─────────────────────────────────── */}
          {error && (
            <p className="text-[12px] px-1 mt-3" style={{ color: '#DC2626' }}>{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || avatarUploading}
            className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 mt-5"
            style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios →'}
          </button>

          <button
            onClick={onDismiss}
            className="w-full text-center text-[13px] cursor-pointer bg-transparent border-none py-2 mt-1 mb-2"
            style={{ color: '#9B9B9B' }}
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </>
  )
}
