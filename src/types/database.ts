// CasaMatch — Tipos TypeScript del esquema de Supabase
// Sincronizar con supabase/migrations/schema.sql
// Para regenerar automáticamente: npx supabase gen types typescript --local

// =============================================================
// ENUMS
// =============================================================

export type RolUsuario      = 'usuario' | 'asesor' | 'admin' | 'admin_agencia'
export type TipoOperacion   = 'comprar' | 'rentar' | 'invertir'
export type TipoInteraccion = 'like' | 'nope' | 'save'
export type TipoPropiedad   = 'casa' | 'departamento' | 'terreno' | 'local' | 'oficina'

export type TagLifestyle =
  | 'mascotas'
  | 'home_office'
  | 'zona_tranquila'
  | 'vida_social'
  | 'escuelas'
  | 'plusvalia'
  | 'familias'
  | 'lujo'
  | 'minimalista'

// =============================================================
// JSONB: características de estilo de vida por propiedad
// =============================================================

export interface CaracteristicasLifestyle {
  seguridad:          number   // 0–5
  trafico:            number   // 0–5 (5 = sin tráfico)
  vida_social:        number   // 0–5
  tranquilidad:       number   // 0–5
  plusvalia:          number   // 0–5
  servicios_cercanos: number   // 0–5
  pet_friendly:       boolean
  familias:           boolean
  home_office:        boolean
}

// =============================================================
// ROW TYPES — lo que devuelve un SELECT
// =============================================================

export interface Perfil {
  id:                 string
  nombre:             string
  telefono:           string | null
  avatar_url:         string | null
  agencia:            string | null
  agencia_id:         string | null
  rol:                RolUsuario
  biografia?:         string | null
  instagram_url?:     string | null
  tiktok_url?:        string | null
  facebook_url?:      string | null
  anios_experiencia?: number | null
  creado_en:          string
  actualizado_en:     string
}

export interface PreferenciaOnboarding {
  id:              string
  usuario_id:      string
  tipo_operacion:  TipoOperacion
  presupuesto_min: number | null
  presupuesto_max: number | null
  ciudad:          string
  tipo_propiedad:  string | null
  zonas:           string[] | null
  tags_lifestyle:  TagLifestyle[] | null
  recamaras_min:   number | null
  creado_en:       string
  actualizado_en:  string
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada'

export interface Cita {
  id:             string
  cliente_id:     string
  asesor_id:      string
  propiedad_id:   string
  fecha_cita:     string
  estado:         EstadoCita
  creado_en:      string
  actualizado_en: string
}

export type CitaInsert =
  Pick<Cita, 'cliente_id' | 'asesor_id' | 'propiedad_id' | 'fecha_cita'> &
  Partial<Pick<Cita, 'estado'>>

export type CitaUpdate = Partial<Pick<Cita, 'estado' | 'fecha_cita'>>

export interface CitaConDetalles extends Cita {
  propiedad: Pick<Propiedad, 'id' | 'titulo' | 'imagenes' | 'ubicacion' | 'precio'>
  asesor:    Pick<Perfil,    'id' | 'nombre' | 'telefono' | 'avatar_url'>
}

export interface Propiedad {
  id:                        string
  asesor_id:                 string
  titulo:                    string
  descripcion:               string | null
  tipo:                      TipoPropiedad
  precio:                    number
  ciudad:                    string
  ubicacion:                 string
  recamaras:                 number | null
  banos:                     number | null
  estacionamientos:          number | null
  m2:                        number | null
  caracteristicas_lifestyle: CaracteristicasLifestyle
  caracteristicas?: {
    seguridad?:          number
    trafico?:            number
    vida_social?:        number
    tranquilidad?:       number
    plusvalia?:          number
    servicios_cerca?:    number
    servicios_cercanos?: number
    pet_friendly?:       boolean
    familias?:           boolean
    home_office?:        boolean
  }
  url_video:                 string | null
  imagenes:                  string[]
  activa:                    boolean
  destacada:                 boolean
  creado_en:                 string
  actualizado_en:            string
}

export interface Agencia {
  id:             string
  nombre:         string
  plan:           'free' | 'premium'
  creado_en:      string
  actualizado_en: string
}

export interface InteraccionSwipe {
  id:               string
  usuario_id:       string
  propiedad_id:     string
  tipo_interaccion: TipoInteraccion
  estatus:          string | null
  creado_en:        string
}

// =============================================================
// INSERT TYPES — lo que se envía al crear un registro
// =============================================================

export type PerfilInsert = Pick<Perfil, 'id' | 'nombre'> &
  Partial<Pick<Perfil, 'telefono' | 'avatar_url' | 'agencia' | 'agencia_id' | 'rol'>>

export type PreferenciaOnboardingInsert =
  Pick<PreferenciaOnboarding, 'usuario_id' | 'tipo_operacion' | 'ciudad'> &
  Partial<Omit<PreferenciaOnboarding, 'id' | 'usuario_id' | 'tipo_operacion' | 'ciudad' | 'creado_en' | 'actualizado_en'>>

export type PropiedadInsert =
  Pick<Propiedad, 'asesor_id' | 'titulo' | 'tipo' | 'precio' | 'ciudad' | 'ubicacion'> &
  Partial<Omit<Propiedad, 'id' | 'asesor_id' | 'titulo' | 'tipo' | 'precio' | 'ciudad' | 'ubicacion' | 'creado_en' | 'actualizado_en'>>

export type InteraccionSwipeInsert =
  Pick<InteraccionSwipe, 'usuario_id' | 'propiedad_id' | 'tipo_interaccion'> &
  Partial<Pick<InteraccionSwipe, 'estatus'>>

// =============================================================
// UPDATE TYPES — campos mutables; claves primarias y FKs inmutables
// =============================================================

export type PerfilUpdate =
  Partial<Pick<Perfil, 'nombre' | 'telefono' | 'avatar_url' | 'agencia' | 'agencia_id' | 'rol' | 'biografia' | 'instagram_url' | 'tiktok_url' | 'facebook_url' | 'anios_experiencia'>>

export type PreferenciaOnboardingUpdate =
  Partial<Omit<PreferenciaOnboarding, 'id' | 'usuario_id' | 'creado_en' | 'actualizado_en'>>

export type PropiedadUpdate =
  Partial<Omit<Propiedad, 'id' | 'asesor_id' | 'creado_en' | 'actualizado_en'>>

export type InteraccionSwipeUpdate =
  Partial<Pick<InteraccionSwipe, 'tipo_interaccion' | 'estatus'>>

// =============================================================
// JOINED TYPES — para queries con relaciones
// =============================================================

export interface PropiedadConAsesor extends Propiedad {
  asesor: Pick<Perfil, 'id' | 'nombre' | 'telefono' | 'avatar_url'>
}

export interface SwipeConPropiedad extends InteraccionSwipe {
  propiedad: Propiedad
}

export interface LeadAsesor {
  usuario:          Pick<Perfil, 'id' | 'nombre' | 'telefono' | 'avatar_url'>
  preferencias:     PreferenciaOnboarding | null
  tipo_interaccion: TipoInteraccion
  propiedad_id:     string
  creado_en:        string
}

// =============================================================
// VIEW ROW TYPES
// =============================================================

export interface KpisAsesor {
  asesor_id:         string
  total_propiedades: number
  total_likes:       number
  total_saves:       number
  total_leads:       number
}

export interface KpisGlobales {
  propiedades_activas: number
  total_asesores:      number
  total_usuarios:      number
  total_likes:         number
  total_saves:         number
  total_leads:         number
}

// =============================================================
// DATABASE — mapa de tipos compatible con supabase-js v2
// Uso: createClient<Database>(url, key)
// =============================================================

export interface Database {
  public: {
    Tables: {
      agencias: {
        Row:    Agencia
        Insert: Omit<Agencia, 'id' | 'creado_en' | 'actualizado_en'> & Partial<Pick<Agencia, 'id' | 'plan'>>
        Update: Partial<Omit<Agencia, 'id' | 'creado_en' | 'actualizado_en'>>
        Relationships: []
      }
      perfiles: {
        Row:    Perfil
        Insert: PerfilInsert
        Update: PerfilUpdate
        Relationships: []
      }
      preferencias_onboarding: {
        Row:    PreferenciaOnboarding
        Insert: PreferenciaOnboardingInsert
        Update: PreferenciaOnboardingUpdate
        Relationships: []
      }
      propiedades: {
        Row:    Propiedad
        Insert: PropiedadInsert
        Update: PropiedadUpdate
        Relationships: []
      }
      interacciones_swipes: {
        Row:    InteraccionSwipe
        Insert: InteraccionSwipeInsert
        Update: InteraccionSwipeUpdate
        Relationships: []
      }
      citas: {
        Row:    Cita
        Insert: CitaInsert
        Update: CitaUpdate
        Relationships: []
      }
    }
    Views: {
      kpis_asesores: {
        Row:          KpisAsesor
        Insert:       { [_ in never]: never }
        Update:       { [_ in never]: never }
        Relationships: []
      }
      kpis_globales: {
        Row:          KpisGlobales
        Insert:       { [_ in never]: never }
        Update:       { [_ in never]: never }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rol_usuario:      RolUsuario
      tipo_operacion:   TipoOperacion
      tipo_interaccion: TipoInteraccion
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
