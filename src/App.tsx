import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import PhoneShell, { type Screen } from './components/PhoneShell'
import LandingScreen from './screens/LandingScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import PropertyDetailScreen from './screens/PropertyDetailScreen'
import ReelsScreen from './screens/ReelsScreen'
import AdvisorDashboard from './screens/AdvisorDashboard'
import AdminDashboard from './screens/AdminDashboard'
import type { PropiedadMock } from './services/mockData'
import './App.css'

interface OnboardingResult {
  ciudad:        string | null
  tipoPropiedad: string | null
}

function App() {
  const [screen,           setScreen]           = useState<Screen>('landing')
  const [selectedProperty, setSelectedProperty] = useState<PropiedadMock | null>(null)
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult>({ ciudad: null, tipoPropiedad: null })

  function viewDetail(property: PropiedadMock) {
    setSelectedProperty(property)
    setScreen('detail')
  }

  return (
    <AuthProvider>
    <PhoneShell screen={screen} onNavigate={setScreen}>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('onboarding')}
          onExplore={() => setScreen('feed')}
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
        />
      )}
      {screen === 'reels' && <ReelsScreen />}
      {screen === 'advisor' && <AdvisorDashboard />}
      {screen === 'admin'   && <AdminDashboard />}
      {screen === 'saved' && (
        <div className="flex-1 flex items-center justify-center font-body text-[#6B6B6B]">
          <p>Pantalla «{screen}» — próximamente</p>
        </div>
      )}
    </PhoneShell>
    </AuthProvider>
  )
}

export default App
