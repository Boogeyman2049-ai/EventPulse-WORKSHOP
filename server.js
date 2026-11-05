// ==============================================================================
// EventPulse Pure Backend REST API (Node.js / Express + Supabase PostgreSQL)
// Fully compatible with both Teacher Schema and Standard PostgreSQL Schema:
//   - users: (uuid, id, email, role)
//   - events: (event_id, id, student_id, organiser_id, title, capacity, created_at, timestamp)
//   - registrations: (id, student_id, user_id, event_id, created_at, createdAt)
// ==============================================================================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

console.log('✅ Supabase Client initialized for teacher database schema.');

// ------------------------------------------------------------------------------
// UNIVERSAL DATABASE QUERY HELPERS
// (Resilient whether custom column aliases exist yet or not)
// ------------------------------------------------------------------------------
async function findUserByIdOrEmail(token) {
    if (token.includes('@')) {
        const { data } = await supabase.from('users').select('*').eq('email', token).maybeSingle();
        if (data) return data;
    }
    // Try id
    let { data: byId } = await supabase.from('users').select('*').eq('id', token).maybeSingle();
    if (byId) return byId;

    // Try uuid if column exists
    try {
        const { data: byUuid, error } = await supabase.from('users').select('*').eq('uuid', token).maybeSingle();
        if (!error && byUuid) return byUuid;
    } catch (_) {}

    return null;
}

async function findEventById(eventId) {
    // Try id
    let { data: byId, error: err1 } = await supabase
        .from('events')
        .select('*, registrations(count)')
        .eq('id', eventId)
        .maybeSingle();

    if (!err1 && byId) return byId;

    // Try event_id if column exists
    try {
        const { data: byEventId, error: err2 } = await supabase
            .from('events')
            .select('*, registrations(count)')
            .eq('event_id', eventId)
            .maybeSingle();

        if (!err2 && byEventId) return byEventId;
    } catch (_) {}

    return null;
}

async function findExistingRegistration(eventId, userId) {
    // Check by user_id & event_id
    let { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

    if (!error && data) return data;

    // Try student_id
    try {
        const { data: byStudent, error: err2 } = await supabase
            .from('registrations')
            .select('*')
            .eq('event_id', eventId)
            .eq('student_id', userId)
            .maybeSingle();

        if (!err2 && byStudent) return byStudent;
    } catch (_) {}

    return null;
}

// ------------------------------------------------------------------------------
// ROOT ENDPOINT: API STATUS & SPECIFICATION (Pure Backend - No Frontend)
// ------------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'EventPulse Backend API',
        status: 'ONLINE',
        version: '1.0.0',
        database: 'Supabase PostgreSQL',
        endpoints: {
            'GET /api/events': 'Browse all events with live seat calculations',
            'GET /api/events/:id': 'Get event details by event_id or id',
            'POST /api/registrations': 'Register for an event (201 Created or 409 Conflict)',
            'GET /api/me/registrations': 'Get current user registrations',
            'GET /api/events/:id/registrations': 'Get attendee roster (Owning organizer only; 403 Forbidden otherwise)'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// ------------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// Resolves token by:
//   1. Supabase JWT (Bearer <jwt>)
//   2. Direct UUID (Bearer <uuid>) matching users.uuid or users.id
//   3. Email (Bearer <email>)
//   4. Header x-user-id: <uuid>
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
            error: 'Unauthorized: Missing or malformed authentication header. Provide Bearer token or x-user-id header.',
            code: 'AUTH_REQUIRED'
        });
    }

    try {
        // Try Supabase JWT
        if (token.startsWith('ey')) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                const userRow = await findUserByIdOrEmail(user.id);
                req.user = {
                    id: user.id,
                    uuid: user.id,
                    email: user.email,
                    role: userRow?.role || 'attendee'
                };
                return next();
            }
        }

        // Direct UUID / Email lookup
        const userProfile = await findUserByIdOrEmail(token);

        if (userProfile) {
            const resolvedId = userProfile.uuid || userProfile.id;
            req.user = {
                id: resolvedId,
                uuid: resolvedId,
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
// 1. GET /api/events : Browse events with capacity calculation
// ------------------------------------------------------------------------------
app.get('/api/events', async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        let query = supabase
            .from('events')
            .select('*, registrations(count)', { count: 'exact' });

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

        const formatted = (events || []).map(ev => {
            const eventId = ev.event_id || ev.id;
            const organiserId = ev.student_id || ev.organiser_id;
            const capacity = Number(ev.capacity) || 0;
            const occupied = ev.registrations?.[0]?.count || 0;
            const seatsLeft = Math.max(0, capacity - occupied);
            const createdAt = ev.created_at || ev.timestamp;

            return {
                id: eventId,
                event_id: eventId,
                organiser_id: organiserId,
                student_id: organiserId,
                title: ev.title,
                capacity,
                occupied,
                seats_left: seatsLeft,
                created_at: createdAt,
                timestamp: createdAt
            };
        });

        res.status(200).json({
            total: count ?? formatted.length,
            events: formatted
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
        const ev = await findEventById(id);

        if (!ev) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        const eventId = ev.event_id || ev.id;
        const organiserId = ev.student_id || ev.organiser_id;
        const capacity = Number(ev.capacity) || 0;
        const occupied = ev.registrations?.[0]?.count || 0;
        const seatsLeft = Math.max(0, capacity - occupied);
        const createdAt = ev.created_at || ev.timestamp;

        res.status(200).json({
            event: {
                id: eventId,
                event_id: eventId,
                organiser_id: organiserId,
                student_id: organiserId,
                title: ev.title,
                capacity,
                occupied,
                seats_left: seatsLeft,
                created_at: createdAt,
                timestamp: createdAt
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ------------------------------------------------------------------------------
// 3. POST /api/registrations : Create registration
// Returns 201 Created or 409 Conflict
// ------------------------------------------------------------------------------
app.post('/api/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id || req.user.uuid;
        const eventId = req.body.event_id || req.body.eventId || req.body.id;

        if (!eventId) {
            return res.status(400).json({ error: 'event_id is required', code: 'MISSING_EVENT_ID' });
        }

        const ev = await findEventById(eventId);
        if (!ev) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        const resolvedEventId = ev.event_id || ev.id;

        // Conflict Check 1: User already registered for this event
        const existingReg = await findExistingRegistration(resolvedEventId, userId);
        if (existingReg) {
            return res.status(409).json({
                error: 'Conflict: User is already registered for this event.',
                code: 'ALREADY_REGISTERED',
                registrationId: existingReg.id
            });
        }

        // Conflict Check 2: Event capacity full
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

        // Insert registration (supports both teacher schema and legacy schema)
        const nowIso = new Date().toISOString();
        let insertPayload = {
            event_id: resolvedEventId,
            student_id: userId,
            user_id: userId,
            created_at: nowIso,
            createdAt: nowIso
        };

        let { data: newReg, error: insertErr } = await supabase
            .from('registrations')
            .insert(insertPayload)
            .select('*')
            .single();

        // If schema cache hasn't loaded student_id or created_at yet, fallback to standard columns
        if (insertErr && insertErr.message && insertErr.message.includes('schema cache')) {
            insertPayload = {
                event_id: resolvedEventId,
                user_id: userId,
                createdAt: nowIso
            };
            const fallback = await supabase
                .from('registrations')
                .insert(insertPayload)
                .select('*')
                .single();
            newReg = fallback.data;
            insertErr = fallback.error;
        }

        if (insertErr) {
            if (insertErr.code === '23505' || insertErr.message.includes('unique')) {
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
// 4. GET /api/me/registrations : Current user registrations
// ------------------------------------------------------------------------------
app.get('/api/me/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id || req.user.uuid;

        let { data: myRegistrations, error } = await supabase
            .from('registrations')
            .select('*, event:events(*)')
            .eq('user_id', userId)
            .order('id', { ascending: false });

        if (error || !myRegistrations || myRegistrations.length === 0) {
            try {
                const { data: byStudent, error: err2 } = await supabase
                    .from('registrations')
                    .select('*, event:events(*)')
                    .eq('student_id', userId)
                    .order('id', { ascending: false });
                if (!err2 && byStudent && byStudent.length > 0) {
                    myRegistrations = byStudent;
                    error = null;
                }
            } catch (_) {}
        }

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
        const requestingUserId = req.user.id || req.user.uuid;

        // Step 1: Look up event to inspect student_id / organiser_id
        const event = await findEventById(eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
        }

        const organiserId = event.student_id || event.organiser_id;

        // Step 2: RESTRICTION CHECK: Must match owning organizer
        if (organiserId !== requestingUserId) {
            return res.status(403).json({
                error: 'Forbidden: Only the owning organizer can access the attendee list for this event.',
                code: 'FORBIDDEN_NOT_ORGANIZER',
                eventId,
                organiserId,
                requesterId: requestingUserId
            });
        }

        // Step 3: Fetch attendees joined with user profile
        const { data: attendees, error: attendeesErr } = await supabase
            .from('registrations')
            .select('*, user:users(*)')
            .eq('event_id', event.event_id || event.id);

        if (attendeesErr) {
            return res.status(500).json({ error: 'Failed to retrieve attendee list', details: attendeesErr.message });
        }

        res.status(200).json({
            eventId: event.event_id || event.id,
            eventTitle: event.title,
            capacity: event.capacity,
            totalAttendees: attendees ? attendees.length : 0,
            attendees: attendees || []
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 EventPulse Pure Backend API running on port ${PORT}`);
    console.log(`📡 URL: http://0.0.0.0:${PORT}`);
});
