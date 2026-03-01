import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../components/Nav/BottomNav'
import { supabase } from '../lib/supabase'

// ─── Hardcoded profile data ───────────────────────────────────────────────────

const INITIAL_PROFILE = {
  name:         'Alex Rivera',
  neighborhood: 'West Philadelphia',
  userType:     'local',
  interests:    ['Farmers Markets', 'Music', 'Gardens'],
  email:        'alex@example.com',
  treesPlanted: 7,
  waters:       34,
  branches:     3,
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const IconPerson = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="6" r="4" stroke="white" strokeWidth="1.8"/>
    <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)
const IconPin = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" stroke="white" strokeWidth="1.8"/>
    <circle cx="10" cy="8" r="2" stroke="white" strokeWidth="1.5"/>
  </svg>
)
const IconBadge = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M10 2l2.2 4.5 5 .7-3.6 3.5.85 4.95L10 13.25l-4.45 2.4.85-4.95L2.8 7.2l5-.7L10 2z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
)
const IconTag = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M3 3h6l8 8-6 6-8-8V3z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="1.2" fill="white"/>
  </svg>
)
const IconTree = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L4 10h4l-2 5h8l-2-5h4L10 2z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
)
const IconEmail = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="5" width="16" height="11" rx="2" stroke="white" strokeWidth="1.8"/>
    <path d="M2 7l8 5 8-5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)
const IconUser = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="12" r="7" stroke="#1BBC65" strokeWidth="2"/>
    <path d="M4 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1BBC65" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <path d="M14.85 2.85a2 2 0 012.83 2.83L6 17.5l-4 1 1-4L14.85 2.85z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
)

// ─── Interest options + Chip ──────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  'Food & Drink', 'Fitness', 'Art', 'Music', 'Tech',
  'Outdoors', 'Volunteering', 'Networking', 'Markets', 'Workshops',
]

function Chip({ label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className="border-none cursor-pointer"
      style={{
        padding: '8px 16px',
        borderRadius: 20,
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        background: selected ? '#1BBC65' : '#f2f9f3',
        color: selected ? '#fff' : '#28332D',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </motion.button>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IconBubble({ bg, children }) {
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{ width: 36, height: 36, background: bg }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      className="mx-5"
      style={{ height: 1, background: 'rgba(40,51,45,0.08)' }}
    />
  )
}

function Label({ children }) {
  return (
    <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 13, color: 'rgba(40,51,45,0.7)', marginBottom: 2 }}>
      {children}
    </p>
  )
}

function Value({ children }) {
  return (
    <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 17, color: '#28332D' }}>
      {children}
    </p>
  )
}

function FieldInput({ value, onChange, placeholder }) {
  return (
    <input
      className="outline-none border-b w-full"
      style={{
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 500,
        fontSize: 17,
        color: '#28332D',
        borderColor: '#1BBC65',
        background: 'transparent',
        paddingBottom: 2,
      }}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage({ onBack }) {
  const navigate = useNavigate()
  const [profile, setProfile]     = useState(INITIAL_PROFILE)
  const [editing, setEditing]     = useState(false)
  const [draft, setDraft]         = useState(INITIAL_PROFILE)
  const [customInterest, setCustomInterest] = useState('')

  function addCustomInterest() {
    const trimmed = customInterest.trim()
    if (trimmed && !draft.interests.includes(trimmed)) {
      setDraft((d) => ({ ...d, interests: [...d.interests, trimmed] }))
    }
    setCustomInterest('')
  }

  function startEdit() {
    setDraft({ ...profile })
    setEditing(true)
  }

  function saveEdit() {
    setProfile({ ...draft })
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
  }

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  const rows = [
    {
      bg: '#AF80FC', icon: <IconPerson />, label: 'Name',
      view: <Value>{profile.name}</Value>,
      edit: <FieldInput value={draft.name} onChange={set('name')} placeholder="Name" />,
    },
    {
      bg: '#F5CA31', icon: <IconPin />, label: 'Neighborhood',
      view: <Value>{profile.neighborhood}</Value>,
      edit: <FieldInput value={draft.neighborhood} onChange={set('neighborhood')} placeholder="Neighborhood" />,
    },
    {
      bg: '#FF82E3', icon: <IconBadge />, label: 'User Type',
      view: <Value style={{ textTransform: 'capitalize' }}>{profile.userType}</Value>,
      edit: (
        <select
          value={draft.userType}
          onChange={set('userType')}
          className="outline-none border-b w-full bg-transparent"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 17, color: '#28332D', borderColor: '#1BBC65' }}
        >
          <option value="guest">guest</option>
          <option value="local">local</option>
          <option value="business">business</option>
        </select>
      ),
    },
    {
      bg: '#28C7AA', icon: <IconTag />, label: 'Interests',
      view: (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {profile.interests.map((tag) => (
            <span
              key={tag}
              className="rounded-[20px] px-2 py-0.5"
              style={{ background: '#2D6A4F', color: '#95D5B2', fontSize: 10 }}
            >
              {tag}
            </span>
          ))}
        </div>
      ),
      edit: (
        <div>
          <div className="flex flex-wrap gap-2 mt-1 mb-3">
            {INTEREST_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={draft.interests.includes(opt)}
                onClick={() => setDraft((d) => ({
                  ...d,
                  interests: d.interests.includes(opt)
                    ? d.interests.filter((i) => i !== opt)
                    : [...d.interests, opt],
                }))}
              />
            ))}
            {draft.interests
              .filter((i) => !INTEREST_OPTIONS.includes(i))
              .map((custom) => (
                <Chip
                  key={custom}
                  label={custom}
                  selected
                  onClick={() => setDraft((d) => ({
                    ...d,
                    interests: d.interests.filter((i) => i !== custom),
                  }))}
                />
              ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 outline-none text-[13px]"
              style={{
                fontFamily: "'Poppins', sans-serif",
                padding: '8px 14px',
                borderRadius: 20,
                border: '1.5px solid rgba(40,51,45,0.15)',
                background: '#fff',
                color: '#28332D',
              }}
              placeholder="Other..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={addCustomInterest}
              className="border-none cursor-pointer text-white text-[13px] font-semibold"
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                background: customInterest.trim() ? '#1BBC65' : 'rgba(40,51,45,0.15)',
                fontFamily: "'Poppins', sans-serif",
                transition: 'background 0.15s',
              }}
            >
              + Add
            </motion.button>
          </div>
        </div>
      ),
    },
    {
      bg: '#AB9D78', icon: <IconTree />, label: 'Trees Planted',
      view: <Value>{profile.treesPlanted} trees · 💧 {profile.waters} waters</Value>,
      edit: null, // stat — not editable
    },
    {
      bg: '#FB9E6E', icon: <IconEmail />, label: 'Email Address',
      view: <Value>{profile.email}</Value>,
      edit: <FieldInput value={draft.email} onChange={set('email')} placeholder="Email" />,
    },
  ]

  return (
    <div className="relative overflow-hidden bg-white" style={{ width: 360, height: 640 }}>

      {/* ── Header ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center px-5" style={{ height: 76, background: '#1BBC65' }}>
        <button
          onClick={onBack}
          className="bg-transparent border-none cursor-pointer p-0 mr-3"
          aria-label="Back"
        >
          <IconBack />
        </button>

        <span
          className="flex-1"
          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 18, color: '#fff' }}
        >
          My Profile
        </span>

        {editing ? (
          <button
            onClick={cancelEdit}
            className="bg-transparent border-none cursor-pointer"
            style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
            style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 14, color: '#fff' }}
          >
            Edit <IconPencil />
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="absolute left-0 right-0 overflow-y-auto" style={{ top: 76, bottom: 140 }}>

        {/* ── Avatar row ── */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 80, height: 80, background: '#fff', border: '1px solid #1BBC65' }}
          >
            <IconUser />
          </div>
          <div>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 17, color: '#28332D' }}>
              {profile.name}
            </p>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400, fontSize: 12, color: '#74C69D' }}>
              📍 {profile.neighborhood}
            </p>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          className="mx-5 mb-1 flex items-center rounded-[12px]"
          style={{ background: 'rgba(40,51,45,0.04)', height: 44 }}
        >
          {[
            { val: profile.treesPlanted, label: '🌳 Trees' },
            { val: profile.waters,       label: '💧 Waters' },
            { val: profile.branches,     label: '🌿 Branches' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 flex items-center justify-center">
              {i > 0 && (
                <div
                  className="absolute"
                  style={{
                    width: 1, height: 20,
                    background: 'rgba(40,51,45,0.12)',
                    marginLeft: -1,
                  }}
                />
              )}
              <span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 500, fontSize: 12, color: '#28332D' }}>
                {stat.val} {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Field rows ── */}
        <motion.div layout className="mt-3">
          {rows.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-start gap-3 px-5 py-4">
                <IconBubble bg={row.bg}>{row.icon}</IconBubble>
                <div className="flex-1 min-w-0">
                  <Label>{row.label}</Label>
                  <AnimatePresence mode="wait" initial={false}>
                    {editing && row.edit ? (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {row.edit}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {row.view}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {i < rows.length - 1 && <Divider />}
            </div>
          ))}
        </motion.div>

        {/* ── Save button (edit mode only) ── */}
        <AnimatePresence>
          {editing && (
            <motion.div
              className="px-5 pt-4 pb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                className="w-full py-3 text-white border-none cursor-pointer"
                style={{
                  background: '#1BBC65',
                  borderRadius: 12,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={saveEdit}
              >
                Save Changes
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sign Out ── */}
      <div className="absolute left-0 right-0 flex items-center" style={{ bottom: 64, height: 76 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/login')
          }}
          className="border-none cursor-pointer"
          style={{
            width: 'calc(100% - 40px)',
            margin: '0 auto',
            display: 'block',
            background: 'transparent',
            border: '1px solid rgba(255,68,68,0.4)',
            borderRadius: 12,
            padding: 12,
            color: '#FF4444',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Sign Out
        </motion.button>
      </div>

      {/* ── Bottom Nav ── */}
      <BottomNav active="profile" />
    </div>
  )
}
