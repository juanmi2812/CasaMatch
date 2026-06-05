import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import type { TipoPropiedad } from '../../types/database'

interface PropData {
  id:          string
  titulo:      string
  tipo:        string
  precio:      number
  ubicacion:   string
  ciudad:      string
  descripcion: string | null
  recamaras:   number | null
  banos:       number | null
  m2:          number | null
  activa:      boolean
}

interface Props {
  prop:      PropData
  onDismiss: () => void
  onSaved:   () => void
}

const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: 'casa',         label: 'Casa'            },
  { value: 'departamento', label: 'Departamento'    },
  { value: 'terreno',      label: 'Terreno'         },
  { value: 'local',        label: 'Local comercial' },
  { value: 'oficina',      label: 'Oficina'         },
]

const FIELD_STYLE = { background: '#F0EAE1', color: '#1A1A1A' }
const FIELD_CLASS = 'w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest -mb-1" style={{ color: '#C2714F' }}>
      {children}
    </p>
  )
}

function Field({
  label, value, onChange, placeholder, inputMode,
}: {
  label:       string
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  inputMode?:  'numeric' | 'decimal' | 'text' | 'email' | 'tel' | 'url' | 'search' | 'none'
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
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      />
    </div>
  )
}

export default function EditPropertyModal({ prop, onDismiss, onSaved }: Props) {
  const [titulo,      setTitulo]      = useState(prop.titulo)
  const [tipo,        setTipo]        = useState<TipoPropiedad>(prop.tipo as TipoPropiedad)
  const [precio,      setPrecio]      = useState(String(prop.precio))
  const [ubicacion,   setUbicacion]   = useState(prop.ubicacion)
  const [ciudad,      setCiudad]      = useState(prop.ciudad)
  const [recamaras,   setRecamaras]   = useState(prop.recamaras != null ? String(prop.recamaras) : '')
  const [banos,       setBanos]       = useState(prop.banos     != null ? String(prop.banos)     : '')
  const [m2,          setM2]          = useState(prop.m2        != null ? String(prop.m2)        : '')
  const [descripcion, setDescripcion] = useState(prop.descripcion ?? '')
  const [activa,      setActiva]      = useState(prop.activa)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSave() {
    if (!titulo.trim() || !precio || !ubicacion.trim() || !ciudad.trim()) {
      setError('Completa los campos obligatorios (*).')
      return
    }
    setSaving(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('propiedades')
      .update({
        titulo:      titulo.trim(),
        tipo,
        precio:      Number(precio),
        ubicacion:   ubicacion.trim(),
        ciudad:      ciudad.trim().toLowerCase(),
        recamaras:   recamaras ? Number(recamaras) : null,
        banos:       banos     ? Number(banos)     : null,
        m2:          m2        ? Number(m2)        : null,
        descripcion: descripcion.trim() || null,
        activa,
      })
      .eq('id', prop.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    alert('¡Propiedad actualizada!')
    onSaved()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="absolute inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)' }}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[28px]"
        style={{ background: '#FDFAF6', maxHeight: '92%', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D8C9BB' }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <h2 className="font-display text-[20px] font-bold" style={{ color: '#1A1A1A' }}>
            Editar propiedad
          </h2>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: '#F0EAE1' }}
          >
            <span className="text-[14px]" style={{ color: '#6B6B6B' }}>✕</span>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-32 flex flex-col gap-4">

          <SectionLabel>Datos básicos</SectionLabel>

          <Field label="Título *" value={titulo} onChange={setTitulo} placeholder="Ej. Casa Moderna en Juriquilla" />

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoPropiedad)}
              className={FIELD_CLASS}
              style={{ ...FIELD_STYLE, appearance: 'none' }}
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <Field label="Precio (MXN) *" value={precio}    onChange={setPrecio}    placeholder="4500000"                  inputMode="numeric" />
          <Field label="Ubicación *"    value={ubicacion} onChange={setUbicacion} placeholder="Ej. Juriquilla, Querétaro" />
          <Field label="Ciudad *"       value={ciudad}    onChange={setCiudad}    placeholder="Ej. queretaro" />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Recámaras" value={recamaras} onChange={setRecamaras} placeholder="3"   inputMode="numeric" />
            <Field label="Baños"     value={banos}     onChange={setBanos}     placeholder="2"   inputMode="numeric" />
            <Field label="m²"        value={m2}        onChange={setM2}        placeholder="180" inputMode="numeric" />
          </div>

          <SectionLabel>Descripción</SectionLabel>

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la propiedad…"
            rows={4}
            className={`${FIELD_CLASS} resize-none leading-relaxed`}
            style={FIELD_STYLE}
          />

          <SectionLabel>Estatus</SectionLabel>

          <div className="flex gap-3">
            {[
              { value: true,  label: '✅ Activa (visible en el feed)' },
              { value: false, label: '🔒 Rentada / Vendida'           },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setActiva(opt.value)}
                className="flex-1 py-3 rounded-[14px] text-[12px] font-semibold border-2 cursor-pointer transition-all"
                style={{
                  borderColor: activa === opt.value ? '#C2714F' : '#EDE4D7',
                  background:  activa === opt.value ? 'rgba(194,113,79,0.08)' : '#F0EAE1',
                  color:       activa === opt.value ? '#C2714F' : '#6B6B6B',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

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
            className="w-full bg-orange-600 text-white font-bold text-lg py-4 rounded-xl mt-6 mb-8 shadow-lg active:scale-95 disabled:opacity-60 border-none cursor-pointer transition-all"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
