import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const [nombre, setNombre] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setNombre((data as { nombre: string }).nombre) })
  }, [session])

  const displayName = nombre ?? session?.user.email?.split('@')[0] ?? 'Usuario'

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6 px-8" style={{ background: '#F5EFE6' }}>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-[44px]"
        style={{ background: 'linear-gradient(135deg, #E8A98A 0%, #C2714F 100%)' }}
      >
        👤
      </div>

      <div className="text-center">
        <p className="font-display text-[22px] font-bold mb-1" style={{ color: '#1A1A1A' }}>
          {displayName}
        </p>
        <p className="text-[13px]" style={{ color: '#9B9B9B' }}>
          {session?.user.email}
        </p>
      </div>

      <div
        className="w-full rounded-[20px] p-4 flex items-center gap-3"
        style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      >
        <span className="text-[22px]">🏠</span>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#1A1A1A' }}>Plan Gratuito</p>
          <p className="text-[11px]" style={{ color: '#9B9B9B' }}>Explora propiedades sin límite</p>
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="w-full py-[14px] rounded-full text-[14px] font-semibold border-none cursor-pointer transition-all active:scale-[.97]"
        style={{ background: 'white', color: '#C2714F', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
