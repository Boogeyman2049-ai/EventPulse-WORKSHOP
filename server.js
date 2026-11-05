// ==============================================================================
// EventPulse Pure Backend REST API (Node.js / Express + Supabase PostgreSQL)
// Designed for production deployment on Render.com
// Implements 5 Required REST Endpoints, 201/409/403 Status Codes, & Zero-Frontend
// ==============================================================================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// ------------------------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// ------------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_KEY is missing from environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

console.log('✅ Supabase client initialized.');

// ------------------------------------------------------------------------------
// ROOT ENDPOINT: API HEALTH & DOCUMENTATION (Pure Backend)
// ------------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'EventPulse Backend API',
        version: '1.0.0',
        status: 'ONLINE',
        database: 'Supabase PostgreSQL',
        endpoints: {
            'GET /api/events': 'Browse all events with live capacity and seat calculations',
            'GET /api/events/:id': 'Get event details by ID',
            'POST /api/registrations': 'Register for an event (Returns 201 Created or 409 Conflict)',
            'GET /api/me/registrations': 'Get current user registrations (Authenticated)',
            'GET /api/events/:id/registrations': 'Get attendee list (Owning organizer only - 403 Forbidden otherwise)'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// ------------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// Supports:
//   1. Standard Supabase JWT (Bearer <token>)
//   2. Direct User ID as Bearer token (Bearer <uuid>)
//   3. User Email as Bearer token (Bearer <email>)
//   4. Custom Header: x-user-id: <uuid>
// ------------------------------------------------------------------------------
async function authenticateUser(req, res, next) {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1].trim();
    } else if (req.headers['x-user-id']) {
        token = req.headers['x-user-id'].trim();
    }

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized: Missing or malformed authentication. Provide Bearer token or x-user-id header.',
            code: 'AUTH_REQUIRED'
        });
    }

    try {
        // Option A: Try verifying as Supabase JWT
        if (token.startsWith('ey')) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                const { data: userRow } = await supabase
                    .from('users')
                    .select('id, email, role')
                    .eq('id', user.id)
                    .maybeSingle();

                req.user = {
                    id: user.id,
                    email: user.email,
                    role: userRow?.role || 'attendee'
                };
                return next();
            }
        }

        // Option B: Resolve direct User UUID or Email from public.users table
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
        let userQuery = supabase.from('users').select('id, email, role');

        if (isUUID) {
            userQuery = userQuery.eq('id', token);
        } else if (token.includes('@')) {
            userQuery = userQuery.eq('email', token);
        } else {
            userQuery = userQuery.or(`id.eq.${token},email.eq.${token}`);
        }

        const { data: userProfile, error: profileErr } = await userQuery.maybeSingle();

        if (userProfile) {
            req.user = {
                id: userProfile.id,
                email: userProfile.email,
                role: userProfile.role || 'attendee'
            };
            return next();
        }

        return res.status(401).json({
            error: 'Unauthorized: Invalid token or user not found',
            code: 'INVALID_CREDENTIALS'
        });
    } catch (err) {
        return res.status(401).json({ error: 'Authentication failed', details: err.message });
    }
}

// ------------------------------------------------------------------------------
// 1. GET /api/events : Browse events with live seat calculations & optional filters
// ------------------------------------------------------------------------------
app.get('/api/events', async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        let query = supabase
            .from('events')
            .select('id, organiser_id, title, capacity, timestamp, registrations(count)', { count: 'exact' })
            .order('timestamp', { ascending: true, nullsFirst: false });

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }

        if (page && limit) {
            const pageNum = Math.max(1, parseInt(page, 10));
            const limitNum = Math.max(1, parseInt(limit, 10));
            const offset = (pageNum - 1) * limitNum;
            query = query.range(offset, offset + limitNum - 1);
        }

        const { data: events, error, count } = await query;

        if (error) {
            return res.status(500).json({ error: 'Database query failed', details: error.message });
        }

        // Calculate live occupied and seats_left dynamically from database
        const formattedEvents = (events || []).map(ev => {
            const occupied = ev.registrations?.[0]?.count || 0;
            const capacity = Number(ev.capacity) || 0;
            const seatsLeft = Math.max(0, capacity - occupied);

            return {
                id: ev.id,
                organiser_id: ev.organiser_id,
                title: ev.title,
                capacity: capacity,
                occupied: occupied,
                seats_left: seatsLeft,
                timestamp: ev.timestamp
            };
        });

        res.status(200).json({
            total: count ?? formattedEvents.length,
            events: formattedEvents
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// 2. GET /api/events/:id : Event details
// ------------------------------------------------------------------------------
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: ev, error } = await supabase
            .from('events')
            .select('id, organiser_id, title, capacity, timestamp, registrations(count)')
            .eq('id', id)
            .single();

        if (error || !ev) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        const occupied = ev.registrations?.[0]?.count || 0;
        const capacity = Number(ev.capacity) || 0;

        res.status(200).json({
            event: {
                id: ev.id,
                organiser_id: ev.organiser_id,
                title: ev.title,
                capacity: capacity,
                occupied: occupied,
                seats_left: Math.max(0, capacity - occupied),
                timestamp: ev.timestamp
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// 3. POST /api/registrations : Create registration
// Returns 201 Created on success, or 409 Conflict if already registered or full
// ------------------------------------------------------------------------------
app.post('/api/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.body.event_id || req.body.eventId;

        if (!eventId) {
            return res.status(400).json({ error: 'event_id is required', code: 'MISSING_EVENT_ID' });
        }

        // ----------------------------------------------------------------------
        // CONFLICT CHECK 1: Is user already registered for this event?
        // ----------------------------------------------------------------------
        const { data: existingReg } = await supabase
            .from('registrations')
            .select('id, event_id, user_id, "createdAt"')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existingReg) {
            return res.status(409).json({
                error: 'Conflict: User is already registered for this event.',
                code: 'ALREADY_REGISTERED',
                registrationId: existingReg.id
            });
        }

        // ----------------------------------------------------------------------
        // CONFLICT CHECK 2: Is the event full?
        // ----------------------------------------------------------------------
        const { data: ev, error: evErr } = await supabase
            .from('events')
            .select('id, title, capacity, registrations(count)')
            .eq('id', eventId)
            .single();

        if (evErr || !ev) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        const occupied = ev.registrations?.[0]?.count || 0;
        const capacity = Number(ev.capacity) || 0;

        if (occupied >= capacity) {
            return res.status(409).json({
                error: 'Conflict: Event is full. No capacity remaining.',
                code: 'EVENT_FULL',
                capacity,
                occupied
            });
        }

        // ----------------------------------------------------------------------
        // INSERT REGISTRATION (Returns 201 Created)
        // ----------------------------------------------------------------------
        const { data: newReg, error: insertErr } = await supabase
            .from('registrations')
            .insert({
                user_id: userId,
                event_id: eventId,
                createdAt: new Date().toISOString()
            })
            .select('*')
            .single();

        if (insertErr) {
            // Check for PostgreSQL unique constraint code 23505
            if (insertErr.code === '23505') {
                return res.status(409).json({
                    error: 'Conflict: User is already registered for this event.',
                    code: 'ALREADY_REGISTERED'
                });
            }
            return res.status(500).json({ error: 'Registration failed', details: insertErr.message });
        }

        return res.status(201).json({
            message: 'Registration created successfully',
            registration: newReg
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// 4. GET /api/me/registrations : Current user's registrations
// ------------------------------------------------------------------------------
app.get('/api/me/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: myRegistrations, error } = await supabase
            .from('registrations')
            .select(`
                id,
                user_id,
                event_id,
                createdAt,
                event:events (
                    id,
                    title,
                    capacity,
                    timestamp,
                    organiser_id
                )
            `)
            .eq('user_id', userId)
            .order('createdAt', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to retrieve registrations', details: error.message });
        }

        res.status(200).json({
            userId,
            totalRegistrations: myRegistrations ? myRegistrations.length : 0,
            registrations: myRegistrations || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// 5. GET /api/events/:id/registrations : Attendee List (Owning Organizer Only)
// Restricted so it is accessible by the owning organizer only
// ------------------------------------------------------------------------------
app.get('/api/events/:id/registrations', authenticateUser, async (req, res) => {
    try {
        const eventId = req.params.id;
        const requestingUserId = req.user.id;

        // Step 1: Look up event to inspect organiser_id
        const { data: event, error: eventErr } = await supabase
            .from('events')
            .select('id, title, organiser_id, capacity')
            .eq('id', eventId)
            .single();

        if (eventErr || !event) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        // Step 2: RESTRICTION CHECK: Must match event.organiser_id
        if (event.organiser_id !== requestingUserId) {
            return res.status(403).json({
                error: 'Forbidden: Only the owning organizer can access the attendee list for this event.',
                code: 'FORBIDDEN_NOT_ORGANIZER',
                eventId,
                organiserId: event.organiser_id,
                requesterId: requestingUserId
            });
        }

        // Step 3: Fetch attendees joined with user profile
        const { data: attendees, error: attendeesErr } = await supabase
            .from('registrations')
            .select(`
                id,
                createdAt,
                user:users (
                    id,
                    email,
                    role
                )
            `)
            .eq('event_id', eventId)
            .order('createdAt', { ascending: false });

        if (attendeesErr) {
            return res.status(500).json({ error: 'Failed to retrieve attendee list', details: attendeesErr.message });
        }

        res.status(200).json({
            eventId: event.id,
            eventTitle: event.title,
            capacity: event.capacity,
            totalAttendees: attendees ? attendees.length : 0,
            attendees: attendees || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// CONVENIENCE LOGIN ROUTE FOR TESTING (POST /api/auth/login)
// ------------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        // Lookup in public.users
        const { data: user } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', email)
            .maybeSingle();

        if (user) {
            return res.status(200).json({
                token: user.id,
                user: user
            });
        }

        // Fallback Supabase auth
        if (password) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data?.session) {
                return res.status(200).json({
                    token: data.session.access_token,
                    user: data.user
                });
            }
        }

        res.status(401).json({ error: 'User not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ------------------------------------------------------------------------------
// 404 CATCH-ALL FOR UNMATCHED ROUTES
// ------------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Start Server on 0.0.0.0 (Required for Render)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 EventPulse Pure Backend API running on port ${PORT}`);
    console.log(`📡 Root URL: http://0.0.0.0:${PORT}`);
});
