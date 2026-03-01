import { useEffect, useRef, useState } from 'react'
import { Marker } from '@vis.gl/react-maplibre'
import { motion, AnimatePresence } from 'framer-motion'
import OakConfetti from '../UI/OakConfetti'

// ─── Inject ripple keyframe once ──────────────────────────────────────────────
;(function injectRippleCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('seed-ripple-css')) return
  const el = document.createElement('style')
  el.id = 'seed-ripple-css'
  el.textContent = `
    @keyframes ripple-ring {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(2.5); opacity: 0;   }
    }
  `
  document.head.appendChild(el)
})()

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_SIZE = 28

const stageVariants = {
  seed:    { scale: 0.35, opacity: 0.5,  backgroundColor: '#6B7280' },
  sprout:  { scale: 0.55, opacity: 0.75, backgroundColor: '#74C69D' },
  sapling: { scale: 0.75, opacity: 0.88, backgroundColor: '#52B788' },
  tree:    { scale: 1.0,  opacity: 1.0,  backgroundColor: '#2D6A4F' },
  oak:     { scale: 1.25, opacity: 1.0,  backgroundColor: '#FFD700' },
}

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
  const stage         = post.growth_stage || getStage(post.waters_count)
  const isOak         = stage === 'oak'
  const prevStageRef  = useRef(stage)
  const prevWatersRef = useRef(post.waters_count)
  const pressTimer    = useRef(null)
  const didLongPress  = useRef(false)

  const [showConfetti,   setShowConfetti]   = useState(false)
  const [burst,          setBurst]          = useState(false)
  const [showQuickShare, setShowQuickShare] = useState(false)
  const [copyToast,      setCopyToast]      = useState(false)

  // Fire confetti when this marker transitions to oak via real-time update
  useEffect(() => {
    if (stage === 'oak' && prevStageRef.current !== 'oak') {
      setShowConfetti(true)
    }
    prevStageRef.current = stage
  }, [stage])

  // Growth burst when waters_count increases (real-time update path)
  useEffect(() => {
    if (post.waters_count > prevWatersRef.current) {
      setBurst(true)
      const t = setTimeout(() => setBurst(false), 1000)
      return () => clearTimeout(t)
    }
    prevWatersRef.current = post.waters_count
  }, [post.waters_count])

  // Close popup on any outside tap — deferred so it doesn't fire on the same press
  useEffect(() => {
    if (!showQuickShare) return
    const timer = setTimeout(() => {
      const close = () => setShowQuickShare(false)
      document.addEventListener('pointerdown', close, { once: true })
    }, 16)
    return () => clearTimeout(timer)
  }, [showQuickShare])

  function startPress() {
    didLongPress.current = false
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setShowQuickShare(true)
    }, 500)
  }

  function cancelPress() {
    clearTimeout(pressTimer.current)
  }

  function handleClick(e) {
    e.stopPropagation()
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    onSelect(post)
  }

  function handleShareAction() {
    const url = `https://roots.community/post/${post.id}`
    if (navigator.share) {
      navigator.share({ title: post.title, text: 'Check out this community event on Communitree!', url })
    } else {
      navigator.clipboard.writeText(url)
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2000)
    }
    setShowQuickShare(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(`https://roots.community/post/${post.id}`)
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 2000)
    setShowQuickShare(false)
  }

  function handleDiscordShare() {
    const text = `🌳 ${post.title}\n💧 ${post.waters_count} waters\n\nCommunitree — Watch your neighborhood bloom\nroots.community`
    console.log('Discord crosspost:', text)
    setShowQuickShare(false)
  }

  return (
    <>
      {showConfetti && (
        <OakConfetti onComplete={() => setShowConfetti(false)} />
      )}

      <Marker longitude={post.lng} latitude={post.lat}>
        {/* ── Bounce wrapper — scale burst on water ── */}
        <motion.div
          className="relative cursor-pointer"
          style={{ width: BASE_SIZE, height: BASE_SIZE }}
          animate={burst ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
        >
          {/* ── Quick share popup ── */}
          <AnimatePresence>
            {showQuickShare && (
              <motion.div
                className="absolute flex items-center gap-3"
                style={{
                  bottom:          BASE_SIZE + 8,
                  left:            '50%',
                  x:               '-50%',
                  background:      '#0f2318',
                  border:          '1px solid rgba(82,183,136,0.25)',
                  borderRadius:    12,
                  padding:         '10px 14px',
                  zIndex:          30,
                  whiteSpace:      'nowrap',
                  pointerEvents:   'all',
                }}
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{ opacity: 1, scale: 1,   y: 0 }}
                exit={{    opacity: 0, scale: 0.8, y: 4 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 📤 Share */}
                <button
                  className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleShareAction() }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>📤</span>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 9, color: '#74C69D' }}>
                    Share
                  </span>
                </button>

                {/* 🔗 Copy */}
                <button
                  className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleCopy() }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>🔗</span>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 9, color: '#74C69D' }}>
                    Copy
                  </span>
                </button>

                {/* Discord */}
                <button
                  className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); handleDiscordShare() }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.012.094.067.161.12.204a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 9, color: '#74C69D' }}>
                    Discord
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Copy toast ── */}
          <AnimatePresence>
            {copyToast && (
              <motion.div
                className="absolute"
                style={{
                  bottom:       BASE_SIZE + 70,
                  left:         '50%',
                  x:            '-50%',
                  background:   '#2D6A4F',
                  borderRadius: 20,
                  padding:      '4px 10px',
                  whiteSpace:   'nowrap',
                  zIndex:       31,
                  fontFamily:   "'Poppins', sans-serif",
                  fontSize:     10,
                  color:        '#fff',
                  pointerEvents: 'none',
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
              >
                Copied! 📋
              </motion.div>
            )}
          </AnimatePresence>
          {/* ── Ripple rings — 3 concentric, staggered 0.1s ── */}
          {burst && [0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                inset:     0,
                border:    '2px solid rgba(82,183,136,0.6)',
                animation: `ripple-ring 0.8s ease-out ${i * 0.1}s forwards`,
              }}
            />
          ))}

          {/* ── Float-up water drop ── */}
          <AnimatePresence>
            {burst && (
              <motion.span
                key="drop"
                className="absolute pointer-events-none"
                style={{
                  top:       0,
                  left:      '50%',
                  x:         '-50%',
                  fontSize:  14,
                  lineHeight: 1,
                  zIndex:    10,
                }}
                initial={{ y: 0,   opacity: 1 }}
                animate={{ y: -40, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                💧
              </motion.span>
            )}
          </AnimatePresence>

          {/* ── Oak pulsing ring ── */}
          {isOak && (
            <motion.div
              className="absolute rounded-full"
              style={{ inset: 0 }}
              animate={OAK_RING.animate}
              transition={OAK_RING.transition}
            />
          )}

          {/* ── Main node — spring growth + color transition ── */}
          <motion.div
            className="absolute rounded-full"
            style={{ inset: 0 }}
            variants={stageVariants}
            initial="seed"
            animate={stage}
            transition={{ type: 'spring', stiffness: 180, damping: 15 }}
          />

          {/* ── Water badge ── */}
          {post.waters_count > 0 && (
            <div
              className="absolute -top-3 -right-3 rounded-full px-1 leading-4 whitespace-nowrap"
              style={{
                background: '#2D6A4F',
                color:      '#fff',
                fontSize:   9,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
              }}
            >
              💧{post.waters_count}
            </div>
          )}

          {/* ── Privacy overlay (private_group / invite_only) ── */}
          {post.privacy === 'private_group' && (
            <>
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ inset: -3, border: '2px dashed #7DD3F0' }}
              />
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: -4, right: -4,
                  width: 14, height: 14,
                  borderRadius: '50%',
                  background: 'rgba(13,31,22,0.9)',
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                🔒
              </div>
            </>
          )}
          {post.privacy === 'invite_only' && (
            <>
              <div
                className="absolute rounded-full pointer-events-none"
                style={{ inset: -3, border: '2px dashed #FFD700' }}
              />
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: -4, right: -4,
                  width: 14, height: 14,
                  borderRadius: '50%',
                  background: 'rgba(13,31,22,0.9)',
                  fontSize: 10,
                  lineHeight: 1,
                }}
              >
                🫂
              </div>
            </>
          )}
        </motion.div>
      </Marker>
    </>
  )
}
