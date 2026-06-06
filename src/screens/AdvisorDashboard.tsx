import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AIGeneratorModal from '../components/ui/AIGeneratorModal'
import NewPropertyModal from '../components/ui/NewPropertyModal'
import EditPropertyModal from '../components/ui/EditPropertyModal'
import AdvisorSettingsModal from '../components/ui/AdvisorSettingsModal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import type { KpisAsesor, Perfil } from '../types/database'

// ─── Local types ──────────────────────────────────────────────────────────────

interface LeadRow {
  id:               string
  tipo_interaccion: string
  creado_en:        string
  usuario:   { nombre: string; avatar_url: string | null; telefono: string | null } | null
  propiedad: { titulo: string; ciudad: string; tipo: string } | null
}

interface PropRow {
  id:          string
  titulo:      string
  tipo:        string
  imagenes:    string[]
  precio:      number
  activa:      boolean
  recamaras:   number | null
  banos:       number | null
  m2:          number | null
  ubicacion:   string
  ciudad:      string
  descripcion: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  return `Hace ${Math.floor(hrs / 24)} d`
}

function isHot(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 3_600_000
}

function fmtPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  return `$${(n / 1_000).toFixed(0)}k`
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvisorDashboard() {
  const { session, signOut } = useAuth()

  const [filtroActivo,     setFiltroActivo]    = useState<'todos' | 'propiedades' | 'leads' | 'likes' | 'guardados'>('todos')
  const [perfil,           setPerfil]          = useState<Perfil | null>(null)
  const [kpis,             setKpis]            = useState<KpisAsesor | null>(null)
  const [leads,            setLeads]           = useState<LeadRow[]>([])
  const [myProps,          setMyProps]         = useState<PropRow[]>([])
  const [kpisLoading,      setKpisLoading]     = useState(true)
  const [leadsLoading,     setLeadsLoading]    = useState(true)
  const [propsLoading,     setPropsLoading]    = useState(true)
  const [kpisKey,          setKpisKey]         = useState(0)
  const [showAIModal,      setShowAIModal]     = useState(false)
  const [showNewPropModal, setShowNewPropModal] = useState(false)
  const [editingProp,      setEditingProp]     = useState<PropRow | null>(null)
  const [showSettings,     setShowSettings]    = useState(false)

  // Fetch profile
  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => { if (data) setPerfil(data as Perfil) })
  }, [session])

  // Fetch KPIs
  useEffect(() => {
    if (!session?.user) { setKpisLoading(false); return }
    setKpisLoading(true)
    supabase
      .from('kpis_asesores')
      .select('*')
      .eq('asesor_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setKpis(data as KpisAsesor)
        setKpisLoading(false)
      })
  }, [session, kpisKey])

  // Fetch leads (RLS automatically scopes to this advisor's properties)
  useEffect(() => {
    if (!session?.user) { setLeadsLoading(false); return }
    setLeadsLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase as any)
      .from('interacciones_swipes')
      .select('id, tipo_interaccion, creado_en, usuario:perfiles!usuario_id(nombre,avatar_url,telefono), propiedad:propiedades!propiedad_id(titulo,ciudad,tipo)')
      .in('tipo_interaccion', ['like', 'save'])
      .order('creado_en', { ascending: false })
      .limit(8)
      .then(({ data }: { data: LeadRow[] | null }) => {
        setLeads(data ?? [])
        setLeadsLoading(false)
      })
  }, [session, kpisKey])

  // Fetch advisor's own active properties
  useEffect(() => {
    if (!session?.user) { setPropsLoading(false); return }
    setPropsLoading(true)
    supabase
      .from('propiedades')
      .select('id,titulo,tipo,imagenes,precio,activa,recamaras,banos,m2,ubicacion,ciudad,descripcion')
      .eq('asesor_id', session.user.id)
      .order('creado_en', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setMyProps((data ?? []) as PropRow[])
        setPropsLoading(false)
      })
  }, [session, kpisKey])

  const metrics: { label: string; value: string; delta: string; icon: string; filtro: typeof filtroActivo }[] = [
    { label: 'Propiedades', value: kpisLoading ? '—' : (kpis?.total_propiedades ?? 0).toLocaleString(), delta: '+activas', icon: '🏠', filtro: 'propiedades' },
    { label: 'Leads',       value: kpisLoading ? '—' : (kpis?.total_leads       ?? 0).toLocaleString(), delta: 'únicos',  icon: '📩', filtro: 'leads'        },
    { label: 'Likes',       value: kpisLoading ? '—' : (kpis?.total_likes       ?? 0).toLocaleString(), delta: 'total',   icon: '♥',  filtro: 'likes'        },
    { label: 'Guardados',   value: kpisLoading ? '—' : (kpis?.total_saves       ?? 0).toLocaleString(), delta: 'total',   icon: '🔖', filtro: 'guardados'    },
  ]

  const displayName = perfil?.nombre || 'Asesor Inmobiliario'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar" style={{ background: '#F5EFE6' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium mb-0.5" style={{ color: '#9B9B9B' }}>
            Bienvenido de vuelta,
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold break-words" style={{ color: '#1A1A1A' }}>
              {displayName}
            </h1>
            {perfil?.agencia && (
              <div
                className="px-2 py-[3px] rounded-full text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
              >
                {perfil.agencia}
              </div>
            )}
          </div>
        </div>

        {/* Avatar + settings + sign-out */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <button
            onClick={() => signOut()}
            className="text-[11px] px-2.5 py-1.5 rounded-full border-none cursor-pointer"
            style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
          >
            Salir
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="relative w-[46px] h-[46px] rounded-full flex items-center justify-center border-none cursor-pointer overflow-hidden"
            style={{
              background: perfil?.avatar_url
                ? 'transparent'
                : 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
              boxShadow: '0 4px 14px rgba(194,113,79,0.38)',
            }}
          >
            {perfil?.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-[15px] font-bold">
                {initials(displayName)}
              </span>
            )}
            <span
              className="absolute bottom-0 right-0 text-[12px] w-[18px] h-[18px] rounded-full flex items-center justify-center"
              style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
            >
              ⚙
            </span>
          </button>
        </div>
      </div>

      {/* ── Metrics grid ───────────────────────────────────────── */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4 mb-6 w-full">
          {metrics.map((m) => {
            const isActive = filtroActivo === m.filtro
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setFiltroActivo(isActive ? 'todos' : m.filtro)}
                className={`rounded-[20px] p-4 min-w-0 cursor-pointer transition-all select-none ${isActive ? 'ring-2 ring-orange-500 scale-105' : 'hover:scale-105'}`}
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
              >
                <div className="flex items-center justify-between gap-1 flex-wrap mb-2">
                  <span className="text-[18px] flex-shrink-0">{m.icon}</span>
                  <span
                    className="text-sm font-semibold px-2 py-[2px] rounded-full"
                    style={{ background: 'rgba(74,222,128,0.14)', color: '#16A34A' }}
                  >
                    {m.delta}
                  </span>
                </div>
                <p className="font-display text-[24px] font-bold leading-none mb-1" style={{ color: '#1A1A1A' }}>
                  {m.value}
                </p>
                <p className="text-sm" style={{ color: '#9B9B9B' }}>{m.label}</p>
              </motion.div>
            )
          })}
        </div>

        {filtroActivo !== 'todos' && (
          <button
            onClick={() => setFiltroActivo('todos')}
            className="mb-6 px-4 py-2 text-sm text-orange-600 bg-orange-50 rounded-full font-medium mx-auto block border-none cursor-pointer"
          >
            Limpiar filtro (Mostrar todo)
          </button>
        )}
      </div>

      {/* ── Leads recientes ────────────────────────────────────── */}
      {(filtroActivo === 'todos' || filtroActivo === 'leads') && <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-bold" style={{ color: '#1A1A1A' }}>
            Leads recientes
          </h2>
        </div>

        {leadsLoading && (
          <div className="flex justify-center py-8">
            <span className="text-[28px] animate-pulse">📩</span>
          </div>
        )}

        {!leadsLoading && leads.length === 0 && (
          <div
            className="rounded-[20px] p-6 flex flex-col items-center text-center gap-3"
            style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <span className="text-[48px]">🏡</span>
            <p className="font-display text-[16px] font-bold" style={{ color: '#1A1A1A' }}>
              Aún no tienes leads
            </p>
            <p className="text-[13px] leading-[1.6]" style={{ color: '#9B9B9B' }}>
              ¡Sube tu primera propiedad para empezar a recibir prospectos!
            </p>
            <button
              onClick={() => setShowNewPropModal(true)}
              className="mt-1 px-6 py-[11px] rounded-full text-[13px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
            >
              + Agregar propiedad
            </button>
          </div>
        )}

        {!leadsLoading && leads.length > 0 && (
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            {leads.map((lead, i) => {
              const hot      = isHot(lead.creado_en)
              const userName = lead.usuario?.nombre ?? 'Usuario'
              const propLabel = lead.propiedad
                ? `${lead.propiedad.ciudad} · ${lead.propiedad.tipo}`
                : '—'
              const waLink = lead.usuario?.telefono
                ? `https://wa.me/${lead.usuario.telefono.replace(/\D/g, '')}`
                : null

              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < leads.length - 1 ? '1px solid #F0EAE1' : 'none' }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
                  >
                    {lead.usuario?.avatar_url ? (
                      <img src={lead.usuario.avatar_url} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      initials(userName)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                        {userName}
                      </p>
                      <span className="text-[11px]">{hot ? '🔥' : '🌡️'}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-[1px] rounded-full flex-shrink-0"
                        style={{
                          background: hot ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)',
                          color:      hot ? '#DC2626'              : '#92400E',
                        }}
                      >
                        {hot ? 'Hot' : 'Warm'}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: '#9B9B9B' }}>
                      {propLabel}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: '#C8C8C8' }}>
                      {relativeTime(lead.creado_en)}
                    </p>
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
                      >
                        WhatsApp
                      </a>
                    ) : (
                      <button
                        onClick={() => alert(`No hay número de teléfono registrado para ${lead.usuario?.nombre ?? 'este usuario'}.`)}
                        className="mt-1 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border-none cursor-pointer"
                        style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
                      >
                        Sin tel.
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>}

      {/* ── Mis propiedades ────────────────────────────────────── */}
      {(filtroActivo === 'todos' || filtroActivo === 'propiedades') && <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[17px] font-bold" style={{ color: '#1A1A1A' }}>
            Mis propiedades
          </h2>
          <button
            onClick={() => setShowNewPropModal(true)}
            className="text-[12px] font-semibold border-none cursor-pointer bg-transparent"
            style={{ color: '#C2714F' }}
          >
            + Agregar
          </button>
        </div>

        {propsLoading && (
          <div className="flex justify-center py-6">
            <span className="text-[28px] animate-pulse">🏠</span>
          </div>
        )}

        {!propsLoading && myProps.length === 0 && (
          <div
            className="rounded-[20px] p-5 text-center"
            style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <p className="text-[13px]" style={{ color: '#9B9B9B' }}>
              Sin propiedades activas aún.
            </p>
          </div>
        )}

        {!propsLoading && myProps.length > 0 && (
          <div className="flex flex-col gap-3">
            {myProps.map((prop) => (
              <div
                key={prop.id}
                className="rounded-[20px] overflow-hidden"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Thumbnail */}
                  <div
                    className="w-[52px] h-[52px] rounded-[14px] flex-shrink-0"
                    style={{
                      ...(prop.imagenes[0]
                        ? { backgroundImage: `url(${prop.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }),
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                        {prop.titulo}
                      </p>
                      <span
                        className="text-[10px] font-medium px-2 py-[2px] rounded-full ml-2 flex-shrink-0"
                        style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
                      >
                        {prop.tipo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-bold" style={{ color: '#C2714F' }}>
                        {fmtPrice(prop.precio)}
                      </p>
                      {!prop.activa && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-[2px] rounded-full"
                          style={{ background: 'rgba(107,107,107,0.12)', color: '#6B6B6B' }}
                        >
                          Rentada/Vendida
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProp(prop)}
                    className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer transition-all active:scale-[.95]"
                    style={{ background: 'rgba(194,113,79,0.10)', color: '#C2714F' }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* ── AI promo card ──────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <div
          className="rounded-[24px] p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #C2714F 0%, #9E5A3A 100%)',
            boxShadow:  '0 8px 28px rgba(194,113,79,0.40)',
          }}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] select-none pointer-events-none" style={{ opacity: 0.12 }}>
            ✨
          </div>
          <div className="relative z-10">
            <div
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold text-white mb-3"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              ✨ Nuevo · IA Generativa
            </div>
            <h3 className="font-display text-[18px] font-bold text-white leading-[1.3] mb-1.5">
              Descripciones que<br />venden más rápido
            </h3>
            <p className="text-[12px] text-white mb-4" style={{ opacity: 0.82 }}>
              Genera textos persuasivos y optimizados para tus propiedades en segundos.
            </p>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-5 py-[11px] rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all active:scale-[.96]"
              style={{ background: 'white', color: '#C2714F' }}
            >
              Probar ahora →
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAIModal && (
          <AIGeneratorModal onDismiss={() => setShowAIModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewPropModal && (
          <NewPropertyModal
            onDismiss={() => setShowNewPropModal(false)}
            onCreated={() => { setShowNewPropModal(false); setKpisKey((k) => k + 1) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProp && (
          <EditPropertyModal
            prop={editingProp}
            onDismiss={() => setEditingProp(null)}
            onSaved={() => { setEditingProp(null); setKpisKey((k) => k + 1) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && perfil && (
          <AdvisorSettingsModal
            perfil={perfil}
            onSaved={(updated) => { setPerfil(updated); setShowSettings(false) }}
            onDismiss={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
