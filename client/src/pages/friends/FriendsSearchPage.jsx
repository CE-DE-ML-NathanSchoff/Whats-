import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../../components/Nav/BottomNav'
import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

// ─── Mock data (mirrors FriendsPage) ─────────────────────────────────────────

const RECENT_ACTIVITY = [
  { id: 1, text: "Sarah watered 'Farmers Market' 💧", time: '2h ago', postId: 1 },
  { id: 2, text: "Mike tended 'Startup Meetup' 🌿", time: 'just now', postId: 3 },
  { id: 3, text: "3 friends watered 'Open Mic Night' 🌱", time: '5m ago', postId: 5 },
  { id: 4, text: "Jess watered 'Community Garden' 💧", time: '1h ago', postId: 4 },
  { id: 5, text: "Leo tended 'Community Cleanup' 🌿", time: '30m ago', postId: 2 },
  { id: 6, text: "Dana watered 'Book Swap at Library' 💧", time: '3h ago', postId: 5 },
  { id: 7, text: "Chris tended 'Yoga in the Park' 🌿", time: '4h ago', postId: 2 },
]

const FRIEND_TREES = [
  { id: 1, title: 'Saturday Farmers Market 🌽', content: 'Fresh local produce every Saturday morning at Clark Park.', waters_count: 12, growth_stage: 'oak', branch_count: 2, friends_watering: 4, time_label: 'Sat 8am' },
  { id: 3, title: 'Community Cleanup 🌳', content: 'Monthly cleanup crew keeping our streets beautiful.', waters_count: 8, growth_stage: 'tree', branch_count: 1, friends_watering: 3, time_label: 'Sun 10am' },
  { id: 5, title: 'Book Swap at Library 📚', content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library.', waters_count: 7, growth_stage: 'tree', branch_count: 2, friends_watering: 2, time_label: 'Tue 5pm' },
  { id: 2, title: 'Sunday Morning Yoga 🧘', content: 'Free community yoga in Fairmount Park every Sunday at 8am.', waters_count: 4, growth_stage: 'sapling', branch_count: 0, friends_watering: 1, time_label: 'Sun 8am' },
  { id: 4, title: 'Community Garden 🌿', content: 'New raised beds available for the season.', waters_count: 2, growth_stage: 'sprout', branch_count: 0, friends_watering: 1, time_label: 'Mon 9am' },
]

const MY_CIRCLE = [
  { id: 1, username: 'Sarah M.', initials: 'SM', waters_count: 24, branch_count: 3, lastActive: '2h ago' },
  { id: 2, username: 'Mike R.', initials: 'MR', waters_count: 18, branch_count: 5, lastActive: 'just now' },
  { id: 3, username: 'Jess K.', initials: 'JK', waters_count: 11, branch_count: 1, lastActive: '1h ago' },
  { id: 4, username: 'Leo P.', initials: 'LP', waters_count: 9, branch_count: 2, lastActive: '30m ago' },
  { id: 5, username: 'Dana T.', initials: 'DT', waters_count: 7, branch_count: 0, lastActive: 'Yesterday' },
  { id: 6, username: 'Chris W.', initials: 'CW', waters_count: 5, branch_count: 1, lastActive: '2d ago' },
]

const REQUESTS = [
  { id: 10, username: 'Dana T.', initials: 'DT', mutual: 2 },
  { id: 11, username: 'Chris W.', initials: 'CW', mutual: 5 },
  { id: 12, username: 'Sam L.', initials: 'SL', mutual: 1 },
]

const stageColor = { seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700' }
const stageEmoji = { seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟' }

// ─── Filter options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: 'All',              icon: '✨', value: 'all'      },
  { label: 'Recent Activity',  icon: '🌱', value: 'activity' },
  { label: "Friends' Trees",   icon: '🌳', value: 'trees'    },
  { label: 'Your Circle',      icon: '⭕', value: 'circle'   },
  { label: 'Requests',         icon: '🔔', value: 'requests' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function IconBack({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectionLabel({ children, count, onSeeAll }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <div className="flex items-center justify-between px-5 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: t.textPrimary }}>
          {children}
        </p>
        {count !== null && (
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#52B788', flexShrink: 0 }}>
            {count} result{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="bg-transparent border-none cursor-pointer flex-shrink-0"
          style={{ fontFamily: "'Roboto', sans-serif", fontSize: 12, color: '#52B788' }}
        >
          See all →
        </button>
      )}
    </div>
  )
}

function ActivityRow({ item, index }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3"
      style={{ padding: '10px 20px' }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 32, height: 32, background: 'rgba(82,183,136,0.15)' }}
      >
        <span style={{ fontSize: 14 }}>🌱</span>
      </div>
      <p className="flex-1 truncate" style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: t.textPrimary }}>
        {item.text}
      </p>
      <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: t.sprout, flexShrink: 0 }}>
        {item.time}
      </span>
    </motion.div>
  )
}

function TreeRow({ post, index }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const color = stageColor[post.growth_stage] ?? '#6B7280'
  const emoji = stageEmoji[post.growth_stage] ?? '🌰'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: 'easeOut' }}
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
        <span style={{ color: t.sprout, fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>{post.time_label}</span>
      </div>
      <p className="mb-1" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: t.textPrimary }}>
        {post.title}
      </p>
      <p
        className="mb-2"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 12,
          color: t.pale,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.content}
      </p>
      <div className="flex items-center gap-3">
        <span style={{ color: '#74C69D', fontSize: 11 }}>💧 {post.waters_count}</span>
        <span style={{ color: '#52B788', fontSize: 11 }}>🌿 {post.branch_count}</span>
        {post.friends_watering > 0 && (
          <span style={{ color: '#7DD3F0', fontSize: 11, marginLeft: 'auto' }}>👥 {post.friends_watering} friends</span>
        )}
      </div>
    </motion.div>
  )
}

function CircleRow({ friend, index }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3"
      style={{ padding: '10px 20px', borderBottom: `1px solid ${t.border}` }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 36, height: 36, background: '#2D6A4F' }}
      >
        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: '#fff' }}>
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
      <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: t.light }}>{friend.lastActive}</span>
    </motion.div>
  )
}

function RequestRow({ req, index }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3"
      style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border}` }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 36, height: 36, background: 'rgba(82,183,136,0.15)' }}
      >
        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: t.light }}>
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
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="border-none cursor-pointer rounded-[8px] px-3 py-1"
          style={{ background: '#52B788', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: '#fff' }}
        >
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="border-none cursor-pointer rounded-[8px] px-3 py-1"
          style={{ background: 'rgba(82,183,136,0.15)', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: t.sprout }}
        >
          Decline
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── FriendsSearchPage ────────────────────────────────────────────────────────

export default function FriendsSearchPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const inputRef = useRef(null)

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(id)
  }, [])

  const q = query.toLowerCase()
  const hasQuery = q.length > 0

  const filteredActivity = RECENT_ACTIVITY.filter(i => !hasQuery || i.text.toLowerCase().includes(q))
  const filteredTrees    = FRIEND_TREES.filter(p  => !hasQuery || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
  const filteredCircle   = MY_CIRCLE.filter(f    => !hasQuery || f.username.toLowerCase().includes(q))
  const filteredRequests = REQUESTS.filter(r     => !hasQuery || r.username.toLowerCase().includes(q))

  // Visible sets based on active filter
  const visActivity  = (activeFilter === 'all' || activeFilter === 'activity') ? filteredActivity : []
  const visTrees     = (activeFilter === 'all' || activeFilter === 'trees')    ? filteredTrees    : []
  const visCircle    = (activeFilter === 'all' || activeFilter === 'circle')   ? filteredCircle   : []
  const visRequests  = (activeFilter === 'all' || activeFilter === 'requests') ? filteredRequests : []

  const totalResults = visActivity.length + visTrees.length + visCircle.length + visRequests.length
  const isEmpty = hasQuery && totalResults === 0

  // Preview mode: all sections, no query — show first 3 items + "See all →"
  const previewMode = activeFilter === 'all' && !hasQuery
  const clip = (arr) => previewMode ? arr.slice(0, 3) : arr

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden flex flex-col"
      style={{ background: t.bg, transition: 'background 0.3s ease' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 flex items-center gap-3" style={{ paddingTop: 56 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          className="flex-shrink-0 bg-transparent border-none cursor-pointer p-2 -m-2"
        >
          <IconBack color={t.textPrimary} />
        </motion.button>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: t.textPrimary, flex: 1, textAlign: 'center' }}>
          Search 🔍
        </h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Search input */}
      <div className="flex-shrink-0 mx-4 mt-3">
        <div
          className="flex items-center gap-2 px-4"
          style={{
            height: 48,
            background: 'rgba(45,106,79,0.2)',
            border: '1px solid rgba(82,183,136,0.25)',
            borderRadius: 14,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>🔍</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none"
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: t.textPrimary }}
            placeholder="Search friends, trees, activity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                onClick={() => setQuery('')}
                className="bg-transparent border-none cursor-pointer flex-shrink-0 flex items-center justify-center"
                style={{ color: t.pale, fontSize: 14, padding: 0, lineHeight: 1 }}
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter pills */}
      <div
        className="flex-shrink-0 flex gap-2 mt-3 px-4"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = activeFilter === opt.value
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(opt.value)}
              className="flex-shrink-0 border-none cursor-pointer flex items-center gap-1.5"
              style={{
                background: active ? '#2D6A4F' : 'rgba(45,106,79,0.2)',
                border: `1px solid ${active ? '#2D6A4F' : 'rgba(82,183,136,0.2)'}`,
                color: active ? '#fff' : '#74C69D',
                borderRadius: 20,
                padding: '6px 14px',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto mt-3" style={{ paddingBottom: 80, scrollbarWidth: 'none' }}>
        {isEmpty ? (
          <motion.div
            className="flex flex-col items-center justify-center pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span style={{ fontSize: 48, marginBottom: 12 }}>🔍</span>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: t.textPrimary }}>
              Nothing found
            </p>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: t.sprout, marginTop: 6 }}>
              Try a different search
            </p>
          </motion.div>
        ) : (
          <>
            {visActivity.length > 0 && (
              <div className="mb-2">
                <SectionLabel
                  count={hasQuery ? visActivity.length : null}
                  onSeeAll={previewMode ? () => navigate('/friends/activity') : null}
                >
                  🌱 Recent Activity
                </SectionLabel>
                {clip(visActivity).map((item, i) => (
                  <ActivityRow key={item.id} item={item} index={i} />
                ))}
              </div>
            )}

            {visTrees.length > 0 && (
              <div className="mb-2">
                <SectionLabel
                  count={hasQuery ? visTrees.length : null}
                  onSeeAll={previewMode ? () => navigate('/friends/trees') : null}
                >
                  🌳 Friends&apos; Trees
                </SectionLabel>
                {clip(visTrees).map((post, i) => (
                  <TreeRow key={post.id} post={post} index={i} />
                ))}
              </div>
            )}

            {visCircle.length > 0 && (
              <div className="mb-2">
                <SectionLabel
                  count={hasQuery ? visCircle.length : null}
                  onSeeAll={previewMode ? () => navigate('/friends/circle') : null}
                >
                  ⭕ Your Circle
                </SectionLabel>
                {clip(visCircle).map((friend, i) => (
                  <CircleRow key={friend.id} friend={friend} index={i} />
                ))}
              </div>
            )}

            {visRequests.length > 0 && (
              <div className="mb-2">
                <SectionLabel
                  count={hasQuery ? visRequests.length : null}
                  onSeeAll={previewMode ? () => navigate('/friends/requests') : null}
                >
                  🔔 Requests
                </SectionLabel>
                {visRequests.map((req, i) => (
                  <RequestRow key={req.id} req={req} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
