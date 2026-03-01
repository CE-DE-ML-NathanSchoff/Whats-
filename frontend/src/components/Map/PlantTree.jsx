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

export default function PlantTree({ open, onClose, coords }) {
  const [name, setName]          = useState('')
  const [description, setDesc]   = useState('')
  const [link, setLink]          = useState('')
  const [datetime, setDatetime]  = useState('')
  const [toast, setToast]        = useState(false)
  const [toastMsg, setToastMsg]  = useState('')
  const [selectedPrivacy, setPrivacy] = useState('public')
  const [useAddress, setUseAddress] = useState(false)
  const [addressInput, setAddress]  = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      datetime: datetime || null,
      location: useAddress ? (addressInput.trim() || null) : null,
      lat: useAddress ? null : coords?.lat,
      lng: useAddress ? null : coords?.lng,
    }
    console.log('Plant tree:', { ...data, privacy: selectedPrivacy })

    // Reset + close sheet
    setName('')
    setDesc('')
    setLink('')
    setDatetime('')
    onClose()

    // Show toast
    const opt = PRIVACY_OPTIONS.find(o => o.id === selectedPrivacy)
    setToastMsg(opt.toast)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  function handleCancel() {
    setName('')
    setDesc('')
    setLink('')
    setDatetime('')
    setAddress('')
    setUseAddress(false)
    setPrivacy('public')
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
              className="absolute left-0 right-0 bottom-0 z-30"
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

              {/* Heading */}
              <h2
                className="text-white mb-1"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                Plant a tree here 🌰
              </h2>

              {/* Location toggle */}
              <div className="flex items-center gap-1 mb-3 p-1 self-start rounded-[20px]" style={{ background: 'rgba(45,106,79,0.2)', display: 'inline-flex' }}>
                {[
                  { id: false, label: '📍 Use map location' },
                  { id: true,  label: '✏️ Enter address' },
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
                  Plant It 🌱
                </motion.button>
              </form>

              {/* Cancel */}
              <button
                onClick={handleCancel}
                className="w-full mt-3 text-white/40 text-sm bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
