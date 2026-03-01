// ─── SearchBar ────────────────────────────────────────────────────────────────

export default function SearchBar({ onSearch, onTap, onFilterOpen, activeFilterCount = 0 }) {
  return (
    <div
      className="absolute left-4 right-4 z-20 flex items-center gap-2 px-3"
      style={{
        top: 16,
        height: 44,
        background: 'rgba(13,31,22,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(82,183,136,0.25)',
        borderRadius: 12,
        cursor: onTap ? 'pointer' : undefined,
      }}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap() } : undefined}
    >
      {/* Search icon */}
      <span style={{ color: '#74C69D', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>🔍</span>

      {/* Input */}
      <input
        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 13,
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
        {/* Active indicator dot */}
        {activeFilterCount > 0 && (
          <span
            className="absolute rounded-full"
            style={{
              width: 7,
              height: 7,
              background: '#52B788',
              top: -1,
              right: -1,
            }}
          />
        )}
      </button>
    </div>
  )
}
