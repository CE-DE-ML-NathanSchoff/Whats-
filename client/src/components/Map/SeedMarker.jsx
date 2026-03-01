import { Marker } from '@vis.gl/react-maplibre'
import { motion } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_SIZE = 28

const stageVariants = {
  seed:    { scale: 0.35, opacity: 0.5,  backgroundColor: '#6B7280' },
  sprout:  { scale: 0.55, opacity: 0.75, backgroundColor: '#74C69D' },
  sapling: { scale: 0.75, opacity: 0.88, backgroundColor: '#52B788' },
  tree:    { scale: 1.0,  opacity: 1.0,  backgroundColor: '#2D6A4F' },
  oak:     { scale: 1.25, opacity: 1.0,  backgroundColor: '#FFD700' },
}

// Mirrors:
//   0%,100% { box-shadow: 0 0 0 4px rgba(255,215,0,0.30) }
//   50%      { box-shadow: 0 0 0 10px rgba(255,215,0,0.08) }
const OAK_RING = {
  animate: {
    boxShadow: [
      '0 0 0 4px rgba(255,215,0,0.30)',
      '0 0 0 10px rgba(255,215,0,0.08)',
      '0 0 0 4px rgba(255,215,0,0.30)',
    ],
  },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
}

export function getStage(waters) {
  if (waters >= 10) return 'oak'
  if (waters >= 6)  return 'tree'
  if (waters >= 3)  return 'sapling'
  if (waters >= 1)  return 'sprout'
  return 'seed'
}

// ─── SeedMarker ───────────────────────────────────────────────────────────────

export default function SeedMarker({ post, onSelect }) {
  const stage = post.growth_stage || getStage(post.waters_count)
  const isOak = stage === 'oak'

  return (
    <Marker longitude={post.lng} latitude={post.lat}>
      <div
        className="relative cursor-pointer"
        style={{ width: BASE_SIZE, height: BASE_SIZE }}
        onClick={(e) => { e.stopPropagation(); onSelect(post) }}
      >
        {/* Oak box-shadow ring — matches @keyframes oak-ring */}
        {isOak && (
          <motion.div
            className="absolute rounded-full"
            style={{ inset: 0 }}
            animate={OAK_RING.animate}
            transition={OAK_RING.transition}
          />
        )}

        {/* Main node — spring growth transition */}
        <motion.div
          className="absolute rounded-full"
          style={{ inset: 0 }}
          variants={stageVariants}
          initial="seed"
          animate={stage}
          transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        />

        {/* Water badge */}
        {post.waters_count > 0 && (
          <div
            className="absolute -top-3 -right-3 rounded-full px-1 leading-4 whitespace-nowrap"
            style={{
              background: '#2D6A4F',
              color: '#fff',
              fontSize: 9,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
            }}
          >
            💧{post.waters_count}
          </div>
        )}
      </div>
    </Marker>
  )
}
