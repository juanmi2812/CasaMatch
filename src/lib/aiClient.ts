export interface MetricasVecindario {
  seguridad:       number
  trafico:         number
  vida_social:     number
  tranquilidad:    number
  plusvalia:       number
  servicios_cerca: number
}

export function calcularMetricasSimuladas(ubicacion: string): Promise<MetricasVecindario> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const texto = (ubicacion || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/̀-ͯ/g, '')

      if (texto.includes('zibata') || texto.includes('juriquilla') || texto.includes('campanario')) {
        return resolve({ seguridad: 5, trafico: 3, vida_social: 4, tranquilidad: 5, plusvalia: 5, servicios_cerca: 4 })
      }
      if (texto.includes('centro')) {
        return resolve({ seguridad: 3, trafico: 1, vida_social: 5, tranquilidad: 2, plusvalia: 4, servicios_cerca: 5 })
      }
      if (texto.includes('pueblito') || texto.includes('corregidora')) {
        return resolve({ seguridad: 4, trafico: 3, vida_social: 3, tranquilidad: 4, plusvalia: 4, servicios_cerca: 4 })
      }
      resolve({ seguridad: 4, trafico: 3, vida_social: 3, tranquilidad: 4, plusvalia: 3, servicios_cerca: 4 })
    }, 1500)
  })
}
