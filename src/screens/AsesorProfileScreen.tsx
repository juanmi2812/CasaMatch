import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Props {
  asesorId: string
  onBack:   () => void
}

interface AsesorData {
  id:                string
  nombre:            string
  agencia:           string | null
  avatar_url:        string | null
  telefono:          string | null
  biografia:         string | null
  instagram_url:     string | null
  tiktok_url:        string | null
  facebook_url:      string | null
  anios_experiencia: number | null
}

interface PropCard {
  id:       string
  titulo:   string
  precio:   number
  tipo:     string
  ciudad:   string
  imagenes: string[]
}

const TIPO_EMOJI: Record<string, string> = {
  casa: '🏡', departamento: '🏙️', terreno: '🌿', local: '🏪', oficina: '🏢',
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  return `$${(n / 1_000).toFixed(0)}k`
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function AsesorProfileScreen({ asesorId, onBack }: Props) {
  const [asesor,      setAsesor]     = useState<AsesorData | null>(null)
  const [propiedades, setPropiedades] = useState<PropCard[]>([])
  const [loading,     setLoading]    = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('perfiles')
        .select('id, nombre, agencia, avatar_url, telefono, biografia, instagram_url, tiktok_url, facebook_url, anios_experiencia')
        .eq('id', asesorId)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('propiedades')
        .select('id, titulo, precio, tipo, ciudad, imagenes')
        .eq('asesor_id', asesorId)
        .eq('activa', true)
        .order('creado_en', { ascending: false })
        .limit(20),
    ]).then(([perfilRes, propsRes]) => {
      if (perfilRes.data) setAsesor(perfilRes.data as AsesorData)
      if (propsRes.data)  setPropiedades(propsRes.data as PropCard[])
      setLoading(false)
    })
  }, [asesorId])

  const name = asesor?.nombre ?? '—'

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar" style={{ background: '#F5EFE6' }}>

      {/* ── Hero card ────────────────────────────────────────────── */}
      <div
        className="relative mx-4 mt-4 rounded-[28px] overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1A1A1A 0%, #2C2C3E 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.22)' }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-[.88]"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
        >
          <span className="text-white text-[16px] font-bold leading-none">←</span>
        </button>

        <div className="flex flex-col items-center px-6 pt-14 pb-8">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-display text-[28px] font-bold text-white mb-4 flex-shrink-0"
            style={{
              background: asesor?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #E8A98A, #C2714F)',
              boxShadow: '0 0 0 4px rgba(255,255,255,0.14)',
            }}
          >
            {loading ? '…' : asesor?.avatar_url ? (
              <img src={asesor.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>

          {/* Name */}
          <h1 className="font-display text-[22px] font-bold text-white text-center mb-1">{name}</h1>

          {/* Agency + experience badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
            {asesor?.agencia && (
              <span
                className="px-3 py-1 rounded-full text-[11px] font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.14)' }}
              >
                {asesor.agencia}
              </span>
            )}
            {asesor?.anios_experiencia != null && (
              <span
                className="px-3 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(194,113,79,0.30)', color: '#E8A98A' }}
              >
                ✦ {asesor.anios_experiencia} años de experiencia
              </span>
            )}
            <span
              className="px-2 py-[3px] rounded text-[9px] font-black tracking-[0.4px]"
              style={{ background: '#C2714F', color: 'white' }}
            >
              ✓ VERIFICADO
            </span>
          </div>

          {/* Social links */}
          {(asesor?.instagram_url || asesor?.tiktok_url || asesor?.facebook_url) && (
            <div className="flex flex-wrap gap-2 justify-center">
              {asesor.instagram_url && (
                <a href={asesor.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(225,48,108,0.18)', color: '#E8A98A', textDecoration: 'none' }}>
                  📸 Instagram
                </a>
              )}
              {asesor.tiktok_url && (
                <a href={asesor.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none' }}>
                  🎵 TikTok
                </a>
              )}
              {asesor.facebook_url && (
                <a href={asesor.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(24,119,242,0.20)', color: '#90B8F8', textDecoration: 'none' }}>
                  👤 Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="text-[32px] animate-pulse">🏡</span>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Biografia ──────────────────────────────────────────── */}
          {asesor?.biografia && (
            <div
              className="mx-4 mt-4 rounded-[24px] p-5"
              style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#C2714F' }}>
                Sobre mí
              </p>
              <p className="text-[13px] leading-[1.7]" style={{ color: '#4A4A4A' }}>
                {asesor.biografia}
              </p>
            </div>
          )}

          {/* ── Contact button ─────────────────────────────────────── */}
          {asesor?.telefono && (
            <div className="mx-4 mt-4">
              <a
                href={`https://wa.me/${asesor.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${name}, encontré tu perfil en CasaMatch y me gustaría hablar contigo.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[18px] text-[14px] font-semibold text-white"
                style={{ background: '#25D366', textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,211,102,0.30)' }}
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          )}

          {/* ── Propiedades activas ────────────────────────────────── */}
          <div className="mx-4 mt-5 mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B9B9B' }}>
              Propiedades activas · {propiedades.length}
            </p>

            {propiedades.length === 0 ? (
              <div
                className="rounded-[20px] p-6 text-center"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <p className="text-[13px]" style={{ color: '#9B9B9B' }}>Sin propiedades activas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {propiedades.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[18px] overflow-hidden"
                    style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-full h-[100px] flex items-center justify-center"
                      style={
                        p.imagenes?.[0]
                          ? { backgroundImage: `url(${p.imagenes[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }
                      }
                    >
                      {!p.imagenes?.[0] && (
                        <span className="text-[32px]" style={{ opacity: 0.5 }}>{TIPO_EMOJI[p.tipo] ?? '🏠'}</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[12px] font-semibold leading-tight truncate mb-0.5" style={{ color: '#1A1A1A' }}>
                        {p.titulo}
                      </p>
                      <p className="text-[12px] font-bold" style={{ color: '#C2714F' }}>
                        {formatPrice(p.precio)}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9B9B9B' }}>📍 {p.ciudad}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
