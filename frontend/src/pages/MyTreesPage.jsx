import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../components/Nav/BottomNav'
import SkeletonCard from '../components/UI/SkeletonCard'

// ─── Stage data ───────────────────────────────────────────────────────────────

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

// ─── Test data ────────────────────────────────────────────────────────────────

const MY_PLANTED = [
  {
    id: 1,
    title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park. Bring your own bags!',
    privacy: 'public',
    waters_count: 12, growth_stage: 'oak',
    branch_count: 2, event_time: 'Sat 9am',
  },
  {
    id: 2,
    title: 'Secret Rooftop Dinner 🌙',
    content: 'A private dinner for close friends. Bring something to share!',
    privacy: 'invite_only',
    waters_count: 3, growth_stage: 'sapling',
    branch_count: 0, event_time: 'Sat 7pm',
    members: [
      { id: 1, username: 'alex_r',   initials: 'AR', role: 'creator', status: 'accepted' },
      { id: 2, username: 'maya_w',   initials: 'MW', role: 'member',  status: 'accepted' },
      { id: 3, username: 'jordan_k', initials: 'JK', role: 'member',  status: 'pending'  },
    ],
  },
  {
    id: 3,
    title: 'Neighborhood Watch 🔒',
    content: 'Monthly meeting to discuss neighborhood safety and updates.',
    privacy: 'private_group',
    waters_count: 6, growth_stage: 'tree',
    branch_count: 1, event_time: 'Thu 7pm',
    members: [
      { id: 1, username: 'alex_r',  initials: 'AR', role: 'creator', status: 'accepted' },
      { id: 4, username: 'priya_s', initials: 'PS', role: 'member',  status: 'pending'  },
    ],
  },
]

const MY_WATERED = [
  {
    id: 5,
    title: 'Block Party Planning 🎉',
    content: 'Annual block party coming up — help plan activities, food, and music for the whole block.',
    waters_count: 7, growth_stage: 'tree', branch_count: 1, event_time: 'Sun 3pm', is_branch: false,
  },
]

const MY_BRANCHES = [
  {
    id: 6,
    title: 'Cooking Demo 2pm',
    content: 'Learn to cook seasonal produce fresh from the market. All skill levels welcome.',
    waters_count: 2, growth_stage: 'sprout', branch_count: 0, event_time: 'Sat 11am',
    is_branch: true, parent_title: 'Saturday Farmers Market 🌽',
  },
]

const STATS = { planted: 7, watered: 34, branches: 3 }

const TABS = [
  { id: 'planted',  label: '🌳 Planted' },
  { id: 'watered',  label: '💧 Watered' },
  { id: 'branches', label: '🌿 Branches' },
]

// ─── MemberSheet ──────────────────────────────────────────────────────────────

function MemberSheet({ tree, onClose }) {
  const [memberTab,        setMemberTab]        = useState('accepted')
  const [members,          setMembers]          = useState(tree?.members ?? [])
  const [showInviteInput,  setShowInviteInput]  = useState(false)
  const [inviteInput,      setInviteInput]      = useState('')
  const [toast,            setToast]            = useState(null)

  // Reset when tree changes
  useEffect(() => {
    if (!tree) return
    setMemberTab('accepted')
    setMembers(tree.members ?? [])
    setShowInviteInput(false)
    setInviteInput('')
    setToast(null)
  }, [tree?.id])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleRemove(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    showToast('Member removed')
  }

  function handleAccept(memberId) {
    setMembers((prev) =>
      prev.map((m) => m.id === memberId ? { ...m, status: 'accepted' } : m)
    )
    showToast('✅ Request accepted!')
  }

  function handleDecline(memberId) {
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    showToast('Request declined')
  }

  function handleSendInvite() {
    if (!inviteInput.trim()) return
    showToast('🫂 Invite sent!')
    setInviteInput('')
    setShowInviteInput(false)
  }

  const accepted = members.filter((m) => m.status === 'accepted')
  const pending  = members.filter((m) => m.status === 'pending')

  const inputClass =
    'w-full rounded-[10px] px-4 py-3 text-white text-sm bg-white/5 border border-white/10 outline-none placeholder-white/30 focus:border-[#52B788] transition-colors'

  return (
    <AnimatePresence>
      {tree && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              background: '#0D1F16',
              borderTop: '2px solid #2D6A4F',
              borderRadius: '20px 20px 0 0',
              padding: 20,
              maxHeight: '80%',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20 flex-shrink-0" />

            {/* Toast inside sheet */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 z-10 rounded-full px-4 py-2 whitespace-nowrap"
                  style={{
                    top: 56,
                    background: '#2D6A4F',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 12,
                    color: '#fff',
                  }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex-shrink-0 mb-1">
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
              }}>
                👥 Members
              </p>
              <p style={{
                fontFamily: "'Roboto', sans-serif",
                fontSize: 12,
                color: '#74C69D',
                marginTop: 2,
              }}>
                {tree.title}
              </p>
            </div>

            {/* X close */}
            <button
              onClick={onClose}
              className="absolute top-8 right-5 text-white/40 text-xl bg-transparent border-none cursor-pointer leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Tabs */}
            <div
              className="flex-shrink-0 flex gap-6 mt-4 mb-1"
              style={{ borderBottom: '1px solid rgba(82,183,136,0.1)' }}
            >
              {['accepted', 'pending'].map((t) => {
                const active = memberTab === t
                const label  = t === 'accepted'
                  ? `Accepted (${accepted.length})`
                  : `Pending (${pending.length})`
                return (
                  <button
                    key={t}
                    onClick={() => setMemberTab(t)}
                    className="relative pb-3 bg-transparent border-none cursor-pointer capitalize"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                      color: active ? '#fff' : '#3a5a45',
                    }}
                  >
                    {label}
                    {active && (
                      <motion.div
                        layoutId="member-tab-underline"
                        className="absolute bottom-0 left-0 right-0 rounded-full"
                        style={{ height: 2, background: '#52B788' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={memberTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {memberTab === 'accepted' && accepted.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center"
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(82,183,136,0.08)',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          background: '#2D6A4F',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#fff',
                        }}
                      >
                        {m.initials}
                      </div>

                      {/* Username */}
                      <p style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#fff',
                        marginLeft: 10,
                        flex: 1,
                      }}>
                        {m.username}
                      </p>

                      {/* Creator badge */}
                      {m.role === 'creator' && (
                        <span style={{
                          background: 'rgba(255,215,0,0.1)',
                          color: '#FFD700',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 10,
                          borderRadius: 20,
                          padding: '2px 8px',
                          marginRight: 8,
                        }}>
                          👑 Creator
                        </span>
                      )}

                      {/* Remove button */}
                      {m.role !== 'creator' && (
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="bg-transparent border-none cursor-pointer"
                          style={{
                            color: '#FF4444',
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: 14,
                            lineHeight: 1,
                            padding: '4px 6px',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  {memberTab === 'pending' && pending.length === 0 && (
                    <p
                      className="text-center py-8"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: 13,
                        color: '#74C69D',
                      }}
                    >
                      No pending requests
                    </p>
                  )}

                  {memberTab === 'pending' && pending.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center"
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(82,183,136,0.08)',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          background: '#2D6A4F',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#fff',
                        }}
                      >
                        {m.initials}
                      </div>

                      {/* Username */}
                      <p style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#fff',
                        marginLeft: 10,
                        flex: 1,
                      }}>
                        {m.username}
                      </p>

                      {/* Accept */}
                      <button
                        onClick={() => handleAccept(m.id)}
                        className="border-none cursor-pointer"
                        style={{
                          background: '#52B788',
                          color: '#fff',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 11,
                          marginRight: 6,
                        }}
                      >
                        ✓ Accept
                      </button>

                      {/* Decline */}
                      <button
                        onClick={() => handleDecline(m.id)}
                        className="bg-transparent cursor-pointer"
                        style={{
                          border: '1px solid #FF4444',
                          color: '#FF4444',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Invite button — invite_only only */}
            {tree.privacy === 'invite_only' && (
              <div className="flex-shrink-0 mt-3">
                <motion.button
                  className="w-full border-none cursor-pointer"
                  style={{
                    background: '#2D6A4F',
                    borderRadius: 12,
                    padding: 12,
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#fff',
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowInviteInput((v) => !v)}
                >
                  + Invite Someone 🫂
                </motion.button>

                <AnimatePresence>
                  {showInviteInput && (
                    <motion.div
                      className="flex flex-col gap-2 mt-3"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <input
                        className={inputClass}
                        placeholder="Username or email..."
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                      />
                      <motion.button
                        className="w-full py-2 border-none cursor-pointer"
                        style={{
                          background: '#52B788',
                          borderRadius: 10,
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#fff',
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSendInvite}
                      >
                        + Send Invite
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── EditTreeSheet ────────────────────────────────────────────────────────────

function EditTreeSheet({ tree, onClose }) {
  const [name, setName]         = useState(tree?.title ?? '')
  const [content, setContent]   = useState(tree?.content ?? '')
  const [datetime, setDatetime] = useState('')

  const inputClass =
    'w-full rounded-[10px] px-4 py-3 text-white text-sm bg-white/5 border border-white/10 outline-none placeholder-white/30 focus:border-[#52B788] transition-colors'

  return (
    <AnimatePresence>
      {tree && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-50"
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

            <h2
              className="text-white mb-5"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16 }}
            >
              Edit Tree ✏️
            </h2>

            <div className="flex flex-col gap-3 mb-5">
              <input
                className={inputClass}
                placeholder="Event name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Description"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <input
                type="datetime-local"
                className={inputClass}
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Save */}
            <motion.button
              className="w-full py-3 text-white border-none cursor-pointer mb-3"
              style={{
                background: '#52B788',
                borderRadius: 12,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 14,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { console.log('Save tree', { id: tree.id, name, content, datetime }); onClose() }}
            >
              Save Changes
            </motion.button>

            {/* Delete */}
            <motion.button
              className="w-full py-3 bg-transparent cursor-pointer mb-3"
              style={{
                border: '1px solid #FF4444',
                color: '#FF4444',
                borderRadius: 12,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 14,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { console.log('Delete tree', tree.id); onClose() }}
            >
              Delete Tree 🗑️
            </motion.button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full text-white/40 text-sm bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ flowers, stage }) {
  const pct = Math.min(flowers / 12, 1) * 100
  const color = stageColor[stage] ?? '#52B788'
  return (
    <div
      className="w-full rounded-full overflow-hidden mb-3"
      style={{ height: 4, background: 'rgba(149,213,178,0.12)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── TreeCard ─────────────────────────────────────────────────────────────────

function TreeCard({ post, index, tab, onEdit, onManageMembers }) {
  const color = stageColor[post.growth_stage] ?? '#6B7280'
  const emoji = stageEmoji[post.growth_stage] ?? '🌰'
  const showManage =
    tab === 'planted' &&
    (post.privacy === 'private_group' || post.privacy === 'invite_only')

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
        position: 'relative',
      }}
    >
      {/* Edit button (Planted + Branches tabs) */}
      {(tab === 'planted' || tab === 'branches') && (
        <button
          onClick={() => onEdit(post)}
          className="absolute top-4 right-4 flex items-center gap-1 border-none cursor-pointer rounded-[8px] px-2 py-1"
          style={{ background: 'rgba(45,106,79,0.3)', color: '#74C69D', fontSize: 11 }}
        >
          ✏️
        </button>
      )}

      {/* Top row: stage badge + privacy pill + time */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="rounded-full capitalize"
          style={{
            background: color + '33',
            color,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 10px',
          }}
        >
          {emoji} {post.growth_stage}
        </span>

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
            🔒 Private
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

        {/* Watered badge */}
        {tab === 'watered' && (
          <span
            className="rounded-[20px] px-2 py-0.5"
            style={{
              background: 'rgba(125,211,240,0.15)',
              color: '#7DD3F0',
              fontSize: 10,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
            }}
          >
            💧 Watered
          </span>
        )}

        <span
          className="ml-auto"
          style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
        >
          {post.event_time}
        </span>
      </div>

      {/* Title */}
      <p
        className="mb-0.5"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: '#fff' }}
      >
        {post.title}
      </p>

      {/* Branch parent label */}
      {tab === 'branches' && post.parent_title && (
        <p
          className="mb-1.5"
          style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
        >
          ↳ branch of {post.parent_title}
        </p>
      )}

      {/* Content preview */}
      <p
        className="mb-3 mt-1"
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

      {/* Progress bar */}
      <ProgressBar flowers={post.waters_count} stage={post.growth_stage} />

      {/* Bottom row */}
      <div className="flex items-center gap-3">
        <span style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          💧 {post.waters_count} waters
        </span>
        <span style={{ color: '#52B788', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}>
          🌿 {post.branch_count} branches
        </span>
      </div>

      {/* Manage Members button */}
      {showManage && (
        <button
          onClick={() => onManageMembers(post)}
          className="mt-3 border-none cursor-pointer"
          style={{
            background: 'rgba(45,106,79,0.3)',
            color: '#95D5B2',
            borderRadius: 10,
            padding: '6px 12px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          👥 Manage Members
        </button>
      )}
    </motion.div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EMPTY_ICON = { planted: '🌱', watered: '💧', branches: '🌿' }

function EmptyState({ tab }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>{EMPTY_ICON[tab]}</span>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 6 }}>
        No trees yet
      </p>
      <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: '#74C69D' }}>
        Tap the map to plant your first tree
      </p>
    </motion.div>
  )
}

// ─── MyTreesPage ──────────────────────────────────────────────────────────────

const TAB_DATA = { planted: MY_PLANTED, watered: MY_WATERED, branches: MY_BRANCHES }

export default function MyTreesPage() {
  const navigate = useNavigate()
  const [activeTab,    setActiveTab]    = useState('planted')
  const [editTree,     setEditTree]     = useState(null)
  const [memberSheet,  setMemberSheet]  = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  const posts = TAB_DATA[activeTab]

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden bg-[#0D1F16] flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 flex items-start justify-between" style={{ paddingTop: 56 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 2 }}>
            My Trees 🌳
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: '#74C69D' }}>
            Your roots in the neighborhood
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/trees/search')}
          className="flex items-center justify-center border-none cursor-pointer rounded-[10px] bg-transparent"
          style={{ width: 40, height: 40, padding: 8, color: '#fff' }}
          aria-label="Search my trees"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </div>

      {/* ── Tab Row ── */}
      <div
        className="flex-shrink-0 flex px-5 mt-4 gap-6"
        style={{ borderBottom: '1px solid rgba(82,183,136,0.1)' }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative pb-3 bg-transparent border-none cursor-pointer"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                color: active ? '#fff' : '#3a5a45',
              }}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{ height: 2, background: '#52B788' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Stats Bar ── */}
      <div
        className="flex-shrink-0 flex items-center mx-4 mt-3 mb-1 rounded-[12px]"
        style={{ background: 'rgba(45,106,79,0.15)', padding: '12px 0' }}
      >
        {[
          { val: STATS.planted,  label: '🌳 Planted' },
          { val: STATS.watered,  label: '💧 Watered' },
          { val: STATS.branches, label: '🌿 Branches' },
        ].map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center" style={{ borderLeft: i > 0 ? '1px solid rgba(82,183,136,0.15)' : 'none' }}>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12, color: '#95D5B2' }}>
              {s.val} {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Card List ── */}
      <div
        className="flex-1 overflow-y-auto mt-2"
        style={{ paddingBottom: 80, scrollbarWidth: 'none' }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonCard count={3} />
            </motion.div>
          ) : posts.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {posts.map((post, i) => (
                <TreeCard
                  key={post.id}
                  post={post}
                  index={i}
                  tab={activeTab}
                  onEdit={setEditTree}
                  onManageMembers={setMemberSheet}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key={`empty-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState tab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sheets ── */}
      <EditTreeSheet  tree={editTree}    onClose={() => setEditTree(null)}    />
      <MemberSheet    tree={memberSheet} onClose={() => setMemberSheet(null)} />

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
