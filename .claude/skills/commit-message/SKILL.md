```

---

name: commit-message

description: Slash command to generate a conventional commit message based on what was just built. Invoke with /commit-message.

---



\# Commit Message Skill



\## Format

```

type(scope): short description



\- bullet of what changed

\- bullet of what changed

```



\## Types

feat     → new feature

fix      → bug fix

style    → UI/styling changes

refactor → code cleanup

chore    → config, deps, setup



\## Scopes for Roots

map, posts, friends, profile, business, chatbot, auth, supabase, backend, nav, ui



\## Examples

```

feat(map): add seed node growth animations



\- added stageVariants with Framer Motion

\- seed grows from grey dot to gold beacon

\- real-time update triggers animation on interact

```

```

feat(posts): add CreatePost modal with Gemini moderation



\- post form with content, event time, neighborhood

\- Gemini pre-publish safety check

\- inserts to Supabase on approval

```



\## Instructions

When invoked with /commit-message:

1\. Look at what files were changed this session

2\. Identify the type and scope

3\. Write a commit message following the format above

4\. Output the git command ready to copy-paste

