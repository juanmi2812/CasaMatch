import { supabase } from '../lib/supabaseClient'
import type { Propiedad, TipoInteraccion, TipoPropiedad } from '../types/database'
import type { PropiedadMock } from './mockData'

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

// ─── Map DB row → PropiedadMock ───────────────────────────────────────────────

export function mapPropiedadToMock(p: Propiedad): PropiedadMock {
  const c    = p.caracteristicas_lifestyle
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
    id:           p.id,
    asesorId:     p.asesor_id,
    titulo:       p.titulo,
    ubicacion:    p.ubicacion,
    ciudad:       p.ciudad.toLowerCase(),
    precio:       Number(p.precio),
    tipo:         p.tipo,
    recamaras:    p.recamaras    ?? 0,
    banos:        Number(p.banos ?? 0),
    m2:           Number(p.m2   ?? 0),
    compatibilidad,
    gradientFrom,
    gradientTo,
    emoji:        TIPO_EMOJIS[p.tipo] ?? '🏠',
    tags,
    caracteristicas: c,
    imagenes:     p.imagenes,
    urlVideo:     p.url_video || undefined,
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export interface PropertyFilters {
  ciudad?: string
  tipos?:  string[]
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Propiedad[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('propiedades')
    .select('*')
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('interacciones_swipes')
    .upsert({
      usuario_id:       session.user.id,
      propiedad_id:     propertyId,
      tipo_interaccion: action,
    }, { onConflict: 'usuario_id,propiedad_id' })

  if (error) console.error('[recordSwipe]', error.message)
}
