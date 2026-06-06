export interface MetricasVecindario {
  seguridad:       number
  trafico:         number
  vida_social:     number
  tranquilidad:    number
  plusvalia:       number
  servicios_cerca: number
}

const DICTIONARY: { keywords: string[]; metricas: MetricasVecindario }[] = [
  {
    keywords: ['juriquilla', 'zibata', 'campanario'],
    metricas: { seguridad: 5, trafico: 3, vida_social: 4, tranquilidad: 5, plusvalia: 5, servicios_cerca: 4 },
  },
  {
    keywords: ['centro'],
    metricas: { seguridad: 3, trafico: 1, vida_social: 5, tranquilidad: 2, plusvalia: 4, servicios_cerca: 5 },
  },
  {
    keywords: ['pueblito', 'corregidora'],
    metricas: { seguridad: 4, trafico: 3, vida_social: 3, tranquilidad: 4, plusvalia: 4, servicios_cerca: 4 },
  },
]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function calcularMetricasSimuladas(ubicacion: string): Promise<MetricasVecindario> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = ubicacion.toLowerCase()
      const match = DICTIONARY.find((entry) => entry.keywords.some((kw) => q.includes(kw)))
      if (match) {
        resolve(match.metricas)
      } else {
        resolve({
          seguridad:       randomBetween(3, 5),
          trafico:         randomBetween(3, 5),
          vida_social:     randomBetween(3, 5),
          tranquilidad:    randomBetween(3, 5),
          plusvalia:       randomBetween(3, 5),
          servicios_cerca: randomBetween(3, 5),
        })
      }
    }, 1500)
  })
}
