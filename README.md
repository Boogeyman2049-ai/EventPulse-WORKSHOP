# EventPulse — End-to-End Ticketing Web Application

Full-stack production architecture integrating a Single Page Application (HTML/CSS/Vanilla JS) with an Express / FastAPI backend and Supabase PostgreSQL with Row Level Security (RLS).

---

## 📁 Project Structure

```
eventpulse/
├── .env.example              # Environment variables template
├── package.json              # Node.js backend dependencies & scripts
├── server.js                 # Express API server (5 routes, JWT auth, RLS)
├── fastapi_server.py         # Alternative Python FastAPI implementation
├── supabase/
│   ├── schema.sql            # Tables, FKs, RLS policies, trigger & RPC
│   └── seed.sql              # Curated events matching 2x2 grid & demo users
└── public/
    └── index.html            # Updated SPA with live fetch() integration
```

---

## ⚡ Quick Start

### 1. Install & Run Backend (Node.js Express)
```bash
npm install
npm start
```
The server will start on `http://localhost:5000` and automatically serve the frontend!

*(Optional Python FastAPI alternative)*:
```bash
pip install fastapi uvicorn pydantic supabase python-dotenv
uvicorn fastapi_server:app --reload --port 5000
```

### 2. Connect Your Supabase PostgreSQL Project
1. In your [Supabase Dashboard](https://supabase.com/dashboard), open the **SQL Editor**.
2. Run `supabase/schema.sql` to create `users`, `events`, `registrations`, RLS policies, and the `register_for_event` atomic booking procedure.
3. Run `supabase/seed.sql` to populate the 16 curated events.
4. Go to **Project Settings -> API** in Supabase and copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
5. Create `.env` from `.env.example`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   PORT=5000
   ```
6. Restart the server (`npm start`).

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/events` | Browse catalog (filter, search, pagination) | No | `200 OK` |
| `GET` | `/api/events/:id` | Event details | No | `200 OK`, `404 Not Found` |
| `POST` | `/api/registrations` | Book tickets (atomic seats check & unique lock) | Yes (JWT) | `201 Created`, `409 Conflict`, `401 Unauthorized` |
| `GET` | `/api/me/registrations` | User's digital ticket wallet passes | Yes (JWT) | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/events/:id/registrations` | Attendee list (**Owning Organizer Only**) | Yes (JWT) | `200 OK`, `403 Forbidden`, `401 Unauthorized` |
