# ==============================================================================
# EventPulse Backend API Server (Python FastAPI + Supabase PostgreSQL)
# Alternative Python implementation implementing all 5 REST Endpoints & RLS
# ==============================================================================

import os
import math
import random
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="EventPulse API",
    description="Secure Event Ticketing API with Supabase PostgreSQL and RLS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# SUPABASE CONFIGURATION
# ------------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase_admin = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and "your-project" not in SUPABASE_URL:
    try:
        from supabase import create_client, Client
        supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("✅ Supabase Python Client connected successfully.")
    except Exception as e:
        print(f"⚠️ Supabase import/connect error: {e}")

# ------------------------------------------------------------------------------
# IN-MEMORY STORE (Fallback when Supabase keys not set)
# ------------------------------------------------------------------------------
mock_users = [
    {"id": "00000000-0000-0000-0000-000000000001", "email": "organizer@eventpulse.io", "full_name": "EventPulse Admin", "role": "organizer"},
    {"id": "00000000-0000-0000-0000-000000000002", "email": "arjun@eventpulse.io", "full_name": "Arjun Mehta", "role": "attendee"}
]

mock_events = [
    {
        "id": "11111111-1111-1111-1111-111111111101",
        "title": "Future of AI & Robotics Summit 2026",
        "tagline": "Autonomous Agents, Physical Robotics & Frontier LLMs in Production",
        "category": "Tech & AI",
        "date_time": "2026-11-14T10:00:00+05:30",
        "venue": "BIEC Exhibition Center, Bengaluru",
        "price_inr": 1499,
        "seats_left": 24,
        "organizer_id": "00000000-0000-0000-0000-000000000001"
    },
    {
        "id": "11111111-1111-1111-1111-111111111102",
        "title": "Neon Horizon: Synthwave Open Air Festival",
        "tagline": "Cyberpunk Laser Spectacle, Analog Synths & Immersive 3D Visuals",
        "category": "Music & Live",
        "date_time": "2026-11-18T18:30:00+05:30",
        "venue": "Jayamahal Palace Grounds, Bengaluru",
        "price_inr": 1999,
        "seats_left": 16,
        "organizer_id": "00000000-0000-0000-0000-000000000001"
    }
]

mock_registrations = [
    {
        "id": "reg-101",
        "booking_id": "EP-914023",
        "event_id": "11111111-1111-1111-1111-111111111101",
        "user_id": "00000000-0000-0000-0000-000000000002",
        "ticket_tier": "VIP",
        "quantity": 2,
        "seats": "SEC-A • SEATS 14-15",
        "total_amount": 3148,
        "status": "confirmed"
    }
]

# ------------------------------------------------------------------------------
# AUTH DEPENDENCY
# ------------------------------------------------------------------------------
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer token"
        )
    token = authorization.split(" ")[1]

    if supabase_admin:
        try:
            res = supabase_admin.auth.get_user(token)
            if not res or not res.user:
                raise HTTPException(status_code=401, detail="Invalid token")
            return {"id": res.user.id, "email": res.user.email}
        except Exception:
            raise HTTPException(status_code=401, detail="Token validation failed")

    # Mock user resolution
    if "organizer" in token:
        return mock_users[0]
    return mock_users[1]

# ------------------------------------------------------------------------------
# SCHEMAS
# ------------------------------------------------------------------------------
class RegistrationRequest(BaseModel):
    event_id: str
    ticket_tier: str = "STANDARD"
    quantity: int = Field(default=1, ge=1, le=10)
    promo_code: Optional[str] = None

# ------------------------------------------------------------------------------
# 1. GET /api/events : Browse events with pagination & category filter
# ------------------------------------------------------------------------------
@app.get("/api/events")
async def get_events(
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(4, ge=1, le=20)
):
    offset = (page - 1) * limit

    if supabase_admin:
        query = supabase_admin.table("events").select("*", count="exact")
        if category and category != "ALL":
            query = query.eq("category", category)
        if search:
            query = query.ilike("title", f"%{search}%")
        
        query = query.range(offset, offset + limit - 1)
        res = query.execute()
        total = res.count or 0
        return {
            "events": res.data,
            "pagination": {
                "currentPage": page,
                "totalPages": max(1, math.ceil(total / limit)),
                "totalEvents": total,
                "limit": limit
            }
        }

    filtered = [e for e in mock_events]
    if category and category != "ALL":
        filtered = [e for e in filtered if e.get("category") == category]
    if search:
        s = search.lower()
        filtered = [e for e in filtered if s in e["title"].lower() or s in e["venue"].lower()]
    
    total = len(filtered)
    return {
        "events": filtered[offset : offset + limit],
        "pagination": {
            "currentPage": page,
            "totalPages": max(1, math.ceil(total / limit)),
            "totalEvents": total,
            "limit": limit
        }
    }

# ------------------------------------------------------------------------------
# 2. GET /api/events/{id} : Event details
# ------------------------------------------------------------------------------
@app.get("/api/events/{id}")
async def get_event_detail(id: str):
    if supabase_admin:
        res = supabase_admin.table("events").select("*").eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"event": res.data[0]}

    event = next((e for e in mock_events if e["id"] == id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"event": event}

# ------------------------------------------------------------------------------
# 3. POST /api/registrations : Create registration (201 Created or 409 Conflict)
# ------------------------------------------------------------------------------
@app.post("/api/registrations", status_code=status.HTTP_201_CREATED)
async def create_registration(
    body: RegistrationRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    event_id = body.event_id
    qty = body.quantity

    if supabase_admin:
        # Check conflict 1: Already registered
        existing = supabase_admin.table("registrations").select("id").eq("event_id", event_id).eq("user_id", user_id).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Conflict: You are already registered for this event."
            )

        # Check conflict 2: Seats capacity
        event_res = supabase_admin.table("events").select("*").eq("id", event_id).execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")
        event = event_res.data[0]

        if event["seats_left"] < qty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Conflict: Event is full or does not have enough remaining seats."
            )

        # Atomic Stored Procedure RPC call
        booking_id = f"EP-{random.randint(100000, 999999)}"
        tx_hash = f"0x{''.join(random.choices('0123456789abcdef', k=12))}"
        seats = f"SEC-B • SEAT {random.randint(10, 50)}"

        try:
            rpc_res = supabase_admin.rpc("register_for_event", {
                "p_event_id": event_id,
                "p_user_id": user_id,
                "p_tier": body.ticket_tier.upper(),
                "p_quantity": qty,
                "p_seats": seats,
                "p_total_amount": float(event["price_inr"]) * qty * 1.05,
                "p_booking_id": booking_id,
                "p_tx_hash": tx_hash
            }).execute()

            return {"message": "Registration created successfully", "registration": rpc_res.data}
        except Exception as e:
            err_msg = str(e)
            if "CONFLICT_ALREADY_REGISTERED" in err_msg:
                raise HTTPException(status_code=409, detail="Conflict: Already registered")
            if "CONFLICT_EVENT_FULL" in err_msg:
                raise HTTPException(status_code=409, detail="Conflict: Event is full")
            raise HTTPException(status_code=500, detail=err_msg)

    # In-memory mock
    existing = next((r for r in mock_registrations if r["event_id"] == event_id and r["user_id"] == user_id), None)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: You are already registered for this event."
        )

    event = next((e for e in mock_events if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event["seats_left"] < qty:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: Event is full or does not have enough remaining seats."
        )

    event["seats_left"] -= qty
    new_reg = {
        "id": f"reg-{len(mock_registrations)+1}",
        "booking_id": f"EP-{random.randint(100000, 999999)}",
        "event_id": event_id,
        "user_id": user_id,
        "ticket_tier": body.ticket_tier.upper(),
        "quantity": qty,
        "seats": f"SEC-A • SEATS 10-{10+qty-1}",
        "total_amount": round(event["price_inr"] * qty * 1.05),
        "status": "confirmed",
        "tx_hash": f"0x{''.join(random.choices('0123456789abcdef', k=12))}"
    }
    mock_registrations.append(new_reg)
    return {"message": "Registration created successfully", "registration": new_reg}

# ------------------------------------------------------------------------------
# 4. GET /api/me/registrations : Current user's registrations (Digital Ticket Wallet)
# ------------------------------------------------------------------------------
@app.get("/api/me/registrations")
async def get_my_registrations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if supabase_admin:
        res = supabase_admin.table("registrations").select("*, event:events(*)").eq("user_id", user_id).execute()
        return {"registrations": res.data}

    user_regs = [r for r in mock_registrations if r["user_id"] == user_id]
    for r in user_regs:
        r["event"] = next((e for e in mock_events if e["id"] == r["event_id"]), None)
    return {"registrations": user_regs}

# ------------------------------------------------------------------------------
# 5. GET /api/events/{id}/registrations : Attendee list (Owning Organizer Only)
# ------------------------------------------------------------------------------
@app.get("/api/events/{id}/registrations")
async def get_event_attendees(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    if supabase_admin:
        event_res = supabase_admin.table("events").select("id, title, organizer_id").eq("id", id).execute()
        if not event_res.data:
            raise HTTPException(status_code=404, detail="Event not found")
        event = event_res.data[0]

        # RESTRICTION CHECK: Owning organizer only
        if event["organizer_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only the owning organizer can access the attendee list for this event."
            )

        attendees_res = supabase_admin.table("registrations").select("*, user:users(*)").eq("event_id", id).execute()
        return {
            "eventId": event["id"],
            "eventTitle": event["title"],
            "totalRegistrations": len(attendees_res.data),
            "attendees": attendees_res.data
        }

    event = next((e for e in mock_events if e["id"] == id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event["organizer_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the owning organizer can access the attendee list for this event."
        )

    attendees = [r for r in mock_registrations if r["event_id"] == id]
    return {
        "eventId": event["id"],
        "eventTitle": event["title"],
        "totalRegistrations": len(attendees),
        "attendees": attendees
    }
