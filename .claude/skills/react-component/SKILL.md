```

---

name: react-component

description: Use when creating any new React component, page, or UI element in Roots. Enforces Tailwind, Framer Motion, and functional component patterns.

---



\# React Component Skill



\## Rules

\- Functional components only — no class components

\- Tailwind only for styling — no inline styles except dynamic map marker sizing

\- Framer Motion for all animations

\- No TypeScript required — plain JS is fine

\- Always check mobile layout at 375px width



\## Component Template

```jsx

import { useState } from 'react'

import { motion } from 'framer-motion'



export default function ComponentName({ prop1, prop2 }) {

&nbsp; const \[state, setState] = useState(null)



&nbsp; return (

&nbsp;   <motion.div

&nbsp;     initial={{ opacity: 0 }}

&nbsp;     animate={{ opacity: 1 }}

&nbsp;     className="w-full bg-\[#0D1F16] text-white"

&nbsp;   >

&nbsp;     {/\* content \*/}

&nbsp;   </motion.div>

&nbsp; )

}

```



\## Roots Color Classes

```

bg-\[#0D1F16]   → dark background

bg-\[#2D6A4F]   → primary green

text-\[#52B788] → light green

text-\[#95D5B2] → pale green

text-\[#FFD700] → gold (oak stage)

```



\## File Locations

\- Map components    → src/components/Map/

\- Post components   → src/components/Posts/

\- Friend components → src/components/Friends/

\- UI components     → src/components/UI/

\- Pages             → src/pages/

