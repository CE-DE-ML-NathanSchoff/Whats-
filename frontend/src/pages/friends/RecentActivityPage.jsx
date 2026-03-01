import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BottomNav from '../../components/Nav/BottomNav'
import SideMenu from '../../components/Nav/SideMenu'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

const RECENT_ACTIVITY = [
  { id: 1, text: "Sarah watered 'Farmers Market' 💧", time: '2h ago', postId: 1 },
  { id: 2, text: "Mike tended 'Startup Meetup' 🌿", time: 'just now', postId: 3 },
  { id: 3, text: "3 friends watered 'Open Mic Night' 🌱", time: '5m ago', postId: 5 },
  { id: 4, text: "Jess watered 'Community Garden' 💧", time: '1h ago', postId: 4 },
  { id: 5, text: "Leo tended 'Community Cleanup' 🌿", time: '30m ago', postId: 2 },
  { id: 6, text: "Dana watered 'Book Swap at Library' 💧", time: '3h ago', postId: 5 },
  { id: 7, text: "Chris tended 'Yoga in the Park' 🌿", time: '4h ago', postId: 2 },
]

// ─── IconBack ─────────────────────────────────────────────────────────────────

function IconBack({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── RecentActivityPage ───────────────────────────────────────────────────────

export default function RecentActivityPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const [menuOpen, setMenuOpen] = useState(false)

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
            Recent Activity 🌱
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
            What your people are up to
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
        {RECENT_ACTIVITY.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
            onClick={() => console.log('Navigate to tree', item.postId)}
            className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer text-left"
            style={{ padding: '10px 20px' }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 32, height: 32, background: 'rgba(82,183,136,0.15)' }}
            >
              <span style={{ fontSize: 14 }}>🌱</span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.textPrimary }}
              >
                {item.text}
              </p>
            </div>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: t.sprout, flexShrink: 0 }}>
              {item.time}
            </span>
          </motion.button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
