import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import type { TipoPropiedad, CaracteristicasLifestyle } from '../../types/database'

interface Props {
  onDismiss: () => void
  onCreated: () => void
}

const DEFAULT_CARACTERISTICAS: CaracteristicasLifestyle = {
  seguridad:          3,
  trafico:            3,
  vida_social:        3,
  tranquilidad:       3,
  plusvalia:          3,
  servicios_cercanos: 3,
  pet_friendly:       false,
  familias:           false,
  home_office:        false,
}

export default function NewPropertyModal({ onDismiss, onCreated }: Props) {
  const { session } = useAuth()
  const [titulo,    setTitulo]    = useState('')
  const [tipo,      setTipo]      = useState<TipoPropiedad>('casa')
  const [precio,    setPrecio]    = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [ciudad,    setCiudad]    = useState('')
  const [imageUrl,  setImageUrl]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    if (!session?.user) return
    if (!titulo.trim() || !precio || !ubicacion.trim() || !ciudad.trim()) {
      setError('Completa los campos obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('propiedades')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        asesor_id:                 session.user.id,
        titulo:                    titulo.trim(),
        tipo,
        precio:                    Number(precio),
        ubicacion:                 ubicacion.trim(),
        ciudad:                    ciudad.trim().toLowerCase(),
        imagenes:                  imageUrl.trim() ? [imageUrl.trim()] : [],
        caracteristicas_lifestyle: DEFAULT_CARACTERISTICAS,
      } as any)
    setSaving(false)
    if (err) { setError(err.message); return }
    onCreated()
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="absolute inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}
      />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
        style={{ background: '#FDFAF6', maxHeight: '88%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D8C9BB' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <h2 className="font-display text-[20px] font-bold" style={{ color: '#1A1A1A' }}>
            Nueva propiedad
          </h2>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: '#F0EAE1' }}
          >
            <span className="text-[14px]" style={{ color: '#6B6B6B' }}>✕</span>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-5 pb-8 flex flex-col gap-4">
          <Field label="Título *" value={titulo} onChange={setTitulo} placeholder="Ej. Casa Moderna en Juriquilla" />

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoPropiedad)}
              className="w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none"
              style={{ background: '#F0EAE1', color: '#1A1A1A', appearance: 'none' }}
            >
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="terreno">Terreno</option>
              <option value="local">Local</option>
              <option value="oficina">Oficina</option>
            </select>
          </div>

          <Field label="Precio (MXN) *" value={precio} onChange={setPrecio} placeholder="4500000" inputMode="numeric" />
          <Field label="Ubicación *" value={ubicacion} onChange={setUbicacion} placeholder="Ej. Juriquilla, Querétaro" />
          <Field label="Ciudad *" value={ciudad} onChange={setCiudad} placeholder="Ej. queretaro" />
          <Field label="URL de imagen" value={imageUrl} onChange={setImageUrl} placeholder="https://..." inputMode="url" />

          {error && (
            <p
              className="text-[12px] font-medium px-3 py-2 rounded-[10px]"
              style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-[14px] rounded-full text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
          >
            {saving ? 'Guardando…' : 'Guardar propiedad'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

function Field({
  label, value, onChange, placeholder, inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputMode?: 'numeric' | 'decimal' | 'text' | 'email' | 'tel' | 'url' | 'search' | 'none'
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none"
        style={{ background: '#F0EAE1', color: '#1A1A1A' }}
      />
    </div>
  )
}
