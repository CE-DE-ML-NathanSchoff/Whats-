```

---

name: supabase-realtime

description: Use when setting up Supabase queries, real-time subscriptions, auth, or any database reads/writes for posts, users, friendships, or neighborhoods.

---



\# Supabase Real-Time Skill



\## Client Setup

```js

// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(

&nbsp; import.meta.env.VITE\_SUPABASE\_URL,

&nbsp; import.meta.env.VITE\_SUPABASE\_KEY

)

```



\## Real-Time Pattern

```js

supabase.channel('posts')

&nbsp; .on('postgres\_changes', {

&nbsp;   event: 'UPDATE', schema: 'public', table: 'posts'

&nbsp; }, (payload) => {

&nbsp;   updateSeedOnMap(payload.new)

&nbsp; }).subscribe()

```



\## Rules

\- Always import supabase from src/lib/supabase.js

\- Always unsubscribe in useEffect cleanup

\- Never expose service role key in frontend

\- Use VITE\_ prefix for all frontend env vars



\## Common Queries

```js

// Fetch posts near location

const { data } = await supabase

&nbsp; .from('posts')

&nbsp; .select('\*')

&nbsp; .eq('neighborhood\_id', id)



// Insert interaction

const { data } = await supabase

&nbsp; .from('interactions')

&nbsp; .insert({ post\_id, user\_id, type: 'attend' })



// Get attendees

const { data } = await supabase

&nbsp; .from('interactions')

&nbsp; .select('\*, users(\*)')

&nbsp; .eq('post\_id', id)

```

