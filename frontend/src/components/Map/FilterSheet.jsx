import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Filter config ────────────────────────────────────────────────────────────

const STAGE_OPTIONS = [
  { value: 'seed',    label: '🌰 seed',    color: '#6B7280' },
  { value: 'sprout',  label: '🌱 sprout',  color: '#74C69D' },
  { value: 'sapling', label: '🌿 sapling', color: '#52B788' },
  { value: 'tree',    label: '🌲 tree',    color: '#2D6A4F' },
  { value: 'oak',     label: '🌳 oak',     color: '#FFD700' },
]

const DISTANCE_OPTIONS = ['10 mi', '20 mi', '30 mi', '40 mi', '50 mi', 'Custom']
const TIME_OPTIONS      = ['Today', 'This Week', 'Weekend', 'Upcoming', 'Any']
const TYPE_OPTIONS      = ['All', 'Trees Only', 'Branches Only']
const SORT_OPTIONS      = ['Newest', 'Most Watered', 'Growing Fast']

const DEFAULTS = {
  stages: [], distance: '10 mi', time: 'Any', type: 'All', sort: 'Newest',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countActive(filters) {
  return (
    filters.stages.length +
    (filters.distance !== '10 mi' ? 1 : 0) +
    (filters.time     !== 'Any'   ? 1 : 0) +
    (filters.type     !== 'All'   ? 1 : 0) +
    (filters.sort     !== 'Newest' ? 1 : 0)
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 10 }}>
      {children}
    </p>
  )
}

function Pill({ label, selected, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border-none cursor-pointer"
      style={{
        borderRadius: 20,
        padding: '6px 14px',
        fontFamily: "'Poppins', sans-serif",
        fontSize: 11,
        fontWeight: selected ? 600 : 400,
        background: selected ? (color ?? '#52B788') : 'rgba(45,106,79,0.2)',
        color: selected ? '#fff' : '#74C69D',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── FilterSheet ──────────────────────────────────────────────────────────────

const RADIUS_MIN = 5
const RADIUS_MAX = 100
const RADIUS_STEP = 5

export default function FilterSheet({ open, onClose, filters, onFiltersChange }) {
  const [radius, setRadius] = useState(25)
  const active = countActive(filters)

  useEffect(() => {
    if (open && filters.distance === 'Custom' && filters.customRadius != null) {
      setRadius(Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, filters.customRadius)))
    }
  }, [open, filters.distance, filters.customRadius])

  function toggleStage(stage) {
    const next = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage]
    onFiltersChange({ ...filters, stages: next })
  }

  function setSingle(key, value) {
    const next = { ...filters, [key]: value }
    if (key === 'distance' && value !== 'Custom') next.customRadius = undefined
    onFiltersChange(next)
  }

  function setRadiusAndNotify(newRadius) {
    const clamped = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, newRadius))
    setRadius(clamped)
    if (filters.distance === 'Custom') {
      onFiltersChange({ ...filters, customRadius: clamped })
    }
  }

  function reset() {
    setRadius(25)
    onFiltersChange({ ...DEFAULTS })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-40"
            style={{
              background: '#0D1F16',
              borderTop: '2px solid #2D6A4F',
              borderRadius: '20px 20px 0 0',
              padding: 20,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>
                Filter Events
              </span>
              <button
                onClick={reset}
                className="bg-transparent border-none cursor-pointer"
                style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D' }}
              >
                Reset
              </button>
            </div>

            {/* ── Filter 1: Growth Stage (multi-select) ── */}
            <div className="mb-5">
              <SectionLabel>🌱 Growth Stage</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={filters.stages.includes(opt.value)}
                    color={opt.color}
                    onClick={() => toggleStage(opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* ── Filter 2: Distance ── */}
            <div className="mb-5">
              <SectionLabel>📍 Distance</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    selected={filters.distance === opt}
                    onClick={() => {
                      setSingle('distance', opt)
                      if (opt === 'Custom') onFiltersChange({ ...filters, distance: 'Custom', customRadius: radius })
                    }}
                  />
                ))}
              </div>
              {filters.distance === 'Custom' && (
                <div className="flex items-center gap-3 mt-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setRadiusAndNotify(radius - RADIUS_STEP)}
                    disabled={radius <= RADIUS_MIN}
                    className="border-none cursor-pointer rounded-xl w-10 h-10 flex items-center justify-center"
                    style={{
                      background: radius <= RADIUS_MIN ? 'rgba(82,183,136,0.1)' : 'rgba(82,183,136,0.2)',
                      color: radius <= RADIUS_MIN ? '#3a5a45' : '#74C69D',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    −
                  </motion.button>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 14, color: '#fff', minWidth: 52, textAlign: 'center' }}>
                    {radius} mi
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setRadiusAndNotify(radius + RADIUS_STEP)}
                    disabled={radius >= RADIUS_MAX}
                    className="border-none cursor-pointer rounded-xl w-10 h-10 flex items-center justify-center"
                    style={{
                      background: radius >= RADIUS_MAX ? 'rgba(82,183,136,0.1)' : 'rgba(82,183,136,0.2)',
                      color: radius >= RADIUS_MAX ? '#3a5a45' : '#74C69D',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    +
                  </motion.button>
                </div>
              )}
            </div>

            {/* ── Filter 3: Event Time ── */}
            <div className="mb-5">
              <SectionLabel>🕐 When</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    selected={filters.time === opt}
                    onClick={() => setSingle('time', opt)}
                  />
                ))}
              </div>
            </div>

            {/* ── Filter 4: Type ── */}
            <div className="mb-5">
              <SectionLabel>🌿 Type</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    selected={filters.type === opt}
                    onClick={() => setSingle('type', opt)}
                  />
                ))}
              </div>
            </div>

            {/* ── Filter 5: Sort By ── */}
            <div className="mb-6">
              <SectionLabel>💧 Sort By</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    selected={filters.sort === opt}
                    onClick={() => setSingle('sort', opt)}
                  />
                ))}
              </div>
            </div>

            {/* Apply button */}
            <motion.button
              className="w-full py-3 text-white border-none cursor-pointer"
              style={{
                background: '#52B788',
                borderRadius: 12,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 14,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
            >
              Apply Filters{active > 0 ? ` (${active} active)` : ''}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
