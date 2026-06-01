import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  initialPrice?: number
}

function calcMonthly(principal: number, annualRatePct: number, years: number): number {
  if (annualRatePct === 0 || years === 0) return principal / Math.max(years * 12, 1)
  const r = annualRatePct / 100 / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function fmtPeso(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

function fmtSliderPrice(n: number): string {
  const m = n / 1_000_000
  if (m >= 1) return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  return `$${(n / 1_000).toFixed(0)}k`
}

function track(pct: number): string {
  return `linear-gradient(to right, #C2714F 0%, #C2714F ${pct}%, rgba(194,113,79,0.16) ${pct}%)`
}

function rangePct(val: number, min: number, max: number): number {
  return ((val - min) / (max - min)) * 100
}

interface FieldProps {
  label:    string
  value:    string
  children: ReactNode
}

function SliderField({ label, value, children }: FieldProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] font-medium" style={{ color: '#6B6B6B' }}>{label}</span>
        <span className="text-[13px] font-bold" style={{ color: '#C2714F' }}>{value}</span>
      </div>
      {children}
    </div>
  )
}

export default function MortgageSimulator({ initialPrice = 3_000_000 }: Props) {
  const clampedInit = Math.min(Math.max(initialPrice, 1_000_000), 15_000_000)

  const [precio,   setPrecio]   = useState(clampedInit)
  const [enganPct, setEnganPct] = useState(20)
  const [plazo,    setPlazo]    = useState(20)
  const [tasa,     setTasa]     = useState(10.5)

  const enganche   = precio * (enganPct / 100)
  const credito    = precio - enganche
  const mensual    = calcMonthly(credito, tasa, plazo)
  const totalPagar = mensual * plazo * 12
  const intereses  = totalPagar - credito

  return (
    <div
      className="mx-5 rounded-[24px] p-5"
      style={{
        background: '#F5EFE6',
        border:     '1.5px solid rgba(194,113,79,0.15)',
      }}
    >
      <h2 className="font-display text-[20px] font-bold mb-0.5" style={{ color: '#1A1A1A' }}>
        Simulador de crédito
      </h2>
      <p className="text-[12px] mb-5" style={{ color: '#6B6B6B' }}>
        Estimación orientativa · Consulta con tu asesor financiero
      </p>

      {/* Result card */}
      <div
        className="rounded-[20px] p-4 mb-5"
        style={{ background: 'linear-gradient(135deg, #C2714F 0%, #7A3E28 100%)' }}
      >
        <p
          className="text-[11px] font-medium mb-1"
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          Mensualidad estimada
        </p>
        <p className="font-display text-[34px] font-bold text-white leading-none mb-3">
          {fmtPeso(mensual)}
          <span
            className="font-body text-[13px] font-normal ml-1"
            style={{ opacity: 0.70 }}
          >
            / mes
          </span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total a pagar', val: fmtPeso(totalPagar)      },
            { label: 'Intereses',     val: fmtPeso(intereses)        },
            { label: 'Crédito',       val: fmtSliderPrice(credito)   },
          ].map(({ label, val }, i) => (
            <div
              key={label}
              className="pl-3"
              style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,0.22)' } : {}}
            >
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {label}
              </p>
              <p className="text-[13px] font-bold text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-5">
        <SliderField
          label="Precio de la propiedad"
          value={fmtSliderPrice(precio)}
        >
          <input
            type="range"
            min={1_000_000} max={15_000_000} step={100_000}
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className="w-full"
            style={{ background: track(rangePct(precio, 1_000_000, 15_000_000)) }}
          />
        </SliderField>

        <SliderField
          label="Enganche"
          value={`${enganPct}%  ·  ${fmtSliderPrice(enganche)}`}
        >
          <input
            type="range"
            min={10} max={50} step={5}
            value={enganPct}
            onChange={(e) => setEnganPct(Number(e.target.value))}
            className="w-full"
            style={{ background: track(rangePct(enganPct, 10, 50)) }}
          />
        </SliderField>

        <SliderField label="Plazo" value={`${plazo} años`}>
          <input
            type="range"
            min={5} max={30} step={5}
            value={plazo}
            onChange={(e) => setPlazo(Number(e.target.value))}
            className="w-full"
            style={{ background: track(rangePct(plazo, 5, 30)) }}
          />
        </SliderField>

        <SliderField label="Tasa anual" value={`${tasa.toFixed(1)}%`}>
          <input
            type="range"
            min={5} max={20} step={0.5}
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
            className="w-full"
            style={{ background: track(rangePct(tasa, 5, 20)) }}
          />
        </SliderField>
      </div>
    </div>
  )
}
