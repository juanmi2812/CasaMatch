import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { calcularMetricasSimuladas, type MetricasVecindario } from '../../lib/aiClient'
import type { TipoPropiedad } from '../../types/database'

interface Props {
  onDismiss: () => void
  onCreated: () => void
}

const TIPOS: { value: TipoPropiedad; label: string }[] = [
  { value: 'casa',         label: 'Casa'             },
  { value: 'departamento', label: 'Departamento'     },
  { value: 'terreno',      label: 'Terreno'          },
  { value: 'local',        label: 'Local comercial'  },
  { value: 'oficina',      label: 'Oficina'          },
]

const METRICAS_LABELS: { key: keyof MetricasVecindario; label: string }[] = [
  { key: 'seguridad',       label: 'Seguridad'       },
  { key: 'trafico',         label: 'Tráfico'          },
  { key: 'vida_social',     label: 'Vida social'      },
  { key: 'tranquilidad',    label: 'Tranquilidad'     },
  { key: 'plusvalia',       label: 'Plusvalía'        },
  { key: 'servicios_cerca', label: 'Servicios cerca'  },
]

const DEFAULT_METRICAS: MetricasVecindario = {
  seguridad: 3, trafico: 3, vida_social: 3,
  tranquilidad: 3, plusvalia: 3, servicios_cerca: 3,
}

const FIELD_STYLE = { background: '#F0EAE1', color: '#1A1A1A' }
const FIELD_CLASS = 'w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none'

// ─── AI description generator ────────────────────────────────────────────────

function buildDescription(tipo: TipoPropiedad, ubicacion: string, precio: string): string {
  const tipoLabel: Record<TipoPropiedad, string> = {
    casa:         'casa',
    departamento: 'departamento',
    terreno:      'terreno con gran potencial',
    local:        'local comercial',
    oficina:      'oficina',
  }
  const precioNum = Number(precio)
  const precioFmt = precioNum >= 1_000_000
    ? `$${(precioNum / 1_000_000).toFixed(1)} millones MXN`
    : precioNum > 0
      ? `$${precioNum.toLocaleString('es-MX')} MXN`
      : 'precio competitivo'
  const zona = ubicacion.trim() || 'una zona exclusiva'
  const usp: Record<TipoPropiedad, string> = {
    casa:         'hacer de este espacio el hogar de tus sueños',
    departamento: 'disfrutar de una vida urbana moderna y cómoda',
    terreno:      'desarrollar un proyecto con alta plusvalía',
    local:        'impulsar tu negocio en una ubicación estratégica',
    oficina:      'llevar tu productividad al siguiente nivel',
  }
  return `Espectacular ${tipoLabel[tipo]} ubicada en la exclusiva zona de ${zona}, disponible a un valor de ${precioFmt}. Esta propiedad destaca por sus acabados de primer nivel, diseño contemporáneo y una localización privilegiada que combina tranquilidad residencial con acceso inmediato a comercios, escuelas y vías principales. Ideal para quienes buscan ${usp[tipo]}. Una oportunidad única en el mercado — ¡agenda tu visita hoy!`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewPropertyModal({ onDismiss, onCreated }: Props) {
  const { session } = useAuth()

  const [titulo,           setTitulo]           = useState('')
  const [tipo,             setTipo]             = useState<TipoPropiedad>('casa')
  const [precio,           setPrecio]           = useState('')
  const [ubicacion,        setUbicacion]        = useState('')
  const [ciudad,           setCiudad]           = useState('')
  const [recamaras,        setRecamaras]        = useState('')
  const [banos,            setBanos]            = useState('')
  const [m2,               setM2]               = useState('')
  const [descripcion,      setDescripcion]      = useState('')
  const [imageUrls,        setImageUrls]        = useState('')
  const [localFiles,       setLocalFiles]       = useState<File[]>([])
  const [caracteristicas,  setCaracteristicas]  = useState<MetricasVecindario>(DEFAULT_METRICAS)
  const [loadingMetricas,  setLoadingMetricas]  = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  function handleGenerateDescription() {
    setDescripcion(buildDescription(tipo, ubicacion, precio))
  }

  async function handleCalcularMetricas() {
    if (!ubicacion.trim()) {
      alert('Por favor, ingresa una ubicación primero.')
      return
    }
    setLoadingMetricas(true)
    setError(null)
    try {
      const result = await calcularMetricasSimuladas(ubicacion)
      setCaracteristicas(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al calcular métricas')
    } finally {
      setLoadingMetricas(false)
    }
  }

  async function uploadFiles(userId: string): Promise<string[]> {
    const publicUrls: string[] = []
    for (const file of localFiles) {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: upErr } = await supabase.storage
        .from('propiedades')
        .upload(path, file, { upsert: false })
      if (upErr) { console.error('[storage upload]', upErr.message); continue }
      if (data) {
        const { data: urlData } = supabase.storage.from('propiedades').getPublicUrl(data.path)
        publicUrls.push(urlData.publicUrl)
      }
    }
    return publicUrls
  }

  async function handleSave() {
    if (!session?.user) return
    if (!titulo.trim() || !precio || !ubicacion.trim() || !ciudad.trim()) {
      setError('Completa los campos obligatorios (*).')
      return
    }
    setSaving(true)
    setError(null)

    const uploadedUrls = await uploadFiles(session.user.id)
    const urlListFromTextarea = imageUrls
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'))
    const allImages = [...uploadedUrls, ...urlListFromTextarea]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('propiedades').insert({
      asesor_id:    session.user.id,
      titulo:       titulo.trim(),
      tipo,
      precio:       Number(precio),
      ubicacion:    ubicacion.trim(),
      ciudad:       ciudad.trim().toLowerCase(),
      recamaras:    recamaras ? Number(recamaras) : null,
      banos:        banos     ? Number(banos)     : null,
      m2:           m2        ? Number(m2)        : null,
      descripcion:  descripcion.trim() || null,
      imagenes:     allImages,
      caracteristicas,
    })

    setSaving(false)
    if (err) { setError(err.message); return }

    alert('¡Propiedad guardada con éxito!')
    setTitulo('')
    setTipo('casa')
    setPrecio('')
    setUbicacion('')
    setCiudad('')
    setRecamaras('')
    setBanos('')
    setM2('')
    setDescripcion('')
    setImageUrls('')
    setLocalFiles([])
    setCaracteristicas(DEFAULT_METRICAS)
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
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[28px]"
        style={{ background: '#FDFAF6', maxHeight: '92%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D8C9BB' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
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

        {/* Scrollable form body */}
        <div className="overflow-y-auto px-5 pb-32 flex flex-col gap-4">

          {/* ── Básicos ─────────────────────────────────── */}
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

          <Field label="Precio (MXN) *" value={precio}    onChange={setPrecio}    placeholder="4500000"                   inputMode="numeric" />
          <Field label="Ubicación *"    value={ubicacion} onChange={setUbicacion} placeholder="Ej. Juriquilla, Querétaro" />
          <Field label="Ciudad *"       value={ciudad}    onChange={setCiudad}    placeholder="Ej. queretaro" />

          <div className="grid grid-cols-3 gap-3">
            <Field label="Recámaras" value={recamaras} onChange={setRecamaras} placeholder="3"   inputMode="numeric" />
            <Field label="Baños"     value={banos}     onChange={setBanos}     placeholder="2"   inputMode="numeric" />
            <Field label="m²"        value={m2}        onChange={setM2}        placeholder="180" inputMode="numeric" />
          </div>

          {/* ── Descripción con IA ──────────────────────── */}
          <SectionLabel>Descripción</SectionLabel>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold" style={{ color: '#6B6B6B' }}>
                Descripción
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer transition-all active:scale-[.95]"
                style={{ background: 'rgba(194,113,79,0.12)', color: '#C2714F' }}
              >
                ✨ Generar texto vendedor
              </button>
            </div>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe la propiedad o usa el generador IA ✨"
              rows={4}
              className={`${FIELD_CLASS} resize-none leading-relaxed`}
              style={FIELD_STYLE}
            />
          </div>

          {/* ── Métricas del Vecindario ──────────────────── */}
          <SectionLabel>Métricas del Vecindario</SectionLabel>

          <div
            className="rounded-[18px] p-4 flex flex-col gap-3"
            style={{ border: '1.5px solid #EDE4D7', background: '#FDFAF6' }}
          >
            {/* Botón IA */}
            <button
              type="button"
              onClick={handleCalcularMetricas}
              disabled={loadingMetricas}
              className="w-full py-3 rounded-[14px] text-[14px] font-bold border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #C2714F 0%, #E8A98A 100%)',
                color: 'white',
                boxShadow: '0 4px 14px rgba(194,113,79,0.35)',
              }}
            >
              {loadingMetricas
                ? <><span className="animate-spin text-[16px]">⏳</span> Calculando…</>
                : <>✨ Calcular métricas por IA</>}
            </button>

            {/* Sliders */}
            {METRICAS_LABELS.map(({ key, label }) => (
              <SliderField
                key={key}
                label={label}
                value={caracteristicas[key]}
                onChange={(v) => setCaracteristicas((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>

          {/* ── Imágenes ────────────────────────────────── */}
          <SectionLabel>Imágenes</SectionLabel>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
              Opción A — URLs (separadas por comas)
            </label>
            <textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://img1.jpg, https://img2.jpg, ..."
              rows={2}
              className={`${FIELD_CLASS} resize-none leading-relaxed`}
              style={FIELD_STYLE}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
              Opción B — Subir desde dispositivo
            </label>
            <label
              className="flex items-center gap-2 px-4 py-3 rounded-[14px] cursor-pointer"
              style={{ background: '#F0EAE1' }}
            >
              <span className="text-[18px]">📷</span>
              <span className="text-[13px]" style={{ color: localFiles.length ? '#1A1A1A' : '#9B9B9B' }}>
                {localFiles.length > 0
                  ? `${localFiles.length} archivo${localFiles.length > 1 ? 's' : ''} seleccionado${localFiles.length > 1 ? 's' : ''}`
                  : 'Seleccionar imágenes…'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setLocalFiles(Array.from(e.target.files ?? []))}
              />
            </label>
          </div>

          {/* ── Error + Submit ──────────────────────────── */}
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
            {saving ? 'Guardando…' : 'Guardar Propiedad'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function SliderField({
  label, value, onChange,
}: {
  label:    string
  value:    number
  onChange: (v: number) => void
}) {
  const color = value >= 4 ? '#4ADE80' : value === 3 ? '#FBBF24' : '#F87171'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold" style={{ color: '#6B6B6B' }}>{label}</span>
        <span className="text-[13px] font-bold tabular-nums" style={{ color }}>{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  )
}
