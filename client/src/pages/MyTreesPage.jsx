import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BottomNav from '../components/Nav/BottomNav'
import { users as usersApi } from '../lib/api'

// ─── Stage data ───────────────────────────────────────────────────────────────

const stageColor = {
  seed: '#6B7280', sprout: '#74C69D', sapling: '#52B788', tree: '#2D6A4F', oak: '#FFD700',
}
const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStage(w) {
  if (w === 0) return 'seed';
  if (w <= 2) return 'sprout';
  if (w <= 5) return 'sapling';
  if (w <= 10) return 'tree';
  return 'oak';
}

function eventToTreeCard(event) {
  const waters = event.waters_count ?? event.rsvp_count ?? 0;
  return {
    id: event.id,
    title: event.title,
    content: event.description || '',
    waters_count: waters,
    growth_stage: getStage(waters),
    branch_count: 0,
    event_time: event.event_time || event.event_date || '',
    is_branch: false,
  };
}

const TABS = [
  { id: 'planted',  label: '🌳 Planted' },
  { id: 'watered',  label: '💧 Watered' },
  { id: 'branches', label: '🌿 Branches' },
]

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

function TreeCard({ post, index, tab, onEdit }) {
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

      {/* Top row: stage badge + time */}
      <div className="flex items-center gap-2 mb-2">
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

export default function MyTreesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('planted')
  const [editTree, setEditTree]   = useState(null)
  const [myPlanted, setMyPlanted] = useState([])
  const [myWatered, setMyWatered] = useState([])
  const [stats, setStats] = useState({ planted: 0, watered: 0, branches: 0 })

  useEffect(() => {
    usersApi.getEvents()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMyPlanted(list.map(eventToTreeCard));
        setStats((s) => ({ ...s, planted: list.length }));
      })
      .catch(() => {});
  }, []);

  const tabData = { planted: myPlanted, watered: myWatered, branches: [] };
  const posts = tabData[activeTab];

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
          { val: stats.planted,  label: '🌳 Planted' },
          { val: stats.watered,  label: '💧 Watered' },
          { val: stats.branches, label: '🌿 Branches' },
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
          {posts.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {posts.map((post, i) => (
                <TreeCard
                  key={post.id}
                  post={post}
                  index={i}
                  tab={activeTab}
                  onEdit={setEditTree}
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

      {/* ── EditTreeSheet ── */}
      <EditTreeSheet tree={editTree} onClose={() => setEditTree(null)} />

      {/* ── Bottom Nav ── */}
      <BottomNav />
    </div>
  )
}
