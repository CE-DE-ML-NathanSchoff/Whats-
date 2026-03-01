import { motion } from 'framer-motion'

import seedImg from '../../assets/stages/seed.png'
import sproutImg from '../../assets/stages/sprout.png'
import treeImg from '../../assets/stages/tree.png'
import oakImg from '../../assets/stages/oak.png'

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG = {
    seed: { img: seedImg, size: 32, label: 'Seed' },
    sprout: { img: sproutImg, size: 38, label: 'Sprout' },
    sapling: { img: sproutImg, size: 44, label: 'Sapling' },
    tree: { img: treeImg, size: 52, label: 'Tree' },
    oak: { img: oakImg, size: 60, label: 'Mighty Oak' },
}

// Fallen uses a simple bare-tree emoji since the dead tree is the user's ref
const FALLEN_CONFIG = { emoji: '🪵', size: 36, label: 'Fallen' }

// ─── SeedMarker ───────────────────────────────────────────────────────────────

export default function SeedMarker({ post, onClick }) {
    const stage = post?.growth_stage ?? 'seed'
    const fallen = post?.fallen || post?.decayed
    const config = fallen ? null : (STAGE_CONFIG[stage] ?? STAGE_CONFIG.seed)

    return (
        <motion.button
            initial={{ scale: 0, y: -12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.88 }}
            onClick={onClick}
            className="bg-transparent border-none cursor-pointer p-0 flex flex-col items-center"
            style={{ outline: 'none' }}
            aria-label={fallen ? 'Fallen tree' : config.label}
        >
            {fallen ? (
                /* ── Fallen / decayed state ── */
                <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: FALLEN_CONFIG.size, lineHeight: 1, filter: 'grayscale(0.4)' }}
                >
                    {FALLEN_CONFIG.emoji}
                </motion.span>
            ) : (
                /* ── Growing stage ── */
                <motion.img
                    src={config.img}
                    alt={config.label}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        width: config.size,
                        height: config.size,
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
                    }}
                    draggable={false}
                />
            )}

            {/* Pin stem */}
            <div
                style={{
                    width: 2,
                    height: 6,
                    borderRadius: 2,
                    background: fallen ? '#6B7280' : '#2D6A4F',
                    marginTop: 1,
                    opacity: 0.7,
                }}
            />
        </motion.button>
    )
}
