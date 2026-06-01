# Navigation & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement PhoneShell container, LandingScreen, and a 5-step conditional OnboardingScreen connected via useState in App.tsx.

**Architecture:** App.tsx owns `Screen` union state and passes it to PhoneShell, which animates screen transitions via Framer Motion AnimatePresence and conditionally renders the BottomNav. LandingScreen and OnboardingScreen are pure presentational components that call callback props to trigger navigation.

**Tech Stack:** React 18, TypeScript strict, Tailwind v4 (tokens in index.css), Framer Motion, Lucide-less (emojis for icons in MVP).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `index.html` | Add Google Fonts (Playfair Display + DM Sans) |
| Replace | `src/App.css` | Empty — all styles via Tailwind |
| Modify | `src/index.css` | Add range-input thumb CSS + scrollbar-none utility |
| Create | `src/components/PhoneShell.tsx` | Shell layout, AnimatePresence, BottomNav, exports `Screen` type |
| Create | `src/screens/LandingScreen.tsx` | Dark hero screen with gradient, stats, two CTAs |
| Create | `src/screens/OnboardingScreen.tsx` | 5-step conditional form, all business logic |
| Replace | `src/App.tsx` | State owner; wires screens together |
| Create | `src/__tests__/onboarding.test.ts` | Unit tests for conditional logic + formatBudget |

---

## Task 1: Foundations — fonts, CSS cleanup, utilities

**Files:**
- Modify: `index.html`
- Replace: `src/App.css`
- Modify: `src/index.css`

- [ ] **Step 1: Add Google Fonts to index.html**

Replace the full content of `index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>CasaMatch — Tu próxima casa, en un swipe</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Empty App.css**

Replace the full content of `src/App.css` with an empty file (one newline). All styles come from Tailwind.

```css

```

- [ ] **Step 3: Add slider thumb + scrollbar utility to index.css**

Append to `src/index.css` (after existing content):

```css
/* Range input thumb — not expressible via Tailwind utilities */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #c2714f;
  box-shadow: 0 2px 8px rgba(194, 113, 79, 0.4);
  cursor: pointer;
}
input[type='range']::-moz-range-thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #c2714f;
  box-shadow: 0 2px 8px rgba(194, 113, 79, 0.4);
  cursor: pointer;
  border: none;
}

/* Utility: hide scrollbar cross-browser */
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: Run tsc to verify no issues**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

---

## Task 2: PhoneShell component

**Files:**
- Create: `src/components/PhoneShell.tsx`

- [ ] **Step 1: Create PhoneShell.tsx**

```tsx
import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type Screen = 'landing' | 'onboarding' | 'feed' | 'reels' | 'saved' | 'advisor'

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: ReactNode
}

const NAV_ITEMS: Array<{ id: Screen; icon: string; label: string }> = [
  { id: 'feed',    icon: '⊞', label: 'Explorar'  },
  { id: 'reels',   icon: '▷', label: 'Reels'      },
  { id: 'saved',   icon: '🤍', label: 'Guardados' },
  { id: 'advisor', icon: '👤', label: 'Asesor'    },
]

const POST_ONBOARDING: Screen[] = ['feed', 'reels', 'saved', 'advisor']

export default function PhoneShell({ screen, onNavigate, children }: Props) {
  const showNav = POST_ONBOARDING.includes(screen)

  return (
    <div className="min-h-svh bg-[#F0EBE3] flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-svh bg-sand overflow-hidden flex flex-col">

        {/* Screen area with animated transitions */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar"
              style={{ paddingBottom: showNav ? 80 : 0 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation — only post-onboarding */}
        {showNav && (
          <nav
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] flex justify-around items-center pt-2.5 pb-5 z-[100] border-t border-black/[0.07]"
            style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)' }}
          >
            {NAV_ITEMS.map(({ id, icon, label }) => {
              const active = screen === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl border-none bg-transparent cursor-pointer transition-all active:bg-sand-dark"
                >
                  <span
                    className="text-[22px] transition-transform"
                    style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}
                  >
                    {icon}
                  </span>
                  <span
                    className="text-[10px] font-medium font-body transition-colors"
                    style={{ color: active ? '#C2714F' : '#6B6B6B' }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tsc to verify types**

```bash
npx tsc --noEmit
```

Expected: no output.

---

## Task 3: LandingScreen component

**Files:**
- Create: `src/screens/LandingScreen.tsx`

- [ ] **Step 1: Create LandingScreen.tsx**

```tsx
interface Props {
  onStart:   () => void
  onExplore: () => void
}

const STATS = [
  { num: '2.4k', label: 'Propiedades' },
  { num: '94%',  label: 'Satisfacción' },
  { num: '320+', label: 'Asesores' },
]

export default function LandingScreen({ onStart, onExplore }: Props) {
  return (
    <div className="relative flex-1 text-white" style={{ background: '#1A1A1A' }}>
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(194,113,79,.45) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 10% 80%, rgba(107,124,92,.30) 0%, transparent 70%)',
            '#1A1A1A',
          ].join(', '),
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-svh px-7 pt-[60px] pb-12 justify-between">

        {/* Logo */}
        <div className="font-display text-[28px] font-bold tracking-[-0.5px]">
          Casa<span style={{ color: '#E8A98A' }}>Match</span>
        </div>

        {/* Hero block */}
        <div className="flex-1 flex flex-col justify-center gap-5 py-8">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium w-fit"
            style={{
              background: 'rgba(255,255,255,.10)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#E8A98A',
              backdropFilter: 'blur(8px)',
            }}
          >
            ✦ Nueva forma de buscar casa
          </div>

          <h1 className="font-display text-[44px] leading-[1.1] font-bold tracking-[-1px]">
            Tu próxima<br />casa, en un<br />
            <em style={{ color: '#E8A98A', fontStyle: 'italic' }}>swipe.</em>
          </h1>

          <p className="text-[16px] leading-[1.6] font-light" style={{ color: 'rgba(255,255,255,.65)' }}>
            Encuentra propiedades compatibles con tu estilo de vida,
            presupuesto y lo que realmente buscas.
          </p>

          {/* Stats row */}
          <div
            className="flex rounded-[18px] p-5"
            style={{
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.10)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,.12)' } : {}}
              >
                <span className="font-display text-[24px] font-bold block">{stat.num}</span>
                <span className="text-[11px] mt-0.5 block" style={{ color: 'rgba(255,255,255,.50)' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onStart}
            className="w-full rounded-full py-[15px] text-[15px] font-semibold font-body border-none text-white cursor-pointer tracking-[0.2px] transition-all active:scale-[.97]"
            style={{ background: '#C2714F' }}
          >
            Encontrar mi casa ideal
          </button>
          <button
            onClick={onExplore}
            className="w-full rounded-full py-[14px] text-[15px] font-medium font-body bg-transparent cursor-pointer transition-all"
            style={{ border: '1.5px solid rgba(255,255,255,.20)', color: 'rgba(255,255,255,.70)' }}
          >
            Solo explorar →
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tsc**

```bash
npx tsc --noEmit
```

Expected: no output.

---

## Task 4: OnboardingScreen component

**Files:**
- Create: `src/screens/OnboardingScreen.tsx`

**Business rules encoded:**
- Step 1 options include the mandated subtexts.
- Step 2 options are conditional on `tipoOperacion`.
- Lifestyle pills (step 5) render **only** when `tipoPropiedad ∈ ['casa','departamento']`.
- After step 4 (Ciudad), if no lifestyle needed → call `onComplete()` directly.
- `totalSteps` = 5 if casa/depto, 4 otherwise (unknown until property type selected → show 5 optimistically).

- [ ] **Step 1: Create OnboardingScreen.tsx**

```tsx
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

// ─── Static data ─────────────────────────────────────────────

const OPERATION_OPTIONS: Array<{ value: TipoOperacion; icon: string; title: string; sub: string }> = [
  { value: 'comprar', icon: '🏡', title: 'Comprar una propiedad',     sub: 'vivienda, terreno o inmueble comercial' },
  { value: 'rentar',  icon: '🔑', title: 'Rentar una propiedad',      sub: 'vivienda, local, oficina o bodega'       },
  { value: 'invertir',icon: '📈', title: 'Invertir en bienes raíces', sub: 'busco plusvalía o renta'                  },
]

const PROPERTY_OPTIONS: Record<TipoOperacion, Array<{ value: TipoProp; icon: string; title: string; sub: string }>> = {
  comprar: [
    { value: 'casa',         icon: '🏡', title: 'Casa',             sub: 'Residencial con jardín o patio'         },
    { value: 'departamento', icon: '🏢', title: 'Departamento',     sub: 'Unidad en edificio o complejo'          },
    { value: 'terreno',      icon: '🗺️', title: 'Terreno',          sub: 'Lote para construcción o inversión'     },
    { value: 'local',        icon: '🏪', title: 'Local comercial',  sub: 'Espacio para negocio o renta'           },
    { value: 'oficina',      icon: '💼', title: 'Oficina',          sub: 'Espacio de trabajo privado'             },
  ],
  rentar: [
    { value: 'casa',         icon: '🏡', title: 'Casa',         sub: 'Residencial con jardín o patio'    },
    { value: 'departamento', icon: '🏢', title: 'Departamento', sub: 'Unidad en edificio o complejo'     },
    { value: 'local',        icon: '🏪', title: 'Local',        sub: 'Espacio comercial o de negocio'    },
    { value: 'oficina',      icon: '💼', title: 'Oficina',      sub: 'Espacio de trabajo privado'        },
    { value: 'bodega',       icon: '🏭', title: 'Bodega',       sub: 'Almacén o espacio industrial'      },
  ],
  invertir: [
    { value: 'terreno',      icon: '🗺️', title: 'Terreno',         sub: 'Alta plusvalía a futuro'                  },
    { value: 'local',        icon: '🏪', title: 'Local comercial', sub: 'Renta mensual garantizada'                },
    { value: 'departamento', icon: '🏢', title: 'Departamento',    sub: 'Airbnb o renta residencial'               },
    { value: 'oficina',      icon: '💼', title: 'Oficina',         sub: 'Mercado corporativo en crecimiento'       },
  ],
}

const CITIES = [
  { value: 'queretaro',    icon: '🏛️', title: 'Querétaro',          sub: '340+ propiedades disponibles' },
  { value: 'cdmx',         icon: '🌆', title: 'Ciudad de México',   sub: '820+ propiedades disponibles' },
  { value: 'guadalajara',  icon: '🌵', title: 'Guadalajara',        sub: '210+ propiedades disponibles' },
  { value: 'leon',         icon: '🏭', title: 'León / Celaya',      sub: '190+ propiedades disponibles' },
]

const LIFESTYLE_PILLS = [
  { tag: 'mascotas',       icon: '🐾', label: 'Tengo mascotas'   },
  { tag: 'home_office',    icon: '💻', label: 'Trabajo desde casa'},
  { tag: 'escuelas',       icon: '🏫', label: 'Escuelas cerca'   },
  { tag: 'zona_tranquila', icon: '🤫', label: 'Zona tranquila'   },
  { tag: 'vida_social',    icon: '🍕', label: 'Vida social'      },
  { tag: 'plusvalia',      icon: '📈', label: 'Plusvalía'        },
  { tag: 'estacionamiento',icon: '🚗', label: 'Estacionamiento'  },
  { tag: 'areas_verdes',   icon: '🌳', label: 'Áreas verdes'     },
  { tag: 'amenidades',     icon: '🏊', label: 'Amenidades'       },
  { tag: 'seguridad',      icon: '🔐', label: 'Seguridad 24h'    },
  { tag: 'familias',       icon: '👨‍👩‍👧', label: 'Zona familiar'   },
  { tag: 'vista_urbana',   icon: '🌇', label: 'Vista urbana'     },
]

// ─── Pure helpers (exported for testing) ─────────────────────

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

// ─── Sub-components (defined outside to avoid re-creation) ───

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
      <div className="flex-1">
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

interface StatusBarProps { bg?: string }
function StatusBar({ bg = 'white' }: StatusBarProps) {
  return (
    <div
      className="flex justify-between items-center px-5 pt-[14px] pb-[6px] text-[12px] font-semibold tracking-[0.3px] flex-shrink-0"
      style={{ background: bg }}
    >
      <span>9:41</span>
      <div className="flex gap-1 items-center">
        <span>●●●</span><span>📶</span><span>🔋</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

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
    if (step === 5) { onComplete(data); return }
    setStep((s) => (s + 1) as StepNum)
  }

  function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
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
          <h2 className="font-display text-[26px] font-semibold leading-[1.25] text-black mb-1.5">{title}</h2>
          <p className="text-[14px] leading-[1.5]" style={{ color: '#6B6B6B' }}>{subtitle}</p>
        </div>
      </>
    )
  }

  const primaryBtn = (label: string, disabled = false) => (
    <button
      onClick={advance}
      disabled={disabled}
      className="w-full rounded-full py-[15px] text-[15px] font-semibold font-body border-none text-white cursor-pointer transition-all active:scale-[.97] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: '#C2714F' }}
    >
      {label}
    </button>
  )

  // ── Step 1: Tipo de operación ──────────────────────────────
  if (step === 1) return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      <StepHeader
        title="¿Qué estás buscando?"
        subtitle="Esto nos ayuda a personalizar tu experiencia."
      />
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
        {primaryBtn('Continuar', !data.tipoOperacion)}
      </div>
    </div>
  )

  // ── Step 2: Tipo de propiedad ──────────────────────────────
  if (step === 2) {
    const options = data.tipoOperacion ? PROPERTY_OPTIONS[data.tipoOperacion] : []
    return (
      <div className="flex flex-col flex-1 bg-white">
        <StatusBar />
        <StepHeader
          title="¿Qué tipo de propiedad buscas?"
          subtitle="Puedes cambiar esto más adelante."
        />
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
          {primaryBtn('Continuar', !data.tipoPropiedad)}
        </div>
      </div>
    )
  }

  // ── Step 3: Presupuesto ────────────────────────────────────
  if (step === 3) {
    const pct = ((data.presupuestoMax - 500) / 7500) * 100
    return (
      <div className="flex flex-col flex-1 bg-white">
        <StatusBar />
        <StepHeader
          title="¿Cuál es tu presupuesto?"
          subtitle="Solo una referencia. Puedes ajustarlo después."
        />
        <div className="px-6">
          <p className="font-display text-[36px] font-bold text-black mb-1">
            {formatBudget(data.presupuestoMax)}
          </p>
          <p className="text-[13px] mb-6" style={{ color: '#6B6B6B' }}>Presupuesto máximo aproximado</p>
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
          <div className="flex justify-between text-[12px] -mt-2 mb-5" style={{ color: '#6B6B6B' }}>
            <span>$500k</span><span>$4M</span><span>$8M+</span>
          </div>
          <div className="bg-sand rounded-[20px] p-[18px]">
            <p className="text-[12px] mb-2" style={{ color: '#6B6B6B' }}>
              Propiedades disponibles en este rango
            </p>
            <p className="text-[20px] font-bold" style={{ color: '#C2714F' }}>
              {Math.round((data.presupuestoMax / 8000) * 400) + 20} propiedades
            </p>
          </div>
        </div>
        <div className="px-6 pb-8 mt-auto flex flex-col gap-2.5">
          {primaryBtn('Continuar')}
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

  // ── Step 4: Ciudad ─────────────────────────────────────────
  if (step === 4) return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      <StepHeader
        title="¿Dónde quieres vivir?"
        subtitle="Elige una ciudad para empezar."
      />
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
        {primaryBtn('Continuar', !data.ciudad)}
      </div>
    </div>
  )

  // ── Step 5: Estilo de vida (casa/depto only) ───────────────
  return (
    <div className="flex flex-col flex-1 bg-white">
      <StatusBar />
      <StepHeader
        title="¿Cómo es tu estilo de vida?"
        subtitle="Elige todo lo que te describe."
      />
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
        {primaryBtn('Ver mis matches ✦')}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tsc**

```bash
npx tsc --noEmit
```

Expected: no output.

---

## Task 5: Update App.tsx

**Files:**
- Replace: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

```tsx
import { useState } from 'react'
import PhoneShell, { type Screen } from './components/PhoneShell'
import LandingScreen from './screens/LandingScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import './App.css'

function App() {
  const [screen, setScreen] = useState<Screen>('landing')

  return (
    <PhoneShell screen={screen} onNavigate={setScreen}>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('onboarding')}
          onExplore={() => setScreen('feed')}
        />
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={() => setScreen('feed')} />
      )}
      {(screen === 'feed' || screen === 'reels' || screen === 'saved' || screen === 'advisor') && (
        <div className="flex-1 flex items-center justify-center font-body text-[#6B6B6B]">
          <p>Pantalla «{screen}» — próximamente</p>
        </div>
      )}
    </PhoneShell>
  )
}

export default App
```

- [ ] **Step 2: Run tsc**

```bash
npx tsc --noEmit
```

Expected: no output.

---

## Task 6: Unit tests for conditional logic

**Files:**
- Create: `src/__tests__/onboarding.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from 'vitest'
import { formatBudget, calcTotalSteps } from '../screens/OnboardingScreen'

describe('formatBudget', () => {
  it('formats thousands below 1000 as "Xk MXN"', () => {
    expect(formatBudget(500)).toBe('$500k MXN')
    expect(formatBudget(999)).toBe('$999k MXN')
  })

  it('formats whole millions without decimal', () => {
    expect(formatBudget(1000)).toBe('$1M MXN')
    expect(formatBudget(3000)).toBe('$3M MXN')
    expect(formatBudget(8000)).toBe('$8M MXN')
  })

  it('formats fractional millions with one decimal', () => {
    expect(formatBudget(1500)).toBe('$1.5M MXN')
    expect(formatBudget(2500)).toBe('$2.5M MXN')
  })
})

describe('calcTotalSteps', () => {
  it('returns 5 when tipoPropiedad is null (optimistic)', () => {
    expect(calcTotalSteps(null)).toBe(5)
  })

  it('returns 5 for casa', () => {
    expect(calcTotalSteps('casa')).toBe(5)
  })

  it('returns 5 for departamento', () => {
    expect(calcTotalSteps('departamento')).toBe(5)
  })

  it('returns 4 for terreno', () => {
    expect(calcTotalSteps('terreno')).toBe(4)
  })

  it('returns 4 for local', () => {
    expect(calcTotalSteps('local')).toBe(4)
  })

  it('returns 4 for oficina', () => {
    expect(calcTotalSteps('oficina')).toBe(4)
  })

  it('returns 4 for bodega', () => {
    expect(calcTotalSteps('bodega')).toBe(4)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```

Expected:
```
✓ src/__tests__/onboarding.test.ts (9 tests)
Test Files  1 passed (1)
Tests       9 passed (9)
```

---

## Task 7: Final build validation

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: `✓ built in <Nms>` with no errors. CSS output ~10-20 kB gzipped.

- [ ] **Step 3: Commit**

```bash
git add index.html src/App.css src/index.css src/App.tsx \
  src/components/PhoneShell.tsx \
  src/screens/LandingScreen.tsx \
  src/screens/OnboardingScreen.tsx \
  src/__tests__/onboarding.test.ts \
  docs/
git commit -m "feat: mobile shell, landing and 5-step conditional onboarding"
```

---

## Self-Review

**Spec coverage check:**
- ✅ PhoneShell: max-w-390px, AnimatePresence, BottomNav shown post-onboarding
- ✅ StatusBar: inside each screen (not in PhoneShell), `background: inherit`-equivalent
- ✅ LandingScreen: double radial-gradient, stats, two CTAs
- ✅ Step 1 subtexts: "vivienda, terreno o inmueble comercial" / "vivienda, local, oficina o bodega"
- ✅ Step 2 (NEW): conditional property type options per operation
- ✅ Step 3: budget slider with dynamic count
- ✅ Step 4: city selection
- ✅ Step 5: lifestyle pills — only rendered for casa/departamento
- ✅ Conditional skip: after Step 4, if not casa/depto → `onComplete()` directly
- ✅ BottomNav: 4 real navigation items with active state
- ✅ Screen type exported from PhoneShell, imported in App.tsx
- ✅ Pure helpers `formatBudget` + `calcTotalSteps` exported and tested
- ✅ Google Fonts added to index.html
- ✅ Range input thumb styled via global CSS

**Placeholder scan:** None found. All steps have concrete code.

**Type consistency:** `TipoProp` defined once in OnboardingScreen.tsx and used for both `PROPERTY_OPTIONS` keys and `data.tipoPropiedad`. `Screen` exported from PhoneShell and imported as a type in App.tsx.
