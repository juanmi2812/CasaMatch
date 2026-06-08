import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  getMatches, removeMatch, savePreferencias, getCitas,
  type MatchItem, type PreferenciasForm,
} from '../services/profileService'
import type { CitaConDetalles } from '../types/database'
import type { PropiedadMock } from '../services/mockData'
import PropertyDetailScreen from './PropertyDetailScreen'

// ─── Constants ───────────────────────────────────────────────────────────────

type Tab = 'matches' | 'preferencias' | 'citas'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'matches',      label: 'Mis Matches', icon: '♥'  },
  { id: 'preferencias', label: 'Preferencias', icon: '⚙' },
  { id: 'citas',        label: 'Citas',        icon: '📅' },
]

const CITIES = [
  { value: 'queretaro',   label: 'Querétaro'   },
  { value: 'cdmx',        label: 'CDMX'        },
  { value: 'guadalajara', label: 'Guadalajara' },
  { value: 'leon',        label: 'León'        },
]

const TIPOS_PROP = [
  { value: '',             label: 'Todos los tipos'  },
  { value: 'casa',         label: 'Casa'             },
  { value: 'departamento', label: 'Departamento'     },
  { value: 'terreno',      label: 'Terreno'          },
  { value: 'local',        label: 'Local comercial'  },
  { value: 'oficina',      label: 'Oficina'          },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  return `$${(n / 1_000).toFixed(0)}k`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const INPUT_STYLE: React.CSSProperties = {
  borderColor: '#EDE4D7', background: '#FAFAFA', color: '#1A1A1A',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { session, signOut, preferencias, refreshPreferencias } = useAuth()
  const [nombre,     setNombre]     = useState<string | null>(null)
  const [activeTab,  setActiveTab]  = useState<Tab>('matches')

  // Matches tab state
  const [matches,        setMatches]        = useState<MatchItem[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesLoaded,  setMatchesLoaded]  = useState(false)

  // Comparator state
  const [isComparing,       setIsComparing]       = useState(false)
  const [selectedMatches,   setSelectedMatches]   = useState<string[]>([])
  const [showCompareModal,  setShowCompareModal]  = useState(false)
  const [propiedadElegida,  setPropiedadElegida]  = useState<string | null>(null)

  // Property detail state
  const [viewingProperty,   setViewingProperty]   = useState<PropiedadMock | null>(null)

  // Preferencias tab state
  const [prefForm, setPrefForm] = useState<PreferenciasForm>({
    ciudad: '', tipo_propiedad: '', presupuesto_min: null, presupuesto_max: null,
  })
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefSaved,  setPrefSaved]  = useState(false)
  const [prefError,  setPrefError]  = useState<string | null>(null)

  // Citas tab state
  const [citas,        setCitas]        = useState<CitaConDetalles[]>([])
  const [citasLoading, setCitasLoading] = useState(false)
  const [citasLoaded,  setCitasLoaded]  = useState(false)

  // Fetch display name
  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setNombre((data as { nombre: string }).nombre)
      })
  }, [session])

  // Sync form when context preferencias arrive (on load or after save)
  useEffect(() => {
    if (preferencias) {
      setPrefForm({
        ciudad:          preferencias.ciudad          || '',
        tipo_propiedad:  preferencias.tipo_propiedad  || '',
        presupuesto_min: preferencias.presupuesto_min ? Number(preferencias.presupuesto_min) : null,
        presupuesto_max: preferencias.presupuesto_max ? Number(preferencias.presupuesto_max) : null,
      })
    }
  }, [preferencias])

  // Lazy-load matches when tab first selected
  useEffect(() => {
    if (activeTab !== 'matches' || matchesLoaded) return
    setMatchesLoading(true)
    getMatches()
      .then((data) => { setMatches(data); setMatchesLoaded(true) })
      .catch(console.error)
      .finally(() => setMatchesLoading(false))
  }, [activeTab, matchesLoaded])

  // Lazy-load citas when tab first selected
  useEffect(() => {
    if (activeTab !== 'citas' || citasLoaded) return
    setCitasLoading(true)
    getCitas()
      .then((data) => { setCitas(data); setCitasLoaded(true) })
      .catch(console.error)
      .finally(() => setCitasLoading(false))
  }, [activeTab, citasLoaded])

  async function handleRemoveMatch(swipeId: string) {
    await removeMatch(swipeId).catch(console.error)
    setMatches((prev) => prev.filter((m) => m.swipeId !== swipeId))
  }

  async function handleSavePreferencias() {
    if (!session?.user) return
    setPrefSaving(true)
    setPrefError(null)
    try {
      await savePreferencias(session.user.id, prefForm)
      await refreshPreferencias()
      setPrefSaved(true)
      setTimeout(() => setPrefSaved(false), 2500)
    } catch (err) {
      setPrefError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setPrefSaving(false)
    }
  }

  function toggleSelectMatch(swipeId: string) {
    setSelectedMatches((prev) =>
      prev.includes(swipeId) ? prev.filter((id) => id !== swipeId) : [...prev, swipeId]
    )
  }

  function handleStartCompare() {
    setIsComparing(true)
    setSelectedMatches([])
  }

  function handleCancelCompare() {
    setIsComparing(false)
    setSelectedMatches([])
    setShowCompareModal(false)
    setPropiedadElegida(null)
  }

  function openCompareModal() {
    const filtered = matches.filter((m) => selectedMatches.includes(m.swipeId))
    const scoreSum = (titulo: string) => {
      const s = titulo.length
      return [0, 1, 2, 3, 4, 5].reduce((acc, i) => acc + ((s + i) % 3) + 3, 0)
    }
    const winner = filtered.length > 0
      ? filtered.reduce((best, m) => scoreSum(m.property.titulo) > scoreSum(best.property.titulo) ? m : best, filtered[0])
      : null
    setPropiedadElegida(winner?.swipeId ?? selectedMatches[0] ?? null)
    setShowCompareModal(true)
  }

  const displayName   = nombre ?? session?.user.email?.split('@')[0] ?? 'Usuario'
  const assignedAsesor = citas[0]?.asesor ?? null

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: '#F5EFE6' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[26px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
          >
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] font-bold truncate" style={{ color: '#1A1A1A' }}>
              {displayName}
            </p>
            <p className="text-[12px] truncate" style={{ color: '#9B9B9B' }}>
              {session?.user.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[12px] px-3 py-1.5 rounded-full border-none cursor-pointer flex-shrink-0"
            style={{ background: 'white', color: '#C2714F', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            Salir
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: '#EDE4D7' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-[10px] text-[11px] font-semibold border-none cursor-pointer transition-all leading-tight"
              style={{
                background: activeTab === tab.id ? 'white' : 'transparent',
                color:      activeTab === tab.id ? '#1A1A1A' : '#9B9B9B',
                boxShadow:  activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              <span className="block text-[15px] mb-0.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">

          {/* ── Mis Matches ───────────────────────────────── */}
          {activeTab === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {matchesLoading && (
                <div className="flex justify-center py-14">
                  <span className="text-[36px] animate-pulse">♥</span>
                </div>
              )}

              {!matchesLoading && matches.length === 0 && (
                <div className="flex flex-col items-center py-14 gap-3">
                  <span className="text-[52px]">💔</span>
                  <p className="text-[14px] font-medium" style={{ color: '#9B9B9B' }}>
                    Aún no tienes matches guardados
                  </p>
                  <p className="text-[12px] text-center" style={{ color: '#B0B0B0' }}>
                    Desliza ❤️ en las propiedades que te interesen.
                  </p>
                </div>
              )}

              {!matchesLoading && matches.length > 0 && (
                <>
                  {/* Compare / Cancel toggle */}
                  <div className="flex justify-between items-center pt-2 pb-2">
                    <p className="text-[12px]" style={{ color: '#9B9B9B' }}>
                      {matches.length} match{matches.length !== 1 ? 'es' : ''} guardado{matches.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={isComparing ? handleCancelCompare : handleStartCompare}
                      className="text-[12px] px-3 py-1.5 rounded-full border-none cursor-pointer font-semibold transition-all active:scale-[.95]"
                      style={{
                        background: isComparing ? 'rgba(220,38,38,0.10)' : 'rgba(194,113,79,0.12)',
                        color:      isComparing ? '#DC2626'               : '#C2714F',
                      }}
                    >
                      {isComparing ? '✕ Cancelar' : '⚖️ Comparar'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {matches.map((m) => {
                      const isSelected = selectedMatches.includes(m.swipeId)
                      return (
                        <div
                          key={m.swipeId}
                          className={`relative rounded-[16px] overflow-hidden transition-all duration-150 cursor-pointer`}
                          style={{
                            background:  'white',
                            boxShadow:   '0 2px 10px rgba(0,0,0,0.08)',
                            outline:     isSelected ? '3px solid #f97316' : 'none',
                            outlineOffset: '2px',
                            transform:   isSelected ? 'scale(1.02)' : 'scale(1)',
                          }}
                          onClick={() => {
                            if (isComparing) {
                              toggleSelectMatch(m.swipeId)
                            } else {
                              setViewingProperty(m.property)
                            }
                          }}
                        >
                          {/* Property image */}
                          <div
                            className="w-full h-[108px] relative"
                            style={{
                              ...(m.property.imagenes?.[0]
                                ? { backgroundImage: `url(${m.property.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                : { background: `linear-gradient(135deg, ${m.property.gradientFrom}, ${m.property.gradientTo})` }),
                            }}
                          >
                            {/* Remove button — hidden while comparing */}
                            {!isComparing && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveMatch(m.swipeId) }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer text-white text-[11px]"
                                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                              >
                                ✕
                              </button>
                            )}
                            {/* Selection overlay */}
                            {isComparing && isSelected && (
                              <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.35)' }}
                              >
                                <span className="text-[32px]">✅</span>
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-2.5">
                            <p className="text-[12px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
                              {m.property.titulo}
                            </p>
                            <p className="text-[11px] font-bold" style={{ color: '#C2714F' }}>
                              {fmtPrice(m.property.precio)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Mis Preferencias ──────────────────────────── */}
          {activeTab === 'preferencias' && (
            <motion.div
              key="preferencias"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pt-2 flex flex-col gap-3"
            >
              <p className="text-[13px]" style={{ color: '#6B6B6B' }}>
                Actualiza tu búsqueda y el feed de propiedades se ajustará de inmediato.
              </p>

              {/* Ciudad */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold" style={{ color: '#1A1A1A' }}>Ciudad</span>
                <select
                  value={prefForm.ciudad}
                  onChange={(e) => setPrefForm((f) => ({ ...f, ciudad: e.target.value }))}
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2"
                  style={INPUT_STYLE}
                >
                  <option value="">Cualquier ciudad</option>
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de inmueble */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold" style={{ color: '#1A1A1A' }}>Tipo de inmueble</span>
                <select
                  value={prefForm.tipo_propiedad}
                  onChange={(e) => setPrefForm((f) => ({ ...f, tipo_propiedad: e.target.value }))}
                  className="w-full px-4 py-[13px] rounded-[14px] text-[14px] outline-none border-2"
                  style={INPUT_STYLE}
                >
                  {TIPOS_PROP.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[12px] font-semibold" style={{ color: '#1A1A1A' }}>Precio mínimo</span>
                  <input
                    type="number"
                    placeholder="Sin mínimo"
                    value={prefForm.presupuesto_min ?? ''}
                    onChange={(e) => setPrefForm((f) => ({
                      ...f, presupuesto_min: e.target.value ? Number(e.target.value) : null,
                    }))}
                    className="w-full px-3 py-[11px] rounded-[14px] text-[13px] outline-none border-2"
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[12px] font-semibold" style={{ color: '#1A1A1A' }}>Precio máximo</span>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={prefForm.presupuesto_max ?? ''}
                    onChange={(e) => setPrefForm((f) => ({
                      ...f, presupuesto_max: e.target.value ? Number(e.target.value) : null,
                    }))}
                    className="w-full px-3 py-[11px] rounded-[14px] text-[13px] outline-none border-2"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {prefError && (
                <p className="text-[12px] px-1" style={{ color: '#DC2626' }}>{prefError}</p>
              )}

              <button
                onClick={handleSavePreferencias}
                disabled={prefSaving}
                className="w-full py-[14px] rounded-[16px] text-[14px] font-semibold text-white border-none cursor-pointer transition-all active:scale-[.97] disabled:opacity-60 mt-1"
                style={{
                  background: prefSaved
                    ? '#4CAF50'
                    : 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)',
                }}
              >
                {prefSaving ? 'Guardando...' : prefSaved ? '✓ Preferencias guardadas' : 'Guardar preferencias →'}
              </button>
            </motion.div>
          )}

          {/* ── Citas ─────────────────────────────────────── */}
          {activeTab === 'citas' && (
            <motion.div
              key="citas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pt-2 flex flex-col gap-3"
            >
              {/* Asesor asignado (from first upcoming cita) */}
              {assignedAsesor && (
                <div
                  className="rounded-[18px] p-4 flex items-center gap-3"
                  style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] flex-shrink-0"
                    style={{ background: 'rgba(194,113,79,0.12)' }}
                  >
                    👔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium" style={{ color: '#9B9B9B' }}>
                      Tu asesor asignado
                    </p>
                    <p className="text-[14px] font-bold truncate" style={{ color: '#1A1A1A' }}>
                      {assignedAsesor.nombre}
                    </p>
                    {assignedAsesor.telefono && (
                      <p className="text-[12px]" style={{ color: '#6B6B6B' }}>
                        {assignedAsesor.telefono}
                      </p>
                    )}
                  </div>
                  {assignedAsesor.telefono && (
                    <a
                      href={`https://wa.me/${assignedAsesor.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-full text-[12px] font-semibold flex-shrink-0"
                      style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}

              {citasLoading && (
                <div className="flex justify-center py-10">
                  <span className="text-[32px] animate-pulse">📅</span>
                </div>
              )}

              {!citasLoading && citas.length === 0 && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <span className="text-[52px]">📆</span>
                  <p className="text-[14px] font-medium" style={{ color: '#9B9B9B' }}>
                    No tienes citas agendadas
                  </p>
                  <p className="text-[12px] text-center" style={{ color: '#B0B0B0' }}>
                    Toca "Agendar visita" en cualquier propiedad para crear una.
                  </p>
                </div>
              )}

              {!citasLoading && citas.map((cita) => (
                <div
                  key={cita.id}
                  className="rounded-[18px] overflow-hidden"
                  style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
                >
                  <div className="flex gap-3 p-3 items-start">
                    {/* Property thumbnail */}
                    <div
                      className="w-[66px] h-[66px] rounded-[12px] flex-shrink-0"
                      style={{
                        ...(cita.propiedad.imagenes?.[0]
                          ? { backgroundImage: `url(${cita.propiedad.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: '#EDE4D7' }),
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate" style={{ color: '#1A1A1A' }}>
                        {cita.propiedad.titulo}
                      </p>
                      <p className="text-[11px]" style={{ color: '#9B9B9B' }}>
                        {cita.propiedad.ubicacion}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#6B6B6B' }}>
                        📅 {fmtDate(cita.fecha_cita)}
                      </p>
                      {cita.asesor && (
                        <p className="text-[11px] mt-0.5" style={{ color: '#6B6B6B' }}>
                          👔 {cita.asesor.nombre}
                        </p>
                      )}
                    </div>
                    {/* Status badge */}
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: cita.estado === 'confirmada'
                          ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)',
                        color: cita.estado === 'confirmada' ? '#2E7D32' : '#E65100',
                      }}
                    >
                      {cita.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Floating comparator action bar ─────────────────────── */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-[110px] left-4 right-4 md:left-0 md:right-0 md:mx-auto md:max-w-md z-[60] flex items-center justify-between px-5 py-3.5 rounded-[20px]"
            style={{ background: '#1A1A1A', boxShadow: '0 8px 32px rgba(0,0,0,0.30)' }}
          >
            <p className="text-white text-[13px] font-medium">
              {selectedMatches.length === 0
                ? 'Selecciona propiedades'
                : `${selectedMatches.length} seleccionada${selectedMatches.length !== 1 ? 's' : ''}`}
            </p>
            <button
              disabled={selectedMatches.length < 2}
              onClick={openCompareModal}
              className="px-5 py-2 rounded-full text-[13px] font-bold border-none cursor-pointer transition-all active:scale-[.95] disabled:opacity-40"
              style={{ background: '#C2714F', color: 'white' }}
            >
              Comparar →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compare modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.20 }}
            className="fixed inset-0 z-[999] flex flex-col bg-[#F5EFE6] overflow-y-auto"
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-5 pt-[52px] pb-4 flex-shrink-0"
              style={{ borderBottom: '1px solid #EDE4D7' }}
            >
              <div>
                <h2 className="text-[18px] font-bold" style={{ color: '#1A1A1A' }}>
                  ⚖️ Comparar propiedades
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: '#9B9B9B' }}>
                  {selectedMatches.length} seleccionadas · desliza para ver más
                </p>
              </div>
              <button
                onClick={handleCancelCompare}
                className="text-[13px] px-5 py-2.5 rounded-full border-none cursor-pointer font-bold transition-all active:scale-[.95]"
                style={{ background: '#1A1A1A', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}
              >
                ✕ Cerrar
              </button>
            </div>

            {/* FOMO banner */}
            <div className="mx-5 mt-4 mb-1 p-3 rounded-xl flex items-center gap-2" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
              <span className="text-lg">🔥</span>
              <p className="text-[12px] font-medium" style={{ color: '#9A3412' }}>
                ¡Esta zona tiene alta demanda! Los precios han subido un 5% este trimestre.
              </p>
            </div>

            {/* Snap-scroll carousel — scores + winners computed before render */}
            {(() => {
              const METRIC_LABELS = [
                'Plusvalía', 'Seguridad', 'Tranquilidad',
                'Vida social', 'Sin tráfico', 'Servicios cerca',
              ] as const
              type MetricLabel = typeof METRIC_LABELS[number]

              const filtered = matches.filter((m) => selectedMatches.includes(m.swipeId))
              if (filtered.length === 0) return null

              const scoreMap = new Map<string, Record<MetricLabel, number>>()
              for (const m of filtered) {
                const s = m.property.titulo.length
                scoreMap.set(m.swipeId, {
                  'Plusvalía':        (s      % 3) + 3,
                  'Seguridad':        ((s + 1) % 3) + 3,
                  'Tranquilidad':     ((s + 2) % 3) + 3,
                  'Vida social':      ((s + 3) % 3) + 3,
                  'Sin tráfico':      ((s + 4) % 3) + 3,
                  'Servicios cerca':  ((s + 5) % 3) + 3,
                })
              }

              // winner per metric: swipeId of sole leader, null on tie
              const winnerMap: Record<MetricLabel, string | null> = {} as Record<MetricLabel, string | null>
              for (const label of METRIC_LABELS) {
                const max = Math.max(...filtered.map((m) => scoreMap.get(m.swipeId)![label]))
                const leaders = filtered.filter((m) => scoreMap.get(m.swipeId)![label] === max)
                winnerMap[label] = leaders.length === 1 ? leaders[0].swipeId : null
              }

              return (
                <div className="flex overflow-x-auto md:justify-center items-start gap-4 sm:gap-6 px-4 sm:px-8 py-6 pb-[220px] no-scrollbar snap-x snap-mandatory md:snap-none md:flex-wrap">
                  {filtered.map((m) => {
                    const scores = scoreMap.get(m.swipeId)!
                    return (
                      <div
                        key={m.swipeId}
                        className="relative w-[85vw] sm:w-[320px] md:w-[380px] flex-shrink-0 snap-center bg-white rounded-[24px] overflow-hidden shadow-xl flex flex-col"
                      >
                        {/* Image */}
                        <div
                          className="w-full h-[200px] flex-shrink-0"
                          style={{
                            ...(m.property.imagenes?.[0]
                              ? { backgroundImage: `url(${m.property.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                              : { background: `linear-gradient(135deg, ${m.property.gradientFrom}, ${m.property.gradientTo})` }),
                          }}
                        />

                        {/* Info */}
                        <div className="p-4 flex flex-col gap-3">
                          <div>
                            <p className="text-[15px] font-bold leading-tight" style={{ color: '#1A1A1A' }}>
                              {m.property.titulo}
                            </p>
                            <p className="text-[17px] font-extrabold mt-0.5" style={{ color: '#C2714F' }}>
                              {fmtPrice(m.property.precio)}
                            </p>
                            {m.property.ciudad && (
                              <p className="text-[12px] mt-0.5" style={{ color: '#9B9B9B' }}>
                                📍 {m.property.ciudad}
                              </p>
                            )}
                          </div>

                          {/* Attributes grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { icon: '🛏', label: 'Recámaras', value: m.property.recamaras != null ? String(m.property.recamaras) : 'N/D' },
                              { icon: '🚿', label: 'Baños',     value: m.property.banos      != null ? String(m.property.banos)      : 'N/D' },
                              { icon: '📐', label: 'm²',        value: m.property.m2         != null ? String(m.property.m2)         : 'N/D' },
                            ] as const).map((attr) => (
                              <div
                                key={attr.label}
                                className="flex flex-col items-center justify-center rounded-[14px] py-3 gap-1"
                                style={{ background: '#F5EFE6' }}
                              >
                                <span className="text-[20px]">{attr.icon}</span>
                                <span className="text-[14px] font-bold" style={{ color: '#1A1A1A' }}>{attr.value}</span>
                                <span className="text-[10px]" style={{ color: '#9B9B9B' }}>{attr.label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Métricas de la Zona */}
                          <div className="mt-2">
                            <p className="text-xs font-bold uppercase mb-3" style={{ color: '#9B9B9B' }}>
                              Métricas de la Zona
                            </p>
                            <div className="flex flex-col gap-3">
                              {METRIC_LABELS.map((label) => {
                                const score    = scores[label]
                                const isWinner = winnerMap[label] === m.swipeId
                                return (
                                  <div key={label}>
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[12px] font-medium" style={{ color: '#4A4A4A' }}>{label}</span>
                                        {isWinner && (
                                          <span
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: 'rgba(194,113,79,0.14)', color: '#C2714F' }}
                                          >
                                            MEJOR
                                          </span>
                                        )}
                                      </div>
                                      <span
                                        className="text-[12px] font-bold"
                                        style={{ color: isWinner ? '#C2714F' : '#9B9B9B' }}
                                      >
                                        {score}/5
                                      </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full" style={{ background: '#EDE4D7' }}>
                                      <div
                                        className="h-2 rounded-full transition-all duration-500"
                                        style={{
                                          width:      `${(score / 5) * 100}%`,
                                          background: isWinner ? '#C2714F' : '#C8C0B8',
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compare bottom bar ─────────────────────────────────── */}
      {showCompareModal && selectedMatches.length >= 2 && (() => {
        const filtered = matches.filter((m) => selectedMatches.includes(m.swipeId))
        const scoreSum = (titulo: string) => {
          const s = titulo.length
          return [0, 1, 2, 3, 4, 5].reduce((acc, i) => acc + ((s + i) % 3) + 3, 0)
        }
        const winner = filtered.reduce(
          (best, m) => scoreSum(m.property.titulo) > scoreSum(best.property.titulo) ? m : best,
          filtered[0],
        )
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000]">
            <div className="max-w-md mx-auto flex flex-col gap-3">
              <select
                value={propiedadElegida ?? ''}
                onChange={(e) => setPropiedadElegida(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-800 outline-none"
              >
                {filtered.map((m) => {
                  const isSugerida = m.swipeId === winner.swipeId
                  return (
                    <option key={m.swipeId} value={m.swipeId}>
                      {isSugerida ? '👑 ' : ''}{m.property.titulo} — {fmtPrice(m.property.precio)}{isSugerida ? ' (Sugerida)' : ''}
                    </option>
                  )
                })}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="w-1/3 bg-gray-100 text-gray-700 rounded-xl font-bold py-3.5 text-[14px] border-none cursor-pointer transition-all active:scale-[.97]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => alert('Abriendo agenda para la propiedad seleccionada...')}
                  className="w-2/3 rounded-xl font-bold py-3.5 text-[14px] text-white border-none cursor-pointer transition-all active:scale-[.97]"
                  style={{ background: '#C2714F' }}
                >
                  Agendar Visita 📅
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Property detail overlay ────────────────────────────── */}
      {viewingProperty && (
        <div className="fixed inset-0 z-[2000] bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <PropertyDetailScreen
              property={viewingProperty}
              onBack={() => setViewingProperty(null)}
            />
          </div>
        </div>
      )}

    </div>
  )
}
