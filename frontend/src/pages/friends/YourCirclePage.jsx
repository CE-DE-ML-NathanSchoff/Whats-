import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BottomNav from '../../components/Nav/BottomNav'
import SideMenu from '../../components/Nav/SideMenu'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

const MY_CIRCLE = [
  { id: 1, username: 'Sarah M.', initials: 'SM', waters_count: 24, branch_count: 3, lastActive: '2h ago' },
  { id: 2, username: 'Mike R.', initials: 'MR', waters_count: 18, branch_count: 5, lastActive: 'just now' },
  { id: 3, username: 'Jess K.', initials: 'JK', waters_count: 11, branch_count: 1, lastActive: '1h ago' },
  { id: 4, username: 'Leo P.', initials: 'LP', waters_count: 9, branch_count: 2, lastActive: '30m ago' },
  { id: 5, username: 'Dana T.', initials: 'DT', waters_count: 7, branch_count: 0, lastActive: 'Yesterday' },
  { id: 6, username: 'Chris W.', initials: 'CW', waters_count: 5, branch_count: 1, lastActive: '2d ago' },
]

function IconBack({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function YourCirclePage() {
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
            Your Circle 👤
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
            {MY_CIRCLE.length} friends growing with you
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
        {MY_CIRCLE.map((friend, i) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
            className="flex items-center gap-3"
            style={{ padding: '10px 20px', borderBottom: `1px solid ${t.border}` }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 40, height: 40, background: '#2D6A4F' }}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}>
                {friend.initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: t.textPrimary }}>
                {friend.username}
              </p>
              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: t.sprout }}>
                💧 {friend.waters_count} · 🌿 {friend.branch_count}
              </p>
            </div>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: t.light }}>
              {friend.lastActive}
            </span>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
