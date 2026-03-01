import { motion } from 'framer-motion'

// ─── Pseudo-random node positions ────────────────────────────────────────────

const FAKE_NODES = [
  { top: '28%', left: '32%', size: 28 },
  { top: '48%', left: '62%', size: 22 },
  { top: '62%', left: '22%', size: 32 },
  { top: '36%', left: '76%', size: 18 },
]

// ─── SkeletonMap ─────────────────────────────────────────────────────────────

export default function SkeletonMap() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {FAKE_NODES.map((node, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width:     node.size,
            height:    node.size,
            top:       node.top,
            left:      node.left,
            transform: 'translate(-50%, -50%)',
            background: '#6B7280',
          }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 1.5,
            repeat:   Infinity,
            delay:    i * 0.2,
            ease:     'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
