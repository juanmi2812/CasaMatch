import { useState } from 'react'
import type { TipoOperacion } from '../types/database'

type TipoProp = 'casa' | 'departamento' | 'terreno' | 'local' | 'oficina' | 'bodega'
type StepNum  = 1 | 2 | 3 | 4 | 5

interface OnboardingData {
  tipoOperacion: TipoOperacion | null
  tipoPropiedad: TipoProp | null
  presupuestoMax: number
  ciudad: string | null
  tagsLifestyle: string[]
}

interface Props {
  onComplete: (data: OnboardingData) => void
}

// ─── Static data ──────────────────────────────────────────────────────────────

const OPERATION_OPTIONS: Array<{ value: TipoOperacion; icon: string; title: string; sub: string }> = [
  { value: 'comprar',  icon: '🏡', title: 'Comprar una propiedad',     sub: 'vivienda, terreno o inmueble comercial' },
  { value: 'rentar',   icon: '🔑', title: 'Rentar una propiedad',      sub: 'vivienda, local, oficina o bodega'       },
  { value: 'invertir', icon: '📈', title: 'Invertir en bienes raíces', sub: 'busco plusvalía o renta'                  },
]

const PROPERTY_OPTIONS: Record<TipoOperacion, Array<{ value: TipoProp; icon: string; title: string; sub: string }>> = {
  comprar: [
    { value: 'casa',         icon: '🏡', title: 'Casa',            sub: 'Residencial con jardín o patio'     },
    { value: 'departamento', icon: '🏢', title: 'Departamento',    sub: 'Unidad en edificio o complejo'      },
    { value: 'terreno',      icon: '🗺️', title: 'Terreno',         sub: 'Lote para construcción o inversión' },
    { value: 'local',        icon: '🏪', title: 'Local comercial', sub: 'Espacio para negocio o renta'       },
    { value: 'oficina',      icon: '💼', title: 'Oficina',         sub: 'Espacio de trabajo privado'         },
  ],
  rentar: [
    { value: 'casa',         icon: '🏡', title: 'Casa',         sub: 'Residencial con jardín o patio'  },
    { value: 'departamento', icon: '🏢', title: 'Departamento', sub: 'Unidad en edificio o complejo'   },
    { value: 'local',        icon: '🏪', title: 'Local',        sub: 'Espacio comercial o de negocio'  },
    { value: 'oficina',      icon: '💼', title: 'Oficina',      sub: 'Espacio de trabajo privado'      },
    { value: 'bodega',       icon: '🏭', title: 'Bodega',       sub: 'Almacén o espacio industrial'    },
  ],
  invertir: [
    { value: 'terreno',      icon: '🗺️', title: 'Terreno',         sub: 'Alta plusvalía a futuro'               },
    { value: 'local',        icon: '🏪', title: 'Local comercial', sub: 'Renta mensual garantizada'             },
    { value: 'departamento', icon: '🏢', title: 'Departamento',    sub: 'Airbnb o renta residencial'            },
    { value: 'oficina',      icon: '💼', title: 'Oficina',         sub: 'Mercado corporativo en crecimiento'    },
  ],
}

const CITIES = [
  { value: 'queretaro',   icon: '🏛️', title: 'Querétaro',        sub: '340+ propiedades disponibles' },
  { value: 'cdmx',        icon: '🌆', title: 'Ciudad de México', sub: '820+ propiedades disponibles' },
  { value: 'guadalajara', icon: '🌵', title: 'Guadalajara',      sub: '210+ propiedades disponibles' },
  { value: 'leon',        icon: '🏭', title: 'León / Celaya',    sub: '190+ propiedades disponibles' },
]

const LIFESTYLE_PILLS = [
  { tag: 'mascotas',        icon: '🐾',    label: 'Tengo mascotas'    },
  { tag: 'home_office',     icon: '💻',    label: 'Trabajo desde casa'},
  { tag: 'escuelas',        icon: '🏫',    label: 'Escuelas cerca'    },
  { tag: 'zona_tranquila',  icon: '🤫',    label: 'Zona tranquila'    },
  { tag: 'vida_social',     icon: '🍕',    label: 'Vida social'       },
  { tag: 'plusvalia',       icon: '📈',    label: 'Plusvalía'         },
  { tag: 'estacionamiento', icon: '🚗',    label: 'Estacionamiento'   },
  { tag: 'areas_verdes',    icon: '🌳',    label: 'Áreas verdes'      },
  { tag: 'amenidades',      icon: '🏊',    label: 'Amenidades'        },
  { tag: 'seguridad',       icon: '🔐',    label: 'Seguridad 24h'     },
  { tag: 'familias',        icon: '👨‍👩‍👧',   label: 'Zona familiar'     },
  { tag: 'vista_urbana',    icon: '🌇',    label: 'Vista urbana'      },
]

// ─── Pure helpers (exported for unit tests) ───────────────────────────────────

export function formatBudget(thousands: number): string {
  if (thousands >= 1000) {
    const m = thousands / 1000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M MXN`
  }
  return `$${thousands}k MXN`
}

export function calcTotalSteps(tipoPropiedad: TipoProp | null): number {
  if (tipoPropiedad == null) return 5
  return tipoPropiedad === 'casa' || tipoPropiedad === 'departamento' ? 5 : 4
}

// ─── Shared sub-components (outside main component to avoid re-creation) ──────

interface OptionCardProps {
  selected: boolean
  icon:     string
  title:    string
  sub:      string
  onClick:  () => void
}

function OptionCard({ selected, icon, title, sub, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 px-5 py-[18px] rounded-[20px] cursor-pointer transition-all w-full text-left border-2 active:scale-[.98]"
      style={{
        borderColor: selected ? '#C2714F' : '#EDE4D7',
        background:  selected ? 'rgba(194,113,79,.05)' : 'white',
      }}
    >
      <span className="text-[28px] flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-black">{title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: '#6B6B6B' }}>{sub}</p>
      </div>
      <div
        className="w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          borderColor: selected ? '#C2714F' : '#C8C8C8',
          background:  selected ? '#C2714F' : 'transparent',
        }}
      >
        {selected && <span className="text-white text-[12px] leading-none">✓</span>}
      </div>
    </button>
  )
}

function StatusBar() {
  return (
    <div className="flex justify-between items-center px-5 pt-[14px] pb-[6px] text-[12px] font-semibold tracking-[0.3px] flex-shrink-0 bg-white">
      <span>9:41</span>
      <div className="flex gap-1 items-center">
        <span>●●●</span><span>📶</span><span>🔋</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<StepNum>(1)
  const [data, setData] = useState<OnboardingData>({
    tipoOperacion: null,
    tipoPropiedad: null,
    presupuestoMax: 2500,
    ciudad:         null,
    tagsLifestyle:  [],
  })

  const needsLifestyle = data.tipoPropiedad === 'casa' || data.tipoPropiedad === 'departamento'
  const total          = calcTotalSteps(data.tipoPropiedad)
  const progress       = (step / total) * 100

  function advance() {
    if (step === 4) {
      needsLifestyle ? setStep(5) : onComplete(data)
      return
    }
    if (step === 5) {
      onComplete(data)
      return
    }
    setStep((s) => (s + 1) as StepNum)
  }

  // Inline StepHeader — uses closure over progress/step/total (not a React component)
  function renderHeader(title: string, subtitle: string) {
    return (
      <>
        <div className="px-6 pt-5 sticky top-0 bg-white z-10">
          <div className="h-[3px] bg-sand-dark rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-terra rounded-full"
              style={{ width: `${progress}%`, transition: 'width 400ms cubic-bezier(.4,0,.2,1)' }}
            />
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-[12px] font-medium mb-2" style={{ color: '#6B6B6B' }}>
            Paso {step} de {total}
          </p>
          <h2 className="font-display text-[26px] font-semibold leading-[1.25] text-black mb-1.5">
            {title}
          </h2>
          <p className="text-[14px] leading-[1.5]" style={{ color: '#6B6B6B' }}>{subtitle}</p>
        </div>
      </>
    )
  }

  function PrimaryBtn({ label, disabled = false }: { label: string; disabled?: boolean }) {
    return (
      <button
        onClick={advance}
        disabled={disabled}
        className="w-full rounded-full py-[15px] text-[15px] font-semibold font-body border-none text-white cursor-pointer transition-all active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#C2714F' }}
      >
        {label}
      </button>
    )
  }

  // ── Step 1: Tipo de operación ──────────────────────────────────────────────
  if (step === 1) return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      {renderHeader('¿Qué estás buscando?', 'Esto nos ayuda a personalizar tu experiencia.')}
      <div className="flex flex-col gap-3 px-6 pb-4">
        {OPERATION_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={data.tipoOperacion === opt.value}
            icon={opt.icon}
            title={opt.title}
            sub={opt.sub}
            onClick={() => setData((d) => ({ ...d, tipoOperacion: opt.value }))}
          />
        ))}
      </div>
      <div className="px-6 pb-8 mt-auto">
        <PrimaryBtn label="Continuar" disabled={!data.tipoOperacion} />
      </div>
    </div>
  )

  // ── Step 2: Tipo de propiedad ──────────────────────────────────────────────
  if (step === 2) {
    const options = data.tipoOperacion ? PROPERTY_OPTIONS[data.tipoOperacion] : []
    return (
      <div className="flex flex-col flex-1 bg-white">
        <StatusBar />
        {renderHeader('¿Qué tipo de propiedad buscas?', 'Puedes cambiar esto más adelante.')}
        <div className="flex flex-col gap-3 px-6 pb-4">
          {options.map((opt) => (
            <OptionCard
              key={opt.value}
              selected={data.tipoPropiedad === opt.value}
              icon={opt.icon}
              title={opt.title}
              sub={opt.sub}
              onClick={() => setData((d) => ({ ...d, tipoPropiedad: opt.value }))}
            />
          ))}
        </div>
        <div className="px-6 pb-8 mt-auto">
          <PrimaryBtn label="Continuar" disabled={!data.tipoPropiedad} />
        </div>
      </div>
    )
  }

  // ── Step 3: Presupuesto ────────────────────────────────────────────────────
  if (step === 3) {
    const pct = ((data.presupuestoMax - 500) / 7500) * 100
    const propCount = Math.round((data.presupuestoMax / 8000) * 400) + 20
    return (
      <div className="flex flex-col flex-1 bg-white">
        <StatusBar />
        {renderHeader('¿Cuál es tu presupuesto?', 'Solo una referencia. Puedes ajustarlo después.')}
        <div className="px-6">
          <p className="font-display text-[36px] font-bold text-black mb-1">
            {formatBudget(data.presupuestoMax)}
          </p>
          <p className="text-[13px] mb-6" style={{ color: '#6B6B6B' }}>
            Presupuesto máximo aproximado
          </p>
          <input
            type="range"
            min={500} max={8000} step={100}
            value={data.presupuestoMax}
            onChange={(e) => setData((d) => ({ ...d, presupuestoMax: Number(e.target.value) }))}
            className="w-full mb-5"
            style={{
              background: `linear-gradient(to right, #C2714F 0%, #C2714F ${pct}%, #EDE4D7 ${pct}%)`,
            }}
          />
          <div
            className="flex justify-between text-[12px] -mt-2 mb-5"
            style={{ color: '#6B6B6B' }}
          >
            <span>$500k</span><span>$4M</span><span>$8M+</span>
          </div>
          <div className="bg-sand rounded-[20px] p-[18px]">
            <p className="text-[12px] mb-2" style={{ color: '#6B6B6B' }}>
              Propiedades disponibles en este rango
            </p>
            <p className="text-[20px] font-bold" style={{ color: '#C2714F' }}>
              {propCount} propiedades
            </p>
          </div>
        </div>
        <div className="px-6 pb-8 mt-auto flex flex-col gap-2.5">
          <PrimaryBtn label="Continuar" />
          <button
            onClick={advance}
            className="w-full rounded-full py-[14px] text-[15px] font-medium font-body bg-transparent cursor-pointer transition-all"
            style={{ border: '1.5px solid #C8C8C8', color: '#6B6B6B' }}
          >
            Saltar este paso
          </button>
        </div>
      </div>
    )
  }

  // ── Step 4: Ciudad ─────────────────────────────────────────────────────────
  if (step === 4) return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      {renderHeader('¿Dónde quieres vivir?', 'Elige una ciudad para empezar.')}
      <div className="flex flex-col gap-3 px-6 pb-4">
        {CITIES.map((city) => (
          <OptionCard
            key={city.value}
            selected={data.ciudad === city.value}
            icon={city.icon}
            title={city.title}
            sub={city.sub}
            onClick={() => setData((d) => ({ ...d, ciudad: city.value }))}
          />
        ))}
      </div>
      <div className="px-6 pb-8 mt-auto">
        <PrimaryBtn label="Continuar" disabled={!data.ciudad} />
      </div>
    </div>
  )

  // ── Step 5: Estilo de vida (casa/departamento only) ────────────────────────
  return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      {renderHeader('¿Cómo es tu estilo de vida?', 'Elige todo lo que te describe.')}
      <div className="flex flex-wrap gap-2.5 px-6 pb-4">
        {LIFESTYLE_PILLS.map(({ tag, icon, label }) => {
          const selected = data.tagsLifestyle.includes(tag)
          return (
            <button
              key={tag}
              onClick={() =>
                setData((d) => ({
                  ...d,
                  tagsLifestyle: selected
                    ? d.tagsLifestyle.filter((t) => t !== tag)
                    : [...d.tagsLifestyle, tag],
                }))
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all active:scale-[.96] border-2"
              style={{
                borderColor: selected ? '#C2714F' : '#EDE4D7',
                background:  selected ? 'rgba(194,113,79,.08)' : 'white',
                color:       selected ? '#C2714F' : '#6B6B6B',
              }}
            >
              <span>{icon}</span>{label}
            </button>
          )
        })}
      </div>
      <div className="px-6 pb-8 mt-auto">
        <PrimaryBtn label="Ver mis matches ✦" />
      </div>
    </div>
  )
}
