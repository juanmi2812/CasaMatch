import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { calcularMetricasSimuladas, type MetricasVecindario } from '../../lib/aiClient'
import type { TipoPropiedad } from '../../types/database'
import { optimizeImage, deleteStorageFiles, extractPathFromUrl } from '../../services/propertyService'

interface PropData {
  id:                        string
  titulo:                    string
  tipo:                      string
  precio:                    number
  ubicacion:                 string
  ciudad:                    string
  descripcion:               string | null
  recamaras:                 number | null
  banos:                     number | null
  estacionamientos?:         number | null
  m2:                        number | null
  activa:                    boolean
  imagenes:                  string[]
  caracteristicas?:          Record<string, number> | null
  caracteristicas_lifestyle?: Record<string, any> | null
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

const METRICAS_LABELS: { key: keyof MetricasVecindario; label: string }[] = [
  { key: 'seguridad',       label: 'Seguridad'       },
  { key: 'trafico',         label: 'Tráfico'          },
  { key: 'vida_social',     label: 'Vida social'      },
  { key: 'tranquilidad',    label: 'Tranquilidad'     },
  { key: 'plusvalia',       label: 'Plusvalía'        },
  { key: 'servicios_cerca', label: 'Servicios cerca'  },
]

const FIELD_STYLE = { background: '#F0EAE1', color: '#1A1A1A' }
const FIELD_CLASS = 'w-full px-4 py-3 rounded-[14px] text-[14px] border-none outline-none'

function initMetricas(prop: PropData): MetricasVecindario {
  const cA = prop.caracteristicas          ?? {}
  const cL = prop.caracteristicas_lifestyle ?? {}
  const p  = (keyL: string, keyA?: string): number => {
    const fromA = cA[keyA ?? keyL]
    const fromL = cL[keyL]
    if (fromA != null && fromA > 0) return fromA
    if (fromL != null && fromL > 0) return fromL
    return 3
  }
  return {
    seguridad:       p('seguridad'),
    trafico:         p('trafico'),
    vida_social:     p('vida_social'),
    tranquilidad:    p('tranquilidad'),
    plusvalia:       p('plusvalia'),
    servicios_cerca: p('servicios_cercanos', 'servicios_cerca'),
  }
}

// ─── AI description generator ──────────────// ─── Toggle Button Component ──────────────────────────────────────────────────

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all"
      style={{
        background: active ? '#C2714F' : '#EDE4D7',
        color: active ? 'white' : '#6B6B6B',
        boxShadow: active ? '0 2px 6px rgba(194,113,79,0.3)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

// ─── AI description generator ────────────────────────────────────────────────

function buildDescription(
  tipo: TipoPropiedad,
  ubicacion: string,
  precio: string,
  recamaras: string,
  m2: string,
  pisos: string,
  tieneCloset: boolean,
  cuartoTv: boolean,
  banosCompletos: string,
  mediosBanos: string,
  cocinaIntegral: boolean,
  cuartoLavado: boolean,
  jardin: boolean,
  terraza: boolean,
  cocheras: string,
  esPrivada: boolean,
  calle: string,
  amenidades: string
): string {
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
  const zona = ubicacion.trim() || 'una excelente ubicación'

  let desc = `Espectacular ${tipoLabel[tipo]} en venta/renta ubicada en ${zona}, con un valor de ${precioFmt}.`

  const detallesList: string[] = []

  if (m2) detallesList.push(`cuenta con una superficie de ${m2} m²`)
  if (pisos) detallesList.push(`se distribuye en ${pisos} ${Number(pisos) === 1 ? 'planta' : 'plantas'}`)
  
  if (recamaras) {
    const closetText = tieneCloset ? ' con amplios clósets' : ''
    detallesList.push(`ofrece ${recamaras} ${Number(recamaras) === 1 ? 'recámara' : 'recámaras'}${closetText}`)
  }

  const banosFmt = []
  if (banosCompletos && Number(banosCompletos) > 0) {
    banosFmt.push(`${banosCompletos} ${Number(banosCompletos) === 1 ? 'baño completo' : 'baños completos'}`)
  }
  if (mediosBanos && Number(mediosBanos) > 0) {
    banosFmt.push(`${mediosBanos} ${Number(mediosBanos) === 1 ? 'medio baño' : 'medios baños'}`)
  }
  if (banosFmt.length > 0) {
    detallesList.push(`dispone de ${banosFmt.join(' y ')}`)
  }

  if (cocheras) {
    detallesList.push(`cochera con espacio para ${cocheras} ${Number(cocheras) === 1 ? 'auto' : 'autos'}`)
  }

  if (detallesList.length > 0) {
    desc += ` La propiedad ${detallesList.join(', ')}.`
  }

  const areasFmt = []
  if (cocinaIntegral) areasFmt.push('cocina integral totalmente equipada')
  if (cuartoTv) areasFmt.push('cuarto de TV')
  if (cuartoLavado) areasFmt.push('área de lavado independiente')
  if (jardin) areasFmt.push('jardín privado')
  if (terraza) areasFmt.push('terraza ideal para reuniones')

  if (areasFmt.length > 0) {
    const last = areasFmt.pop()
    const areasStr = areasFmt.length > 0 ? `${areasFmt.join(', ')} y ${last}` : last
    desc += ` El inmueble está diseñado para tu comodidad, incluyendo ${areasStr}.`
  }

  if (esPrivada) {
    desc += ` Se ubica dentro de una privada residencial con acceso controlado y seguridad las 24 horas, ideal para la tranquilidad de tu familia.`
  } else if (calle.trim()) {
    desc += ` Se encuentra sobre la calle ${calle.trim()}, una vialidad con excelente conectividad.`
  }

  if (amenidades.trim()) {
    desc += ` Además, el complejo ofrece amenidades exclusivas como ${amenidades.trim()}.`
  }

  desc += ` Es una excelente oportunidad para habitar o invertir. ¡Contáctanos hoy mismo para agendar tu visita!`

  return desc
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditPropertyModal({ prop, onDismiss, onSaved }: Props) {
  const { session } = useAuth()

  const [titulo,          setTitulo]          = useState(prop.titulo)
  const [tipo,            setTipo]            = useState<TipoPropiedad>(prop.tipo as TipoPropiedad)
  const [precio,          setPrecio]          = useState(String(prop.precio))
  const [ubicacion,       setUbicacion]       = useState(prop.ubicacion)
  const [ciudad,          setCiudad]          = useState(prop.ciudad)
  const [recamaras,       setRecamaras]       = useState(prop.recamaras != null ? String(prop.recamaras) : '')
  const [m2,              setM2]              = useState(prop.m2        != null ? String(prop.m2)        : '')
  const [descripcion,     setDescripcion]     = useState(prop.descripcion ?? '')
  const [activa,          setActiva]          = useState(prop.activa)
  const [imageUrls,       setImageUrls]       = useState(prop.imagenes?.join(', ') ?? '')
  const [localFiles,      setLocalFiles]      = useState<File[]>([])
  const [caracteristicas, setCaracteristicas] = useState<MetricasVecindario>(() => initMetricas(prop))
  const [loadingMetricas, setLoadingMetricas] = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  // Initialize new details from caracteristicas_lifestyle with fallbacks for existing records
  const details = (prop.caracteristicas_lifestyle as Record<string, any>) ?? {}
  const fallbackBanosCompletos = prop.banos != null ? String(Math.floor(prop.banos)) : ''
  const fallbackMediosBanos = prop.banos != null && prop.banos % 1 >= 0.5 ? '1' : ''
  const fallbackCocheras = prop.estacionamientos != null ? String(prop.estacionamientos) : ''

  const [pisos,            setPisos]            = useState(details.detalles_pisos != null ? String(details.detalles_pisos) : '')
  const [tieneCloset,      setTieneCloset]      = useState(!!details.detalles_closet)
  const [cuartoTv,         setCuartoTv]         = useState(!!details.detalles_cuarto_tv)
  const [banosCompletos,   setBanosCompletos]   = useState(details.detalles_banos_completos != null ? String(details.detalles_banos_completos) : fallbackBanosCompletos)
  const [mediosBanos,      setMediosBanos]      = useState(details.detalles_medios_banos != null ? String(details.detalles_medios_banos) : fallbackMediosBanos)
  const [cocinaIntegral,   setCocinaIntegral]   = useState(!!details.detalles_cocina_integral)
  const [cuartoLavado,     setCuartoLavado]     = useState(!!details.detalles_cuarto_lavado)
  const [jardin,           setJardin]           = useState(!!details.detalles_jardin)
  const [terraza,          setTerraza]          = useState(!!details.detalles_terraza)
  const [cocheras,         setCocheras]         = useState(details.detalles_cocheras != null ? String(details.detalles_cocheras) : fallbackCocheras)
  const [esPrivada,        setEsPrivada]        = useState(!!details.detalles_privada)
  const [calle,            setCalle]            = useState(details.detalles_calle != null ? String(details.detalles_calle) : '')
  const [amenidades,       setAmenidades]       = useState(details.detalles_amenidades != null ? String(details.detalles_amenidades) : '')

  function handleGenerateDescription() {
    setDescripcion(
      buildDescription(
        tipo,
        ubicacion,
        precio,
        recamaras,
        m2,
        pisos,
        tieneCloset,
        cuartoTv,
        banosCompletos,
        mediosBanos,
        cocinaIntegral,
        cuartoLavado,
        jardin,
        terraza,
        cocheras,
        esPrivada,
        calle,
        amenidades
      )
    )
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
      
      // Optimize image before upload
      const optimizedFile = await optimizeImage(file)
      
      const { data, error: upErr } = await supabase.storage
        .from('propiedades')
        .upload(path, optimizedFile, { upsert: false })
      if (upErr) { console.error('[storage upload]', upErr.message); continue }
      if (data) {
        const { data: urlData } = supabase.storage.from('propiedades').getPublicUrl(data.path)
        publicUrls.push(urlData.publicUrl)
      }
    }
    return publicUrls
  }

  async function handleSave() {
    if (!titulo.trim() || !precio || !ubicacion.trim() || !ciudad.trim()) {
      setError('Completa los campos obligatorios (*).'); return
    }
    if (!session?.user) { setError('Sesión expirada.'); return }
    setSaving(true)
    setError(null)

    const uploadedUrls       = await uploadFiles(session.user.id)
    const urlListFromTextarea = imageUrls
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http'))
    const allImages = [...urlListFromTextarea, ...uploadedUrls]

    // Identify and delete orphan images from Supabase Storage
    if (prop.imagenes && prop.imagenes.length > 0) {
      const removedUrls = prop.imagenes.filter((url) => !allImages.includes(url))
      const removedPaths = removedUrls
        .map((url) => extractPathFromUrl(url))
        .filter((p): p is string => p !== null)
      if (removedPaths.length > 0) {
        await deleteStorageFiles(removedPaths)
      }
    }

    const computedBanos = (banosCompletos ? Number(banosCompletos) : 0) + (mediosBanos ? Number(mediosBanos) * 0.5 : 0)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('propiedades')
      .update({
        titulo:         titulo.trim(),
        tipo,
        precio:         Number(precio),
        ubicacion:      ubicacion.trim(),
        ciudad:         ciudad.trim().toLowerCase(),
        recamaras:      recamaras ? Number(recamaras) : null,
        banos:          computedBanos || null,
        estacionamientos: cocheras ? Number(cocheras) : null,
        m2:             m2        ? Number(m2)        : null,
        descripcion:    descripcion.trim() || null,
        imagenes:       allImages,
        activa,
        caracteristicas,
        caracteristicas_lifestyle: {
          detalles_pisos: pisos ? Number(pisos) : null,
          detalles_closet: tieneCloset,
          detalles_cuarto_tv: cuartoTv,
          detalles_banos_completos: banosCompletos ? Number(banosCompletos) : null,
          detalles_medios_banos: mediosBanos ? Number(mediosBanos) : null,
          detalles_cocina_integral: cocinaIntegral,
          detalles_cuarto_lavado: cuartoLavado,
          detalles_jardin: jardin,
          detalles_terraza: terraza,
          detalles_cocheras: cocheras ? Number(cocheras) : null,
          detalles_privada: esPrivada,
          detalles_calle: calle.trim() || null,
          detalles_amenidades: amenidades.trim() || null,
        }
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

          {/* ── Básicos ──────────────────────────────────────── */}
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Recámaras" value={recamaras} onChange={setRecamaras} placeholder="3"   inputMode="numeric" />
            <Field label="m²"        value={m2}        onChange={setM2}        placeholder="180" inputMode="numeric" />
          </div>

          {/* ── Detalles rápidos (para IA) ──────────────── */}
          <SectionLabel>Detalles rápidos (para IA ✨)</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pisos / Plantas" value={pisos} onChange={setPisos} placeholder="Ej. 2" inputMode="numeric" />
            <Field label="Cocheras / Estacionamiento" value={cocheras} onChange={setCocheras} placeholder="Ej. 2" inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Baños completos" value={banosCompletos} onChange={setBanosCompletos} placeholder="Ej. 2" inputMode="numeric" />
            <Field label="Medios baños" value={mediosBanos} onChange={setMediosBanos} placeholder="Ej. 1" inputMode="numeric" />
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Calle" value={calle} onChange={setCalle} placeholder="Ej. Paseo de la República" />
            <Field label="Amenidades" value={amenidades} onChange={setAmenidades} placeholder="Ej. alberca, gym, áreas verdes" />
          </div>

          <label className="text-[11px] font-bold uppercase tracking-wider mt-1 block" style={{ color: '#9B9B9B' }}>
            Características rápidas (Toca para activar)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            <ToggleButton active={tieneCloset} onClick={() => setTieneCloset(!tieneCloset)} label="👕 Con clóset" />
            <ToggleButton active={cuartoTv} onClick={() => setCuartoTv(!cuartoTv)} label="📺 Cuarto de TV" />
            <ToggleButton active={cocinaIntegral} onClick={() => setCocinaIntegral(!cocinaIntegral)} label="🍳 Cocina integral" />
            <ToggleButton active={cuartoLavado} onClick={() => setCuartoLavado(!cuartoLavado)} label="🧺 Cuarto de lavado" />
            <ToggleButton active={jardin} onClick={() => setJardin(!jardin)} label="🌳 Jardín" />
            <ToggleButton active={terraza} onClick={() => setTerraza(!terraza)} label="🌅 Terraza" />
            <ToggleButton active={esPrivada} onClick={() => setEsPrivada(!esPrivada)} label="🛡️ Privada" />
          </div>

          {/* ── Descripción con IA ───────────────────────────── */}
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
              className="w-full min-h-[120px] p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-[14px] resize-y leading-relaxed"
              style={{ borderColor: '#EDE4D7', background: '#F0EAE1', color: '#1A1A1A' }}
            />
          </div>

          {/* ── Métricas del Vecindario ──────────────────────── */}
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

          {/* ── Imágenes ─────────────────────────────────────── */}
          <SectionLabel>Imágenes</SectionLabel>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>
              URLs actuales / nuevas (separadas por comas)
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
              Subir nuevas imágenes desde dispositivo
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

          {/* ── Estatus ──────────────────────────────────────── */}
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
