import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Privacy options ───────────────────────────────────────────────────────────

const PRIVACY_OPTIONS = [
  {
    id: 'public',
    icon: '🌍',
    title: 'Public',
    subtitle: 'Anyone can discover and water your tree',
    borderSelected: '#52B788',
    bgSelected: 'rgba(82,183,136,0.1)',
    dotColor: '#52B788',
    toast: '🌰 Seed planted! 🌍',
  },
  {
    id: 'private_group',
    icon: '🔒',
    title: 'Private Group',
    subtitle: 'Visible on map, people request to join',
    borderSelected: '#7DD3F0',
    bgSelected: 'rgba(125,211,240,0.1)',
    dotColor: '#7DD3F0',
    toast: '🔒 Private tree planted!',
  },
  {
    id: 'invite_only',
    icon: '🫂',
    title: 'Invite Only',
    subtitle: 'Hidden from map — only invited people see this',
    borderSelected: '#FFD700',
    bgSelected: 'rgba(255,215,0,0.08)',
    dotColor: '#FFD700',
    toast: '🫂 Invite-only tree planted!',
  },
]

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ visible, message }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-2 text-white text-sm whitespace-nowrap"
          style={{ background: '#2D6A4F', fontFamily: "'Poppins', sans-serif" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── PlantTree ────────────────────────────────────────────────────────────────

const ALL_TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'
]

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{value ? tzLabel(value) : '🕐 Timezone'}</span>
        <span style={{ opacity: 0.5, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0,
            top: '110%',
            zIndex: 200,
            background: '#0f2318',
            border: '1px solid rgba(82,183,136,0.25)',
            borderRadius: 10,
            maxHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Search timezone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 'none',
              background: 'rgba(82,183,136,0.1)',
              border: 'none',
              borderBottom: '1px solid rgba(82,183,136,0.2)',
              padding: '8px 12px',
              color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              fontSize: 12,
              outline: 'none',
            }}
          />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => { onChange(tz); setOpen(false); setSearch('') }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: tz === value ? 'rgba(82,183,136,0.2)' : 'transparent',
                  border: 'none',
                  padding: '9px 12px',
                  color: tz === value ? '#52B788' : '#95D5B2',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {tzLabel(tz)}
              </button>
            ))}
            {filtered.length === 0 && (
              <p style={{ color: '#74C69D', fontSize: 12, padding: '10px 12px', fontFamily: "'Poppins', sans-serif" }}>
                No results
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlantTree({ open, onClose, coords, parentPost, onPlant }) {
  const [name, setName] = useState('')
  const [description, setDesc] = useState('')
  const [link, setLink] = useState('')
  const [datetime, setDatetime] = useState('')
  const [timezone, setTimezone] = useState('')
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [selectedPrivacy, setPrivacy] = useState('public')
  const [useAddress, setUseAddress] = useState(false)
  const [addressInput, setAddress] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  const isBranch = !!parentPost

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setToastMsg('⚠️ Event name is required!')
      setToast(true)
      setTimeout(() => setToast(false), 3000)
      return
    }

    const lat = useAddress ? (coords?.lat ?? 39.9526) : coords?.lat
    const lng = useAddress ? (coords?.lng ?? -75.1652) : coords?.lng

    const newPost = {
      id: Date.now(),
      title: name.trim(),
      content: description.trim() || '',
      link: link.trim() || null,
      event_time: datetime || null,
      timezone: datetime ? timezone : null,
      location: useAddress ? (addressInput.trim() || null) : null,
      lat: isBranch ? parentPost.lat + (Math.random() - 0.5) * 0.003 : lat,
      lng: isBranch ? parentPost.lng + (Math.random() - 0.5) * 0.003 : lng,
      waters_count: 0,
      growth_stage: 'seed',
      is_branch: isBranch,
      parent_id: isBranch ? parentPost.id : undefined,
      branch_count: 0,
      privacy: selectedPrivacy,
      author: {
        id: 'me', username: 'you', initials: 'YO',
        user_type: 'local', community: 'West Philadelphia',
        verified: false, trees: 1, waters: 0, branches: 0,
        friendship_status: 'none',
      },
    }

    onPlant?.(newPost)

    resetForm()
    onClose()

    const opt = PRIVACY_OPTIONS.find(o => o.id === selectedPrivacy)
    setToastMsg(isBranch ? '🌿 Branch planted!' : opt.toast)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  function resetForm() {
    setName('')
    setDesc('')
    setLink('')
    setDatetime('')
    setTimezone('')
    setAddress('')
    setUseAddress(false)
    setPrivacy('public')
    setConfirmCancel(false)
  }

  function handleCancel() {
    const isDirty = name.trim() || description.trim() || link.trim() || datetime
    if (isDirty) {
      setConfirmCancel(true)
    } else {
      doClose()
    }
  }

  function doClose() {
    resetForm()
    onClose()
  }

  const inputClass =
    'w-full rounded-[10px] px-4 py-3 text-white text-sm bg-white/5 border border-white/10 outline-none placeholder-white/30 focus:border-[#52B788] transition-colors'

  return (
    <>
      <Toast visible={toast} message={toastMsg} />

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
            />

            {/* Sheet */}
            <motion.div
              className="absolute left-0 right-0 z-30"
              style={{
                bottom: 64,
                background: '#0D1F16',
                borderTop: '2px solid #2D6A4F',
                borderRadius: '20px 20px 0 0',
                padding: 20,
                maxHeight: 'calc(85vh - 64px)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-white/20" />

              <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(80vh - 64px)', paddingBottom: 40 }}>

                {/* Heading */}
                <h2
                  className="text-white mb-1"
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {isBranch ? `Branch off: ${parentPost.title} 🌿` : 'Plant a tree here 🌰'}
                </h2>

                {/* Location toggle */}
                <div className="flex items-center gap-1 mb-3 p-1 self-start rounded-[20px]" style={{ background: 'rgba(45,106,79,0.2)', display: 'inline-flex' }}>
                  {[
                    { id: false, label: '📍 Use map location' },
                    { id: true, label: '✏️ Enter address' },
                  ].map(({ id, label }) => (
                    <button
                      key={String(id)}
                      type="button"
                      onClick={() => setUseAddress(id)}
                      className="border-none cursor-pointer rounded-[16px] px-3 py-1"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 11,
                        fontWeight: useAddress === id ? 600 : 400,
                        background: useAddress === id ? '#2D6A4F' : 'transparent',
                        color: useAddress === id ? '#fff' : '#74C69D',
                        transition: 'background 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Location display / input */}
                {!useAddress && coords && (
                  <p className="mb-4" style={{ color: '#74C69D', fontSize: 11 }}>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                )}
                {useAddress && (
                  <input
                    type="text"
                    className="w-full mb-4 outline-none text-white placeholder-white/30"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: 13,
                      background: 'rgba(45,106,79,0.15)',
                      border: '1px solid rgba(82,183,136,0.25)',
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}
                    placeholder="e.g. Clark Park, Philadelphia"
                    value={addressInput}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    className={inputClass}
                    placeholder="Event name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <input
                    className={inputClass}
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDesc(e.target.value)}
                  />

                  <div>
                    <label className="block mb-1" style={{ fontFamily: "'Roboto', sans-serif", fontSize: 12, color: '#95D5B2' }}>
                      Add a link (optional)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Event page, menu, signup form..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>

                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                  <TimezoneSelect value={timezone} onChange={setTimezone} />

                  {/* ── Privacy Picker ─────────────────────────────────────── */}
                  <div style={{ marginBottom: 12 }}>
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
                        const active = selectedPrivacy === opt.id
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
                            {/* Radio dot */}
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

                  <motion.button
                    type="submit"
                    className="w-full py-3 text-white text-sm font-semibold border-none cursor-pointer mt-1"
                    style={{
                      background: '#52B788',
                      borderRadius: 12,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isBranch ? 'Plant Branch 🌿' : 'Plant It 🌱'}
                  </motion.button>
                </form>

                {/* Cancel confirmation dialog */}
                <AnimatePresence>
                  {confirmCancel && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      style={{
                        background: '#0f2318',
                        border: '1px solid rgba(255,100,100,0.3)',
                        borderRadius: 14,
                        padding: '16px',
                        marginTop: 8,
                      }}
                    >
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 4 }}>
                        Discard changes?
                      </p>
                      <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 12, color: '#95D5B2', marginBottom: 14 }}>
                        Your event details won't be saved.
                      </p>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={doClose}
                          className="flex-1 py-2 border-none cursor-pointer"
                          style={{ background: '#FF4444', borderRadius: 10, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13 }}
                        >
                          Yes, discard
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setConfirmCancel(false)}
                          className="flex-1 py-2 border-none cursor-pointer"
                          style={{ background: 'rgba(82,183,136,0.15)', borderRadius: 10, color: '#52B788', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13 }}
                        >
                          Keep editing
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!confirmCancel && (
                  <button
                    onClick={handleCancel}
                    className="w-full mt-3 mb-2 text-white/40 text-sm bg-transparent border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
