import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../../components/Nav/BottomNav'
import SideMenu from '../../components/Nav/SideMenu'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

const INITIAL_REQUESTS = [
  { id: 10, username: 'Dana T.', initials: 'DT', mutual: 2 },
  { id: 11, username: 'Chris W.', initials: 'CW', mutual: 5 },
  { id: 12, username: 'Sam L.', initials: 'SL', mutual: 1 },
]

function IconBack({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RequestsPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const [menuOpen, setMenuOpen] = useState(false)
  const [requests, setRequests] = useState(INITIAL_REQUESTS)

  const handleAccept = (id) => setRequests((r) => r.filter((req) => req.id !== id))
  const handleDecline = (id) => setRequests((r) => r.filter((req) => req.id !== id))

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden flex flex-col"
      style={{ background: t.bg, transition: 'background 0.3s ease' }}
    >
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Header */}
      <div className="flex-shrink-0 px-4 flex items-center gap-3" style={{ paddingTop: 56 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setMenuOpen(true)}
          className="flex-shrink-0 bg-transparent border-none cursor-pointer p-2 -m-2"
        >
          <span style={{ fontSize: 22, lineHeight: 1, color: t.textPrimary }}>☰</span>
        </motion.button>

        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: t.textPrimary, marginBottom: 2 }}>
            Requests 🔔
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
            {requests.length} pending
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate('/friends/search')}
          className="flex-shrink-0 border-none cursor-pointer flex items-center justify-center"
          style={{
            width: 36, height: 36,
            background: 'rgba(45,106,79,0.2)',
            border: '1px solid rgba(82,183,136,0.2)',
            borderRadius: 10,
            fontSize: 16,
          }}
          aria-label="Search friends"
        >
          🔍
        </motion.button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto mt-4" style={{ paddingBottom: 80, scrollbarWidth: 'none' }}>
        <AnimatePresence>
          {requests.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center pt-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span style={{ fontSize: 48, marginBottom: 16 }}>🎉</span>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: t.textPrimary }}>
                All caught up!
              </p>
              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: t.sprout, marginTop: 6 }}>
                No pending requests
              </p>
            </motion.div>
          ) : (
            requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-3"
                style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 40, height: 40, background: 'rgba(82,183,136,0.15)' }}
                >
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: t.light }}>
                    {req.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: t.textPrimary }}>
                    {req.username}
                  </p>
                  <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: t.sprout }}>
                    {req.mutual} mutual friends
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleAccept(req.id)}
                    className="border-none cursor-pointer rounded-[8px] px-3 py-1"
                    style={{ background: '#52B788', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: '#fff' }}
                  >
                    Accept
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleDecline(req.id)}
                    className="border-none cursor-pointer rounded-[8px] px-3 py-1"
                    style={{ background: 'rgba(82,183,136,0.15)', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: t.sprout }}
                  >
                    Decline
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
