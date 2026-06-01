import { useState } from 'react'
import PhoneShell, { type Screen } from './components/PhoneShell'
import LandingScreen from './screens/LandingScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import './App.css'

function App() {
  const [screen, setScreen] = useState<Screen>('landing')

  return (
    <PhoneShell screen={screen} onNavigate={setScreen}>
      {screen === 'landing' && (
        <LandingScreen
          onStart={() => setScreen('onboarding')}
          onExplore={() => setScreen('feed')}
        />
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={() => setScreen('feed')} />
      )}
      {screen === 'feed' && (
        <DiscoverScreen />
      )}
      {(screen === 'reels' || screen === 'saved' || screen === 'advisor') && (
        <div className="flex-1 flex items-center justify-center font-body text-[#6B6B6B]">
          <p>Pantalla «{screen}» — próximamente</p>
        </div>
      )}
    </PhoneShell>
  )
}

export default App
