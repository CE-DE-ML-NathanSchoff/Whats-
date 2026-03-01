import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Splash from './pages/Splash'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import MyTreesPage from './pages/MyTreesPage'
import TreesSearchPage from './pages/TreesSearchPage'
import FriendsPage from './pages/FriendsPage'
import FindFriendsPage from './pages/FindFriendsPage'

function App() {
  const [phase, setPhase] = useState('splash') // 'splash' | 'fading' | 'onboarding' | 'login' | 'register' | 'app'

  useEffect(() => {
    const fadeOut       = setTimeout(() => setPhase('fading'),      2200)
    const showOnboarding = setTimeout(() => setPhase('onboarding'), 2900)
    return () => {
      clearTimeout(fadeOut)
      clearTimeout(showOnboarding)
    }
  }, [])

  // Pre-router phases (splash → onboarding → login/register)
  if (phase !== 'app') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {(phase === 'splash' || phase === 'fading') && (
          <div
            className="transition-opacity duration-700"
            style={{ opacity: phase === 'fading' ? 0 : 1 }}
          >
            <Splash />
          </div>
        )}

        {phase === 'onboarding' && (
          <div className="animate-fade-in">
            <OnboardingPage onComplete={() => setPhase('login')} />
          </div>
        )}

        {phase === 'login' && (
          <div className="animate-fade-in">
            <LoginPage
              onLogin={() => setPhase('app')}
              onRegister={() => setPhase('register')}
            />
          </div>
        )}

        {phase === 'register' && (
          <div className="animate-fade-in">
            <RegisterPage
              onCreate={() => setPhase('app')}
              onLogin={() => setPhase('login')}
            />
          </div>
        )}
      </div>
    )
  }

  // Main app — router-driven
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Navigate to="/map" replace />} />
          <Route path="/map"     element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage onBack={() => window.history.back()} />} />
          <Route path="/explore"      element={<ExplorePage />} />
          <Route path="/friends"      element={<FriendsPage />} />
          <Route path="/find-friends" element={<FindFriendsPage />} />
          <Route path="/trees"        element={<MyTreesPage />} />
          <Route path="/trees/search" element={<TreesSearchPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
