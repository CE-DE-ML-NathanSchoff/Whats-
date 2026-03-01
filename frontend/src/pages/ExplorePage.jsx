import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FilterSheet from '../components/Map/FilterSheet'
import BottomNav from '../components/Nav/BottomNav'
import SkeletonCard from '../components/UI/SkeletonCard'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/theme'

// ─── Stage data ───────────────────────────────────────────────────────────────

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

// ─── Sort tabs ────────────────────────────────────────────────────────────────

const SORT_TABS = [
  { id: 'Most Watered', label: '💧 Most Watered' },
  { id: 'Newest', label: '🌱 Newest' },
  { id: 'Branches', label: '🌿 Branches' },
  { id: 'Trending', label: '🔥 Trending' },
  { id: 'Nearby', label: '📍 Nearby' },
]

// ─── Test data ────────────────────────────────────────────────────────────────

const EXPLORE_POSTS = [
  {
    id: 1,
    title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park. Bring your own bags!',
    lat: 39.9541, lng: -75.1878,
    waters_count: 0, growth_stage: 'seed', is_branch: false,
    branch_count: 0, time_label: 'Sat 8am',
    author: { username: '@mariag', initials: 'MG', user_type: 'local', verified: false },
  },
  {
    id: 2,
    title: 'Sunday Morning Yoga 🧘',
    content: 'Free community yoga in Fairmount Park every Sunday at 8am. All levels welcome.',
    lat: 39.9726, lng: -75.1895,
    waters_count: 4, growth_stage: 'sapling', is_branch: true, parent_id: 3,
    branch_count: 0, time_label: '2h ago',
    author: { username: '@alexr', initials: 'AR', user_type: 'local', verified: false },
  },
  {
    id: 3,
    title: 'Community Cleanup 🌳',
    content: 'Monthly cleanup crew keeping our streets beautiful. Gloves and bags provided!',
    lat: 39.9621, lng: -75.1712,
    waters_count: 12, growth_stage: 'oak', is_branch: false,
    branch_count: 1, time_label: 'Sun 10am',
    author: { username: '@samw', initials: 'SW', user_type: 'local', verified: false },
  },
  {
    id: 4,
    title: 'Community Garden 🌿',
    content: 'New raised beds available for the season. Sign up at the rec center.',
    lat: 39.9448, lng: -75.1602,
    waters_count: 2, growth_stage: 'sprout', is_branch: false,
    branch_count: 0, time_label: 'Mon 9am',
    author: { username: '@clarkparkrec', initials: 'CP', user_type: 'business', verified: true },
  },
  {
    id: 5,
    title: 'Book Swap at Library 📚',
    content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library. All genres welcome.',
    lat: 39.9381, lng: -75.1823,
    waters_count: 7, growth_stage: 'tree', is_branch: false,
    branch_count: 2, time_label: 'Tue 5pm',
    author: { username: '@kingsessinglibrary', initials: 'KL', user_type: 'business', verified: true },
  },
]

const DEFAULT_FILTERS = {
  stages: [], distance: '10 mi', time: 'Any', type: 'All', sort: 'Newest',
}

// ─── AuthorRow ────────────────────────────────────────────────────────────────

function AuthorRow({ author }) {
  const isBusiness = author.user_type === 'business'
  const borderColor = isBusiness ? '#FFD700' : '#52B788'

  return (
    <button
      type="button"
      onClick={() => console.log('view author')}
      className="flex items-center bg-transparent border-none cursor-pointer p-0 mb-2"
      style={{ gap: 6 }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#2D6A4F',
          border: `1.5px solid ${borderColor}`,
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 9,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: 0,
          }}
        >
          {author.initials}
        </span>
      </div>

      {/* Username + verified check */}
      <span
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          fontSize: 11,
          color: '#74C69D',
        }}
      >
        {author.username}
      </span>
      {isBusiness && author.verified && (
        <span style={{ fontSize: 11, color: '#FFD700', lineHeight: 1 }}>✓</span>
      )}
    </button>
  )
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({ post, index }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const color = stageColor[post.growth_stage] ?? '#6B7280'
  const emoji = stageEmoji[post.growth_stage] ?? '🌰'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: 'easeOut' }}
      className="mx-4 mb-3"
      style={{
        background: t.bgCard,
        borderRadius: 16,
        border: isDark ? `1px solid ${t.border}` : 'none',
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(45,106,79,0.1)',
        padding: 16,
      }}
    >
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-white capitalize"
          style={{
            background: color + '33',
            color,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {emoji} {post.growth_stage}
        </span>
        <span style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          {post.time_label}
        </span>
      </div>

      {/* Title */}
      <p
        className="mb-1.5"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: t.textPrimary,
        }}
      >
        {post.title}
      </p>

      {/* Author */}
      {post.author && <AuthorRow author={post.author} />}

      {/* Content preview — 2 lines */}
      <p
        className="mb-3"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
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

      {/* Bottom row */}
      <div className="flex items-center gap-3">
        <span style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          💧 {post.waters_count} waters
        </span>
        <span style={{ color: '#52B788', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          🌿 {post.branch_count} branches
        </span>
      </div>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <div className="flex flex-col items-center justify-center flex-1 pb-16">
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>🌱</span>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: t.textPrimary, marginBottom: 6 }}>
        No trees found
      </p>
      <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: t.sprout }}>
        Try adjusting your filters
      </p>
    </div>
  )
}

// ─── ExplorePage ──────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSort, setActiveSort] = useState('Newest')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  const activeFilterCount =
    filters.stages.length +
    (filters.distance !== '10 mi' ? 1 : 0) +
    (filters.time !== 'Any' ? 1 : 0) +
    (filters.type !== 'All' ? 1 : 0) +
    (filters.sort !== 'Newest' ? 1 : 0)

  // ── Filtering + sorting ─────────────────────────────────────────────────────
  const visiblePosts = EXPLORE_POSTS
    .filter((p) =>
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((p) =>
      filters.stages.length === 0 || filters.stages.includes(p.growth_stage)
    )
    .filter((p) =>
      filters.type === 'All' ||
      (filters.type === 'Trees Only' && !p.is_branch) ||
      (filters.type === 'Branches Only' && p.is_branch)
    )
    .filter((p) =>
      activeSort !== 'Branches' || p.branch_count > 0
    )
    .sort((a, b) => {
      if (activeSort === 'Most Watered') return b.waters_count - a.waters_count
      if (activeSort === 'Branches') return b.branch_count - a.branch_count
      return 0
    })

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden flex flex-col"
      style={{ background: t.bg, transition: 'background 0.3s ease' }}
    >

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5" style={{ paddingTop: 56 }}>
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: t.textPrimary,
            marginBottom: 2,
          }}
        >
          Explore 🌍
        </h1>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
          What&apos;s growing near you
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="flex-shrink-0 px-4 mt-4">
        <div
          className="flex items-center gap-2 px-3"
          style={{
            height: 44,
            background: isDark ? 'rgba(13,31,22,0.88)' : 'rgba(255,255,255,0.92)',
            border: `1px solid ${t.inputBorder}`,
            borderRadius: 12,
          }}
        >
          <span style={{ color: t.sprout, fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            className="flex-1 bg-transparent border-none outline-none"
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: t.textPrimary }}
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => setFilterOpen(true)}
            className="relative bg-transparent border-none cursor-pointer p-0 flex-shrink-0 leading-none"
            style={{ fontSize: 18 }}
            aria-label="Open filters"
          >
            🎛️
            {activeFilterCount > 0 && (
              <span
                className="absolute rounded-full"
                style={{ width: 7, height: 7, background: '#52B788', top: -1, right: -1 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* ── Sort tabs ── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 mt-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', paddingBottom: 2 }}
      >
        {SORT_TABS.map((tab) => {
          const active = activeSort === tab.id
          return (
            <motion.button
              key={tab.id}
              layout
              onClick={() => setActiveSort(tab.id)}
              className="flex-shrink-0 border-none cursor-pointer rounded-[20px] relative overflow-hidden"
              style={{
                padding: '6px 14px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : t.sprout,
                background: active ? '#2D6A4F' : 'transparent',
                border: active ? 'none' : `1px solid ${t.primary}`,
                transition: 'background 0.15s, color 0.15s',
              }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      {/* ── Scrollable card list ── */}
      <div
        className="flex-1 overflow-y-auto mt-3"
        style={{ paddingBottom: 80, scrollbarWidth: 'none' }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonCard count={4} />
            </motion.div>
          ) : visiblePosts.length > 0 ? (
            <motion.div
              key={activeSort + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {visiblePosts.map((post, i) => (
                <EventCard key={post.id} post={post} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center"
              style={{ paddingTop: 80 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FilterSheet ── */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
