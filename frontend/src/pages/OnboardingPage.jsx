import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Interest options ────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  'Food & Drink', 'Fitness', 'Art', 'Music', 'Tech',
  'Outdoors', 'Volunteering', 'Networking', 'Markets', 'Workshops',
]

// ─── Slide config ────────────────────────────────────────────────────────────

const TOTAL_SLIDES = 4

const SLIDES = [
  {
    title: 'Connect & Grow Together',
    subtitle:
      'Discover events in your neighborhood. Watch your community grow from seeds to forests.',
    leftLabel: 'Skip Intro',
    rightLabel: 'NEXT',
  },
  null, // slide 1: how it works — rendered separately
  null, // slide 2: interests — rendered separately
  {
    title: 'Your Neighborhood Comes Alive',
    subtitle:
      'Every event is a seed. Every neighbor who joins helps it grow into a tree.',
    leftLabel: 'Go Back',
    rightLabel: 'GET STARTED',
  },
]

const HOW_IT_WORKS_ITEMS = [
  { icon: '🌰', stage: 'Seed',   meaning: 'A new idea\nor event posted' },
  { icon: '🌱', stage: 'Sprout', meaning: '1–2 neighbors\nwatered it' },
  { icon: '🌲', stage: 'Tree',   meaning: 'Growing fast\n3–10 neighbors' },
  { icon: '🌳', stage: 'Oak',    meaning: 'Neighborhood\nlegend 10+' },
]

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
}

// ─── Illustration (slides 0 & 2) ────────────────────────────────────────────

function Illustration({ index }) {
  return (
    <div className="absolute inset-0 bg-[#f2f9f3] flex items-center justify-center">
      <div className="flex items-end gap-5" style={{ opacity: 0.75 }}>
        {index === 0 ? (
          <>
            <span style={{ fontSize: 52 }}>🌱</span>
            <span style={{ fontSize: 44 }}>👥</span>
            <span style={{ fontSize: 48 }}>🌿</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 44 }}>🏘️</span>
            <span style={{ fontSize: 60 }}>🌳</span>
            <span style={{ fontSize: 44 }}>🤝</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Pagination dots ─────────────────────────────────────────────────────────

function Dots({ current }) {
  return (
    <div className="flex gap-[14px] justify-center">
      {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
        <div
          key={i}
          className="w-[6px] h-[6px] rounded-full transition-colors duration-300"
          style={{ background: current === i ? '#1BBC65' : 'rgba(40,51,45,0.3)' }}
        />
      ))}
    </div>
  )
}

// ─── Interest chip ───────────────────────────────────────────────────────────

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

// ─── How it works slide ───────────────────────────────────────────────────────

function HowItWorksSlide() {
  return (
    <div className="absolute inset-0">
      {/* Illustration area */}
      <div
        className="absolute left-0 right-0 top-0 flex items-end justify-around px-4 pb-4"
        style={{ height: 219, background: '#f2f9f3' }}
      >
        <motion.div
          className="flex w-full justify-around items-end"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {HOW_IT_WORKS_ITEMS.map((item) => (
            <motion.div
              key={item.stage}
              variants={staggerItem}
              className="flex flex-col items-center gap-1"
              style={{ width: 64 }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{item.icon}</span>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 11,
                  color: '#2D6A4F',
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {item.stage}
              </p>
              <p
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontWeight: 400,
                  fontSize: 10,
                  color: 'rgba(40,51,45,0.6)',
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                  lineHeight: '14px',
                }}
              >
                {item.meaning}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Text content */}
      <div style={{ position: 'absolute', top: 228, left: 32, right: 32 }}>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: '30px',
            color: '#28332D',
            marginBottom: 8,
          }}
        >
          Your Water Makes it Grow
        </p>
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: '22px',
            color: 'rgba(40,51,45,0.6)',
            marginBottom: 12,
          }}
        >
          Every time you water a tree, it grows stronger.
          Trees grow branches. Branches become forests.
          This is how neighborhoods come alive.
        </p>

        {/* Callout box */}
        <div style={{ background: '#f2f9f3', borderRadius: 12, padding: '10px 14px' }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: 12,
              color: '#2D6A4F',
            }}
          >
            💧 Water = show up &amp; support an event
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Interest slide content ──────────────────────────────────────────────────

function InterestSlide({ interests, customInterest, onToggle, onCustomChange, onCustomAdd }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ padding: '28px 24px 20px' }}>
      <p
        className="font-bold text-[20px] leading-[28px] text-[#28332D] mb-1"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Your Interests 🌿
      </p>
      <p
        className="text-[13px] leading-[20px] mb-4"
        style={{ fontFamily: "'Roboto', sans-serif", color: 'rgba(40,51,45,0.6)' }}
      >
        Pick what speaks to you — we&apos;ll personalize your feed.
      </p>

      {/* Chip grid */}
      <div className="flex flex-wrap gap-2 mb-4">
        {INTEREST_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={interests.includes(opt)}
            onClick={() => onToggle(opt)}
          />
        ))}
        {interests
          .filter((i) => !INTEREST_OPTIONS.includes(i))
          .map((custom) => (
            <Chip
              key={custom}
              label={custom}
              selected
              onClick={() => onToggle(custom)}
            />
          ))}
      </div>

      {/* "Other" custom input */}
      <div className="flex gap-2 mb-auto">
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
          onChange={(e) => onCustomChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCustomAdd()}
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onCustomAdd}
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
  )
}

// ─── OnboardingPage ──────────────────────────────────────────────────────────

function OnboardingPage({ onComplete }) {
  const [current, setCurrent]             = useState(0)
  const [direction, setDirection]         = useState(1)
  const [interests, setInterests]         = useState([])
  const [customInterest, setCustomInterest] = useState('')

  const isHowItWorksSlide = current === 1
  const isInterestSlide   = current === 2
  const slide = SLIDES[current]

  const goTo = (next) => {
    setDirection(next > current ? 1 : -1)
    setCurrent(next)
  }

  const handleLeft = () => {
    if (current === 0) onComplete?.()
    else goTo(current - 1)
  }

  const handleRight = () => {
    if (current < TOTAL_SLIDES - 1) goTo(current + 1)
    else onComplete?.()
  }

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const addCustomInterest = () => {
    const trimmed = customInterest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed])
    }
    setCustomInterest('')
  }

  const leftLabel  = (isHowItWorksSlide || isInterestSlide) ? 'Go Back' : slide.leftLabel
  const rightLabel = isHowItWorksSlide ? 'NEXT'
                   : isInterestSlide   ? 'Plant My Experience 🌱'
                   : slide.rightLabel

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden"
      style={{ background: '#0D1F16' }}
    >
      {/* Nature gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 160% 65% at 50% 105%, rgba(27,188,101,0.25) 0%, transparent 60%),' +
            'radial-gradient(ellipse 90% 45% at 8% 95%, rgba(11,133,67,0.3) 0%, transparent 55%),' +
            'radial-gradient(ellipse 70% 40% at 95% 85%, rgba(11,133,67,0.2) 0%, transparent 50%)',
        }}
      />

      {/* Logo */}
      <span
        className="absolute left-5 top-[17px] z-10 text-white font-bold text-[22px] leading-[33px]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Communitree🌱
      </span>

      {/* White card */}
      <div className="absolute left-5 top-[57px] w-[320px] h-[525px] bg-white rounded-[20px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {isHowItWorksSlide ? (
              /* ── How it works slide ── */
              <HowItWorksSlide />
            ) : isInterestSlide ? (
              /* ── Interest selection slide ── */
              <InterestSlide
                interests={interests}
                customInterest={customInterest}
                onToggle={toggleInterest}
                onCustomChange={setCustomInterest}
                onCustomAdd={addCustomInterest}
              />
            ) : (
              /* ── Info slides (0 & 2) ── */
              <>
                <div className="absolute left-0 right-0 top-0 h-[219px]">
                  <Illustration index={current} />
                </div>
                <p
                  className="absolute font-bold text-[22px] leading-[33px] text-[#28332D]"
                  style={{ fontFamily: "'Poppins', sans-serif", left: 32, top: 219, width: 253 }}
                >
                  {slide.title}
                </p>
                <p
                  className="absolute text-[14px] leading-[22px]"
                  style={{
                    fontFamily: "'Roboto', sans-serif",
                    color: 'rgba(40,51,45,0.6)',
                    left: 32,
                    top: 262,
                    width: 253,
                  }}
                >
                  {slide.subtitle}
                </p>
              </>
            )}

            {/* Pagination dots */}
            <div className="absolute" style={{ left: 0, right: 0, top: 416 }}>
              <Dots current={current} />
            </div>

            {/* Left text button */}
            <button
              className="absolute p-0 bg-transparent border-none cursor-pointer text-[14px] font-medium leading-[16px]"
              style={{ fontFamily: "'Roboto', sans-serif", color: '#28332D', left: 48, top: 472 }}
              onClick={handleLeft}
            >
              {leftLabel}
            </button>

            {/* Right filled button */}
            <button
              className="absolute h-[40px] rounded-[5px] border-none cursor-pointer text-white text-[14px] font-medium leading-[16px]"
              style={{
                fontFamily: "'Roboto', sans-serif",
                background: '#1BBC65',
                right: 32,
                top: 460,
                paddingLeft: 16,
                paddingRight: 16,
              }}
              onClick={handleRight}
            >
              {rightLabel}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default OnboardingPage
