```

name: maplibre-seed-node

description: Use when creating or editing map markers, seed nodes, tree animations, growth stages, or anything involving MapLibre GL JS, react-maplibre, or map visualization in Roots.

---



\# MapLibre Seed Node Skill



\## Stack

\- @vis.gl/react-maplibre for all map components

\- MapLibre GL JS for map instance

\- Framer Motion for growth animations

\- Tiles: https://tiles.openfreemap.org/styles/dark (no API key)



\## Rules

\- NEVER import from mapbox-gl directly

\- Always use @vis.gl/react-maplibre

\- All marker animations use Framer Motion variants

\- Growth stage drives the animate prop



\## Growth Stages

seed    → 0 interactions   → grey, 10px

sprout  → 1-2             → green pulse, 14px

sapling → 3-5             → green glow, 20px

tree    → 6-10            → green node, 28px

oak     → 10+ recurring   → gold beacon, 36px + animated ring



\## Marker Pattern

```jsx

import { Marker } from '@vis.gl/react-maplibre'

import { motion } from 'framer-motion'



const stageVariants = {

&nbsp; seed:    { scale: 0.35, opacity: 0.5,  backgroundColor: '#6B7280' },

&nbsp; sprout:  { scale: 0.55, opacity: 0.75, backgroundColor: '#74C69D' },

&nbsp; sapling: { scale: 0.75, opacity: 0.88, backgroundColor: '#52B788' },

&nbsp; tree:    { scale: 1.0,  opacity: 1.0,  backgroundColor: '#2D6A4F' },

&nbsp; oak:     { scale: 1.25, opacity: 1.0,  backgroundColor: '#FFD700' },

}



<Marker longitude={post.lng} latitude={post.lat}>

&nbsp; <motion.div

&nbsp;   variants={stageVariants}

&nbsp;   animate={post.growth\_stage}

&nbsp;   transition={{ type: 'spring', stiffness: 180, damping: 15 }}

&nbsp;   className="rounded-full cursor-pointer"

&nbsp; />

</Marker>

```

