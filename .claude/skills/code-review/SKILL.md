Paste:

```

---

name: code-review

description: Slash command to review any component or file against Roots standards. Invoke with /review followed by the file path.

---



\# Code Review Skill



\## Instructions

When invoked with /review \[filepath]:

1\. Read the file

2\. Check against every item in the checklist below

3\. Report PASS or FAIL for each item

4\. List fixes needed with code snippets



\## Roots Review Checklist



\### General

\- \[ ] Functional component only — no class components

\- \[ ] No inline styles except dynamic map marker sizing

\- \[ ] Tailwind classes only for styling

\- \[ ] No hardcoded API keys or secrets

\- \[ ] No console.log left in production code



\### Map

\- \[ ] Uses @vis.gl/react-maplibre — not mapbox-gl directly

\- \[ ] Tile URL is https://tiles.openfreemap.org/styles/dark

\- \[ ] Markers use Framer Motion variants for growth stages

\- \[ ] No hardcoded API key for map tiles



\### Supabase

\- \[ ] Imports supabase from src/lib/supabase.js

\- \[ ] Real-time subscription cleaned up in useEffect return

\- \[ ] No service role key in frontend code

\- \[ ] VITE\_ prefix on all frontend env vars



\### Animations

\- \[ ] Framer Motion used for all animations

\- \[ ] Growth stage uses variants prop not manual state

\- \[ ] Spring transition used for seed growth



\### Mobile

\- \[ ] Layout works at 375px width

\- \[ ] No fixed widths that break on small screens

\- \[ ] Bottom nav doesn't overlap content



\### Definition of Done

\- \[ ] Component renders without console errors

\- \[ ] Supabase reads/writes work

\- \[ ] Framer Motion animation plays correctly

\- \[ ] Mobile layout looks good at 375px

\- \[ ] No hardcoded secrets

