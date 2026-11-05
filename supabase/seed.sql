-- ============================================================================
-- EventPulse: Seed Data for Events, Demo Organizer, and Demo Attendee
-- Run this in Supabase SQL Editor after running schema.sql
-- ============================================================================

DO $$
DECLARE
    v_organizer_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_attendee_id  UUID := '00000000-0000-0000-0000-000000000002'::uuid;
BEGIN
    -- 1. Ensure demo users exist in auth.users & public.users for local/staging test
    -- (In production, users are created through Supabase Auth)
    INSERT INTO auth.users (id, email, raw_user_meta_data, role, aud)
    VALUES 
        (v_organizer_id, 'organizer@eventpulse.io', '{"full_name": "EventPulse Admin", "role": "organizer"}'::jsonb, 'authenticated', 'authenticated'),
        (v_attendee_id, 'arjun@eventpulse.io', '{"full_name": "Arjun Mehta", "role": "attendee"}'::jsonb, 'authenticated', 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.users (id, email, full_name, phone, role)
    VALUES 
        (v_organizer_id, 'organizer@eventpulse.io', 'EventPulse Admin', '+91 98765 00000', 'organizer'),
        (v_attendee_id, 'arjun@eventpulse.io', 'Arjun Mehta', '+91 98765 43210', 'attendee')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

    -- 2. Clear existing demo events if re-seeding
    DELETE FROM public.events WHERE organizer_id = v_organizer_id;

    -- 3. Insert 16 Curated Events (Matching Wireframe 2x2 Pagination Pages 1 to 4)
    INSERT INTO public.events (
        id, title, tagline, category, date_time, duration, venue, hall,
        price_inr, total_capacity, seats_left, organizer_id, rating, age_limit,
        language, banner_gradient, icon, badge, description, perks, speakers, schedule, tier_perks
    ) VALUES 
    -- Page 1
    (
        '11111111-1111-1111-1111-111111111101'::uuid,
        'Future of AI & Robotics Summit 2026',
        'Autonomous Agents, Physical Robotics & Frontier LLMs in Production',
        'Tech & AI',
        '2026-11-14 10:00:00+05:30',
        '8 Hours • Full Day',
        'BIEC Exhibition Center, Bengaluru',
        'Grand Hall B2 • Gate 4',
        1499, 100, 24, v_organizer_id, 4.9, '16+ Allowed', 'English',
        'from-indigo-600 via-blue-600 to-cyan-500', 'fa-microchip', 'KEYNOTE + EXPO',
        'Experience India''s premier deep-tech gathering featuring live bipedal humanoid demonstrations, production multi-agent architecture workshops, and keynotes from frontier AI researchers and hardware founders.',
        '["High-Speed Wi-Fi 6E", "Buffet Lunch & Coffee", "Digital Certificate", "AI Hardware Expo Access"]'::jsonb,
        '[{"name": "Dr. Vikram Sarabhai Jr.", "role": "Chief AI Scientist", "org": "NeuralCore Labs"}, {"name": "Elena Rostova", "role": "VP of Robotics", "org": "Aether Dynamics"}, {"name": "Karthik Subramanian", "role": "Staff LLM Architect", "org": "OpenScale AI"}]'::jsonb,
        '[{"time": "10:00 AM", "title": "Opening Keynote: Reasoning Models & Embodied AI", "tag": "Main Stage"}, {"time": "12:00 PM", "title": "Live Demo: Bipedal Robotics Obstacle Course", "tag": "Arena Floor"}, {"time": "02:30 PM", "title": "Hands-on Workshop: Multi-Agent LangGraph Systems", "tag": "Breakout Lab"}, {"time": "04:45 PM", "title": "VC & Founder Panel + Networking Mixer", "tag": "VIP Lounge"}]'::jsonb,
        '{"STANDARD": ["Main Stage Keynotes", "Robotics Expo Floor", "Digital Certificate"], "VIP": ["Front-Row Reserved Seating", "Speaker Networking Lunch", "Exclusive Summit Swag Kit"], "BACKSTAGE": ["All-Access Speaker Green Room", "1-on-1 Hardware Lab Tour", "Signed AI Engineering Hardcover"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111102'::uuid,
        'Neon Horizon: Synthwave Open Air Festival',
        'Cyberpunk Laser Spectacle, Analog Synths & Immersive 3D Visuals',
        'Music & Live',
        '2026-11-18 18:30:00+05:30',
        '5.5 Hours • Night',
        'Jayamahal Palace Grounds, Bengaluru',
        'Main Open Arena • Gate 1',
        1999, 150, 16, v_organizer_id, 4.8, '18+ Only', 'Instrumental / English',
        'from-fuchsia-600 via-purple-600 to-indigo-600', 'fa-wave-square', 'LIVE ARENA',
        'Step into a retro-futuristic sonic universe under the stars. Featuring custom 100-watt full-color atmospheric lasers, Dolby Atmos surround arrays, and four international synthwave & melodic techno headliners.',
        '["LED Wristband Sync", "Dolby Live Array", "Craft Food Village", "Neon Merch Stalls"]'::jsonb,
        '[{"name": "KronoSynth (FR)", "role": "Headline Producer", "org": "Outrun Records"}, {"name": "Maya V & The Arpeggios", "role": "Live Analog Modular Act", "org": "Mumbai / Berlin"}, {"name": "DJ Cyberia", "role": "Closing Darksynth Set", "org": "Tokyo Night Collective"}]'::jsonb,
        '[{"time": "06:30 PM", "title": "Gates Open & Sunset Ambient Modular Warmup", "tag": "Sunset Deck"}, {"time": "08:00 PM", "title": "Maya V Live Analog Synthesizer Performance", "tag": "Main Stage"}, {"time": "09:30 PM", "title": "KronoSynth: 90-Min Audio-Visual Laser Odyssey", "tag": "Main Stage"}, {"time": "11:00 PM", "title": "DJ Cyberia Closing Cyberpunk Rave Set", "tag": "Neon Dome"}]'::jsonb,
        '{"STANDARD": ["General Standing Arena", "LED Sync Wristband", "Food Court Access"], "VIP": ["Elevated VIP Viewing Deck", "2 Complimentary Craft Beverages", "Fast-Track Express Entry"], "BACKSTAGE": ["Side-Stage Viewing Platform", "Artist Meet & Greet Photo Op", "Limited Edition Vinyl LP"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111103'::uuid,
        'Valorant Champions India LAN Finals',
        'Top 4 Franchise Rosters Battle Live for the ₹50 Lakh Prize Pool',
        'Gaming & Esports',
        '2026-11-22 13:00:00+05:30',
        '7 Hours • LAN Final',
        'Koramangala Indoor Stadium, Bengaluru',
        'Center Court Arena • Gate 2',
        999, 200, 42, v_organizer_id, 4.9, '13+ Allowed', 'English & Hindi Cast',
        'from-emerald-600 via-teal-600 to-cyan-600', 'fa-gamepad', 'ESPORTS MAJOR',
        'Feel the roar of 4,000 fans inside the stadium as South Asia''s top tactical shooter rosters clash in a Best-of-5 Grand Final.',
        '["In-Game Gun Buddy Code", "360Hz PC Free-Play Zone", "Thundersticks & Merch", "Pro Signing Booth"]'::jsonb,
        '[{"name": "Global Esports vs Velocity", "role": "Grand Finalist Teams", "org": "VCT South Asia"}, {"name": "Ocean & Siege", "role": "Shoutcaster Duo", "org": "Official English Desk"}]'::jsonb,
        '[{"time": "01:00 PM", "title": "Creator 5v5 All-Star Showmatch", "tag": "Center Stage"}, {"time": "03:00 PM", "title": "Grand Finals Best-of-5 Series", "tag": "Main Arena"}]'::jsonb,
        '{"STANDARD": ["Tier-1 Bowl Seating", "Exclusive In-Game Title Code"], "VIP": ["Floor Ringside Padded Seats", "Guaranteed Creator Meet & Greet"], "BACKSTAGE": ["Player Tunnel Walkout Access", "Backstage Warmup Lounge Visit"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111104'::uuid,
        'Figma Design Systems & AI UI Masterclass',
        'Design Tokens, Multi-Brand Variables & Code-Synced Component Libraries',
        'Design & Workshops',
        '2026-11-29 10:30:00+05:30',
        '6 Hours • Intensive',
        'WeWork Galaxy, Residency Road',
        'Design Studio 3F • Main Atrium',
        1299, 60, 12, v_organizer_id, 4.8, 'All Ages', 'English',
        'from-amber-500 via-orange-600 to-rose-600', 'fa-pen-nib', 'HANDS-ON LAB',
        'A tactical, laptop-open workshop for product designers and frontend engineers. Learn token-driven systems and Dev Mode workflows.',
        '["Figma UI Kit & Token Repo", "Artisan Coffee & Lunch", "Printed Workbook", "Verified Skill Badge"]'::jsonb,
        '[{"name": "Rhea Kapoor", "role": "Principal Design Systems Lead", "org": "Razorpay"}, {"name": "Siddharth Rao", "role": "Staff Design Technologist", "org": "Swiggy"}]'::jsonb,
        '[{"time": "10:30 AM", "title": "Architecting Multi-Theme Variables & Modes", "tag": "Session 1"}, {"time": "02:30 PM", "title": "Bridging Figma Dev Mode to React & Tailwind", "tag": "Code Sync"}]'::jsonb,
        '{"STANDARD": ["Full Workshop Access", "Complete Figma Source Files"], "VIP": ["Front Table Power Station", "30-Min 1-on-1 Review"], "BACKSTAGE": ["Private Dinner with Speakers", "Lifetime Access to Token Templates"]}'::jsonb
    ),
    -- Page 2
    (
        '11111111-1111-1111-1111-111111111201'::uuid,
        'Cloud Native, Kubernetes & eBPF Con',
        'Zero-Downtime Microservices, GPU Cluster Scheduling & Cilium Service Mesh',
        'Tech & AI',
        '2026-12-04 09:30:00+05:30',
        '8.5 Hours • Conference',
        'Sheraton Grand Whitefield, Bengaluru',
        'Grand Ballroom • Level 1',
        2499, 120, 31, v_organizer_id, 4.9, '18+ Allowed', 'English',
        'from-sky-600 via-indigo-600 to-violet-700', 'fa-server', 'DEVOPS SUMMIT',
        'Built for SREs, platform engineers, and cloud architects scaling high-throughput clusters with eBPF observability.',
        '["CNCF Swag Pack", "5-Star Hotel Lunch Buffet", "Cloud Credits ($200)"]'::jsonb,
        '[{"name": "Prashanth Varma", "role": "Distinguished Infra Engineer", "org": "Uber Cloud"}]'::jsonb,
        '[{"time": "09:30 AM", "title": "Keynote: Scaling 50,000 Nodes", "tag": "Main Ballroom"}]'::jsonb,
        '{"STANDARD": ["All Keynotes", "5-Star Buffet Lunch"], "VIP": ["Reserved Tables", "Maintainers Clinic"], "BACKSTAGE": ["Private CXO Roundtable", "Open Bar"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111202'::uuid,
        'Midnight Acoustic: Indie Unplugged Tour',
        'Intimate Candlelit Storytelling, Folk-Rock Harmonies & Strings Quartet',
        'Music & Live',
        '2026-12-09 19:30:00+05:30',
        '3.5 Hours • Concert',
        'Chowdiah Memorial Hall, Malleshwaram',
        'Violin Auditorium • Main Tier',
        899, 100, 19, v_organizer_id, 4.9, 'All Ages', 'Hindi & English',
        'from-rose-600 via-pink-600 to-purple-700', 'fa-guitar', 'ACOUSTIC TOUR',
        'An unforgettable candlelit evening inside Bengaluru''s iconic violin-shaped auditorium.',
        '["Candlelit Acoustic Stage", "Hi-Fi Auditorium Acoustics", "Signed Postcard"]'::jsonb,
        '[{"name": "Prateek & The Strings", "role": "Headline Indie Folk Act", "org": "New Delhi"}]'::jsonb,
        '[{"time": "08:00 PM", "title": "Unplugged Acoustic Set", "tag": "Acoustic Stage"}]'::jsonb,
        '{"STANDARD": ["Balcony Acoustic Seating"], "VIP": ["Orchestra Center Stalls"], "BACKSTAGE": ["Front 2 Rows + Soundcheck Access"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111203'::uuid,
        'Anime & Cosplay Con Winter 2026',
        'Indian Cosplay Championship, Japanese Voice Actors & Manga Alley',
        'Gaming & Esports',
        '2026-12-14 10:00:00+05:30',
        '9 Hours • Expo',
        'KTPO Trade Center, Whitefield',
        'Expo Halls 1 & 2 • Main Concourse',
        1199, 300, 55, v_organizer_id, 4.8, 'All Ages', 'English & Japanese',
        'from-violet-600 via-purple-600 to-pink-500', 'fa-bolt', 'FESTIVAL PASS',
        'Celebrate Japanese pop culture with 150+ artist alley booths, authentic ramen pop-ups, and cosplay runways.',
        '["Limited Manga Goodie Bag", "150+ Artist Alley Booths", "Ramen Street"]'::jsonb,
        '[{"name": "Kenjiro Takahashi", "role": "Special Guest Seiyuu", "org": "Tokyo"}]'::jsonb,
        '[{"time": "04:00 PM", "title": "National Cosplay Championship Finals", "tag": "Runway Arena"}]'::jsonb,
        '{"STANDARD": ["Full Day Expo & Stage Access"], "VIP": ["VIP Express Lane + Mystery Otaku Box"], "BACKSTAGE": ["Voice Actor Autograph Token + Green Room"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111204'::uuid,
        'Creative WebGL, Shaders & Three.js Bootcamp',
        'Build Award-Winning 3D Interactive Websites, GLSL Shaders & Physics',
        'Design & Workshops',
        '2026-12-19 13:00:00+05:30',
        '5 Hours • Code Lab',
        'Indiranagar Social Tech Hub, Bengaluru',
        'Creator Conservatory • 2nd Floor',
        1599, 40, 9, v_organizer_id, 4.9, '16+ Allowed', 'English',
        'from-teal-500 via-emerald-600 to-green-700', 'fa-cube', 'INTERACTIVE 3D',
        'Unlock secrets behind Awwwards Site-of-the-Day experiences. Code GLSL shaders from scratch.',
        '["Complete 3D Starter Repo", "Custom Shader Library", "Tapas & Craft Drinks"]'::jsonb,
        '[{"name": "Bruno Simon (Guest Stream)", "role": "Creator of Three.js Journey", "org": "Paris"}]'::jsonb,
        '[{"time": "01:00 PM", "title": "Three.js Scene Graph & PBR Materials", "tag": "Module 1"}]'::jsonb,
        '{"STANDARD": ["Live Coding Bootcamp + 3D Asset Pack"], "VIP": ["Priority Debugging Assistant"], "BACKSTAGE": ["1-on-1 Portfolio Architecture Call"]}'::jsonb
    ),
    -- Page 3
    (
        '11111111-1111-1111-1111-111111111301'::uuid,
        'Web3 Cryptography & Zero-Knowledge Day',
        'zkVMs, Account Abstraction, Rollup Security & Formal Verification',
        'Tech & AI',
        '2026-12-23 10:00:00+05:30',
        '7 Hours • Summit',
        'Taj MG Road Convention Hall, Bengaluru',
        'Trinity Ballroom • Ground Floor',
        1799, 80, 27, v_organizer_id, 4.7, '18+ Allowed', 'English',
        'from-blue-700 via-indigo-700 to-slate-800', 'fa-shield-halved', 'SECURITY + ZK',
        'A rigorous technical symposium focused on applied cryptography, zero-knowledge proofs, and auditing.',
        '["Hardware Wallet Raffle", "Taj Gourmet Lunch", "ZK Math Compendium"]'::jsonb,
        '[{"name": "Dr. Aditi Natarajan", "role": "Lead Cryptographer", "org": "Polygon Zero"}]'::jsonb,
        '[{"time": "10:00 AM", "title": "State of zkVMs: Proving Rust Execution", "tag": "Keynote"}]'::jsonb,
        '{"STANDARD": ["All Cryptography Sessions"], "VIP": ["Smart Contract Security Audit Clinic"], "BACKSTAGE": ["Speaker Dinner at Taj + Hardware Key"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111302'::uuid,
        'Symphony Orchestra: Sci-Fi Film Scores Live',
        '65-Piece Philharmonic Performing Interstellar, Dune, Inception & Blade Runner',
        'Music & Live',
        '2026-12-27 18:30:00+05:30',
        '3 Hours • Gala Concert',
        'Good Shepherd Auditorium, Richmond Town',
        'Grand Concert Hall • Main Gate',
        2199, 150, 14, v_organizer_id, 5.0, 'All Ages', 'Orchestral',
        'from-amber-600 via-red-600 to-rose-800', 'fa-music', '65-PIECE ORCHESTRA',
        'Witness goosebump-inducing cinematic themes performed live by a 65-piece symphony orchestra and 24-voice choir.',
        '["65-Piece Live Orchestra", "Printed Souvenir Program", "Projection Mapping"]'::jsonb,
        '[{"name": "Maestro Julian Thorne", "role": "Principal Conductor", "org": "London / Bengaluru"}]'::jsonb,
        '[{"time": "06:30 PM", "title": "Act I: Blade Runner 2049 & Interstellar", "tag": "Act I"}]'::jsonb,
        '{"STANDARD": ["Rear Stalls Reserved Seat"], "VIP": ["Golden Circle Acoustic Center"], "BACKSTAGE": ["Royal Box Front Row + Backstage Meet"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111303'::uuid,
        'ETHIndia & AI Autonomous Agents Hackathon',
        '36-Hour Non-Stop Building Sprint • ₹25 Lakh Bounty Pool & VC Demo Day',
        'Hackathons',
        '2027-01-03 09:00:00+05:30',
        '36 Hours • Overnight',
        'Nexus Shantiniketan Convention Arena',
        'Hacker Bunker • Level 4',
        699, 200, 38, v_organizer_id, 4.9, '18+ Allowed', 'English',
        'from-cyan-500 via-blue-600 to-indigo-700', 'fa-code', '₹25L PRIZE POOL',
        'Bring your laptop and build the future over 36 caffeinated hours. Compete for ₹25 Lakhs in track bounties.',
        '["All 6 Meals + Red Bull", "Sleeping Pods & Beanbags", "$500 API Credits"]'::jsonb,
        '[{"name": "18+ Track Sponsors", "role": "Bounty Judges", "org": "Anthropic / Base / Solana"}]'::jsonb,
        '[{"time": "Sat 09:00 AM", "title": "Check-in & Bounty Reveal", "tag": "Kickoff"}]'::jsonb,
        '{"STANDARD": ["36-Hour Hacker Pass + Meals"], "VIP": ["Herman Miller Team Desk + Priority Pitch"], "BACKSTAGE": ["Private Pod Room + Accelerator Interview"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111304'::uuid,
        'Standup Comedy Gala: Ctrl+Alt+Laughs Live',
        '4 National Headliner Comedians Roasting Tech Life, Startups & Dating',
        'Comedy & Arts',
        '2027-01-09 20:00:00+05:30',
        '2.5 Hours • Standup Special',
        'MLR Convention Centre, JP Nagar',
        'Main Comedy Theater • Gate 1',
        999, 120, 15, v_organizer_id, 4.8, '18+ Only', 'English & Hinglish',
        'from-orange-500 via-rose-600 to-pink-600', 'fa-masks-theater', '4 HEADLINERS',
        'Leave your production bugs at the door for two and a half hours of non-stop laughter.',
        '["4 Full Headliner Sets", "Crowd-Work Encore", "Post-Show Selfie Zone"]'::jsonb,
        '[{"name": "Kanan & Biswa (Special Set)", "role": "Headline Standup Comics", "org": "Prime Special Alumni"}]'::jsonb,
        '[{"time": "08:00 PM", "title": "Opening Crowd-Work & Tech Roasts", "tag": "Opening Act"}]'::jsonb,
        '{"STANDARD": ["Standard Auditorium Seating"], "VIP": ["Front Center Rows (Safe from Roast!)"], "BACKSTAGE": ["Row 1 Roast Zone + Green Room Photo"]}'::jsonb
    ),
    -- Page 4
    (
        '11111111-1111-1111-1111-111111111401'::uuid,
        'Embedded Rust, IoT & Drone Flight Lab',
        'Program Bare-Metal STM32 Flight Controllers & Autonomous Swarm Drones',
        'Hackathons',
        '2027-01-16 10:00:00+05:30',
        '7 Hours • Hardware Lab',
        'IISc Innovation Park Arena, Bengaluru',
        'Aerospace Flight Cage • Block C',
        1899, 50, 11, v_organizer_id, 4.9, '16+ Allowed', 'English',
        'from-emerald-600 via-cyan-600 to-blue-700', 'fa-helicopter', 'HARDWARE + DRONES',
        'Flash memory-safe Rust firmware onto microcontrollers and test autonomous obstacle-avoidance algorithms in a flight cage.',
        '["STM32 & Sensor Kit on Desk", "Indoor Drone Flight Cage", "GitHub Firmware Repo"]'::jsonb,
        '[{"name": "Capt. Rajeev Menon", "role": "Autonomous UAV Architect", "org": "Garuda Aero"}]'::jsonb,
        '[{"time": "10:00 AM", "title": "No-Std Rust on Cortex-M Microcontrollers", "tag": "Lab 1"}]'::jsonb,
        '{"STANDARD": ["Full Hardware Lab Access"], "VIP": ["Take-Home STM32 Nucleo Dev Board"], "BACKSTAGE": ["Take-Home Mini Quadcopter Kit"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111402'::uuid,
        'Electronic Sunset: Rooftop Boiler Room Session',
        '360-Degree DJ Booth, Golden Hour Deep House & Panoramic Skyline Views',
        'Music & Live',
        '2027-01-23 16:30:00+05:30',
        '6 Hours • Sundowner',
        'Skyye Lounge, UB City 16th Floor',
        'Helipad Rooftop Deck • VIP Lift',
        2299, 100, 8, v_organizer_id, 4.9, '21+ Only', 'House / Afro-Tech',
        'from-amber-500 via-pink-600 to-purple-800', 'fa-compact-disc', '360° ROOFTOP',
        'Dance right behind the decks at an intimate 360-degree Boiler Room style sundowner 16 floors above central Bengaluru.',
        '["360° Intimate DJ Floor", "UB City Skyline View", "4K Live Stream Recording"]'::jsonb,
        '[{"name": "Nikhil Chinapa & Friends", "role": "Sunset Melodic Techno Set", "org": "Submerge"}]'::jsonb,
        '[{"time": "04:30 PM", "title": "Golden Hour Doors Open & Sunset Lounge", "tag": "Sunset"}]'::jsonb,
        '{"STANDARD": ["Rooftop Dancefloor Access + 1 Welcome Beverage"], "VIP": ["Elevated Sky-Pod Lounge + Cover"], "BACKSTAGE": ["Inside 360° DJ Booth + Unlimited Bar"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111403'::uuid,
        'Indie Game Dev Expo & Unreal Engine 5 Jam',
        'Playtest 40+ Upcoming Indian PC/Console Titles & Lumen Lighting Talks',
        'Gaming & Esports',
        '2027-01-30 11:00:00+05:30',
        '7 Hours • Showcase',
        'The Lalit Ashok Convention Center',
        'Kalinga Arcade Hall • Ground Floor',
        799, 150, 34, v_organizer_id, 4.8, 'All Ages', 'English',
        'from-purple-600 via-indigo-600 to-blue-600', 'fa-vr-cardboard', '40+ INDIE BOOTHS',
        'Playtest 40 unreleased indie games before they hit Steam and PlayStation! Meet studio founders and join UE5 masterclasses.',
        '["Steam Key Bundle (3 Games)", "40+ Playtest Arcade Pods", "UE5 Asset Pack"]'::jsonb,
        '[{"name": "Shruti Ghosh", "role": "Studio Director & Co-Founder", "org": "Nodding Heads Games"}]'::jsonb,
        '[{"time": "11:00 AM", "title": "Indie Arcade Floor Opens", "tag": "Expo Floor"}]'::jsonb,
        '{"STANDARD": ["Full Expo Access + 3 Steam Keys"], "VIP": ["1-on-1 Publisher Pitch Slot"], "BACKSTAGE": ["VIP Studio Founder Lunch + Steam Deck Raffle"]}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111404'::uuid,
        'Immersive Van Gogh & Projection Art Gala',
        '360° Floor-to-Ceiling 8K Laser Projections, Spatial Audio & Wine Tasting',
        'Comedy & Arts',
        '2027-02-06 17:00:00+05:30',
        '4 Hours • Exhibition',
        'Jayamahal Heritage Pavilion, Bengaluru',
        'Immersive Dome • East Wing',
        1399, 100, 21, v_organizer_id, 4.9, 'All Ages', 'Visual & Spatial Audio',
        'from-blue-600 via-amber-500 to-yellow-500', 'fa-palette', '360° 8K PROJECTION',
        'Walk inside living masterpieces as 30,000 lumens of 8K laser projection transform 25-foot walls and floors.',
        '["360° 8K Projection Dome", "VR Starry Night Headset", "Artisanal Tasting"]'::jsonb,
        '[{"name": "Studio Lumières (Milan)", "role": "Projection Mapping Directors", "org": "Visual Art Collective"}]'::jsonb,
        '[{"time": "05:00 PM", "title": "Gallery Walk & Sketchbook Archive", "tag": "Gallery 1"}]'::jsonb,
        '{"STANDARD": ["360° Projection Dome Entry + Bookmark"], "VIP": ["VR Lounge Access + Artisanal Pairing"], "BACKSTAGE": ["Private Guided Curator Tour + Giclée Print"]}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. Sample demo registration for attendee
    INSERT INTO public.registrations (
        booking_id, event_id, user_id, ticket_tier, quantity, seats, total_amount, status, tx_hash
    ) VALUES (
        'EP-914023',
        '11111111-1111-1111-1111-111111111101'::uuid,
        v_attendee_id,
        'VIP',
        2,
        'SEC-A • SEATS 14-15',
        3148.00,
        'confirmed',
        '0x94f27be81a3c'
    ) ON CONFLICT (booking_id) DO NOTHING;

END $$;
