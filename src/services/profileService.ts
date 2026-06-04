import { supabase } from '../lib/supabaseClient'
import type { Propiedad, CitaConDetalles } from '../types/database'
import { mapPropiedadToMock } from './propertyService'
import type { PropiedadMock } from './mockData'

// ─── Matches ─────────────────────────────────────────────────────────────────

export interface MatchItem {
  swipeId:  string
  property: PropiedadMock
  savedAt:  string
}

export async function getMatches(): Promise<MatchItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('interacciones_swipes')
    .select('id, creado_en, propiedades(*)')
    .in('tipo_interaccion', ['like', 'save'])
    .order('creado_en', { ascending: false })

  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).flatMap((row: any) => {
    const prop = row.propiedades
    if (!prop) return []
    return [{
      swipeId:  row.id as string,
      property: mapPropiedadToMock(prop as Propiedad),
      savedAt:  row.creado_en as string,
    }]
  })
}

export async function removeMatch(swipeId: string): Promise<void> {
  const { error } = await supabase
    .from('interacciones_swipes')
    .delete()
    .eq('id', swipeId)
  if (error) throw error
}

// ─── Preferencias ────────────────────────────────────────────────────────────

export interface PreferenciasForm {
  ciudad:          string
  tipo_propiedad:  string
  presupuesto_min: number | null
  presupuesto_max: number | null
}

export async function savePreferencias(userId: string, form: PreferenciasForm): Promise<void> {
  const { error } = await supabase
    .from('preferencias_onboarding')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({
      usuario_id:      userId,
      tipo_operacion:  'comprar',
      ciudad:          form.ciudad.toLowerCase() || 'mexico',
      tipo_propiedad:  form.tipo_propiedad || null,
      presupuesto_min: form.presupuesto_min || null,
      presupuesto_max: form.presupuesto_max || null,
    } as any, { onConflict: 'usuario_id' })
  if (error) throw error
}

// ─── Citas ───────────────────────────────────────────────────────────────────

export async function getCitas(): Promise<CitaConDetalles[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('citas')
    .select(`
      *,
      propiedad:propiedades(id,titulo,imagenes,ubicacion,precio),
      asesor:perfiles!asesor_id(id,nombre,telefono,avatar_url)
    `)
    .order('fecha_cita', { ascending: true })

  if (error) throw error
  return (data ?? []) as CitaConDetalles[]
}
