import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BottomNav from '../../components/Nav/BottomNav'
import SideMenu from '../../components/Nav/SideMenu'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

const FRIEND_TREES = [
  { id: 1, title: 'Saturday Farmers Market 🌽', content: 'Fresh local produce every Saturday morning at Clark Park.', waters_count: 12, growth_stage: 'oak', branch_count: 2, friends_watering: 4, time_label: 'Sat 8am' },
  { id: 3, title: 'Community Cleanup 🌳', content: 'Monthly cleanup crew keeping our streets beautiful.', waters_count: 8, growth_stage: 'tree', branch_count: 1, friends_watering: 3, time_label: 'Sun 10am' },
  { id: 5, title: 'Book Swap at Library 📚', content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library.', waters_count: 7, growth_stage: 'tree', branch_count: 2, friends_watering: 2, time_label: 'Tue 5pm' },
  { id: 2, title: 'Sunday Morning Yoga 🧘', content: 'Free community yoga in Fairmount Park every Sunday at 8am.', waters_count: 4, growth_stage: 'sapling', branch_count: 0, friends_watering: 1, time_label: 'Sun 8am' },
  { id: 4, title: 'Community Garden 🌿', content: 'New raised beds available for the season.', waters_count: 2, growth_stage: 'sprout', branch_count: 0, friends_watering: 1, time_label: 'Mon 9am' },
]

function IconBack({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FriendTreesPage() {
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
            Friends' Trees 🌳
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
            Events your people are growing
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

      {/* Cards */}
      <div className="flex-1 overflow-y-auto mt-4" style={{ paddingBottom: 80, scrollbarWidth: 'none' }}>
        {FRIEND_TREES.map((post, i) => {
          const color = stageColor[post.growth_stage] ?? '#6B7280'
          const emoji = stageEmoji[post.growth_stage] ?? '🌰'
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.28, ease: 'easeOut' }}
              className="mx-4 mb-3"
              style={{
                background: t.bgCard,
                borderRadius: 16,
                border: isDark ? `1px solid ${t.border}` : 'none',
                boxShadow: isDark ? 'none' : '0 1px 8px rgba(45,106,79,0.1)',
                padding: 16,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="rounded-full px-2.5 py-0.5 capitalize"
                  style={{ background: color + '33', color, fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600 }}
                >
                  {emoji} {post.growth_stage}
                </span>
                <span style={{ color: t.sprout, fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
                  {post.time_label}
                </span>
              </div>
              <p className="mb-1.5" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: t.textPrimary }}>
                {post.title}
              </p>
              <p
                className="mb-3"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 12, color: t.pale, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {post.content}
              </p>
              <div className="flex items-center gap-3">
                <span style={{ color: t.sprout, fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>💧 {post.waters_count} waters</span>
                <span style={{ color: t.light, fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>🌿 {post.branch_count} branches</span>
                {post.friends_watering > 0 && (
                  <span style={{ color: '#7DD3F0', fontSize: 11, fontFamily: "'Roboto', sans-serif", marginLeft: 'auto' }}>
                    👥 {post.friends_watering} friends
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
