import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { KpisGlobales } from '../types/database'


function StatCard({ icon, label, value, loading }: {
  icon: string; label: string; value: string | number; loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="rounded-[20px] p-4"
      style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <span className="text-[22px] block mb-2">{icon}</span>
      <p className="font-display text-[26px] font-bold leading-none mb-1" style={{ color: '#1A1A1A' }}>
        {loading ? '—' : value.toLocaleString()}
      </p>
      <p className="text-[12px]" style={{ color: '#9B9B9B' }}>{label}</p>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { session, signOut } = useAuth()
  const [kpis,    setKpis]    = useState<KpisGlobales | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

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

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar" style={{ background: '#F5EFE6' }}>

      {/* Header */}
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
          Métricas globales — kpis_globales
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

      {/* KPIs grid */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B9B9B' }}>
          Plataforma global
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="🏠" label="Propiedades activas" value={kpis?.propiedades_activas ?? 0} loading={loading} />
          <StatCard icon="🧑‍💼" label="Asesores"          value={kpis?.total_asesores     ?? 0} loading={loading} />
          <StatCard icon="👥" label="Usuarios"            value={kpis?.total_usuarios     ?? 0} loading={loading} />
          <StatCard icon="📩" label="Leads únicos"        value={kpis?.total_leads        ?? 0} loading={loading} />
        </div>
      </div>

      {/* Engagement */}
      <div className="px-4 mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B9B9B' }}>
          Engagement total
        </p>
        <div
          className="rounded-[20px] p-4"
          style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          {[
            { label: 'Total Likes',    value: kpis?.total_likes ?? 0, icon: '♥',  color: '#C2714F' },
            { label: 'Total Guardados',value: kpis?.total_saves ?? 0, icon: '🔖', color: '#6B7C5C' },
          ].map((row, i) => {
            const max = Math.max((kpis?.total_likes ?? 0), (kpis?.total_saves ?? 0), 1)
            return (
              <div
                key={row.label}
                className="flex items-center gap-3"
                style={{ marginBottom: i === 0 ? 16 : 0 }}
              >
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

      {/* Data source note */}
      <div className="px-4 mb-8">
        <div
          className="rounded-[16px] px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(194,113,79,0.07)' }}
        >
          <span className="text-[16px] mt-0.5">🗄</span>
          <p className="text-[11px] leading-[1.6]" style={{ color: '#7A5A4A' }}>
            Datos en tiempo real desde la vista <strong>kpis_globales</strong> (Supabase).
            Acceso restringido a usuarios con <code>app_metadata.rol = "admin"</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
