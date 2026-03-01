import { motion, AnimatePresence } from 'framer-motion'

// ─── Section IDs (must match FriendsPage section ids) ─────────────────────────

export const FRIENDS_SECTION_IDS = {
  RECENT_ACTIVITY: 'recent-activity',
  FRIEND_TREES: 'friend-trees',
  YOUR_CIRCLE: 'your-circle',
  REQUESTS: 'requests',
}

const MENU_ITEMS = [
  { id: FRIENDS_SECTION_IDS.RECENT_ACTIVITY, label: '🌱 Recent Activity' },
  { id: FRIENDS_SECTION_IDS.FRIEND_TREES,     label: "Friends' Trees 🌳" },
  { id: FRIENDS_SECTION_IDS.YOUR_CIRCLE,     label: '👤 Your Circle' },
  { id: FRIENDS_SECTION_IDS.REQUESTS,        label: '🔔 Requests' },
]

// ─── SideMenu ────────────────────────────────────────────────────────────────

export default function SideMenu({ open, onClose, activeSection, onSelectSection }) {
  function handleSelect(id) {
    onSelectSection?.(id)
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
              background: '#0D1F16',
              borderRight: '1px solid rgba(82,183,136,0.15)',
              borderRadius: '0 20px 20px 0',
            }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="pt-16 px-4">
              {MENU_ITEMS.map((item) => {
                const active = activeSection === item.id
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(item.id)}
                    className="w-full text-left border-none cursor-pointer rounded-xl py-3 px-4 mb-1"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#52B788' : '#fff',
                      background: active ? 'rgba(82,183,136,0.15)' : 'transparent',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {item.label}
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
