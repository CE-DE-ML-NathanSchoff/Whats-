import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import MyTreesPage from './pages/MyTreesPage'
import TreesSearchPage from './pages/TreesSearchPage'
import FriendsPage from './pages/FriendsPage'
import FindFriendsPage from './pages/FindFriendsPage'
import RecentActivityPage from './pages/friends/RecentActivityPage'
import FriendTreesPage from './pages/friends/FriendTreesPage'
import YourCirclePage from './pages/friends/YourCirclePage'
import RequestsPage from './pages/friends/RequestsPage'
import FriendsSearchPage from './pages/friends/FriendsSearchPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-white text-lg">Loading...</span>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <span className="text-white text-lg">Loading...</span>
      </div>
    )
  }
  if (user) return <Navigate to="/map" replace />
  return children
}

// Base path when deployed at subpath (e.g. /communitree) — must match Vite base
const basename = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/onboarding" element={<GuestRoute><OnboardingPage /></GuestRoute>} />
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage onBack={() => window.history.back()} /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="/friends/activity" element={<ProtectedRoute><RecentActivityPage /></ProtectedRoute>} />
            <Route path="/friends/trees" element={<ProtectedRoute><FriendTreesPage /></ProtectedRoute>} />
            <Route path="/friends/circle" element={<ProtectedRoute><YourCirclePage /></ProtectedRoute>} />
            <Route path="/friends/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
            <Route path="/friends/search" element={<ProtectedRoute><FriendsSearchPage /></ProtectedRoute>} />
            <Route path="/find-friends" element={<ProtectedRoute><FindFriendsPage /></ProtectedRoute>} />
            <Route path="/trees" element={<ProtectedRoute><MyTreesPage /></ProtectedRoute>} />
            <Route path="/trees/search" element={<ProtectedRoute><TreesSearchPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}

export default App
