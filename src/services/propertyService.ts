import { supabase } from '../lib/supabaseClient'
import type { CaracteristicasLifestyle, Propiedad, TipoInteraccion, TipoPropiedad } from '../types/database'

// ─── Gradient + emoji fallbacks per property type ────────────────────────────

const TIPO_GRADIENTS: Record<TipoPropiedad, [string, string]> = {
  casa:         ['#C2714F', '#7A3E28'],
  departamento: ['#5C6E4A', '#2F3D24'],
  terreno:      ['#8B6E5A', '#4A3328'],
  local:        ['#4A6080', '#1F3248'],
  oficina:      ['#2C2C3E', '#0F0F1A'],
}

const TIPO_EMOJIS: Record<TipoPropiedad, string> = {
  casa:         '🏡',
  departamento: '🏙️',
  terreno:      '🌿',
  local:        '🏪',
  oficina:      '🏢',
}

export interface PropiedadConCompatibilidad extends Propiedad {
  compatibilidad:  number
  gradientFrom:    string
  gradientTo:      string
  emoji:           string
  tags:            string[]
  caracteristicas: CaracteristicasLifestyle
}

// ─── Map DB row → PropiedadConCompatibilidad ───────────────────────────────────

export function enriquecerPropiedad(p: Propiedad): PropiedadConCompatibilidad {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cL = (p.caracteristicas_lifestyle as Record<string, any> | null | undefined) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cA = (p.caracteristicas           as Record<string, any> | null | undefined) ?? {}

  const pick = (keyL: string, keyA?: string, fallback = 3): number => {
    const fromA = cA[keyA ?? keyL]
    const fromL = cL[keyL]
    if (fromA != null && fromA > 0) return Number(fromA)
    if (fromL != null && fromL > 0) return Number(fromL)
    return fallback
  }

  const c: CaracteristicasLifestyle = {
    seguridad:          pick('seguridad'),
    trafico:            pick('trafico'),
    vida_social:        pick('vida_social'),
    tranquilidad:       pick('tranquilidad'),
    plusvalia:          pick('plusvalia'),
    servicios_cercanos: pick('servicios_cercanos', 'servicios_cerca'),
    pet_friendly:       Boolean(cA.pet_friendly ?? cL.pet_friendly ?? false),
    familias:           Boolean(cA.familias      ?? cL.familias      ?? false),
    home_office:        Boolean(cA.home_office   ?? cL.home_office   ?? false),
  }

  const nums = [c.seguridad, c.trafico, c.vida_social, c.tranquilidad, c.plusvalia, c.servicios_cercanos]
  const compatibilidad = Math.round((nums.reduce((a, b) => a + b, 0) / (nums.length * 5)) * 100)

  const [gradientFrom, gradientTo] = TIPO_GRADIENTS[p.tipo] ?? ['#C2714F', '#7A3E28']

  const tags: string[] = []
  if (c.pet_friendly)    tags.push('Pet friendly')
  if (c.home_office)     tags.push('Home office')
  if (c.familias)        tags.push('Zona familiar')
  if (c.seguridad  >= 4) tags.push('Alta seguridad')
  if (c.plusvalia  >= 4) tags.push('Alta plusvalía')
  if (c.vida_social >= 4) tags.push('Vida social')

  return {
    ...p,
    compatibilidad,
    gradientFrom,
    gradientTo,
    emoji:        TIPO_EMOJIS[p.tipo] ?? '🏠',
    tags,
    caracteristicas: c,
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export interface PropertyFilters {
  ciudad?: string
  tipos?:  string[]
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Propiedad[]> {
  let q = supabase
    .from('propiedades')
    .select('id, asesor_id, titulo, descripcion, tipo, precio, ciudad, ubicacion, recamaras, banos, estacionamientos, m2, caracteristicas_lifestyle, caracteristicas, url_video, imagenes, activa, destacada, creado_en, actualizado_en')
    .eq('activa', true)
    .order('creado_en', { ascending: false })

  if (filters.ciudad) {
    q = q.ilike('ciudad', `%${filters.ciudad.toLowerCase()}%`)
  }
  if (filters.tipos?.length === 1) {
    q = q.eq('tipo', filters.tipos[0])
  } else if (filters.tipos && filters.tipos.length > 1) {
    q = q.in('tipo', filters.tipos)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Propiedad[]
}

export async function recordSwipe(
  propertyId: string,
  action: TipoInteraccion,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const { error } = await (supabase as any)
    .from('interacciones_swipes')
    .upsert({
      usuario_id:       session.user.id,
      propiedad_id:     propertyId,
      tipo_interaccion: action,
      estatus:          'nuevo',
    }, { onConflict: 'usuario_id,propiedad_id' })

  if (error) console.error('[recordSwipe]', error.message)
}

// ─── Storage cleanup helpers ───────────────────────────────────────────────────

export async function deleteStorageFiles(paths: string[], bucket = 'propiedades'): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    console.error(`[deleteStorageFiles] Error deleting files from ${bucket}:`, error.message)
  }
}

export function extractPathFromUrl(url: string, bucket = 'propiedades'): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = url.indexOf(marker)
    if (index !== -1) {
      return url.slice(index + marker.length)
    }
    return null
  } catch {
    return null
  }
}

// ─── Image optimization helper ───────────────────────────────────────────────

export async function optimizeImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob | File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        try {
          ctx.filter = 'contrast(1.10) saturate(1.15)'
        } catch (e) {
          console.warn('[optimizeImage] Canvas filters not supported', e)
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            resolve(blob ?? file)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}
