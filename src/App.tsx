import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import PhoneShell, { type Screen } from './components/PhoneShell'
import AuthModal from './components/ui/AuthModal'
import LandingScreen from './screens/LandingScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import PropertyDetailScreen from './screens/PropertyDetailScreen'
import ReelsScreen from './screens/ReelsScreen'
import AdvisorDashboard from './screens/AdvisorDashboard'
import AdminDashboard from './screens/AdminDashboard'
import ProfileScreen from './screens/ProfileScreen'
import AsesorProfileScreen from './screens/AsesorProfileScreen'
import type { PropiedadMock } from './services/mockData'
import './App.css'

interface OnboardingResult {
  ciudad:        string | null
  tipoPropiedad: string | null
}

function AppContent() {
  const { preferencias, session: authSession } = useAuth()
  const [screen,           setScreen]           = useState<Screen>('landing')
  const [selectedProperty,  setSelectedProperty]  = useState<PropiedadMock | null>(null)
  const [asesorPerfilId,    setAsesorPerfilId]    = useState<string | null>(null)
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult>({ ciudad: null, tipoPropiedad: null })
  const [showAppAuthModal, setShowAppAuthModal] = useState(false)
  const [authModalMode,    setAuthModalMode]    = useState<'login' | 'register'>('login')

  // Sync DiscoverScreen filters when user updates saved preferences from ProfileScreen
  useEffect(() => {
    if (preferencias) {
      setOnboardingResult({
        ciudad:        preferencias.ciudad        || null,
        tipoPropiedad: preferencias.tipo_propiedad || null,
      })
    }
  }, [preferencias])

  // Redirect to landing when session is cleared (sign-out from any protected screen)
  useEffect(() => {
    const protectedScreens: Screen[] = ['admin', 'advisor', 'profile']
    if (!authSession && protectedScreens.includes(screen)) {
      setScreen('landing')
    }
  }, [authSession, screen])

  function openAuthModal(mode: 'login' | 'register') {
    setAuthModalMode(mode)
    setShowAppAuthModal(true)
  }

  async function navigateByRole() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', session.user.id)
      .maybeSingle()
    const rol = (profile as { rol?: string } | null)?.rol ?? 'usuario'
    if (rol === 'admin')   setScreen('admin')
    else if (rol === 'asesor') setScreen('advisor')
    else setScreen('profile')
  }

  function handleNavigate(target: Screen) {
    if (target === 'advisor') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setShowAppAuthModal(true)
        } else {
          navigateByRole()
        }
      })
      return
    }
    setScreen(target)
  }

  function viewDetail(property: PropiedadMock) {
    setSelectedProperty(property)
    setScreen('detail')
  }

  return (
    <PhoneShell screen={screen} onNavigate={handleNavigate}>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('onboarding')}
          onExplore={() => setScreen('feed')}
          onLogin={() => openAuthModal('login')}
          onRegister={() => openAuthModal('register')}
        />
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen
          onComplete={(data) => {
            setOnboardingResult({ ciudad: data.ciudad, tipoPropiedad: data.tipoPropiedad })
            setScreen('feed')
          }}
        />
      )}
      {screen === 'feed' && (
        <DiscoverScreen
          onViewDetail={viewDetail}
          ciudadInicial={onboardingResult.ciudad ?? undefined}
          tipoInicial={onboardingResult.tipoPropiedad ?? undefined}
        />
      )}
      {screen === 'detail' && selectedProperty && (
        <PropertyDetailScreen
          property={selectedProperty}
          onBack={() => setScreen('feed')}
          onViewAsesorPerfil={(id) => { setAsesorPerfilId(id); setScreen('asesor-perfil') }}
        />
      )}
      {screen === 'asesor-perfil' && asesorPerfilId && (
        <AsesorProfileScreen
          asesorId={asesorPerfilId}
          onBack={() => { setScreen('detail'); setAsesorPerfilId(null) }}
        />
      )}
      {screen === 'reels'   && <ReelsScreen />}
      {screen === 'advisor' && <AdvisorDashboard />}
      {screen === 'admin'   && <AdminDashboard />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'saved' && (
        <div className="flex-1 flex items-center justify-center font-body text-[#6B6B6B]">
          <p>Guardados — próximamente</p>
        </div>
      )}

      {/* App-level auth modal — triggered by "Asesor" nav tap when unauthenticated */}
      <AnimatePresence>
        {showAppAuthModal && (
          <AuthModal
            initialMode={authModalMode}
            onRegister={async () => {
              setShowAppAuthModal(false)
              await navigateByRole()
            }}
            onDismiss={() => setShowAppAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </PhoneShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
