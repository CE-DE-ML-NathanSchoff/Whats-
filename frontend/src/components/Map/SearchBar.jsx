import { useTheme } from '../../context/ThemeContext'
import { DARK, LIGHT } from '../../lib/theme'

// ─── SearchBar ────────────────────────────────────────────────────────────────

export default function SearchBar({ onSearch, onTap, onFilterOpen, activeFilterCount = 0 }) {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div
      className="absolute left-4 right-4 z-20 flex items-center gap-2 px-3"
      style={{
        top: 16,
        height: 44,
        background: isDark ? 'rgba(13,31,22,0.88)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid ${t.inputBorder}`,
        borderRadius: 12,
        cursor: onTap ? 'pointer' : undefined,
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
    >
      {/* Search icon */}
      <span style={{ color: t.sprout, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>🔍</span>

      {/* Input */}
      <input
        className="flex-1 bg-transparent border-none outline-none"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 13,
          color: t.textPrimary,
          cursor: onTap ? 'pointer' : undefined,
        }}
        placeholder="Search events..."
        readOnly={!!onTap}
        onFocus={onTap ? (e) => { e.target.blur(); onTap() } : undefined}
        onChange={onTap ? undefined : (e) => onSearch(e.target.value)}
      />

      {/* Filter button */}
      <button
        onClick={onFilterOpen}
        className="relative bg-transparent border-none cursor-pointer p-0 flex-shrink-0 leading-none"
        style={{ fontSize: 18 }}
        aria-label="Open filters"
      >
        🎛️
        {activeFilterCount > 0 && (
          <span
            className="absolute rounded-full"
            style={{ width: 7, height: 7, background: t.light, top: -1, right: -1 }}
          />
        )}
      </button>
    </div>
  )
}
