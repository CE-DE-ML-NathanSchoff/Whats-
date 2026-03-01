from fastapi import FastAPI, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List
import requests
import json
import os

# --- SQLAlchemy Imports ---
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

# 1. Database Setup
# We store the database inside the 'data' folder mapped by Docker
os.makedirs("./data", exist_ok=True)
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/events.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models (SQL) ---

# The Adjacency List for your Friend Network (Graph Structure)
friendship = Table(
    'friendships', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('friend_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # This allows a user to have many friends natively in the database
    friends = relationship("DBUser", secondary=friendship, 
                           primaryjoin=id==friendship.c.user_id,
                           secondaryjoin=id==friendship.c.friend_id)

class DBEvent(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    host = Column(String)
    public_description = Column(String)
    vault_details = Column(String)
    is_published = Column(Boolean, default=False)

# Create the tables in the database
Base.metadata.create_all(bind=engine)

# --- Pydantic Models (Data Validation) ---
class EventCreate(BaseModel):
    title: str
    host: str
    public_description: str
    vault_details: str
    is_published: bool = False

# --- FastAPI App ---
app = FastAPI(title="EventBoard API")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Discord Logic ---
def send_discord_invite(event_id: int):
    """
    Fetches the event from the database using the event_id,
    and posts the dynamic details to the Discord webhook.
    """
    db = SessionLocal()
    try:
        event = db.query(DBEvent).filter(DBEvent.id == event_id).first()
        if not event:
            print(f"Event with ID {event_id} not found.")
            return

        WEBHOOK_URL = "https://discord.com/api/webhooks/1477389940508856386/CWkaCVWwnRcSQQ_x1eb4CfPpQCzQEEjknX6WdsQBPSVxY_yXMlqIZ4Kf_XIxGGNxbSY_"  # Remember to paste your URL!
        
        # Build the message dynamically from the database record
        message = {
            "content": (
                f"🎉 **New Event Alert!** 🎉\n"
                f"**{event.title}** is being hosted by **{event.host}**!\n\n"
                f"**Details:** {event.public_description}\n"
                f"*Head to the Event Board to request Vault access.*"
            )
        }
        
        requests.post(WEBHOOK_URL, data=json.dumps(message), headers={"Content-Type": "application/json"})
    finally:
        db.close()

# --- Endpoints ---
@app.post("/events/create/")
def create_event(event: EventCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Convert the Pydantic data into a SQLAlchemy database row
    new_event = DBEvent(**event.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    if new_event.is_published:
        # Pass the database ID to the background task instead of the literal strings
        background_tasks.add_task(send_discord_invite, new_event.id)
        
    return {"status": "Success", "event_id": new_event.id, "title": new_event.title}

@app.get("/events/")
def get_all_events(db: Session = Depends(get_db)):
    # Fetch all events from the database
    events = db.query(DBEvent).all()
    # Only return the public info!
    return [{"id": e.id, "title": e.title, "host": e.host, "desc": e.public_description} for e in events]
