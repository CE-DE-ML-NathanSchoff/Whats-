import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Preset neighborhoods ─────────────────────────────────────────────────────

const NEIGHBORHOODS = [
  { name: 'West Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'North Philly', lat: 39.9840, lng: -75.1530 },
  { name: 'South Philly', lat: 39.9176, lng: -75.1652 },
  { name: 'Fishtown', lat: 39.9737, lng: -75.1343 },
  { name: 'Germantown', lat: 40.0376, lng: -75.1721 },
  { name: 'Center City', lat: 39.9526, lng: -75.1635 },
]

// ─── LocationPicker ───────────────────────────────────────────────────────────

export default function LocationPicker({ open, onClose, onLocationChange, currentLocation }) {
  const [query, setQuery] = useState('')

  const filtered = NEIGHBORHOODS.filter((n) =>
    n.name.toLowerCase().includes(query.toLowerCase())
  )

  function pick(neighborhood) {
    onLocationChange(neighborhood)
    setQuery('')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (filtered.length > 0) pick(filtered[0])
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            {/* Title */}
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
                marginBottom: 4,
              }}
            >
              Explore a community 📍
            </p>
            <p
              style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 400,
                fontSize: 12,
                color: '#74C69D',
                marginBottom: 16,
              }}
            >
              Search or pick from nearby areas
            </p>

            {/* Search input */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative mb-4">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ fontSize: 14 }}
                >
                  🔍
                </span>
                <input
                  className="w-full outline-none"
                  style={{
                    background: 'rgba(45,106,79,0.2)',
                    border: '1px solid rgba(82,183,136,0.25)',
                    borderRadius: 12,
                    padding: '10px 14px 10px 36px',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 13,
                    color: '#fff',
                  }}
                  placeholder="Search community..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </div>
            </form>

            {/* Neighborhood pills — horizontal scroll */}
            <div
              className="flex gap-2 overflow-x-auto pb-2 mb-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {filtered.map((n) => (
                <motion.button
                  key={n.name}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => pick(n)}
                  className="border-none cursor-pointer flex-shrink-0"
                  style={{
                    background: currentLocation?.name === n.name
                      ? '#2D6A4F'
                      : 'rgba(45,106,79,0.2)',
                    border: '1px solid rgba(82,183,136,0.2)',
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 12,
                    color: currentLocation?.name === n.name ? '#fff' : '#95D5B2',
                  }}
                >
                  {n.name}
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <p
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: 13,
                    color: 'rgba(149,213,178,0.5)',
                    padding: '8px 0',
                  }}
                >
                  No communities found
                </p>
              )}
            </div>

            {/* Cancel */}
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="bg-transparent border-none cursor-pointer"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  color: '#6B7280',
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
