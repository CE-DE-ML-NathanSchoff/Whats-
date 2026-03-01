# 🌳 Communitree — Project Memory V2

## What Is Communitree
Hyperlocal community platform for HenHacks hackathon.
Neighbors discover and create events on a living map where posts appear
as seeds and grow into trees as people water them.
No DMs. All interaction public/group-based.

**Tagline:** "Watch your neighborhood bloom"
**Domain:** roots.community
**Previous name:** Roots (changed to Communitree)

---

## ⚠️ CRITICAL MECHANIC DECISIONS (updated)

### Watering — NOT flowers
- The action is WATERING 💧 a tree — not planting flowers
- Trees grow from being watered, they don't grow flowers
- Removed all "flower" language from UI
- DB column renamed: `flowers_planted` → `waters_count`

### Stage-based action buttons
Different button per growth stage:
```
seed    🌰  → "Water it 💧"        bg:#1a4a6a  color:#7DD3F0
sprout  🌱  → "Water it 💧"        bg:#1a4a6a  color:#7DD3F0
sapling 🌿  → "Water it 💧"        bg:#1a4a6a  color:#7DD3F0
tree    🌲  → "Tend the Tree 🌿"   bg:#2D6A4F  color:#95D5B2
oak     🌳  → "Honor the Oak ✨"   bg:#3d3000  color:#FFD700
```

After action done (per stage):
```
seed/sprout/sapling → "💧 You watered this!"
tree                → "🌿 You tended this tree!"
oak                 → "✨ You honored the oak!"
```

### Growth Stages (driven by waters_count)
```
seed    → 0 waters   → grey dim dot 10px
sprout  → 1-2        → green pulse 14px
sapling → 3-5        → green glow 20px
tree    → 6-10       → green node 28px (unlocks branching)
oak     → 10+        → gold beacon 36px + animated ring
```

### Branching
- Trees with 6+ waters unlock "🌿 Add a Branch"
- Branches = sub-events connected to parent tree
- Green dashed line drawn on map from parent to branch

---

## Tech Stack
```
Frontend:   React + Vite + Tailwind CSS + Framer Motion
Map:        MapLibre GL JS + @vis.gl/react-maplibre
Tiles:      https://tiles.openfreemap.org/styles/dark (NO API KEY)
Backend:    Python FastAPI
Database:   Supabase (PostgreSQL + real-time + auth)
AI Chat:    Claude API — floating chatbot assistant
AI Labels:  Claude API — weekly neighborhood personality labels
Moderation: Google Gemini API — pre-publish safety check
Discord:    Webhook cross-posting
Deploy:     Vercel (frontend) + Digital Ocean (backend)
```

---

## Project Location
```
C:\Projects\HenHacks\
├── CLAUDE.md
├── .claudeignore
├── .claude\skills\
│   ├── maplibre-seed-node\SKILL.md
│   ├── supabase-realtime\SKILL.md
│   ├── react-component\SKILL.md
│   ├── fastapi-route\SKILL.md
│   ├── commit-message\SKILL.md
│   ├── code-review\SKILL.md
│   └── demo-prep\SKILL.md
└── frontend\src\
    ├── pages\
    │   ├── MapPage.jsx          ✅ done
    │   ├── HomePage.jsx         ✅ done
    │   ├── ProfilePage.jsx      ✅ done
    │   ├── ExplorePage.jsx      ✅ done
    │   ├── MyTreesPage.jsx      ✅ done
    │   ├── OnboardingPage.jsx   🔲
    │   ├── LoginPage.jsx        🔲
    │   └── RegisterPage.jsx     🔲
    ├── components\
    │   ├── Map\
    │   │   ├── SeedMarker.jsx   ✅ done
    │   │   ├── BranchLines.jsx  ✅ done
    │   │   ├── PlantTree.jsx    ✅ done
    │   │   ├── SearchBar.jsx    ✅ done
    │   │   └── FilterSheet.jsx  ✅ done
    │   ├── Posts\
    │   │   └── PostCard.jsx     ✅ done (water mechanic applied)
    │   └── Nav\
    │       └── BottomNav.jsx    ✅ done (🌳 My Trees icon)
    └── lib\
        └── supabase.js
```

---

## Database Schema (CURRENT — updated)

### posts
```sql
id, user_id, neighborhood_id, content, event_time,
growth_stage, waters_count (was flowers_planted),
branch_count, parent_id (nullable), is_branch (boolean),
lat, lng, created_at
```

### branches
```sql
id, parent_post_id, child_post_id, created_at
```

### users
```sql
id, username, area_id, user_type (guest/local/business), interests[]
```

### neighborhoods
```sql
id, name, lat, lng, spark_count, personality
```

### interactions
```sql
id, post_id, user_id, type (water), created_at
```

### friendships
```sql
id, requester_id, addressee_id, status (pending/accepted/declined)
```

### business_profiles
```sql
id, user_id, business_name, business_type, verified
```

### cross_posts
```sql
id, post_id, platform, status
```

---

## Color Palette
```
#0D1F16  → dark background
#2D6A4F  → primary green
#52B788  → light green
#95D5B2  → pale green
#74C69D  → sprout green
#FFD700  → gold (oak stage)
#6B7280  → grey (seed)
#1a4a6a  → water blue bg
#7DD3F0  → water blue text
```

---

## Framer Motion Growth Pattern
```jsx
const stageVariants = {
  seed:    { scale: 0.35, opacity: 0.5,  backgroundColor: '#6B7280' },
  sprout:  { scale: 0.55, opacity: 0.75, backgroundColor: '#74C69D' },
  sapling: { scale: 0.75, opacity: 0.88, backgroundColor: '#52B788' },
  tree:    { scale: 1.0,  opacity: 1.0,  backgroundColor: '#2D6A4F' },
  oak:     { scale: 1.25, opacity: 1.0,  backgroundColor: '#FFD700' },
}

<motion.div
  variants={stageVariants}
  animate={post.growth_stage}
  transition={{ type: 'spring', stiffness: 180, damping: 15 }}
/>
```

---

## Supabase Real-Time Pattern
```js
supabase.channel('posts')
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'posts'
  }, (payload) => {
    updateSeedOnMap(payload.new)
  }).subscribe()
```

---

## API Endpoints
```
GET  /api/posts?lat=&lng=&radius=
POST /api/posts                      → triggers Gemini moderation
POST /api/posts/:id/water            → water a tree, triggers growth
GET  /api/posts/:id/waters           → get waterers list
POST /api/posts/:id/branch           → create branch sub-event
GET  /api/posts/:id/branches         → get all branches
POST /api/friends/request
POST /api/friends/:id/respond
GET  /api/users/:id/profile
GET  /api/neighborhoods/:id/stats
POST /api/chat                       → proxies to Claude API
POST /api/posts/:id/crosspost        → sends to Discord
```

---

## Routes
```
/          → redirect to /map
/map       → MapPage
/explore   → ExplorePage
/trees     → MyTreesPage
/profile   → ProfilePage
/onboarding → OnboardingPage (🔲 not built)
/login     → LoginPage (🔲 not built)
/register  → RegisterPage (🔲 not built)
```

---

## Bottom Nav
```
🗺️ Map      → /map
🔍 Explore  → /explore
🌳 My Trees → /trees
👤 Profile  → /profile
```
Active tab derived from useLocation() — no active prop needed.

---

## Language Rules (STRICT)
- NEVER say "attend" → say "water" or stage-specific action
- NEVER say "attendees" → say "waterers" or "neighbors watering"
- NEVER say "Plant a Flower" anywhere in UI
- "Sub-event" = "Branch 🌿"
- waters_count drives growth_stage (not flowers_planted)
- Branching unlocks at 6+ waters

---

## Stage Action Labels (UI)
```
const STAGE_ACTION = {
  seed:    { label: 'Water it 💧',       bg: '#1a4a6a', color: '#7DD3F0' },
  sprout:  { label: 'Water it 💧',       bg: '#1a4a6a', color: '#7DD3F0' },
  sapling: { label: 'Water it 💧',       bg: '#1a4a6a', color: '#7DD3F0' },
  tree:    { label: 'Tend the Tree 🌿',  bg: '#2D6A4F', color: '#95D5B2' },
  oak:     { label: 'Honor the Oak ✨',  bg: '#3d3000', color: '#FFD700' },
}
```

---

## 60-Second Demo Script (updated)
1. "This is Communitree — your neighborhood comes alive"
2. Show dark map with one seed
3. Tap map → plant a tree: "Saturday Farmers Market 🌰"
4. Seed appears on map
5. Open second tab → water it 3 times
6. Watch seed grow to sapling in real time
7. Hit 6 waters → "Add a Branch" unlocks
8. Add branch: "Cooking Demo 2pm 🌿"
9. Green line connects branch to parent on map
10. "Active neighborhoods become forests. This is Communitree."

---

## Still To Build
- 🔲 OnboardingPage (2 slides, Framer Motion)
- 🔲 LoginPage + RegisterPage
- 🔲 Supabase Auth wired up
- 🔲 Water button wired to Supabase (currently console.log)
- 🔲 PlantTree wired to Supabase
- 🔲 AI Chatbot floating bubble
- 🔲 Discord cross-posting
- 🔲 Rename flowers_planted → waters_count in schema.sql
- 🔲 Update all components to use waters_count
- 🔲 Neighborhood personality (Claude API weekly label)
