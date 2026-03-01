from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import List
import requests
import json

app = FastAPI(title="EventBoard API")

# 1. Define the Data Shape
class Event(BaseModel):
    title: str
    host: str
    public_description: str
    vault_details: str
    is_published: bool = False

# 2. Our Temporary "Database"
db_events = []

# 3. Discord Webhook Logic
def send_discord_invite(event_title: str, host_name: str):
    WEBHOOK_URL = "https://discord.com/api/webhooks/1477389940508856386/CWkaCVWwnRcSQQ_x1eb4CfPpQCzQEEjknX6WdsQBPSVxY_yXMlqIZ4Kf_XIxGGNxbSY_" # Paste your URL here
    message = {
        "content": f"🎉 **New Event Alert!** 🎉\n**{event_title}** is being hosted by {host_name}!\n*Head to the Event Board to request Vault access.*"
    }
    requests.post(WEBHOOK_URL, data=json.dumps(message), headers={"Content-Type": "application/json"})

# 4. The Endpoints
@app.post("/events/create/")
async def create_event(event: Event, background_tasks: BackgroundTasks):
    db_events.append(event)
    
    # Trigger the webhook in the background if published
    if event.is_published:
        background_tasks.add_task(send_discord_invite, event.title, event.host)
        
    return {"status": "Success", "event_title": event.title}

@app.get("/events/")
async def get_all_events():
    return {"events": db_events}