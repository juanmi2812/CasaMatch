import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { KpisGlobales } from '../types/database'

interface AsesorRow {
  id:         string
  nombre:     string
  agencia:    string | null
  telefono:   string | null
  avatar_url: string | null
}

interface UsuarioRow {
  id:         string
  nombre:     string
  creado_en:  string
}

interface PropiedadRow {
  id:        string
  titulo:    string
  precio:    number
  asesor_id: string | null
  ciudad:    string
  tipo:      string
  activa:    boolean
}

type Vista = 'resumen' | 'propiedades' | 'asesores' | 'usuarios'

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${(n / 1_000).toFixed(0)}k`
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── KPI card — clickable ─────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, loading, active, onClick,
}: {
  icon: string; label: string; value: number; loading: boolean
  active?: boolean; onClick?: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClick}
      className="rounded-[20px] p-4 text-left w-full border-none cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{
        background: active
          ? 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)'
          : 'white',
        boxShadow: active
          ? '0 8px 24px rgba(194,113,79,0.30)'
          : '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <span className="text-[22px] block mb-2">{icon}</span>
      <p
        className="font-display text-[26px] font-bold leading-none mb-1"
        style={{ color: active ? 'white' : '#1A1A1A' }}
      >
        {loading ? '—' : value.toLocaleString()}
      </p>
      <p className="text-[12px]" style={{ color: active ? 'rgba(255,255,255,0.78)' : '#9B9B9B' }}>
        {label}
      </p>
      {onClick && (
        <p
          className="text-[10px] font-semibold mt-2 uppercase tracking-wide"
          style={{ color: active ? 'rgba(255,255,255,0.65)' : '#C2714F' }}
        >
          {active ? 'Viendo detalle ↓' : 'Ver detalle →'}
        </p>
      )}
    </motion.button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { session, signOut } = useAuth()

  const [kpis,              setKpis]              = useState<KpisGlobales | null>(null)
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState<string | null>(null)
  const [vistaActiva,       setVistaActiva]       = useState<Vista>('resumen')
  const [listaAsesores,     setListaAsesores]     = useState<AsesorRow[]>([])
  const [listaUsuarios,     setListaUsuarios]     = useState<UsuarioRow[]>([])
  const [listaPropiedades,  setListaPropiedades]  = useState<PropiedadRow[]>([])
  const [loadingDetalle,    setLoadingDetalle]    = useState(false)

  useEffect(() => {
    if (!session?.user) { setLoading(false); return }
    supabase
      .from('kpis_globales')
      .select('*')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) setKpis(data as KpisGlobales)
        setLoading(false)
      })
  }, [session])

  async function handleDrillDown(vista: Vista) {
    if (vistaActiva === vista) { setVistaActiva('resumen'); return }
    setVistaActiva(vista)
    setLoadingDetalle(true)

    if (vista === 'asesores' && listaAsesores.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('perfiles')
        .select('id, nombre, agencia, telefono, avatar_url')
        .eq('rol', 'asesor')
        .order('nombre')
      if (data) setListaAsesores(data as AsesorRow[])
    }

    if (vista === 'usuarios' && listaUsuarios.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('perfiles')
        .select('id, nombre, creado_en')
        .eq('rol', 'usuario')
        .order('creado_en', { ascending: false })
        .limit(50)
      if (data) setListaUsuarios(data as UsuarioRow[])
    }

    if (vista === 'propiedades' && listaPropiedades.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('propiedades')
        .select('id, titulo, precio, asesor_id, ciudad, tipo, activa')
        .order('creado_en', { ascending: false })
        .limit(50)
      if (data) setListaPropiedades(data as PropiedadRow[])
    }

    setLoadingDetalle(false)
  }

  const TIPO_EMOJI: Record<string, string> = {
    casa: '🏡', departamento: '🏙️', terreno: '🌿', local: '🏪', oficina: '🏢',
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-10" style={{ background: '#F5EFE6' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="font-display text-[22px] font-bold flex-1" style={{ color: '#1A1A1A' }}>
            Panel de Control
          </h1>
          <div
            className="px-2 py-[3px] rounded-full text-[10px] font-bold text-white mr-2"
            style={{ background: '#1A1A1A' }}
          >
            Admin
          </div>
          <button
            onClick={() => signOut()}
            className="text-[12px] px-3 py-1.5 rounded-full border-none cursor-pointer transition-all active:scale-[.95]"
            style={{ background: 'rgba(194,113,79,0.12)', color: '#C2714F' }}
          >
            Cerrar sesión
          </button>
        </div>
        <p className="text-[13px]" style={{ color: '#9B9B9B' }}>
          {vistaActiva === 'resumen' ? 'Métricas globales — kpis_globales' : 'Vista de detalle — haz clic en una tarjeta para volver'}
        </p>
      </div>

      {error && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-[14px]" style={{ background: 'rgba(220,38,38,0.08)' }}>
          <p className="text-[12px]" style={{ color: '#DC2626' }}>
            Sin acceso a kpis_globales. Verifica que tu JWT incluya app_metadata.rol = "admin".
          </p>
          <p className="text-[11px] mt-1" style={{ color: '#DC2626', opacity: 0.7 }}>{error}</p>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B9B9B' }}>
          Plataforma global
        </p>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          <KpiCard
            icon="🏠" label="Propiedades activas"
            value={kpis?.propiedades_activas ?? 0} loading={loading}
            active={vistaActiva === 'propiedades'}
            onClick={() => handleDrillDown('propiedades')}
          />
          <KpiCard
            icon="🧑‍💼" label="Asesores"
            value={kpis?.total_asesores ?? 0} loading={loading}
            active={vistaActiva === 'asesores'}
            onClick={() => handleDrillDown('asesores')}
          />
          <KpiCard
            icon="👥" label="Usuarios"
            value={kpis?.total_usuarios ?? 0} loading={loading}
            active={vistaActiva === 'usuarios'}
            onClick={() => handleDrillDown('usuarios')}
          />
          <KpiCard
            icon="📩" label="Leads únicos"
            value={kpis?.total_leads ?? 0} loading={loading}
          />
        </div>
      </div>

      {/* ── Engagement ───────────────────────────────────────────── */}
      {vistaActiva === 'resumen' && (
        <div className="px-4 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B9B9B' }}>
            Engagement total
          </p>
          <div
            className="rounded-[20px] p-4"
            style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {[
              { label: 'Total Likes',     value: kpis?.total_likes ?? 0, icon: '♥',  color: '#C2714F' },
              { label: 'Total Guardados', value: kpis?.total_saves ?? 0, icon: '🔖', color: '#6B7C5C' },
            ].map((row, i) => {
              const max = Math.max((kpis?.total_likes ?? 0), (kpis?.total_saves ?? 0), 1)
              return (
                <div key={row.label} className="flex items-center gap-3" style={{ marginBottom: i === 0 ? 16 : 0 }}>
                  <span className="text-[18px] w-6 text-center flex-shrink-0">{row.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: '#1A1A1A' }}>{row.label}</span>
                      <span className="text-[12px] font-bold" style={{ color: row.color }}>
                        {loading ? '—' : row.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EAE1' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: loading ? '0%' : `${(row.value / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: row.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detail views ─────────────────────────────────────────── */}
      <AnimatePresence>
        {vistaActiva !== 'resumen' && (
          <motion.div
            key={vistaActiva}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.30 }}
            className="px-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9B9B9B' }}>
                {vistaActiva === 'propiedades' && 'Últimas propiedades'}
                {vistaActiva === 'asesores'    && 'Asesores registrados'}
                {vistaActiva === 'usuarios'    && 'Usuarios recientes'}
              </p>
              <button
                onClick={() => setVistaActiva('resumen')}
                className="text-[11px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer"
                style={{ background: 'rgba(194,113,79,0.12)', color: '#C2714F' }}
              >
                ← Volver al resumen
              </button>
            </div>

            {loadingDetalle ? (
              <div className="flex justify-center py-10">
                <span className="text-[24px]" style={{ opacity: 0.4 }}>⋯</span>
              </div>
            ) : (
              <div
                className="rounded-[20px] overflow-hidden"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >

                {/* ── Propiedades list ─────────────────────────── */}
                {vistaActiva === 'propiedades' && listaPropiedades.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < listaPropiedades.length - 1 ? '1px solid #F0EAE1' : 'none' }}
                  >
                    <span className="text-[20px] flex-shrink-0">{TIPO_EMOJI[p.tipo] ?? '🏠'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                        {p.titulo}
                      </p>
                      <p className="text-[11px]" style={{ color: '#9B9B9B' }}>
                        📍 {p.ciudad}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[13px] font-bold" style={{ color: '#C2714F' }}>
                        {formatPrice(p.precio)}
                      </p>
                      <span
                        className="text-[9px] font-bold px-1.5 py-[2px] rounded"
                        style={{
                          background: p.activa ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                          color:      p.activa ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {p.activa ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </div>
                  </div>
                ))}

                {/* ── Asesores list ─────────────────────────────── */}
                {vistaActiva === 'asesores' && listaAsesores.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < listaAsesores.length - 1 ? '1px solid #F0EAE1' : 'none' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[14px] font-bold text-white overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #E8A98A, #C2714F)' }}
                    >
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={a.nombre} className="w-full h-full object-cover" />
                        : initials(a.nombre)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                        {a.nombre}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: '#9B9B9B' }}>
                        {a.agencia ?? 'Sin agencia'}
                      </p>
                    </div>
                    {a.telefono && (
                      <a
                        href={`https://wa.me/${a.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(37,211,102,0.12)', color: '#16A34A' }}
                      >
                        WA
                      </a>
                    )}
                  </div>
                ))}

                {/* ── Usuarios list ──────────────────────────────── */}
                {vistaActiva === 'usuarios' && listaUsuarios.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < listaUsuarios.length - 1 ? '1px solid #F0EAE1' : 'none' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[13px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #5C6E4A, #2F3D24)' }}
                    >
                      {initials(u.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                        {u.nombre}
                      </p>
                      <p className="text-[11px]" style={{ color: '#9B9B9B' }}>
                        Registrado {new Date(u.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Empty states */}
                {vistaActiva === 'propiedades' && listaPropiedades.length === 0 && (
                  <p className="text-center py-8 text-[13px]" style={{ color: '#9B9B9B' }}>Sin propiedades</p>
                )}
                {vistaActiva === 'asesores' && listaAsesores.length === 0 && (
                  <p className="text-center py-8 text-[13px]" style={{ color: '#9B9B9B' }}>Sin asesores registrados</p>
                )}
                {vistaActiva === 'usuarios' && listaUsuarios.length === 0 && (
                  <p className="text-center py-8 text-[13px]" style={{ color: '#9B9B9B' }}>Sin usuarios registrados</p>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
