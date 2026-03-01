import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../components/Nav/BottomNav'
import SkeletonCard from '../components/UI/SkeletonCard'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/theme'

const ALL_TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'
]
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone

function formatEventTime(dateStr, tz) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr

  const now = new Date()
  const diffDays = (d - now) / (1000 * 60 * 60 * 24)

  const opts = { hour: 'numeric', minute: '2-digit', hour12: true }
  if (tz) opts.timeZone = tz

  if (diffDays > 7 || diffDays < -1) {
    opts.month = 'short'
    opts.day = 'numeric'
  } else {
    opts.weekday = 'short'
  }

  try {
    const datePart = d.toLocaleDateString('en-US', opts)
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).toLowerCase()
    return opts.weekday ? `${datePart.split(',')[0]} ${timePart.replace(' ', '')}` : `${datePart} ${timePart.replace(' ', '')}`
  } catch (e) {
    return dateStr
  }
}

function tzLabel(tz) {
  const parts = tz.split('/')
  return parts.length > 1
    ? `${parts[0].replace(/_/g, ' ')} / ${parts[parts.length - 1].replace(/_/g, ' ')}`
    : tz.replace(/_/g, ' ')
}

function TimezoneSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = ALL_TIMEZONES.filter((tz) =>
    tzLabel(tz).toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left border-none cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '12px 14px',
          fontFamily: "'Poppins', sans-serif",
          fontSize: 14,
          color: value ? '#fff' : 'rgba(255,255,255,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{value ? tzLabel(value) : '🕐 Timezone'}</span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '110%', zIndex: 200,
          background: '#0f2318', border: '1px solid rgba(82,183,136,0.25)',
          borderRadius: 10, maxHeight: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <input
            autoFocus type="text" placeholder="Search timezone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 'none', background: 'rgba(82,183,136,0.1)', border: 'none',
              borderBottom: '1px solid rgba(82,183,136,0.2)', padding: '8px 12px',
              color: '#fff', fontFamily: "'Poppins', sans-serif", fontSize: 12, outline: 'none',
            }}
          />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((tz) => (
              <button key={tz} type="button"
                onClick={() => { onChange(tz); setOpen(false); setSearch('') }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: tz === value ? 'rgba(82,183,136,0.2)' : 'transparent',
                  border: 'none', padding: '9px 12px',
                  color: tz === value ? '#52B788' : '#95D5B2',
                  fontFamily: "'Poppins', sans-serif", fontSize: 12, cursor: 'pointer',
                }}
              >{tzLabel(tz)}</button>
            ))}
            {filtered.length === 0 && (
              <p style={{ color: '#74C69D', fontSize: 12, padding: '10px 12px', fontFamily: "'Poppins', sans-serif" }}>No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
    waters_count: 12, growth_stage: 'mighty oak',
    branch_count: 2, event_time: new Date(Date.now() + 2 * 86400000).toISOString(), timezone: userTz,
  },
  {
    id: 2,
    title: 'Secret Rooftop Dinner 🌙',
    content: 'A private dinner for close friends. Bring something to share!',
    privacy: 'invite_only',
    waters_count: 3, growth_stage: 'sapling',
    branch_count: 0, event_time: new Date(Date.now() + 1 * 86400000).toISOString(), timezone: userTz,
    members: [
      { id: 1, username: 'alex_r', initials: 'AR', role: 'creator', status: 'accepted' },
      { id: 2, username: 'maya_w', initials: 'MW', role: 'member', status: 'accepted' },
      { id: 3, username: 'jordan_k', initials: 'JK', role: 'member', status: 'pending' },
    ],
  },
  {
    id: 3,
    title: 'Community Watch 🔒',
    content: 'Monthly meeting to discuss community safety and updates.',
    privacy: 'private_group',
    waters_count: 6, growth_stage: 'tree',
    branch_count: 1, event_time: new Date(Date.now() + 4 * 86400000).toISOString(), timezone: userTz,
    members: [
      { id: 1, username: 'alex_r', initials: 'AR', role: 'creator', status: 'accepted' },
      { id: 4, username: 'priya_s', initials: 'PS', role: 'member', status: 'pending' },
    ],
  },
]

const MY_WATERED = [
  {
    id: 5,
    title: 'Block Party Planning 🎉',
    content: 'Annual block party coming up — help plan activities, food, and music for the whole block.',
    waters_count: 7, growth_stage: 'tree', branch_count: 1, event_time: new Date(Date.now() + 10 * 86400000).toISOString(), timezone: userTz, is_branch: false,
  },
]

const MY_BRANCHES = [
  {
    id: 6,
    title: 'Cooking Demo 2pm',
    content: 'Learn to cook seasonal produce fresh from the market. All skill levels welcome.',
    waters_count: 2, growth_stage: 'sprout', branch_count: 0, event_time: new Date(Date.now() + 8 * 86400000).toISOString(), timezone: userTz,
    is_branch: true, parent_title: 'Saturday Farmers Market 🌽',
  },
]

const STATS = { planted: 7, watered: 34, branches: 3 }

const TABS = [
  { id: 'planted', label: '🌳 Planted' },
  { id: 'watered', label: '💧 Watered' },
  { id: 'branches', label: '🌿 Branches' },
]

// ─── MemberSheet ──────────────────────────────────────────────────────────────

function MemberSheet({ tree, onClose }) {
  const [memberTab, setMemberTab] = useState('accepted')
  const [members, setMembers] = useState(tree?.members ?? [])
  const [showInviteInput, setShowInviteInput] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [toast, setToast] = useState(null)

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
  const pending = members.filter((m) => m.status === 'pending')

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
                const label = t === 'accepted'
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

const PRIVACY_OPTIONS = [
  {
    id: 'public',
    icon: '🌍',
    title: 'Public',
    subtitle: 'Anyone can discover and water your tree',
    borderSelected: '#52B788',
    bgSelected: 'rgba(82,183,136,0.1)',
    dotColor: '#52B788',
  },
  {
    id: 'private_group',
    icon: '🔒',
    title: 'Private Group',
    subtitle: 'Visible on map, people request to join',
    borderSelected: '#7DD3F0',
    bgSelected: 'rgba(125,211,240,0.1)',
    dotColor: '#7DD3F0',
  },
  {
    id: 'invite_only',
    icon: '🫂',
    title: 'Invite Only',
    subtitle: 'Hidden from map — only invited people see this',
    borderSelected: '#FFD700',
    bgSelected: 'rgba(255,215,0,0.08)',
    dotColor: '#FFD700',
  },
]

function EditTreeSheet({ tree, onClose }) {
  const isBranch = tree?.is_branch === true

  const [name, setName] = useState(tree?.title ?? '')
  const [description, setDescription] = useState(tree?.content ?? '')
  const [datetime, setDatetime] = useState(tree?.event_time ?? '')
  const [timezone, setTimezone] = useState(tree?.timezone ?? '')
  const [privacy, setPrivacy] = useState(tree?.privacy ?? 'public')

  // Re-initialise when the selected tree changes
  useEffect(() => {
    if (!tree) return
    setName(tree.title ?? '')
    setDescription(tree.content ?? '')
    setLocation(tree.location ?? '')
    setDatetime(tree.event_time ?? '')
    setTimezone(tree.timezone ?? '')
    setPrivacy(tree.privacy ?? 'public')
  }, [tree?.id])

  const inputClass =
    'w-full rounded-[10px] px-4 py-3 text-white text-sm bg-white/5 border border-white/10 outline-none placeholder-white/30 focus:border-[#52B788] transition-colors'

  function handleSave() {
    console.log(isBranch ? 'Save branch' : 'Save tree', {
      id: tree.id, name, description, location, datetime, privacy,
    })
    onClose()
  }

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
              maxHeight: '85%',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20 flex-shrink-0" />

            <h2
              className="text-white mb-5 flex-shrink-0"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16 }}
            >
              {isBranch ? 'Edit Branch 🌿' : 'Edit Tree ✏️'}
            </h2>

            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-col gap-3 mb-5">

                {/* Name */}
                <input
                  className={inputClass}
                  placeholder={isBranch ? 'Branch activity / event name' : 'Tree name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                {/* Description */}
                <textarea
                  className={inputClass}
                  placeholder={isBranch ? 'Description' : "Description / What's happening?"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ resize: 'none' }}
                />

                {/* Location */}
                <input
                  className={inputClass}
                  placeholder="Location / Address"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                {/* Date & Time */}
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={datetime ? new Date(datetime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setDatetime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
                <TimezoneSelect value={timezone} onChange={setTimezone} />

                {/* Privacy */}
                <div>
                  <p style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#fff',
                    marginBottom: 8,
                  }}>
                    Who can see this? 👁️
                  </p>
                  <div className="flex flex-col gap-2">
                    {PRIVACY_OPTIONS.map((opt) => {
                      const active = privacy === opt.id
                      return (
                        <motion.button
                          key={opt.id}
                          type="button"
                          onClick={() => setPrivacy(opt.id)}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center justify-between text-left border-none cursor-pointer"
                          style={{
                            borderRadius: 12,
                            padding: '12px 14px',
                            border: `1.5px solid ${active ? opt.borderSelected : 'rgba(82,183,136,0.15)'}`,
                            background: active ? opt.bgSelected : 'transparent',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <div>
                            <p style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: 13,
                              color: '#fff',
                              marginBottom: 2,
                            }}>
                              {opt.icon} {opt.title}
                            </p>
                            <p style={{
                              fontFamily: "'Roboto', sans-serif",
                              fontWeight: 400,
                              fontSize: 11,
                              color: '#74C69D',
                            }}>
                              {opt.subtitle}
                            </p>
                          </div>
                          <div style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginLeft: 12,
                            border: active ? `2px solid ${opt.dotColor}` : '2px solid rgba(82,183,136,0.3)',
                            background: active ? opt.dotColor : 'transparent',
                            transition: 'background 0.15s, border-color 0.15s',
                          }} />
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex-shrink-0">
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
                onClick={handleSave}
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
                onClick={() => { console.log(`Delete ${isBranch ? 'branch' : 'tree'}`, tree.id); onClose() }}
              >
                {isBranch ? 'Delete Branch 🗑️' : 'Delete Tree 🗑️'}
              </motion.button>

              {/* Cancel */}
              <button
                onClick={onClose}
                className="w-full text-white/40 text-sm bg-transparent border-none cursor-pointer"
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

function TreeCard({ post, index, tab, onEdit, onManageMembers, onUnwater }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
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
        background: t.bgCard,
        borderRadius: 16,
        border: isDark ? `1px solid ${t.border}` : 'none',
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(45,106,79,0.1)',
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
          <button
            onClick={() => onUnwater && onUnwater(post)}
            className="rounded-[20px] px-2 py-0.5 border-none cursor-pointer"
            style={{
              background: 'rgba(125,211,240,0.15)',
              color: '#7DD3F0',
              fontSize: 10,
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
            }}
          >
            💧 Watered
          </button>
        )}

        <span
          style={{ color: '#74C69D', fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
        >
          {formatEventTime(post.event_time, post.timezone)}
        </span>
      </div>

      {/* Title */}
      <p
        className="mb-0.5"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, color: t.textPrimary }}
      >
        {post.title}
      </p>

      {/* Branch parent label */}
      {tab === 'branches' && post.parent_title && (
        <p
          className="mb-1.5"
          style={{ color: t.sprout, fontSize: 11, fontFamily: "'Roboto', sans-serif" }}
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
          color: t.pale,
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
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <motion.div
      className="flex flex-col items-center justify-center pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>{EMPTY_ICON[tab]}</span>
      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, color: t.textPrimary, marginBottom: 6 }}>
        No trees yet
      </p>
      <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 13, color: t.sprout }}>
        Tap the map to plant your first tree
      </p>
    </motion.div>
  )
}

// ─── MyTreesPage ──────────────────────────────────────────────────────────────

export default function MyTreesPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const [activeTab, setActiveTab] = useState('planted')
  const [editTree, setEditTree] = useState(null)
  const [memberSheet, setMemberSheet] = useState(null)
  const [unwaterTree, setUnwaterTree] = useState(null)
  const [wateredList, setWateredList] = useState(MY_WATERED)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  const posts = activeTab === 'watered' ? wateredList : activeTab === 'planted' ? MY_PLANTED : MY_BRANCHES

  function handleConfirmUnwater() {
    setWateredList(prev => prev.filter(p => p.id !== unwaterTree.id))
    setUnwaterTree(null)
    setToast('Support removed. You can always water again later! 🌱')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden flex flex-col"
      style={{ background: t.bg, transition: 'background 0.3s ease' }}
    >

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 flex items-start justify-between" style={{ paddingTop: 56 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 20, color: t.textPrimary, marginBottom: 2 }}>
            My Trees 🌳
          </h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: t.sprout }}>
            Your roots in the community
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
        style={{ borderBottom: `1px solid ${t.border}` }}
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
                color: active ? t.textPrimary : t.navInactive,
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
        style={{ background: isDark ? 'rgba(45,106,79,0.15)' : 'rgba(40,51,45,0.04)', padding: '12px 0' }}
      >
        {[
          { val: STATS.planted, label: '🌳 Planted' },
          { val: STATS.watered, label: '💧 Watered' },
          { val: STATS.branches, label: '🌿 Branches' },
        ].map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center" style={{ borderLeft: i > 0 ? `1px solid ${t.border}` : 'none' }}>
            <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12, color: t.textPrimary }}>
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
                  onUnwater={setUnwaterTree}
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
      <EditTreeSheet tree={editTree} onClose={() => setEditTree(null)} />
      <MemberSheet tree={memberSheet} onClose={() => setMemberSheet(null)} />

      {/* Un-water Confirmation Dialog */}
      <AnimatePresence>
        {unwaterTree && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0f2318] w-full max-w-[280px] rounded-2xl p-6 text-center shadow-xl border border-[rgba(82,183,136,0.2)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <span className="text-4xl mb-3 block">💧</span>
              <h3 className="text-white font-bold text-lg font-poppins mb-2">Remove Support?</h3>
              <p className="text-[#95D5B2] text-sm font-roboto mb-6 leading-relaxed">
                Do you want to remove your support? You can always water again later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUnwaterTree(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2D6A4F] bg-transparent text-[#74C69D] font-poppins text-sm font-semibold cursor-pointer"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmUnwater}
                  className="flex-1 py-2.5 rounded-xl border-none bg-[#2D6A4F] text-white font-poppins text-sm font-semibold cursor-pointer"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 z-50 rounded-full px-4 py-2 text-center"
            style={{
              bottom: 80,
              width: 'max-content',
              maxWidth: '320px',
              background: '#2D6A4F',
              fontFamily: "'Poppins', sans-serif",
              fontSize: 12,
              color: '#fff',
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
