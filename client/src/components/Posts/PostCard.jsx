import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { events as eventsApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

// ─── Stage data ───────────────────────────────────────────────────────────────

const stageColor = {
  seed:    '#6B7280',
  sprout:  '#74C69D',
  sapling: '#52B788',
  tree:    '#2D6A4F',
  oak:     '#FFD700',
}

const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

const waterDoneLabel = {
  seed:    '💧 Watered',
  sprout:  '🌱 Sprouting!',
  sapling: '🌿 Growing!',
  tree:    '🌳 Thriving!',
  oak:     '🌟 Mighty Oak!',
}

function getStage(w) {
  if (w === 0)  return 'seed'
  if (w <= 2)   return 'sprout'
  if (w <= 5)   return 'sapling'
  if (w <= 10)  return 'tree'
  return 'oak'
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
          style={{
            bottom: 140,
            background: '#2D6A4F',
            borderRadius: 12,
            padding: '10px 20px',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 13,
            color: '#fff',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.22 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({ post, onClose }) {
  const { user } = useAuth()
  const [localWaters, setLocalWaters] = useState(0)
  const [localStage,  setLocalStage]  = useState('seed')
  const [hasWatered,  setHasWatered]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [toast,       setToast]       = useState(null)

  // Reset local state whenever a different post is opened
  useEffect(() => {
    if (!post) return
    setLocalWaters(post.waters_count ?? 0)
    setLocalStage(post.growth_stage ?? 'seed')
    setHasWatered(false)
    setLoading(false)
  }, [post?.id])

  // Check if current user already watered this post
  useEffect(() => {
    if (!post) return
    eventsApi.getMyWater(post.id)
      .then((data) => { if (data.watered) setHasWatered(true) })
      .catch(() => {})
  }, [post?.id])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleWater() {
    if (!user) {
      showToast('Sign in to water this tree 💧')
      return
    }

    const prevCount = localWaters
    const prevStage = localStage
    const newCount = localWaters + 1
    setLocalWaters(newCount)
    setLocalStage(getStage(newCount))
    setLoading(true)

    try {
      const result = await eventsApi.water(post.id)
      if (result.already) {
        setHasWatered(true)
        setLocalWaters(prevCount)
        setLocalStage(prevStage)
      } else {
        setHasWatered(true)
      }
    } catch (err) {
      setLocalWaters(prevCount)
      setLocalStage(prevStage)
      showToast('Something went wrong. Try again')
    }
    setLoading(false)
  }

  // Derived from local (optimistic) state
  const color     = stageColor[localStage] ?? '#6B7280'
  const emoji     = stageEmoji[localStage] ?? '🌰'
  const progress  = Math.min(localWaters / 12, 1) * 100
  const canBranch = localWaters >= 6

  return (
    <>
      <Toast message={toast} />

      <AnimatePresence>
        {post && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Drawer — sits above BottomNav (64px) */}
            <motion.div
              className="absolute left-0 right-0 z-30"
              style={{
                bottom: 64,
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

              {/* X close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-white/40 text-xl bg-transparent border-none cursor-pointer leading-none"
                aria-label="Close"
              >
                ✕
              </button>

              {/* Stage badge — uses localStage for optimistic update */}
              <div className="flex items-center gap-2 mb-3">
                <motion.span
                  layout
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize"
                  style={{ background: color + '33', color }}
                >
                  {emoji} {localStage}
                </motion.span>
              </div>

              {/* Title */}
              <h2
                className="text-white mb-2"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16 }}
              >
                {post.title}
              </h2>

              {/* Content */}
              <p
                className="mb-4 leading-relaxed"
                style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#95D5B2' }}
              >
                {post.content}
              </p>

              {/* Progress bar — animates on optimistic update */}
              <div
                className="w-full rounded-full mb-1 overflow-hidden"
                style={{ height: 5, background: 'rgba(149,213,178,0.12)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Water count */}
              <p className="mb-1" style={{ color: '#74C69D', fontSize: 11 }}>
                💧 {localWaters} waters
              </p>

              {/* Friends watering indicator */}
              {(post.friends_watering ?? 0) > 0 && (
                <p className="mb-4" style={{ color: '#7DD3F0', fontSize: 11 }}>
                  👥 {post.friends_watering} friends watering
                </p>
              )}
              {!(post.friends_watering > 0) && <div className="mb-4" />}

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  className="flex-1 py-3 text-white text-sm font-semibold rounded-[10px] border-none"
                  style={{
                    background: hasWatered ? '#1a3a2a' : '#52B788',
                    fontFamily: "'Poppins', sans-serif",
                    cursor: loading || hasWatered ? 'default' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                  whileTap={loading || hasWatered ? {} : { scale: 0.97 }}
                  onClick={loading || hasWatered ? undefined : handleWater}
                >
                  {loading
                    ? 'Growing... 🌱'
                    : hasWatered
                      ? waterDoneLabel[localStage]
                      : '💧 Water'}
                </motion.button>

                {canBranch && (
                  <motion.button
                    className="flex-1 py-3 text-white text-sm font-semibold rounded-[10px] border-none cursor-pointer"
                    style={{ background: '#2D6A4F', fontFamily: "'Poppins', sans-serif" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => console.log('Add a branch', post.id)}
                  >
                    🌿 Add a Branch
                  </motion.button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
