import { useState, useEffect, createContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export const AuthContext = createContext(null)

import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import MyTreesPage from './pages/MyTreesPage'
import TreesSearchPage from './pages/TreesSearchPage'
import FindFriendsPage from './pages/FindFriendsPage'
import FriendsPage     from './pages/FriendsPage'

// ─── SplashScreen ─────────────────────────────────────────────────────────────

function SplashScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0D1F16',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize: 24,
          color: '#fff',
          margin: 0,
        }}
      >
        Communitree 🌳
      </p>
      <motion.div
        className="rounded-full"
        style={{ width: 8, height: 8, background: '#52B788' }}
        animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mocking an initial loading delay for realism, then checking local storage conceptually (omitted for simplicity)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <SplashScreen />

  const ProtectedRoute = ({ children }) => {
    if (!session) return <Navigate to="/login" replace />
    return children
  }

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <BrowserRouter>
          <Routes>

            {/* ── Public routes ── */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={
              session ? <Navigate to="/map" replace /> : <LoginPage />
            } />
            <Route path="/register" element={
              session ? <Navigate to="/map" replace /> : <RegisterPage />
            } />

            {/* ── Root redirect ── */}
            <Route path="/" element={
              <Navigate to={session ? '/map' : '/login'} replace />
            } />

            {/* ── Protected routes ── */}
            <Route path="/map" element={
              <ProtectedRoute><MapPage /></ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute><ExplorePage /></ProtectedRoute>
            } />
            <Route path="/trees" element={
              <ProtectedRoute><MyTreesPage /></ProtectedRoute>
            } />
            <Route path="/trees/search" element={
              <ProtectedRoute><TreesSearchPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage onBack={() => window.history.back()} />
              </ProtectedRoute>
            } />
            <Route path="/friends" element={
              <ProtectedRoute><FriendsPage /></ProtectedRoute>
            } />
            <Route path="/find-friends" element={
              <ProtectedRoute><FindFriendsPage /></ProtectedRoute>
            } />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  )
}

export default App
