import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FilterSheet from '../components/Map/FilterSheet'
import BottomNav from '../components/Nav/BottomNav'

// ─── Filter defaults (match ExplorePage) ─────────────────────────────────────

const DEFAULT_FILTERS = {
  stages: [], distance: '10 mi', time: 'Any', type: 'All', sort: 'Newest',
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const INITIAL_SIMILAR = [
  { id: 30, username: 'Kenji M.', sharedTrees: 4, lastInteraction: '2h ago', interests: ['Tech', 'Music'], added: false },
  { id: 31, username: 'Olivia R.', sharedTrees: 3, lastInteraction: '5m ago', interests: ['Art', 'Markets'], added: false },
  { id: 32, username: 'Marcus D.', sharedTrees: 3, lastInteraction: '1d ago', interests: ['Outdoors', 'Fitness'], added: false },
  { id: 33, username: 'Jordan T.', sharedTrees: 2, lastInteraction: 'just now', interests: ['Food & Drink'], added: false },
  { id: 34, username: 'Priya S.', sharedTrees: 2, lastInteraction: '3h ago', interests: ['Workshops', 'Art'], added: false },
]

const INITIAL_NEARBY = [
  { id: 20, username: 'Aisha L.', community: 'West Philadelphia', distanceMi: 1.2, interests: ['Markets', 'Food & Drink'], added: false },
  { id: 21, username: 'Jordan T.', community: 'West Philadelphia', distanceMi: 2.3, interests: ['Fitness', 'Music'], added: false },
  { id: 22, username: 'Priya S.', community: 'University City', distanceMi: 0.8, interests: ['Art', 'Workshops'], added: false },
  { id: 23, username: 'Dana T.', community: 'Fairmount', distanceMi: 4.1, interests: ['Outdoors', 'Volunteering'], added: false },
  { id: 24, username: 'Chris W.', community: 'South Philly', distanceMi: 5.5, interests: ['Music', 'Networking'], added: false },
]

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <p
      className="px-5 mb-2"
      style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}
    >
      {children}
    </p>
  )
}

// ─── Person row ──────────────────────────────────────────────────────────────

function PersonRow({ person, subtitle, index, onAdd }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: 'easeOut' }}
      className="flex items-center gap-3"
      style={{ padding: '10px 20px' }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 36, height: 36, background: 'rgba(82,183,136,0.15)' }}
      >
        <span style={{ fontSize: 16 }}>👤</span>
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: '#fff' }}>
          {person.username}
        </p>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: '#74C69D' }}>
          {subtitle}
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => onAdd(person.id)}
        className="border-none cursor-pointer rounded-[8px] px-3 py-1.5 flex-shrink-0"
        style={{
          background: person.added ? 'rgba(82,183,136,0.15)' : '#52B788',
          fontFamily: "'Poppins', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: person.added ? '#74C69D' : '#fff',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {person.added ? 'Requested' : 'Add Friend'}
      </motion.button>
    </motion.div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectiveRadiusMi(filters) {
  if (filters.distance === 'Custom') return filters.customRadius ?? 25
  const n = parseInt(filters.distance, 10)
  return Number.isNaN(n) ? 10 : n
}

function matchesSearch(person, query) {
  if (!query.trim()) return true
  const q = query.toLowerCase().trim()
  const username = (person.username || '').toLowerCase()
  const neighborhood = (person.neighborhood || '').toLowerCase()
  const interestsStr = (person.interests || []).join(' ').toLowerCase()
  return username.includes(q) || neighborhood.includes(q) || interestsStr.includes(q)
}

// ─── FindFriendsPage ─────────────────────────────────────────────────────────

export default function FindFriendsPage() {
  const navigate = useNavigate()
  const [similar, setSimilar] = useState(INITIAL_SIMILAR)
  const [nearby, setNearby] = useState(INITIAL_NEARBY)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount =
    filters.stages.length +
    (filters.distance !== '10 mi' ? 1 : 0) +
    (filters.time !== 'Any' ? 1 : 0) +
    (filters.type !== 'All' ? 1 : 0) +
    (filters.sort !== 'Newest' ? 1 : 0)

  const radiusMi = getEffectiveRadiusMi(filters)

  const filteredSimilar = [...similar]
    .filter((p) => matchesSearch(p, searchQuery))
    .sort((a, b) => {
      if (b.sharedTrees !== a.sharedTrees) return b.sharedTrees - a.sharedTrees
      const order = { 'just now': 0, '5m ago': 1, '2h ago': 2, '3h ago': 3, '1d ago': 4 }
      return (order[a.lastInteraction] ?? 5) - (order[b.lastInteraction] ?? 5)
    })

  const filteredNearby = [...nearby]
    .filter((p) => matchesSearch(p, searchQuery))
    .filter((p) => p.distanceMi <= radiusMi)
    .sort((a, b) => a.distanceMi - b.distanceMi)

  const markSimilarAdded = (id) => setSimilar((prev) => prev.map((p) => (p.id === id ? { ...p, added: true } : p)))
  const markNearbyAdded = (id) => setNearby((prev) => prev.map((p) => (p.id === id ? { ...p, added: true } : p)))

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden bg-[#0D1F16] flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 flex items-center gap-3" style={{ paddingTop: 56 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate('/friends')}
          className="bg-transparent border-none cursor-pointer p-0 leading-none flex-shrink-0"
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 2 }}>
            Find Friends 🌱
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#74C69D' }}>
            Grow your circle
          </p>
        </div>
      </div>

      {/* ── Search bar (same structure as ExplorePage) ── */}
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
            placeholder="Search by username, interests, community..."
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

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto mt-4"
        style={{ paddingBottom: 80, scrollbarWidth: 'none' }}
      >
        {/* Section 1: Watering Similar Trees */}
        <SectionHeader>🌱 Watering Similar Trees</SectionHeader>
        <div className="mb-6">
          {filteredSimilar.length > 0 ? (
            filteredSimilar.map((person, i) => (
              <PersonRow
                key={person.id}
                person={person}
                subtitle={`You both watered ${person.sharedTrees} trees`}
                index={i}
                onAdd={markSimilarAdded}
              />
            ))
          ) : (
            <p className="px-5 py-4" style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D' }}>
              No matches
            </p>
          )}
        </div>

        {/* Section 2: People Nearby */}
        <SectionHeader>🌿 People Nearby</SectionHeader>
        <div className="mb-4">
          {filteredNearby.length > 0 ? (
            filteredNearby.map((person, i) => (
              <PersonRow
                key={person.id}
                person={person}
                subtitle={`${person.distanceMi.toFixed(1)} mi away`}
                index={i}
                onAdd={markNearbyAdded}
              />
            ))
          ) : (
            <p className="px-5 py-4" style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D' }}>
              No one in this radius
            </p>
          )}
        </div>
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
