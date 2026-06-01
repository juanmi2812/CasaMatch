# CasaMatch — Navigation & Onboarding Design Spec
Date: 2026-06-01

## Scope
Mobile-first navigation shell with landing screen and multi-step onboarding with conditional logic.

---

## Architecture

```
App.tsx  (Screen state owner)
└── PhoneShell  (layout, BottomNav)
    ├── LandingScreen
    ├── OnboardingScreen
    └── [stub screens: feed, reels, saved, advisor]
```

**State management:** `useState<Screen>` in `App.tsx`. No router. No external state library.

```typescript
type Screen = 'landing' | 'onboarding' | 'feed' | 'reels' | 'saved' | 'advisor'
```

---

## Component: PhoneShell

**File:** `src/components/PhoneShell.tsx`

**Responsibilities:**
- Outer viewport: full-screen, `background: #F0EBE3`, flex-center
- Phone container: `max-width: 390px`, `background: var(--color-sand)`, `overflow: hidden`
- Screen area: `position: relative; flex: 1` — children rendered as `position: absolute; inset: 0`
- Framer Motion `AnimatePresence` wraps screen slot → `y: 16→0, opacity: 0→1, duration: 350ms, ease: [0.4,0,0.2,1]`
- BottomNav: rendered only when `screen` ∈ `['feed','reels','saved','advisor']`

**BottomNav items:**
| Icon | Label | Screen |
|------|-------|--------|
| ⊞ | Explorar | feed |
| ▷ | Reels | reels |
| 🤍 | Guardados | saved |
| 👤 | Asesor | advisor |

Active state: icon scales 1.1×, label color → `var(--color-terra)`.

**No status bar in PhoneShell** — each screen manages its own top area.

---

## Component: LandingScreen

**File:** `src/screens/LandingScreen.tsx`

**Props:** `{ onStart: () => void; onExplore: () => void }`

**Layout:** Full-screen dark (`#1A1A1A`), double radial-gradient background (terra top-right 45%, olive bottom-left 30%), `padding: 60px 28px 48px`, flex-col space-between.

**Sections (top to bottom):**
1. Logo: `Casa` + `Match` (terra-light)
2. Hero: tag pill → H1 con `<em>swipe.</em>` en terra-light → subtítulo
3. Stats row: 2.4k / 94% / 320+ con dividers verticales semitransparentes
4. CTA: btn-primary "Encontrar mi casa ideal" → `onStart`; btn-secondary "Solo explorar →" → `onExplore`

---

## Component: OnboardingScreen

**File:** `src/screens/OnboardingScreen.tsx`

**Props:** `{ onComplete: (data: OnboardingData) => void }`

**Internal state:**
```typescript
interface OnboardingData {
  tipoOperacion: 'comprar' | 'rentar' | 'invertir' | null
  tipoPropiedad: string | null
  presupuestoMax: number          // default 2500 (= $2.5M MXN)
  ciudad: string | null
  tagsLifestyle: string[]
}
```

### Step flow

```
Step 1: Tipo de operación
  ↓
Step 2: Tipo de propiedad  (options depend on step 1 selection)
  ↓
Step 3: Presupuesto  (slider, skip allowed)
  ↓
Step 4: Ciudad
  ↓ (only if tipoPropiedad ∈ ['casa','departamento'])
Step 5: Estilo de vida  → onComplete()
  ↓ (if tipoPropiedad ∉ ['casa','departamento'])
  onComplete() directly after step 4
```

**Progress bar:** `width = (step / totalSteps) * 100%`
- `totalSteps` is known after step 2: 5 if casa/depto, 4 otherwise.
- Before step 2 completes, show 5 (optimistic).

### Step 1 — Tipo de operación
Options (radio cards):
- 🏡 **Comprar una propiedad** / "vivienda, terreno o inmueble comercial"
- 🔑 **Rentar una propiedad** / "vivienda, local, oficina o bodega"
- 📈 **Invertir en bienes raíces** / "busco plusvalía o renta"

### Step 2 — Tipo de propiedad (conditional)

**If comprar:**
Casa · Departamento · Terreno · Local comercial · Oficina

**If rentar:**
Casa · Departamento · Local · Oficina · Bodega

**If invertir:**
Terreno · Local comercial · Departamento · Oficina

### Step 3 — Presupuesto
- Slider: min 500, max 8000, step 100 (units = miles MXN)
- Display: `$2,500,000 MXN` formatted
- Dynamic count: "148 propiedades" badge (static mock)
- "Saltar este paso" secondary button

### Step 4 — Ciudad
Radio cards: Querétaro · CDMX · Guadalajara · León/Celaya

### Step 5 — Estilo de vida (conditional)
Multi-select pills: mascotas · home_office · escuelas · zona_tranquila · vida_social · plusvalía · estacionamiento · áreas verdes · amenidades · seguridad 24h · zona familiar · vista urbana

CTA: "Ver mis matches ✦"

---

## App.tsx changes

- Remove all Vite boilerplate
- Import: `PhoneShell`, `LandingScreen`, `OnboardingScreen`
- State: `const [screen, setScreen] = useState<Screen>('landing')`
- Render: switch/ternary over screen value
- Stub screens (feed, reels, saved, advisor): placeholder div

---

## Other changes

- `index.html`: add Google Fonts link (Playfair Display + DM Sans)
- `src/App.css`: delete content (all styles via Tailwind)
- `src/index.css`: already configured with Tailwind + tokens
