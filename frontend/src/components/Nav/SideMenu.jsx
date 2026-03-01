import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

// ─── Section IDs (kept for backward-compat) ───────────────────────────────────

export const FRIENDS_SECTION_IDS = {
  RECENT_ACTIVITY: 'recent-activity',
  FRIEND_TREES: 'friend-trees',
  YOUR_CIRCLE: 'your-circle',
  REQUESTS: 'requests',
}

const MENU_ITEMS = [
  { route: '/friends', icon: '👥', label: 'Activity from Friends' },
  { route: '/friends/activity', icon: '🌱', label: 'Recent Activity' },
  { route: '/friends/trees', icon: '🌳', label: "Friends' Trees" },
  { route: '/friends/circle', icon: '⭕', label: 'Your Circle' },
  { route: '/friends/requests', icon: '🔔', label: 'Requests' },
]

// ─── SideMenu ────────────────────────────────────────────────────────────────

export default function SideMenu({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  function handleSelect(route) {
    navigate(route)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: '#000' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 z-50 w-[260px]"
            style={{
              background: t.bg,
              borderRight: `1px solid ${t.border}`,
              borderRadius: '0 20px 20px 0',
              transition: 'background 0.3s ease',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="pt-16 px-4">
              {MENU_ITEMS.map((item) => {
                const active = location.pathname === item.route
                return (
                  <motion.button
                    key={item.route}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(item.route)}
                    className="w-full text-left border-none cursor-pointer rounded-xl py-3 px-4 mb-1"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? t.light : t.textPrimary,
                      background: active ? 'rgba(82,183,136,0.15)' : 'transparent',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
