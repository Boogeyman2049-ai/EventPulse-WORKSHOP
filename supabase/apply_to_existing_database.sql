-- ============================================================================
-- EventPulse: SQL Script for Your Existing Supabase Database Schema
-- Applies Constraints, Row Level Security (RLS) Policies & Sample Events
-- ============================================================================

-- 1. Ensure duplicate registrations are prevented (Enforces HTTP 409 Conflict)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_event_registration'
    ) THEN
        ALTER TABLE public.registrations 
        ADD CONSTRAINT unique_user_event_registration UNIQUE (event_id, user_id);
    END IF;
END $$;

-- 2. Enable Row Level Security (RLS) on your 3 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if re-running to avoid duplicate policy errors
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organisers can insert own events" ON public.events;
DROP POLICY IF EXISTS "Organisers can update own events" ON public.events;
DROP POLICY IF EXISTS "Attendees can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Attendees can register" ON public.registrations;
DROP POLICY IF EXISTS "Owning organiser only can view event attendee registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Organisers can view registered attendees profile" ON public.users;

-- 4. Apply RLS Policies on 'events'
CREATE POLICY "Events are viewable by everyone"
    ON public.events FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organisers can insert own events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Organisers can update own events"
    ON public.events FOR UPDATE
    TO authenticated
    USING (auth.uid() = organiser_id);

-- 5. Apply RLS Policies on 'registrations'
-- Attendee can view their own passes for ticket wallet
CREATE POLICY "Attendees can view their own registrations"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Attendee can create their own registration
CREATE POLICY "Attendees can register"
    ON public.registrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- OWNING ORGANIZER ONLY RESTRICTION:
-- Restricted so it is accessible by the owning organizer only
CREATE POLICY "Owning organiser only can view event attendee registrations"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE public.events.id = public.registrations.event_id
            AND public.events.organiser_id = auth.uid()
        )
    );

-- 6. Apply RLS Policies on 'users'
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Organisers can view registered attendees profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.registrations r
            JOIN public.events e ON r.event_id = e.id
            WHERE r.user_id = public.users.id
            AND e.organiser_id = auth.uid()
        )
    );

-- ============================================================================
-- 7. INSERT SAMPLE EVENTS MATCHING YOUR EXACT SCHEMA
-- ============================================================================
DO $$
DECLARE
    v_organizer_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_attendee_id  UUID := '00000000-0000-0000-0000-000000000002'::uuid;
BEGIN
    -- Ensure test users exist in auth.users and public.users
    INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
    VALUES 
        (v_organizer_id, 'organizer@eventpulse.io', '{"role": "organizer"}'::jsonb, 'authenticated', 'authenticated'),
        (v_attendee_id, 'arjun@eventpulse.io', '{"role": "attendee"}'::jsonb, 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, email, role)
    VALUES 
        (v_organizer_id, 'organizer@eventpulse.io', 'organizer'),
        (v_attendee_id, 'arjun@eventpulse.io', 'attendee')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

    -- Insert 4 sample events matching your exact columns: (id, organiser_id, title, capacity, timestamp)
    INSERT INTO public.events (id, organiser_id, title, capacity, timestamp)
    VALUES 
        ('11111111-1111-1111-1111-111111111101'::uuid, v_organizer_id, 'Future of AI & Robotics Summit 2026', 50, now() + interval '10 days'),
        ('11111111-1111-1111-1111-111111111102'::uuid, v_organizer_id, 'Neon Horizon: Synthwave Open Air Festival', 100, now() + interval '14 days'),
        ('11111111-1111-1111-1111-111111111103'::uuid, v_organizer_id, 'Valorant Champions India LAN Finals', 80, now() + interval '18 days'),
        ('11111111-1111-1111-1111-111111111104'::uuid, v_organizer_id, 'Figma Design Systems & AI UI Masterclass', 30, now() + interval '25 days')
    ON CONFLICT (id) DO NOTHING;

END $$;
