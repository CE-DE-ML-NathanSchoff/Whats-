import { useState } from 'react'

const roboto = { fontFamily: "'Roboto', sans-serif" }
const poppins = { fontFamily: "'Poppins', sans-serif" }
const inputStyle = { border: '1px solid rgba(40,51,45,0.2)', ...roboto }
const baseInput = 'w-full h-full px-3 bg-white rounded-[5px] text-[17px] text-[#28332D] placeholder:text-[#28332D]/30 outline-none'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#1877F2" />
      <path
        d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z"
        fill="#fff"
      />
    </svg>
  )
}

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-0 bg-transparent border-none cursor-pointer"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <ellipse cx="11" cy="8" rx="10" ry="7" stroke="#28332D" strokeWidth="1.8" />
          <circle cx="11" cy="8" r="3" stroke="#28332D" strokeWidth="1.8" />
        </svg>
      ) : (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <path d="M1 8C4.5 1.5 17.5 1.5 21 8C17.5 14.5 4.5 14.5 1 8Z" stroke="#28332D" strokeWidth="1.8" />
          <line x1="3" y1="1" x2="19" y2="15" stroke="#28332D" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <p className="text-[14px] leading-[22px] text-[#28332D] mb-[2px]" style={roboto}>
        {label}
      </p>
      <div className="relative h-[42px]">{children}</div>
    </div>
  )
}

export default function RegisterPage({ onCreate, onLogin }) {
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden" style={{ background: '#0D1F16' }}>
      {/* Nature gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 160% 65% at 50% 105%, rgba(27,188,101,0.25) 0%, transparent 60%),' +
            'radial-gradient(ellipse 90% 45% at 8% 95%, rgba(11,133,67,0.3) 0%, transparent 55%)',
        }}
      />

      {/* Logo */}
      <span className="absolute left-5 top-[17px] z-10 text-white font-bold text-[22px] leading-[33px]" style={poppins}>
        Communitree🌱
      </span>

      {/* Scrollable white card */}
      <div className="absolute inset-x-0 top-[64px] bottom-0 bg-white rounded-t-[20px] overflow-y-auto">
        <div className="px-10 pt-[31px] pb-10">

          <h2 className="font-bold text-[22px] leading-[33px] text-[#28332D] mb-[15px]" style={poppins}>
            Create New Account
          </h2>

          {/* Name */}
          <Field label="Name">
            <input
              type="text"
              placeholder="E.g: Arjun Das"
              className={baseInput}
              style={inputStyle}
            />
          </Field>

          {/* Neighborhood / Area */}
          <Field label="Neighborhood / Area">
            <select
              className={`${baseInput} appearance-none pr-8`}
              style={inputStyle}
              defaultValue=""
            >
              <option value="" disabled>Select your area</option>
              <option>Downtown</option>
              <option>East Side</option>
              <option>West End</option>
              <option>North Park</option>
              <option>South Hill</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[#28332D]">
              ▼
            </span>
          </Field>

          {/* Email */}
          <Field label="Email Address">
            <input
              type="email"
              placeholder="user@mail.com"
              className={baseInput}
              style={inputStyle}
            />
          </Field>

          {/* Password */}
          <Field label="Password">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Enter Password"
              className={`${baseInput} pr-10`}
              style={inputStyle}
            />
            <EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />
          </Field>

          {/* Confirm Password */}
          <Field label="Confirm Password">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Enter Password"
              className={`${baseInput} pr-10`}
              style={inputStyle}
            />
            <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
          </Field>

          {/* CREATE ACCOUNT NOW */}
          <button
            className="w-full h-[46px] rounded-[5px] border-none text-white text-[17px] font-medium cursor-pointer mt-1 mb-6"
            style={{ background: '#1BBC65', ...roboto }}
            onClick={onCreate}
          >
            CREATE ACCOUNT NOW
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1" style={{ borderTop: '1px solid rgba(40,51,45,0.15)' }} />
            <span className="text-[14px] text-[#28332D] whitespace-nowrap" style={roboto}>
              Or sign up using
            </span>
            <div className="flex-1" style={{ borderTop: '1px solid rgba(40,51,45,0.15)' }} />
          </div>

          {/* Social buttons — Facebook + Google */}
          <div className="flex gap-4 mb-6">
            <button
              className="flex-1 h-[46px] bg-white rounded-[5px] cursor-pointer flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(40,51,45,0.3)', ...roboto }}
            >
              <FacebookIcon />
              <span className="text-[14px] font-medium text-[#1877F2]">Facebook</span>
            </button>
            <button
              className="flex-1 h-[46px] bg-white rounded-[5px] cursor-pointer flex items-center justify-center gap-2"
              style={{ border: '1px solid rgba(40,51,45,0.3)', ...roboto }}
            >
              <GoogleIcon />
              <span className="text-[14px] font-medium text-[#EA4335]">Google</span>
            </button>
          </div>

          {/* Already have account */}
          <p className="text-center text-[14px] leading-[28px] text-[#28332D]" style={roboto}>
            Already have an account?{' '}
            <button
              className="text-[#1BBC65] font-medium p-0 bg-transparent border-none cursor-pointer"
              onClick={onLogin}
            >
              Login Now
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}
