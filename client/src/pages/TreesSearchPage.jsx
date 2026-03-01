import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FilterSheet from '../components/Map/FilterSheet'
import BottomNav from '../components/Nav/BottomNav'

// ─── Stage data ───────────────────────────────────────────────────────────────

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'planted',  label: '🌱 Planted' },
  { id: 'watered',  label: '💧 Watered' },
  { id: 'branches', label: '🌿 Branches' },
]

// ─── Test data (same sources as MyTreesPage) ───────────────────────────────────

const MY_PLANTED = [
  {
    id: 1, title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park. Bring your own bags!',
    waters_count: 12, growth_stage: 'oak', branch_count: 2, event_time: 'Sat 9am', is_branch: false,
  },
  {
    id: 2, title: 'Community Garden 🌿',
    content: 'New raised beds available for the season. Sign up at the rec center.',
    waters_count: 4, growth_stage: 'sapling', branch_count: 0, event_time: 'Fri 10am', is_branch: false,
  },
]

const MY_WATERED = [
  {
    id: 3, title: 'Block Party Planning 🎉',
    content: 'Annual block party coming up — help plan activities, food, and music for the whole block.',
    waters_count: 7, growth_stage: 'tree', branch_count: 1, event_time: 'Sun 3pm', is_branch: false,
  },
]

const MY_BRANCHES = [
  {
    id: 4, title: 'Cooking Demo 2pm',
    content: 'Learn to cook seasonal produce fresh from the market. All skill levels welcome.',
    waters_count: 2, growth_stage: 'sprout', branch_count: 0, event_time: 'Sat 11am',
    is_branch: true, parent_title: 'Saturday Farmers Market 🌽',
  },
]

const TAB_DATA = { planted: MY_PLANTED, watered: MY_WATERED, branches: MY_BRANCHES }

const DEFAULT_FILTERS = {
  stages: [], distance: '10 mi', time: 'Any', type: 'All', sort: 'Newest',
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ flowers, stage }) {
  const pct = Math.min(flowers / 12, 1) * 100
  const color = stageColor[stage] ?? '#52B788'
  return (
    <div
      className="w-full rounded-full overflow-hidden mb-3"
      style={{ height: 4, background: 'rgba(149,213,178,0.12)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── TreeCard ─────────────────────────────────────────────────────────────────

function TreeCard({ post, index, tab }) {
  const color = stageColor[post.growth_stage] ?? '#6B7280'
  const emoji = stageEmoji[post.growth_stage] ?? '🌰'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: 'easeOut' }}
      className="mx-4 mb-3"
      style={{
        background: '#0f2318',
        borderRadius: 16,
        border: '1px solid rgba(82,183,136,0.15)',
        padding: 16,
        position: 'relative',
      }}
    >
      {/* Top row: stage badge + time */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded-full capitalize"
          style={{
            background: color + '33',
            color,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 10px',
          }}
        >
          {emoji} {post.growth_stage}
        </span>
        {tab === 'watered' && (
          <span
            className="rounded-[20px] px-2 py-0.5"
            style={{
              background: 'rgba(125,211,240,0.15)',
              color: '#7DD3F0',
              fontSize: 10,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
            }}
          >
            💧 Watered
          </span>
        )}
        <span
          className="ml-auto"
          style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
        >
          {post.event_time}
        </span>
      </div>

      <p
        className="mb-0.5"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' }}
      >
        {post.title}
      </p>

      {tab === 'branches' && post.parent_title && (
        <p
          className="mb-1.5"
          style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
        >
          ↳ branch of {post.parent_title}
        </p>
      )}

      <p
        className="mb-3 mt-1"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          fontSize: 12,
          color: '#95D5B2',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.content}
      </p>

      <ProgressBar flowers={post.waters_count} stage={post.growth_stage} />

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

// ─── Empty State ───────────────────────────────────────────────────────────────

const EMPTY_ICON = { planted: '🌱', watered: '💧', branches: '🌿' }

function EmptyState({ tab }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>{EMPTY_ICON[tab]}</span>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 6 }}>
        No trees found
      </p>
      <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D' }}>
        Try adjusting your search or filters
      </p>
    </motion.div>
  )
}

// ─── TreesSearchPage ───────────────────────────────────────────────────────────

export default function TreesSearchPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab]   = useState('planted')
  const [filters, setFilters]       = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount =
    filters.stages.length +
    (filters.distance !== '10 mi' ? 1 : 0) +
    (filters.time     !== 'Any'    ? 1 : 0) +
    (filters.type     !== 'All'    ? 1 : 0) +
    (filters.sort     !== 'Newest' ? 1 : 0)

  // Apply search + filters to the active tab's data (global filters across tabs)
  const baseForTab = TAB_DATA[activeTab]
  const visiblePosts = baseForTab
    .filter((p) =>
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.content && p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((p) =>
      filters.stages.length === 0 || filters.stages.includes(p.growth_stage)
    )
    .filter((p) =>
      filters.type === 'All' ||
      (filters.type === 'Trees Only'    && !p.is_branch) ||
      (filters.type === 'Branches Only' &&  p.is_branch)
    )
    .sort((a, b) => {
      if (filters.sort === 'Most Watered') return b.waters_count - a.waters_count
      if (filters.sort === 'Growing Fast') return b.waters_count - a.waters_count
      return 0
    })

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden bg-[#0D1F16] flex flex-col">

      {/* ── Header with back ── */}
      <div className="flex-shrink-0 px-5 flex items-center gap-3" style={{ paddingTop: 56 }}>
        <button
          type="button"
          onClick={() => navigate('/trees')}
          className="flex items-center justify-center border-none cursor-pointer rounded-[10px] bg-transparent p-2 -ml-2"
          style={{ color: '#fff' }}
          aria-label="Back to My Trees"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 2 }}>
            Search My Trees
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#74C69D' }}>
            Find your planted, watered & branches
          </p>
        </div>
      </div>

      {/* ── Search bar (same as ExplorePage) ── */}
      <div className="flex-shrink-0 px-4 mt-4">
        <div
          className="flex items-center gap-2 px-3"
          style={{
            height: 44,
            background: 'rgba(45,106,79,0.2)',
            border: '1px solid rgba(82,183,136,0.25)',
            borderRadius: 12,
          }}
        >
          <span style={{ color: '#74C69D', fontSize: 16, flexShrink: 0 }}>🔍</span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30"
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13 }}
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

      {/* ── Tabs (Planted / Watered / Branches) ── */}
      <div
        className="flex-shrink-0 flex px-5 mt-4 gap-6"
        style={{ borderBottom: '1px solid rgba(82,183,136,0.1)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative pb-3 bg-transparent border-none cursor-pointer"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                color: active ? '#fff' : '#3a5a45',
              }}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="trees-search-tab-underline"
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{ height: 2, background: '#52B788' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Scrollable card list ── */}
      <div
        className="flex-1 overflow-y-auto mt-2"
        style={{ paddingBottom: 80, scrollbarWidth: 'none' }}
      >
        <AnimatePresence mode="wait">
          {visiblePosts.length > 0 ? (
            <motion.div
              key={activeTab + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {visiblePosts.map((post, i) => (
                <TreeCard key={post.id} post={post} index={i} tab={activeTab} />
              ))}
            </motion.div>
          ) : (
            <motion.div key={`empty-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState tab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FilterSheet (same as ExplorePage) ── */}
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
