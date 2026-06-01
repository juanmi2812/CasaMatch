import { supabase } from '../lib/supabaseClient'
import type { Propiedad, TipoInteraccion } from '../types/database'

export async function getProperties(): Promise<Propiedad[]> {
  const { data, error } = await supabase
    .from('propiedades')
    .select('*')
    .eq('activa', true)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function recordSwipe(
  propertyId: string,
  action: TipoInteraccion,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const { error } = await supabase
    .from('interacciones_swipes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      usuario_id:       session.user.id,
      propiedad_id:     propertyId,
      tipo_interaccion: action,
    } as any)

  if (error) console.error('[recordSwipe]', error.message)
}
