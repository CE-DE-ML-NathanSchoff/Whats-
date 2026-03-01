import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../components/Nav/BottomNav'
import SideMenu, { FRIENDS_SECTION_IDS } from '../components/Nav/SideMenu'

// ─── Stage data (matches PostCard / ExplorePage) ─────────────────────────────

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const RECENT_ACTIVITY = [
  { id: 1, text: "Sarah watered 'Farmers Market' 💧",       time: '2h ago',   postId: 1 },
  { id: 2, text: "Mike tended 'Startup Meetup' 🌿",         time: 'just now', postId: 3 },
  { id: 3, text: "3 friends watered 'Open Mic Night' 🌱",   time: '5m ago',   postId: 5 },
  { id: 4, text: "Jess watered 'Community Garden' 💧",      time: '1h ago',   postId: 4 },
  { id: 5, text: "Leo tended 'Neighborhood Cleanup' 🌿",    time: '30m ago',  postId: 2 },
]

const FRIEND_TREES = [
  {
    id: 1, title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park.',
    waters_count: 12, growth_stage: 'oak', branch_count: 2,
    friends_watering: 4, time_label: 'Sat 8am',
  },
  {
    id: 3, title: 'Neighborhood Cleanup 🌳',
    content: 'Monthly cleanup crew keeping our streets beautiful.',
    waters_count: 8, growth_stage: 'tree', branch_count: 1,
    friends_watering: 3, time_label: 'Sun 10am',
  },
  {
    id: 5, title: 'Book Swap at Library 📚',
    content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library.',
    waters_count: 7, growth_stage: 'tree', branch_count: 2,
    friends_watering: 2, time_label: 'Tue 5pm',
  },
]

const MY_CIRCLE = [
  { id: 1, username: 'Sarah M.',   waters_count: 24, branch_count: 3, lastActive: '2h ago'  },
  { id: 2, username: 'Mike R.',    waters_count: 18, branch_count: 5, lastActive: 'just now' },
  { id: 3, username: 'Jess K.',    waters_count: 11, branch_count: 1, lastActive: '1h ago'   },
  { id: 4, username: 'Leo P.',     waters_count: 9,  branch_count: 2, lastActive: '30m ago'  },
]

const REQUESTS = [
  { id: 10, username: 'Dana T.', mutual: 2 },
  { id: 11, username: 'Chris W.', mutual: 5 },
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

// ─── Activity item ───────────────────────────────────────────────────────────

function ActivityItem({ item, index, onTap }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22, ease: 'easeOut' }}
      onClick={() => onTap(item.postId)}
      className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer text-left"
      style={{ padding: '10px 20px' }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 32, height: 32, background: 'rgba(82,183,136,0.15)' }}
      >
        <span style={{ fontSize: 14 }}>🌱</span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#fff' }}
        >
          {item.text}
        </p>
      </div>
      <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: '#74C69D', flexShrink: 0 }}>
        {item.time}
      </span>
    </motion.button>
  )
}

// ─── Friend tree card (matches EventCard styling) ────────────────────────────

function FriendTreeCard({ post, index }) {
  const color = stageColor[post.growth_stage] ?? '#6B7280'
  const emoji = stageEmoji[post.growth_stage] ?? '🌰'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: 'easeOut' }}
      className="mx-4 mb-3"
      style={{
        background: '#0f2318',
        borderRadius: 16,
        border: '1px solid rgba(82,183,136,0.15)',
        padding: 16,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="rounded-full px-2.5 py-0.5 capitalize"
          style={{
            background: color + '33',
            color,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {emoji} {post.growth_stage}
        </span>
        <span style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          {post.time_label}
        </span>
      </div>

      <p
        className="mb-1.5"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' }}
      >
        {post.title}
      </p>

      <p
        className="mb-3"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          fontSize: 12,
          color: '#95D5B2',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {post.content}
      </p>

      <div className="flex items-center gap-3">
        <span style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          💧 {post.waters_count} waters
        </span>
        <span style={{ color: '#52B788', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          🌿 {post.branch_count} branches
        </span>
        {post.friends_watering > 0 && (
          <span style={{ color: '#7DD3F0', fontSize: 11, fontFamily: "'Roboto', sans-serif", marginLeft: 'auto' }}>
            👥 {post.friends_watering} friends watering
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Circle item ─────────────────────────────────────────────────────────────

function CircleItem({ friend, index }) {
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
          {friend.username}
        </p>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: '#74C69D' }}>
          💧 {friend.waters_count} · 🌿 {friend.branch_count}
        </p>
      </div>
      <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 10, color: '#52B788' }}>
        Active {friend.lastActive}
      </span>
    </motion.div>
  )
}

// ─── Request item ────────────────────────────────────────────────────────────

function RequestItem({ request, index, onAccept, onDecline }) {
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
          {request.username}
        </p>
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: '#74C69D' }}>
          {request.mutual} mutual friends
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onAccept(request.id)}
          className="border-none cursor-pointer rounded-[8px] px-3 py-1"
          style={{
            background: '#52B788',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
          }}
        >
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onDecline(request.id)}
          className="border-none cursor-pointer rounded-[8px] px-3 py-1"
          style={{
            background: 'rgba(82,183,136,0.15)',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            color: '#74C69D',
          }}
        >
          Decline
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── FriendsPage ─────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const navigate = useNavigate()
  const [requests, setRequests]   = useState(REQUESTS)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [activeSection, setActiveSection] = useState(FRIENDS_SECTION_IDS.RECENT_ACTIVITY)

  const scrollRef           = useRef(null)
  const recentActivityRef   = useRef(null)
  const friendTreesRef      = useRef(null)
  const yourCircleRef       = useRef(null)
  const requestsRef         = useRef(null)

  const sectionRefs = {
    [FRIENDS_SECTION_IDS.RECENT_ACTIVITY]: recentActivityRef,
    [FRIENDS_SECTION_IDS.FRIEND_TREES]:     friendTreesRef,
    [FRIENDS_SECTION_IDS.YOUR_CIRCLE]:     yourCircleRef,
    [FRIENDS_SECTION_IDS.REQUESTS]:        requestsRef,
  }

  const handleSelectSection = useCallback((sectionId) => {
    setActiveSection(sectionId)
    const ref = sectionRefs[sectionId]?.current
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleAccept  = (id) => setRequests((r) => r.filter((req) => req.id !== id))
  const handleDecline = (id) => setRequests((r) => r.filter((req) => req.id !== id))

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden bg-[#0D1F16] flex flex-col">

      {/* ── Side menu ── */}
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
      />

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 flex items-center gap-3" style={{ paddingTop: 56 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setMenuOpen(true)}
          className="flex-shrink-0 bg-transparent border-none cursor-pointer p-2 -m-2"
          aria-label="Open menu"
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>☰</span>
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 2 }}>
            Your People 👥
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#74C69D' }}>
            See where your people are growing 🌿
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/find-friends')}
          className="border-none cursor-pointer rounded-[8px] px-3 py-1.5 flex-shrink-0"
          style={{
            background: '#2D6A4F',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
          }}
        >
          + Find Friends
        </motion.button>
      </div>

      {/* ── Scrollable body ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-4"
        style={{ paddingBottom: 80, scrollbarWidth: 'none' }}
      >
        {/* Section 1: Recent Activity */}
        <div id="recent-activity" ref={recentActivityRef}>
          <SectionHeader>🌱 Recent Activity</SectionHeader>
          <div className="mb-5">
            {RECENT_ACTIVITY.map((item, i) => (
              <ActivityItem
                key={item.id}
                item={item}
                index={i}
                onTap={(postId) => console.log('Navigate to tree', postId)}
              />
            ))}
          </div>
        </div>

        {/* Section 2: Friends' Trees */}
        <div id="friend-trees" ref={friendTreesRef}>
          <SectionHeader>Friends&apos; Trees 🌳</SectionHeader>
          <div className="mb-5">
            {FRIEND_TREES.map((post, i) => (
              <FriendTreeCard key={post.id} post={post} index={i} />
            ))}
          </div>
        </div>

        {/* Section 3: Your Circle */}
        <div id="your-circle" ref={yourCircleRef}>
          <SectionHeader>👤 Your Circle</SectionHeader>
          <div className="mb-5">
            {MY_CIRCLE.map((friend, i) => (
              <CircleItem key={friend.id} friend={friend} index={i} />
            ))}
          </div>
        </div>

        {/* Section 4: Requests */}
        <div id="requests" ref={requestsRef}>
          <AnimatePresence>
            {requests.length > 0 && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SectionHeader>🔔 Requests</SectionHeader>
                {requests.map((req, i) => (
                  <RequestItem
                    key={req.id}
                    request={req}
                    index={i}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
