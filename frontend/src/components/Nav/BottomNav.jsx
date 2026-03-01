import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { path: '/friends', label: 'Friends', icon: '👥' },
  { path: '/explore', label: 'Explore', icon: '🔍' },
  { path: '/map', label: 'Map', icon: '🗺️', isMap: true },
  { path: '/trees', label: 'My Trees', icon: '🌳' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

// ─── BottomNav ────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-end"
      style={{
        height: 64,
        background: t.navBg,
        borderTop: `1px solid ${t.navBorder}`,
        overflow: 'visible',
        transition: 'background 0.3s ease',
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path)

        // ── Map FAB ───────────────────────────────────────────────────────────
        if (tab.isMap) {
          return (
            <div key={tab.path} className="flex-1 flex justify-center">
              <motion.button
                className="flex items-center justify-center border-none cursor-pointer"
                style={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
                  borderRadius: 14,
                  position: 'relative',
                  top: -16,
                  boxShadow: '0 4px 16px rgba(45,106,79,0.5)',
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(tab.path)}
              >
                <span style={{ fontSize: 22, color: '#fff' }}>{tab.icon}</span>
              </motion.button>
            </div>
          )
        }

        // ── Standard tab ─────────────────────────────────────────────────────
        return (
          <motion.button
            key={tab.path}
            className="flex flex-col items-center justify-center flex-1 h-full cursor-pointer bg-transparent border-none gap-0.5"
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate(tab.path)}
          >
            <span className="text-[20px] leading-none">{tab.icon}</span>

            <span
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 600,
                fontSize: 9,
                color: active ? t.navActive : (isDark ? '#95D5B2' : '#1a1a1a'),
              }}
            >
              {tab.label}
            </span>

            {/* Active dot */}
            {active ? (
              <div className="rounded-full" style={{ width: 3, height: 3, background: t.navActive }} />
            ) : (
              <div style={{ width: 3, height: 3 }} />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
