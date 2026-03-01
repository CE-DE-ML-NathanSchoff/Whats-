import { motion, AnimatePresence } from 'framer-motion'

const stageEmoji = {
  seed: '🌰', sprout: '🌱', sapling: '🪴', tree: '🌳', oak: '🌟',
}

export default function EventPicker({ posts, onSelect, onClose }) {
  return (
    <AnimatePresence>
      {posts.length > 0 && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute left-0 right-0 bottom-0 z-40"
            style={{
              background: '#0D1F16',
              borderTop: '2px solid #2D6A4F',
              borderRadius: '20px 20px 0 0',
              padding: 20,
              maxHeight: 300,
              display: 'flex',
              flexDirection: 'column',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-white/20 flex-shrink-0" />

            {/* Title */}
            <p
              className="mb-3 flex-shrink-0"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
              }}
            >
              Multiple events here 🌳
            </p>

            {/* Scrollable list */}
            <div className="overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {posts.map((post, i) => (
                <div key={post.id}>
                  <button
                    className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer text-left py-3"
                    onClick={() => { onClose(); onSelect(post) }}
                  >
                    {/* Stage emoji */}
                    <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                      {stageEmoji[post.growth_stage] ?? '🌰'}
                    </span>

                    {/* Title */}
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 500,
                        fontSize: 14,
                        color: '#fff',
                      }}
                    >
                      {post.title}
                    </span>

                    {/* Water count */}
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        fontSize: 11,
                        color: '#74C69D',
                      }}
                    >
                      {post.waters_count} 💧
                    </span>
                  </button>

                  {i < posts.length - 1 && (
                    <div style={{ height: 1, background: 'rgba(82,183,136,0.1)' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
