import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { PreferenciaOnboarding } from '../types/database'

interface AuthContextValue {
  session:             Session | null
  loading:             boolean
  preferencias:        PreferenciaOnboarding | null
  signIn:              (email: string, password: string) => Promise<void>
  signUp:              (email: string, password: string, rol?: 'usuario' | 'asesor') => Promise<void>
  signInWithGoogle:    () => Promise<void>
  signOut:             () => Promise<void>
  refreshPreferencias: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,      setSession]      = useState<Session | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [preferencias, setPreferencias] = useState<PreferenciaOnboarding | null>(null)

  async function fetchPreferencias(userId: string) {
    const { data } = await supabase
      .from('preferencias_onboarding')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle()
    setPreferencias(data as PreferenciaOnboarding | null)
  }

  async function refreshPreferencias() {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) await fetchPreferencias(s.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) fetchPreferencias(data.session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) fetchPreferencias(s.user.id)
      else setPreferencias(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, rol: 'usuario' | 'asesor' = 'usuario') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user && !data.session) throw new Error('CONFIRM_EMAIL')
    // Trigger creates profile with rol='usuario'; promote to asesor when requested
    if (rol === 'asesor' && data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('perfiles').update({ rol: 'asesor' }).eq('id', data.user.id)
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      session, loading, preferencias,
      signIn, signUp, signInWithGoogle, signOut,
      refreshPreferencias,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
