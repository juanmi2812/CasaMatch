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
