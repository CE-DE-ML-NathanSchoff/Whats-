import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  { path: '/map',     label: 'Map',      icon: '🗺️' },
  { path: '/friends', label: 'Friends',  icon: '👥' },
  { path: '/trees',   label: 'My Trees', icon: '🌳' },
  { path: '/profile', label: 'Profile',  icon: '👤' },
]

// ─── BottomNav ────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-center"
      style={{
        height: 64,
        background: '#0a1a0f',
        borderTop: '1px solid rgba(82,183,136,0.12)',
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path)

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
                fontWeight: 400,
                fontSize: 9,
                color: active ? '#52B788' : '#3a5a45',
              }}
            >
              {tab.label}
            </span>

            {/* Active dot */}
            {active ? (
              <div
                className="rounded-full"
                style={{ width: 3, height: 3, background: '#52B788' }}
              />
            ) : (
              <div style={{ width: 3, height: 3 }} />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
