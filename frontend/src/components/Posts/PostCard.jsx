import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import OakConfetti from '../UI/OakConfetti'

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
  oak:     '🌟 Ancient Oak ✨',
}

const stageUpgradeMsg = {
  sprout:  '🌱 Your tree sprouted!',
  sapling: '🌿 Your tree grew to a Sapling!',
  tree:    '🌲 Your tree is now a Tree!',
}

function getStage(w) {
  if (w === 0)  return 'seed'
  if (w <= 2)   return 'sprout'
  if (w <= 5)   return 'sapling'
  if (w <= 10)  return 'tree'
  return 'oak'
}

// ─── Toasts ───────────────────────────────────────────────────────────────────

function StageUpgradeToast({ stage }) {
  const color = stageColor[stage] ?? '#2D6A4F'
  const msg   = stageUpgradeMsg[stage]
  return (
    <AnimatePresence>
      {stage && msg && (
        <motion.div
          key={stage}
          className="absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
          style={{
            bottom:     160,
            background: color + 'e6',
            borderRadius: 12,
            padding:    '10px 18px',
            fontFamily: "'Poppins', sans-serif",
            fontSize:   13,
            fontWeight: 600,
            color:      '#fff',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OakToast({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 z-50"
          style={{
            bottom: 160,
            background: '#3d3000',
            borderRadius: 14,
            padding: '12px 20px',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: '#FFD700',
            textAlign: 'center',
            maxWidth: 300,
            lineHeight: '22px',
          }}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          🌳 Ancient Oak unlocked! Your tree is a neighborhood legend!
        </motion.div>
      )}
    </AnimatePresence>
  )
}

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

// ─── ShareSheet ───────────────────────────────────────────────────────────────

function ShareSheet({ post, open, onClose, showToast }) {
  async function handleDiscord() {
    const shareText =
      `🌳 ${post.title}\n💧 ${post.waters_count} waters\n\nCommunitree — Watch your neighborhood bloom\nroots.community`
    console.log('Discord share:', shareText)
    // POST /api/posts/:id/crosspost when backend is wired
    onClose()
    showToast('Shared to Discord! 🎉')
  }

  function handleNativeShare() {
    const url = `https://roots.community/post/${post.id}`
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: 'Check out this community event on Communitree!',
        url,
      })
      onClose()
    } else {
      navigator.clipboard.writeText(url)
      onClose()
      showToast('Link copied! 📋')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute left-0 right-0 bottom-0 z-40"
          style={{
            background:   '#0f2318',
            borderTop:    '2px solid #2D6A4F',
            borderRadius: '20px 20px 0 0',
            padding:      20,
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20" />

          {/* Header */}
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize:   16,
            color:      '#fff',
            marginBottom: 4,
          }}>
            Share this tree 🌳
          </p>
          <p style={{
            fontFamily:   "'Roboto', sans-serif",
            fontSize:     13,
            color:        '#74C69D',
            marginBottom: 16,
            overflow:     'hidden',
            whiteSpace:   'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {post.title}
          </p>

          {/* ── Discord row ── */}
          <motion.button
            className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer py-3 text-left"
            whileTap={{ scale: 0.98 }}
            onClick={handleDiscord}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0 }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.012.094.067.161.12.204a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            <div className="flex-1">
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize:   14,
                color:      '#fff',
                marginBottom: 2,
              }}>
                Share to Discord
              </p>
              <p style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 400,
                fontSize:   11,
                color:      '#74C69D',
              }}>
                Post to your neighborhood channel
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74C69D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </motion.button>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(82,183,136,0.1)', margin: '0 0 0 0' }} />

          {/* ── Native share row ── */}
          <motion.button
            className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer py-3 text-left"
            whileTap={{ scale: 0.98 }}
            onClick={handleNativeShare}
          >
            <span style={{ fontSize: 32, lineHeight: 1, width: 32, textAlign: 'center', flexShrink: 0 }}>📱</span>
            <div className="flex-1">
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize:   14,
                color:      '#fff',
                marginBottom: 2,
              }}>
                Share Link
              </p>
              <p style={{
                fontFamily: "'Roboto', sans-serif",
                fontWeight: 400,
                fontSize:   11,
                color:      '#74C69D',
              }}>
                Copy or send anywhere
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74C69D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </motion.button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full mt-2 bg-transparent border-none cursor-pointer"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize:   13,
              color:      '#6B7280',
            }}
          >
            Cancel
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ author }) {
  if (!author) return null
  if (author.user_type === 'business') {
    return (
      <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 11, color: '#FFD700' }}>
        🏪 {author.business_name || author.username}
        {author.verified && <span style={{ marginLeft: 4 }}>✓</span>}
      </span>
    )
  }
  if (author.user_type === 'local') {
    return <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 11, color: '#74C69D' }}>🏡 Local</span>
  }
  return <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 11, color: '#6B7280' }}>🧭 Visitor</span>
}

// ─── MiniProfile ──────────────────────────────────────────────────────────────

function MiniProfile({ author, open, onClose, onViewProfile }) {
  const [friendStatus, setFriendStatus] = useState(author?.friendship_status ?? 'none')
  const [miniToast,    setMiniToast]    = useState(null)

  useEffect(() => {
    if (author) setFriendStatus(author.friendship_status ?? 'none')
  }, [author?.id])

  function showMiniToast(msg) {
    setMiniToast(msg)
    setTimeout(() => setMiniToast(null), 3000)
  }

  function handleAddFriend() {
    setFriendStatus('pending')
    showMiniToast('👥 Friend request sent!')
    console.log('friend request', author.id)
  }

  const borderColor = author?.user_type === 'business' ? '#FFD700'
    : author?.user_type === 'local' ? '#52B788'
    : '#6B7280'

  return (
    <AnimatePresence>
      {open && author && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{ zIndex: 50, background: 'rgba(0,0,0,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute left-0 right-0 bottom-0"
            style={{
              zIndex:       60,
              background:   '#0D1F16',
              borderTop:    '2px solid #2D6A4F',
              borderRadius: '20px 20px 0 0',
              padding:      20,
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
            >
              ✕
            </button>

            {/* Mini toast */}
            <AnimatePresence>
              {miniToast && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 z-10 rounded-full px-4 py-2 whitespace-nowrap"
                  style={{ top: 56, background: '#2D6A4F', fontFamily: "'Poppins', sans-serif", fontSize: 12, color: '#fff' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {miniToast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar + info */}
            <div className="flex flex-col items-center mb-4">
              <div
                className="flex items-center justify-center mb-3 flex-shrink-0"
                style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  background: '#2D6A4F',
                  border: `2px solid ${borderColor}`,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#fff',
                }}
              >
                {author.initials}
              </div>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>
                {author.username}
              </p>
              <TypeBadge author={author} />
              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D', marginTop: 6 }}>
                📍 {author.community}
              </p>
              <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12, color: '#95D5B2', marginTop: 8 }}>
                {author.trees} 🌳 trees · {author.waters} 💧 waters · {author.branches} 🌿 branches
              </p>
            </div>

            {/* Friend button — 3 states */}
            {friendStatus === 'none' && (
              <motion.button
                className="w-full border-none cursor-pointer mb-3"
                style={{ background: '#2D6A4F', color: '#fff', borderRadius: 12, padding: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddFriend}
              >
                👥 Add Friend
              </motion.button>
            )}
            {friendStatus === 'pending' && (
              <button
                className="w-full mb-3"
                style={{ background: 'transparent', border: '1px solid #74C69D', color: '#74C69D', borderRadius: 12, padding: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'default' }}
                disabled
              >
                ⏳ Request Sent
              </button>
            )}
            {friendStatus === 'friends' && (
              <button
                className="w-full mb-3"
                style={{ background: 'transparent', border: '1px solid #52B788', color: '#52B788', borderRadius: 12, padding: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'default' }}
                disabled
              >
                ✅ Friends
              </button>
            )}

            {/* View full profile */}
            <button
              onClick={onViewProfile}
              className="w-full bg-transparent border-none cursor-pointer text-center"
              style={{ fontFamily: "'Roboto', sans-serif", fontSize: 12, color: '#74C69D' }}
            >
              View Full Profile →
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Privacy membership ────────────────────────────────────────────────────────

const MEMBER_POST_IDS = [1, 3, 5]

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({ post, onClose }) {
  const [localWaters, setLocalWaters] = useState(0)
  const [localStage,  setLocalStage]  = useState('seed')
  const [hasWatered,    setHasWatered]    = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [toast,         setToast]         = useState(null)
  const [showConfetti,  setShowConfetti]  = useState(false)
  const [oakToast,      setOakToast]      = useState(false)
  const [stageToast,    setStageToast]    = useState(null)
  const [joinRequested, setJoinRequested] = useState(false)
  const [shareOpen,         setShareOpen]         = useState(false)
  const [hasRequested,      setHasRequested]      = useState(false)
  const [requesting,        setRequesting]        = useState(false)
  const [authorProfileOpen, setAuthorProfileOpen] = useState(false)

  // Reset local state whenever a different post is opened
  useEffect(() => {
    if (!post) return
    setLocalWaters(post.waters_count ?? 0)
    setLocalStage(post.growth_stage ?? 'seed')
    setHasWatered(false)
    setLoading(false)
    setStageToast(null)
    setJoinRequested(false)
    setShareOpen(false)
    setHasRequested(false)
    setRequesting(false)
  }, [post?.id])

  // Check if current user already watered this post
  useEffect(() => {
    if (!post) return
    async function checkWatered() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('interactions')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('type', 'water')
        .maybeSingle()
      if (data) setHasWatered(true)
    }
    checkWatered()
  }, [post?.id])

  function showToast(msgOrObj) {
    const message  = typeof msgOrObj === 'string' ? msgOrObj : msgOrObj.message
    const duration = typeof msgOrObj === 'object' ? (msgOrObj.duration ?? 3000) : 3000
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }

  async function handleRequestInvite() {
    setRequesting(true)
    await new Promise(r => setTimeout(r, 800))
    setHasRequested(true)
    setRequesting(false)
    showToast({ message: '✉️ Invite request sent to the creator!', type: 'info', duration: 4000 })
    console.log('invite request for post:', post.id)
  }

  async function handleWater() {
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Sign in to water this tree 💧')
      return
    }

    // Duplicate check
    const { data: existing } = await supabase
      .from('interactions')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .eq('type', 'water')
      .maybeSingle()
    if (existing) {
      setHasWatered(true)
      return
    }

    // Optimistic update
    const prevCount = localWaters
    const prevStage = localStage
    const newCount  = localWaters + 1
    const newStage  = getStage(newCount)
    setLocalWaters(newCount)
    setLocalStage(newStage)
    setLoading(true)

    // Trigger Ancient Oak celebration
    const justBecameOak    = newStage === 'oak' && prevStage !== 'oak'
    const justChangedStage = newStage !== prevStage
    if (justBecameOak) {
      setShowConfetti(true)
      setOakToast(true)
      setTimeout(() => setOakToast(false), 5000)
    } else if (justChangedStage) {
      setStageToast(newStage)
      setTimeout(() => setStageToast(null), 3000)
    }

    // Persist interaction
    const { error: insertError } = await supabase
      .from('interactions')
      .insert({ post_id: post.id, user_id: user.id, type: 'water' })

    if (insertError) {
      setLocalWaters(prevCount)
      setLocalStage(prevStage)
      setLoading(false)
      showToast('Something went wrong. Try again 🌧️')
      return
    }

    // Increment waters_count on the post
    const { error: updateError } = await supabase
      .from('posts')
      .update({ waters_count: newCount })
      .eq('id', post.id)

    if (updateError) {
      setLocalWaters(prevCount)
      setLocalStage(prevStage)
      setLoading(false)
      showToast('Something went wrong. Try again 🌧️')
      return
    }

    setHasWatered(true)
    setLoading(false)
  }

  // Derived from local (optimistic) state
  const color     = stageColor[localStage] ?? '#6B7280'
  const emoji     = stageEmoji[localStage] ?? '🌰'
  const progress  = Math.min(localWaters / 12, 1) * 100
  const canBranch = localWaters >= 6
  const isMember  = !post || post.privacy === 'public' || MEMBER_POST_IDS.includes(post.id)

  return (
    <>
      <Toast message={toast} />
      <StageUpgradeToast stage={stageToast} />
      <OakToast show={oakToast} />
      {showConfetti && (
        <OakConfetti onComplete={() => setShowConfetti(false)} />
      )}

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

              {/* Share button */}
              <motion.button
                onClick={() => setShareOpen(true)}
                className="absolute top-5 bg-transparent border-none cursor-pointer"
                style={{ right: 44, color: '#74C69D', lineHeight: 1, padding: 0 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Share"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              </motion.button>

              {/* X close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-white/40 text-xl bg-transparent border-none cursor-pointer leading-none"
                aria-label="Close"
              >
                ✕
              </button>

              {/* ShareSheet — slides up over the drawer */}
              <ShareSheet
                post={post}
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                showToast={showToast}
              />

              {/* Stage badge — animates on stage change */}
              <div className="flex items-center gap-2 mb-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={localStage}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize"
                    style={{ background: color + '33', color }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [0.8, 1.15, 1], opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {emoji} {localStage}
                  </motion.span>
                </AnimatePresence>

                {/* Privacy pill */}
                {post.privacy === 'private_group' && (
                  <span style={{
                    background: 'rgba(125,211,240,0.12)',
                    border: '1px solid rgba(125,211,240,0.25)',
                    color: '#7DD3F0',
                    borderRadius: 20,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 10,
                    padding: '3px 10px',
                  }}>
                    🔒 Private Group
                  </span>
                )}
                {post.privacy === 'invite_only' && (
                  <span style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.25)',
                    color: '#FFD700',
                    borderRadius: 20,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 10,
                    padding: '3px 10px',
                  }}>
                    🫂 Invite Only
                  </span>
                )}
              </div>

              {/* Invite-only lock screen */}
              {post.privacy === 'invite_only' && !isMember ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <span style={{ fontSize: 48, lineHeight: 1 }}>🫂</span>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#fff',
                    marginTop: 8,
                    textAlign: 'center',
                  }}>
                    This event is invite only
                  </p>
                  <p style={{
                    fontFamily: "'Roboto', sans-serif",
                    fontWeight: 400,
                    fontSize: 13,
                    color: '#74C69D',
                    textAlign: 'center',
                  }}>
                    Ask the creator for an invite
                  </p>

                  <motion.button
                    className="w-full border-none cursor-pointer"
                    style={{
                      marginTop:    8,
                      background:   hasRequested ? 'rgba(82,183,136,0.1)' : 'rgba(255,215,0,0.1)',
                      border:       `1px solid ${hasRequested ? 'rgba(82,183,136,0.3)' : 'rgba(255,215,0,0.3)'}`,
                      borderRadius: 12,
                      padding:      12,
                      color:        hasRequested ? '#52B788' : '#FFD700',
                      fontFamily:   "'Poppins', sans-serif",
                      fontWeight:   600,
                      fontSize:     14,
                      opacity:      requesting || hasRequested ? 0.7 : 1,
                      cursor:       requesting || hasRequested ? 'default' : 'pointer',
                    }}
                    whileTap={requesting || hasRequested ? {} : { scale: 0.97 }}
                    onClick={requesting || hasRequested ? undefined : handleRequestInvite}
                  >
                    {requesting
                      ? 'Sending request...'
                      : hasRequested
                        ? '✅ Request Sent!'
                        : '✉️ Request an Invite'}
                  </motion.button>
                </div>
              ) : (
                <>
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
                    {post.privacy === 'private_group' && !isMember
                      ? post.content.slice(0, 60) + '...'
                      : post.content}
                  </p>

                  {/* Progress bar — only for members / public */}
                  {isMember && (
                    <div
                      className="w-full rounded-full mb-1 overflow-hidden"
                      style={{ height: 5, background: 'rgba(149,213,178,0.12)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  )}

                  {/* Water count */}
                  <p className="mb-1" style={{ color: '#74C69D', fontSize: 11 }}>
                    {post.privacy === 'private_group' && !isMember
                      ? '💧 ?? waters'
                      : `💧 ${localWaters} waters`}
                  </p>

                  {/* Friends watering indicator */}
                  {isMember && (post.friends_watering ?? 0) > 0 && (
                    <p className="mb-4" style={{ color: '#7DD3F0', fontSize: 11 }}>
                      👥 {post.friends_watering} friends watering
                    </p>
                  )}
                  {!(post.friends_watering > 0) && <div className="mb-4" />}

                  {/* Action buttons */}
                  {post.privacy === 'private_group' && !isMember ? (
                    <motion.button
                      className="w-full py-3 text-sm font-semibold border-none"
                      style={{
                        background: 'rgba(125,211,240,0.15)',
                        border: '1px solid #7DD3F0',
                        color: '#7DD3F0',
                        borderRadius: 12,
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: joinRequested ? 'default' : 'pointer',
                        opacity: joinRequested ? 0.7 : 1,
                      }}
                      whileTap={joinRequested ? {} : { scale: 0.97 }}
                      onClick={joinRequested ? undefined : () => {
                        setJoinRequested(true)
                        showToast('🔒 Join request sent!')
                      }}
                    >
                      {joinRequested ? 'Request Sent ✓' : 'Request to Join 🔒'}
                    </motion.button>
                  ) : (
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
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
