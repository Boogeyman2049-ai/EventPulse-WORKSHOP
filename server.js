// ==============================================================================
// EventPulse Backend API Server (Node.js / Express + Supabase PostgreSQL)
// Tailored exactly to your Supabase schema:
//   - users: id, email, role
//   - events: id, organiser_id, title, capacity, timestamp
//   - registrations: id, user_id, event_id, createdAt
// ==============================================================================

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Serve frontend SPA
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// ------------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project-id'));

let supabaseAdmin = null;

if (isSupabaseConfigured) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log('✅ Connected to your Supabase project with Service Role Key.');
} else {
    console.warn('\n⚠️ [SUPABASE CONFIG WARNING]');
    console.warn('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to connect live.');
}

// ------------------------------------------------------------------------------
// MOCK FALLBACK DATA (Matches your exact schema structure)
// ------------------------------------------------------------------------------
const mockStore = {
    users: [
        { id: '00000000-0000-0000-0000-000000000001', email: 'organizer@eventpulse.io', role: 'organizer' },
        { id: '00000000-0000-0000-0000-000000000002', email: 'arjun@eventpulse.io', role: 'attendee' }
    ],
    events: [
        {
            id: '11111111-1111-1111-1111-111111111101',
            organiser_id: '00000000-0000-0000-0000-000000000001',
            title: 'Future of AI & Robotics Summit 2026',
            capacity: 50,
            timestamp: '2026-11-14T10:00:00+05:30'
        },
        {
            id: '11111111-1111-1111-1111-111111111102',
            organiser_id: '00000000-0000-0000-0000-000000000001',
            title: 'Neon Horizon: Synthwave Open Air Festival',
            capacity: 100,
            timestamp: '2026-11-18T18:30:00+05:30'
        },
        {
            id: '11111111-1111-1111-1111-111111111103',
            organiser_id: '00000000-0000-0000-0000-000000000001',
            title: 'Valorant Champions India LAN Finals',
            capacity: 80,
            timestamp: '2026-11-22T13:00:00+05:30'
        },
        {
            id: '11111111-1111-1111-1111-111111111104',
            organiser_id: '00000000-0000-0000-0000-000000000001',
            title: 'Figma Design Systems & AI UI Masterclass',
            capacity: 30,
            timestamp: '2026-11-29T10:30:00+05:30'
        }
    ],
    registrations: [
        {
            id: '22222222-2222-2222-2222-222222222201',
            user_id: '00000000-0000-0000-0000-000000000002',
            event_id: '11111111-1111-1111-1111-111111111101',
            createdAt: new Date().toISOString()
        }
    ]
};

// ------------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ------------------------------------------------------------------------------
async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized: Missing or invalid Bearer token',
            code: 'AUTH_REQUIRED'
        });
    }

    const token = authHeader.split(' ')[1];

    if (isSupabaseConfigured && supabaseAdmin) {
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token', code: 'INVALID_TOKEN' });
            }

            // Check role from public.users table
            const { data: profile } = await supabaseAdmin
                .from('users')
                .select('id, email, role')
                .eq('id', user.id)
                .maybeSingle();

            req.user = {
                id: user.id,
                email: user.email,
                role: profile?.role || 'attendee'
            };
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Authentication failed', details: err.message });
        }
    }

    // Mock fallback
    const mockUser = mockStore.users.find(u => token.includes(u.id) || token.includes(u.role)) || mockStore.users[1];
    req.user = { ...mockUser };
    next();
}

// ------------------------------------------------------------------------------
// 1. GET /api/events : Browse events (with live capacity & pagination)
// ------------------------------------------------------------------------------
app.get('/api/events', async (req, res) => {
    try {
        const { search, page = 1, limit = 4 } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.max(1, parseInt(limit, 10));
        const offset = (pageNum - 1) * limitNum;

        if (isSupabaseConfigured && supabaseAdmin) {
            // Fetch events joined with count of registrations
            let query = supabaseAdmin
                .from('events')
                .select('id, organiser_id, title, capacity, timestamp, registrations(count)', { count: 'exact' });

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            query = query
                .order('timestamp', { ascending: true })
                .range(offset, offset + limitNum - 1);

            const { data: events, error, count } = await query;
            if (error) {
                return res.status(500).json({ error: 'Database query failed', details: error.message });
            }

            // Calculate live seats_left dynamically from capacity - registrations
            const formattedEvents = (events || []).map(ev => {
                const registeredCount = ev.registrations?.[0]?.count || 0;
                const capacity = Number(ev.capacity) || 50;
                const seatsLeft = Math.max(0, capacity - registeredCount);

                return {
                    id: ev.id,
                    organiser_id: ev.organiser_id,
                    title: ev.title,
                    capacity: capacity,
                    seats_left: seatsLeft,
                    registered_count: registeredCount,
                    timestamp: ev.timestamp,
                    // UI metadata defaults
                    price_inr: 1499,
                    category: 'Live Event',
                    venue: 'Bengaluru Tech Arena'
                };
            });

            const total = count || 0;
            return res.status(200).json({
                events: formattedEvents,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.max(1, Math.ceil(total / limitNum)),
                    totalEvents: total,
                    limit: limitNum
                }
            });
        }

        // Mock store fallback
        let filtered = [...mockStore.events];
        if (search) {
            filtered = filtered.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
        }

        const formatted = filtered.map(ev => {
            const registeredCount = mockStore.registrations.filter(r => r.event_id === ev.id).length;
            const seatsLeft = Math.max(0, (ev.capacity || 50) - registeredCount);
            return {
                ...ev,
                seats_left: seatsLeft,
                registered_count: registeredCount,
                price_inr: 1499,
                category: 'Live Event',
                venue: 'Bengaluru Tech Arena'
            };
        });

        const total = formatted.length;
        res.status(200).json({
            events: formatted.slice(offset, offset + limitNum),
            pagination: {
                currentPage: pageNum,
                totalPages: Math.max(1, Math.ceil(total / limitNum)),
                totalEvents: total,
                limit: limitNum
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------------------------------------------------------------------
// 2. GET /api/events/:id : Event details
// ------------------------------------------------------------------------------
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (isSupabaseConfigured && supabaseAdmin) {
            const { data: ev, error } = await supabaseAdmin
                .from('events')
                .select('id, organiser_id, title, capacity, timestamp, registrations(count)')
                .eq('id', id)
                .single();

            if (error || !ev) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const registeredCount = ev.registrations?.[0]?.count || 0;
            const capacity = Number(ev.capacity) || 50;
            const event = {
                id: ev.id,
                organiser_id: ev.organiser_id,
                title: ev.title,
                capacity: capacity,
                seats_left: Math.max(0, capacity - registeredCount),
                registered_count: registeredCount,
                timestamp: ev.timestamp,
                price_inr: 1499,
                venue: 'Bengaluru Tech Arena'
            };

            return res.status(200).json({ event });
        }

        const ev = mockStore.events.find(e => e.id === id);
        if (!ev) return res.status(404).json({ error: 'Event not found' });

        const count = mockStore.registrations.filter(r => r.event_id === id).length;
        res.status(200).json({
            event: {
                ...ev,
                seats_left: Math.max(0, (ev.capacity || 50) - count),
                registered_count: count,
                price_inr: 1499,
                venue: 'Bengaluru Tech Arena'
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------------------------------------------------------------------
// 3. POST /api/registrations : Create registration
// Returns 201 Created on success, or 409 Conflict if already registered or full
// ------------------------------------------------------------------------------
app.post('/api/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { event_id } = req.body;

        if (!event_id) {
            return res.status(400).json({ error: 'event_id is required' });
        }

        // ----------------------------------------------------------------------
        // Supabase Live Flow
        // ----------------------------------------------------------------------
        if (isSupabaseConfigured && supabaseAdmin) {
            // Check 1: Conflict 409 — Has user already registered for this event?
            const { data: existingReg } = await supabaseAdmin
                .from('registrations')
                .select('id')
                .eq('event_id', event_id)
                .eq('user_id', userId)
                .maybeSingle();

            if (existingReg) {
                return res.status(409).json({
                    error: 'Conflict: You are already registered for this event.',
                    code: 'ALREADY_REGISTERED',
                    existingId: existingReg.id
                });
            }

            // Check 2: Conflict 409 — Is the event capacity full?
            const { data: ev, error: evErr } = await supabaseAdmin
                .from('events')
                .select('id, title, capacity, registrations(count)')
                .eq('id', event_id)
                .single();

            if (evErr || !ev) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const currentRegistrations = ev.registrations?.[0]?.count || 0;
            const capacity = Number(ev.capacity) || 50;

            if (currentRegistrations >= capacity) {
                return res.status(409).json({
                    error: 'Conflict: Event is full. No capacity remaining.',
                    code: 'EVENT_FULL',
                    capacity,
                    registeredCount: currentRegistrations
                });
            }

            // Insert into registrations table matching your schema columns
            const { data: newReg, error: insertErr } = await supabaseAdmin
                .from('registrations')
                .insert({
                    user_id: userId,
                    event_id: event_id,
                    createdAt: new Date().toISOString()
                })
                .select('*')
                .single();

            if (insertErr) {
                if (insertErr.code === '23505') {
                    return res.status(409).json({ error: 'Conflict: Already registered', code: 'ALREADY_REGISTERED' });
                }
                return res.status(500).json({ error: 'Registration failed', details: insertErr.message });
            }

            return res.status(201).json({
                message: 'Registration created successfully',
                registration: {
                    ...newReg,
                    booking_id: `EP-${newReg.id.slice(0, 6).toUpperCase()}`,
                    seats: `SEAT-${currentRegistrations + 1}`,
                    total_amount: 1499
                }
            });
        }

        // ----------------------------------------------------------------------
        // Mock Flow Fallback
        // ----------------------------------------------------------------------
        const existing = mockStore.registrations.find(r => r.event_id === event_id && r.user_id === userId);
        if (existing) {
            return res.status(409).json({
                error: 'Conflict: You are already registered for this event.',
                code: 'ALREADY_REGISTERED'
            });
        }

        const ev = mockStore.events.find(e => e.id === event_id);
        if (!ev) return res.status(404).json({ error: 'Event not found' });

        const count = mockStore.registrations.filter(r => r.event_id === event_id).length;
        if (count >= ev.capacity) {
            return res.status(409).json({
                error: 'Conflict: Event is full. No capacity remaining.',
                code: 'EVENT_FULL'
            });
        }

        const newRegistration = {
            id: `reg-${Date.now()}`,
            user_id: userId,
            event_id: event_id,
            createdAt: new Date().toISOString()
        };
        mockStore.registrations.unshift(newRegistration);

        return res.status(201).json({
            message: 'Registration created successfully',
            registration: {
                ...newRegistration,
                booking_id: `EP-${Math.floor(100000 + Math.random() * 900000)}`,
                seats: `SEAT-${count + 1}`,
                total_amount: 1499
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------------------------------------------------------------------
// 4. GET /api/me/registrations : Current user's registrations (Digital Wallet)
// ------------------------------------------------------------------------------
app.get('/api/me/registrations', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        if (isSupabaseConfigured && supabaseAdmin) {
            // Join registrations with events
            const { data: myRegistrations, error } = await supabaseAdmin
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
                return res.status(500).json({ error: error.message });
            }

            const formatted = (myRegistrations || []).map(r => ({
                id: r.id,
                booking_id: `EP-${r.id.slice(0, 6).toUpperCase()}`,
                event_id: r.event_id,
                user_id: r.user_id,
                ticket_tier: 'STANDARD',
                seats: 'GENERAL PASS',
                total_amount: 1499,
                status: 'confirmed',
                createdAt: r.createdAt,
                event: {
                    id: r.event?.id,
                    title: r.event?.title || 'Event Pass',
                    category: 'Live Event',
                    venue: 'Bengaluru Tech Arena',
                    date_time: r.event?.timestamp
                }
            }));

            return res.status(200).json({ registrations: formatted });
        }

        // Mock store fallback
        const userRegistrations = mockStore.registrations
            .filter(r => r.user_id === userId)
            .map(r => {
                const ev = mockStore.events.find(e => e.id === r.event_id);
                return {
                    id: r.id,
                    booking_id: `EP-${r.id.slice(-6).toUpperCase()}`,
                    ticket_tier: 'STANDARD',
                    seats: 'GENERAL PASS',
                    total_amount: 1499,
                    status: 'confirmed',
                    createdAt: r.createdAt,
                    event: {
                        id: ev?.id,
                        title: ev?.title || 'Event Pass',
                        category: 'Live Event',
                        venue: 'Bengaluru Tech Arena',
                        date_time: ev?.timestamp
                    }
                };
            });

        res.status(200).json({ registrations: userRegistrations });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------------------------------------------------------------------
// 5. GET /api/events/:id/registrations : Attendee List (Owning Organizer Only)
// ------------------------------------------------------------------------------
app.get('/api/events/:id/registrations', authenticateUser, async (req, res) => {
    try {
        const eventId = req.params.id;
        const requestingUserId = req.user.id;

        if (isSupabaseConfigured && supabaseAdmin) {
            // Fetch event to inspect organiser_id (spelled with 's')
            const { data: event, error: eventErr } = await supabaseAdmin
                .from('events')
                .select('id, title, organiser_id, capacity')
                .eq('id', eventId)
                .single();

            if (eventErr || !event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // RESTRICTION CHECK: Restricted so it is accessible by owning organizer only!
            if (event.organiser_id !== requestingUserId) {
                return res.status(403).json({
                    error: 'Forbidden: Only the owning organizer can access the attendee list for this event.',
                    code: 'FORBIDDEN_NOT_ORGANIZER',
                    eventId,
                    organiserId: event.organiser_id,
                    requesterId: requestingUserId
                });
            }

            // Fetch attendees joined with user profile from public.users
            const { data: attendees, error: attendeesErr } = await supabaseAdmin
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
                return res.status(500).json({ error: attendeesErr.message });
            }

            const formattedAttendees = (attendees || []).map(a => ({
                registrationId: a.id,
                bookingId: `EP-${a.id.slice(0, 6).toUpperCase()}`,
                createdAt: a.createdAt,
                ticketTier: 'STANDARD',
                seats: 'GENERAL PASS',
                totalAmount: 1499,
                user: {
                    id: a.user?.id,
                    email: a.user?.email || 'attendee@eventpulse.io',
                    role: a.user?.role || 'attendee'
                }
            }));

            return res.status(200).json({
                eventId: event.id,
                eventTitle: event.title,
                totalRegistrations: formattedAttendees.length,
                attendees: formattedAttendees
            });
        }

        // Mock store fallback
        const event = mockStore.events.find(e => e.id === eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.organiser_id !== requestingUserId) {
            return res.status(403).json({
                error: 'Forbidden: Only the owning organizer can access the attendee list for this event.',
                code: 'FORBIDDEN_NOT_ORGANIZER',
                eventId,
                organiserId: event.organiser_id,
                requesterId: requestingUserId
            });
        }

        const attendees = mockStore.registrations
            .filter(r => r.event_id === eventId)
            .map(r => {
                const u = mockStore.users.find(user => user.id === r.user_id);
                return {
                    registrationId: r.id,
                    bookingId: `EP-${r.id.slice(-6).toUpperCase()}`,
                    createdAt: r.createdAt,
                    ticketTier: 'STANDARD',
                    seats: 'GENERAL PASS',
                    totalAmount: 1499,
                    user: u || { email: 'attendee@eventpulse.io', role: 'attendee' }
                };
            });

        res.status(200).json({
            eventId: event.id,
            eventTitle: event.title,
            totalRegistrations: attendees.length,
            attendees
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ------------------------------------------------------------------------------
// CONVENIENCE AUTH ROUTES (POST /api/auth/login and POST /api/auth/signup)
// ------------------------------------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role = 'attendee' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (isSupabaseConfigured && supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: { data: { role } }
        });
        if (error) return res.status(400).json({ error: error.message });

        // Ensure user row in public.users
        if (data.user) {
            await supabaseAdmin.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                role: role
            });
        }

        return res.status(201).json({ message: 'User created', user: data.user, token: data.session?.access_token });
    }

    const mockUser = { id: `usr-${Date.now()}`, email, role };
    mockStore.users.push(mockUser);
    res.status(201).json({ message: 'User created (mock)', user: mockUser, token: `mock-token-${mockUser.id}-${role}` });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (isSupabaseConfigured && supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });

        // Fetch role from users table
        const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

        const userObj = {
            id: data.user.id,
            email: data.user.email,
            role: userRow?.role || 'attendee'
        };

        return res.status(200).json({ token: data.session.access_token, user: userObj });
    }

    let user = mockStore.users.find(u => u.email === email);
    if (!user) {
        user = {
            id: `usr-${Date.now()}`,
            email,
            role: email.includes('organizer') ? 'organizer' : 'attendee'
        };
        mockStore.users.push(user);
    }
    res.status(200).json({ token: `mock-token-${user.id}-${user.role}`, user });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 EventPulse API Server is running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
});
