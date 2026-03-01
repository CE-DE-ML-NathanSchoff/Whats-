// ─── Shimmer CSS — injected once ─────────────────────────────────────────────
;(function injectShimmerCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('shimmer-css')) return
  const el = document.createElement('style')
  el.id = 'shimmer-css'
  el.textContent = `
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .shimmer {
      background: linear-gradient(
        90deg,
        rgba(45,106,79,0.15) 25%,
        rgba(82,183,136,0.1)  50%,
        rgba(45,106,79,0.15) 75%
      );
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite;
    }
  `
  document.head.appendChild(el)
})()

// ─── Bar ─────────────────────────────────────────────────────────────────────

function Bar({ width, height }) {
  return (
    <div className="shimmer" style={{ width, height, borderRadius: 6, flexShrink: 0 }} />
  )
}

// ─── Single skeleton card ─────────────────────────────────────────────────────

function SingleSkeleton() {
  return (
    <div
      className="mx-4 mb-3"
      style={{
        background:   '#0f2318',
        borderRadius: 16,
        border:       '1px solid rgba(82,183,136,0.15)',
        padding:      16,
      }}
    >
      {/* Top row: stage badge + time */}
      <div className="flex items-center justify-between mb-3">
        <Bar width={60} height={22} />
        <Bar width={50} height={14} />
      </div>

      {/* Title bar */}
      <div className="mb-2">
        <Bar width={220} height={18} />
      </div>

      {/* Content lines */}
      <div className="flex flex-col mb-3" style={{ gap: 6 }}>
        <Bar width={280} height={12} />
        <Bar width={200} height={12} />
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-3">
        <Bar width={80} height={12} />
        <Bar width={80} height={12} />
      </div>
    </div>
  )
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export default function SkeletonCard({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  )
}
