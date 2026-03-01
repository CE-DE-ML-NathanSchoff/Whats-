import { Marker } from '@vis.gl/react-maplibre'
import { motion } from 'framer-motion'

const STAGE_CONFIG = {
  seed:    { emoji: '🌰', size: 28, glow: 'rgba(107,114,128,0.4)' },
  sprout:  { emoji: '🌱', size: 32, glow: 'rgba(116,198,157,0.5)' },
  sapling: { emoji: '🪴', size: 38, glow: 'rgba(82,183,136,0.5)' },
  tree:    { emoji: '🌳', size: 44, glow: 'rgba(45,106,79,0.5)' },
  oak:     { emoji: '🌟', size: 52, glow: 'rgba(255,215,0,0.5)' },
}

const BRANCH_CONFIG = { emoji: '🌿', size: 30, glow: 'rgba(82,183,136,0.5)' }
const FALLEN_CONFIG = { emoji: '🪵', size: 32, glow: 'rgba(107,114,128,0.3)' }

export function isFallen(post) {
  return !!post?.fallen
}

export function isDecayed(post) {
  return !!post?.decayed
}

export default function SeedMarker({ post, onSelect }) {
  const stage = post?.growth_stage ?? 'seed'
  const fallen = post?.fallen || post?.decayed
  const isBranch = post?.is_branch

  const config = fallen
    ? FALLEN_CONFIG
    : isBranch
      ? BRANCH_CONFIG
      : (STAGE_CONFIG[stage] ?? STAGE_CONFIG.seed)

  return (
    <Marker
      longitude={post.lng}
      latitude={post.lat}
      anchor="bottom"
    >
      <motion.button
        initial={{ scale: 0, y: -12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        whileHover={{ scale: 1.18 }}
        whileTap={{ scale: 0.88 }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(post)
        }}
        className="bg-transparent border-none cursor-pointer p-0 flex flex-col items-center"
        style={{ outline: 'none' }}
        aria-label={fallen ? 'Fallen tree' : isBranch ? 'Branch' : config.emoji}
      >
        {fallen ? (
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: config.size,
              lineHeight: 1,
              filter: 'grayscale(0.4) drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
            }}
          >
            {config.emoji}
          </motion.span>
        ) : isBranch ? (
          <motion.span
            animate={{ y: [0, -4, 0], rotate: [0, 6, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: config.size,
              lineHeight: 1,
              filter: `drop-shadow(0 0 8px ${config.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
            }}
          >
            {config.emoji}
          </motion.span>
        ) : (
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: config.size,
              lineHeight: 1,
              filter: `drop-shadow(0 0 6px ${config.glow}) drop-shadow(0 2px 4px rgba(0,0,0,0.35))`,
            }}
          >
            {config.emoji}
          </motion.span>
        )}

        {/* Pin stem — shorter for branches */}
        <div
          style={{
            width: 2,
            height: isBranch ? 4 : 6,
            borderRadius: 2,
            background: fallen ? '#6B7280' : isBranch ? '#52B788' : '#2D6A4F',
            marginTop: 1,
            opacity: 0.7,
          }}
        />
      </motion.button>
    </Marker>
  )
}
