Paste:

```

---

name: fastapi-route

description: Use when creating or editing Python FastAPI routes, AI integrations, Gemini moderation, Claude chat proxy, or any backend endpoint in Roots.

---



\# FastAPI Route Skill



\## Rules

\- All routes go in backend/routes/ as separate files

\- Always use async/await

\- Always validate with Pydantic models

\- Never put API keys in code — use python-dotenv

\- Register all routers in main.py



\## Route Template

```python

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from supabase import create\_client

import os



router = APIRouter()

supabase = create\_client(os.getenv("SUPABASE\_URL"), os.getenv("SUPABASE\_KEY"))



class PostRequest(BaseModel):

&nbsp;   content: str

&nbsp;   user\_id: str

&nbsp;   neighborhood\_id: str



@router.post("/api/posts")

async def create\_post(req: PostRequest):

&nbsp;   # 1. Run Gemini moderation

&nbsp;   # 2. Insert to Supabase

&nbsp;   # 3. Return new post

&nbsp;   pass

```



\## Gemini Moderation Pattern

```python

import google.generativeai as genai



genai.configure(api\_key=os.getenv("GEMINI\_API\_KEY"))

model = genai.GenerativeModel('gemini-pro')



async def moderate\_post(content: str) -> bool:

&nbsp;   response = model.generate\_content(

&nbsp;       f"Is this community post safe and appropriate? Reply YES or NO only: {content}"

&nbsp;   )

&nbsp;   return response.text.strip() == "YES"

```



\## Claude Chat Pattern

```python

import anthropic



client = anthropic.Anthropic(api\_key=os.getenv("ANTHROPIC\_API\_KEY"))



@router.post("/api/chat")

async def chat(message: str):

&nbsp;   response = client.messages.create(

&nbsp;       model="claude-sonnet-4-20250514",

&nbsp;       max\_tokens=1000,

&nbsp;       system="You are the Roots community assistant...",

&nbsp;       messages=\[{"role": "user", "content": message}]

&nbsp;   )

&nbsp;   return {"reply": response.content\[0].text}

```



\## main.py Registration

```python

from routes import posts, friends, neighborhoods, chat, crosspost

app.include\_router(posts.router)

app.include\_router(friends.router)

app.include\_router(neighborhoods.router)

app.include\_router(chat.router)

app.include\_router(crosspost.router)

```

