-- ============================================================================
-- EventPulse: Supabase PostgreSQL Database Schema & Security Architecture
-- Includes Tables, Constraints, Triggers, RLS Policies & Concurrency RPC
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Bridges Supabase auth.users with public profile and role definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically mirror new Supabase Auth signups into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.raw_user_meta_data->>'role', 'attendee')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        phone = COALESCE(EXCLUDED.phone, public.users.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. EVENTS TABLE
-- Holds event details, venue, capacity, and live inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    duration TEXT,
    venue TEXT NOT NULL,
    hall TEXT,
    price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_inr >= 0),
    total_capacity INT NOT NULL DEFAULT 100 CHECK (total_capacity > 0),
    seats_left INT NOT NULL DEFAULT 100 CHECK (seats_left >= 0),
    organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    age_limit TEXT DEFAULT 'All Ages',
    language TEXT DEFAULT 'English',
    banner_gradient TEXT DEFAULT 'from-indigo-600 via-blue-600 to-cyan-500',
    icon TEXT DEFAULT 'fa-ticket',
    badge TEXT DEFAULT 'EVENT',
    perks JSONB DEFAULT '[]'::jsonb,
    speakers JSONB DEFAULT '[]'::jsonb,
    schedule JSONB DEFAULT '[]'::jsonb,
    tier_perks JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid catalog filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date_time);

-- ----------------------------------------------------------------------------
-- 3. REGISTRATIONS TABLE
-- Tracks ticket bookings, seats, transaction metadata, and unique constraint
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT NOT NULL UNIQUE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ticket_tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK (ticket_tier IN ('STANDARD', 'VIP', 'BACKSTAGE')),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    seats TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Prevent duplicate registration by the same user for the same event (Conflict 409)
    CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id)
);

-- Indices for user and organizer registration lookups
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_booking_id ON public.registrations(booking_id);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict zero-trust security configuration
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ==================== USERS RLS ====================
-- A user can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Organizers can view profiles of users registered for their events
CREATE POLICY "Organizers can view registered attendees profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.registrations r
            JOIN public.events e ON r.event_id = e.id
            WHERE r.user_id = public.users.id
            AND e.organizer_id = auth.uid()
        )
    );

-- A user can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ==================== EVENTS RLS ====================
-- Anyone (guests, attendees, organizers) can browse events
CREATE POLICY "Events are viewable by everyone"
    ON public.events FOR SELECT
    TO anon, authenticated
    USING (true);

-- Organizers can create events
CREATE POLICY "Organizers can create events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = organizer_id);

-- Only the owning organizer can update their own events
CREATE POLICY "Organizers can update own events"
    ON public.events FOR UPDATE
    TO authenticated
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);

-- Only the owning organizer can delete their own events
CREATE POLICY "Organizers can delete own events"
    ON public.events FOR DELETE
    TO authenticated
    USING (auth.uid() = organizer_id);

-- ==================== REGISTRATIONS RLS ====================
-- 1. Attendee can view their own registrations (for ticket wallet)
CREATE POLICY "Attendees can view their own registrations"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Attendee can insert their own registration
CREATE POLICY "Attendees can create their own registration"
    ON public.registrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. ATTENDEE LIST RESTRICTION: Owning organizer ONLY can view attendee registrations
-- Evaluates to true IF AND ONLY IF the authenticated user is the event's organizer
CREATE POLICY "Owning organizer only can view event attendee registrations"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.registrations.event_id
            AND public.events.organizer_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- 5. ATOMIC REGISTRATION RPC (HANDLES CONFLICT 409 & RACE CONDITIONS)
-- Uses SELECT ... FOR UPDATE to lock inventory and prevent over-booking
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id UUID,
    p_user_id UUID,
    p_tier TEXT,
    p_quantity INT,
    p_seats TEXT,
    p_total_amount NUMERIC,
    p_booking_id TEXT,
    p_tx_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seats_left INT;
    v_registration_id UUID;
    v_result JSONB;
BEGIN
    -- Conflict Check 1: User already registered for this event
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE event_id = p_event_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'CONFLICT_ALREADY_REGISTERED';
    END IF;

    -- Concurrency Lock: Lock event row for atomic seat check and decrement
    SELECT seats_left INTO v_seats_left
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    -- Conflict Check 2: Event capacity full / insufficient seats
    IF v_seats_left < p_quantity THEN
        RAISE EXCEPTION 'CONFLICT_EVENT_FULL';
    END IF;

    -- Decrement available seats atomically
    UPDATE public.events
    SET seats_left = seats_left - p_quantity,
        updated_at = now()
    WHERE id = p_event_id;

    -- Insert confirmed registration
    INSERT INTO public.registrations (
        booking_id,
        event_id,
        user_id,
        ticket_tier,
        quantity,
        seats,
        total_amount,
        tx_hash,
        status
    ) VALUES (
        p_booking_id,
        p_event_id,
        p_user_id,
        p_tier,
        p_quantity,
        p_seats,
        p_total_amount,
        p_tx_hash,
        'confirmed'
    ) RETURNING id INTO v_registration_id;

    -- Return JSON payload
    SELECT json_build_object(
        'id', r.id,
        'booking_id', r.booking_id,
        'event_id', r.event_id,
        'user_id', r.user_id,
        'ticket_tier', r.ticket_tier,
        'quantity', r.quantity,
        'seats', r.seats,
        'total_amount', r.total_amount,
        'status', r.status,
        'tx_hash', r.tx_hash,
        'created_at', r.created_at
    )::jsonb INTO v_result
    FROM public.registrations r
    WHERE r.id = v_registration_id;

    RETURN v_result;
END;
$$;
