import { useState, useEffect, createContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'

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
import FriendsPage from './pages/FriendsPage'
import RecentActivityPage from './pages/friends/RecentActivityPage'
import FriendTreesPage from './pages/friends/FriendTreesPage'
import YourCirclePage from './pages/friends/YourCirclePage'
import RequestsPage from './pages/friends/RequestsPage'
import FriendsSearchPage from './pages/friends/FriendsSearchPage'

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

// ─── WelcomePage ──────────────────────────────────────────────────────────────

function WelcomePage() {
  const nav = useNavigate()
  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#0D1F16' }}
    >
      {/* Gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 160% 65% at 50% 105%, rgba(27,188,101,0.25) 0%, transparent 60%),' +
            'radial-gradient(ellipse 90% 45% at 8% 95%, rgba(11,133,67,0.3) 0%, transparent 55%)',
        }}
      />

      {/* Logo */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>🌳</span>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.5px',
          }}
        >
          Communitree
        </p>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontWeight: 400,
            fontSize: 14,
            color: '#74C69D',
            marginTop: 8,
            textAlign: 'center',
            maxWidth: 220,
            lineHeight: '20px',
          }}
        >
          Grow your community, one event at a time.
        </p>
      </motion.div>

      {/* Get Started button */}
      <motion.button
        className="relative border-none cursor-pointer"
        style={{
          marginTop: 48,
          background: '#52B788',
          borderRadius: 14,
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 48,
          paddingRight: 48,
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
        }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        whileTap={{ scale: 0.96 }}
        onClick={() => nav('/register')}
      >
        Get Started 🌱
      </motion.button>

      {/* Already have account */}
      <motion.p
        className="relative"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          marginTop: 20,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        Already a member?{' '}
        <button
          className="bg-transparent border-none cursor-pointer p-0"
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: 13,
            color: '#74C69D',
            fontWeight: 600,
          }}
          onClick={() => nav('/login')}
        >
          Sign in
        </button>
      </motion.p>
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
    if (!session) return <Navigate to="/" replace />
    return children
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ session, setSession }}>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <BrowserRouter>
            <Routes>

              {/* ── Public routes ── */}
              <Route path="/" element={
                session ? <Navigate to="/map" replace /> : <WelcomePage />
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

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
              <Route path="/friends/activity" element={
                <ProtectedRoute><RecentActivityPage /></ProtectedRoute>
              } />
              <Route path="/friends/trees" element={
                <ProtectedRoute><FriendTreesPage /></ProtectedRoute>
              } />
              <Route path="/friends/circle" element={
                <ProtectedRoute><YourCirclePage /></ProtectedRoute>
              } />
              <Route path="/friends/requests" element={
                <ProtectedRoute><RequestsPage /></ProtectedRoute>
              } />
              <Route path="/friends/search" element={
                <ProtectedRoute><FriendsSearchPage /></ProtectedRoute>
              } />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
        </div>
      </AuthContext.Provider>
    </ThemeProvider>
  )
}

export default App
