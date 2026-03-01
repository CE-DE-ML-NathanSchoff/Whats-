Paste:

```

---

name: demo-prep

description: Slash command to run a full pre-demo checklist and prepare Roots for presentation. Invoke with /demo-prep.

---



\# Demo Prep Skill



\## Instructions

When invoked with /demo-prep:

1\. Run through every check below

2\. Report PASS or FAIL for each

3\. Fix any blockers found

4\. Seed demo data

5\. Output the 60-second demo script



\## Pre-Demo Checklist



\### App Running

\- \[ ] npm run dev starts without errors

\- \[ ] Map loads with dark tile style

\- \[ ] No console errors in browser



\### Core Features

\- \[ ] Seed node appears on map when post created

\- \[ ] Seed grows when interactions added

\- \[ ] Real-time update works (open two tabs)

\- \[ ] Who's Going list shows attendees

\- \[ ] AI chatbot responds



\### Data

\- \[ ] At least 3 posts exist at different growth stages

\- \[ ] One post is at oak stage (gold beacon)

\- \[ ] Neighborhoods have spark counts



\### Supabase

\- \[ ] Real-time subscription active

\- \[ ] No auth errors in console

\- \[ ] Posts loading from database



\### Mobile

\- \[ ] App looks good at 375px width

\- \[ ] Bottom nav visible and working

\- \[ ] No overlapping elements



\## Demo Seed Data

Insert these 3 posts for demo:

```sql

-- Seed (just planted)

INSERT INTO posts (content, growth\_stage, interaction\_count, lat, lng)

VALUES ('Saturday Farmers Market 🌽', 'seed', 0, 39.7392, -104.9903);



-- Tree (growing)

INSERT INTO posts (content, growth\_stage, interaction\_count, lat, lng)

VALUES ('Sunday Morning Yoga in the Park 🧘', 'tree', 7, 39.7412, -104.9883);



-- Oak (thriving)

INSERT INTO posts (content, growth\_stage, interaction\_count, lat, lng)

VALUES ('Weekly Neighborhood Cleanup 🌳', 'oak', 12, 39.7372, -104.9923);

```



\## 60-Second Demo Script

1\. "This is Roots — grow your community"

2\. Show dark map with one seed dot

3\. Plant new post: Saturday Farmers Market

4\. Show seed appear on map

5\. Open second tab — click attend 3 times

6\. Watch seed grow to tree in real time

7\. Show Who's Going list with attendees

8\. Show spark count increment

9\. Open AI chatbot — ask "what's happening near me?"

10\. "Active neighborhoods become forests. This is Roots."

