-- ============================================================================
-- EventPulse: Workshop Coordinator Seed Script
-- Adapted specifically for your Supabase table schema:
--   users:         (id, email, role)
--   events:        (id, organiser_id, title, capacity, timestamp)
--   registrations: (id, user_id, event_id, "createdAt")
-- ============================================================================

begin;

-- 1. Insert Users: changed 'uuid' -> 'id'
insert into public.users(id, email, role) values
 ('f6aa333d-a1c8-5954-b268-86b4257003a5', 'maya.demo@example.invalid', 'organiser'),
 ('84291c94-c887-559e-b231-4d868cdb8929', 'arjun.demo@example.invalid', 'organiser'),
 ('069ec420-b3f8-5206-9eee-179f9183253a', 'leah.demo@example.invalid', 'organiser'),
 ('2e1bfce2-9204-5659-b776-032f59f1b0f6', 'noah.demo@example.invalid', 'attendee'),
 ('9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', 'isha.demo@example.invalid', 'attendee'),
 ('257c41c3-f1ad-59ed-869b-0f6d4ab962d7', 'omar.demo@example.invalid', 'attendee'),
 ('0d14cdaa-bdff-5670-8c81-f5dee3342e8c', 'ava.demo@example.invalid', 'attendee'),
 ('60bfffd0-236f-5c4e-999d-3777e639b226', 'liam.demo@example.invalid', 'attendee'),
 ('1293fbeb-3924-5ad1-8bb6-5e2ba344929d', 'zara.demo@example.invalid', 'attendee'),
 ('d8d66d61-9ba6-58ed-bdee-a3143d57e657', 'ethan.demo@example.invalid', 'attendee'),
 ('bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', 'priya.demo@example.invalid', 'attendee'),
 ('f8134f80-95d4-53fb-a796-e217dc9847c0', 'lucas.demo@example.invalid', 'attendee')
on conflict do nothing;

-- 2. Insert Events: 
--    event_id   -> id
--    student_id -> organiser_id
--    created_at -> timestamp
insert into public.events(id, organiser_id, title, capacity, timestamp) values
 ('9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4', 'f6aa333d-a1c8-5954-b268-86b4257003a5', 'Synthesis AI Summit', 40, ((current_date + 7) + time '18:30') at time zone 'Asia/Kolkata'),
 ('71257d3a-f02a-53c2-a46f-928080b042c1', '84291c94-c887-559e-b231-4d868cdb8929', 'Resonance: Electronic Night', 60, ((current_date + 10) + time '18:30') at time zone 'Asia/Kolkata'),
 ('72906fc9-b1b2-518b-85e6-be38bc865df6', '069ec420-b3f8-5206-9eee-179f9183253a', 'Latent Space Design Lab', 24, ((current_date + 12) + time '18:30') at time zone 'Asia/Kolkata'),
 ('13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3', 'f6aa333d-a1c8-5954-b268-86b4257003a5', 'Autonomous Agents Workshop', 18, ((current_date + 14) + time '18:30') at time zone 'Asia/Kolkata'),
 ('06141e68-0909-5069-b828-f0d4d2e83000', '84291c94-c887-559e-b231-4d868cdb8929', 'Ethereal Frequencies', 50, ((current_date + 17) + time '18:30') at time zone 'Asia/Kolkata'),
 ('4a8ebb62-cc09-5b67-ab7d-70293ba84067', '069ec420-b3f8-5206-9eee-179f9183253a', 'NOIR: Creative Collective', 30, ((current_date + 20) + time '18:30') at time zone 'Asia/Kolkata'),
 ('acc78e86-b43e-5b02-8238-a70f779b8197', 'f6aa333d-a1c8-5954-b268-86b4257003a5', 'Quantum Horizons', 35, ((current_date + 23) + time '18:30') at time zone 'Asia/Kolkata'),
 ('9fcceb11-b83d-5aef-9bb1-cb0593d0d15f', '84291c94-c887-559e-b231-4d868cdb8929', 'Python After Hours', 25, ((current_date + 26) + time '18:30') at time zone 'Asia/Kolkata'),
 ('93de5161-6e19-5c41-ae76-a7d760cb4bd4', '069ec420-b3f8-5206-9eee-179f9183253a', 'Open Source Community Meetup', 45, ((current_date + 30) + time '18:30') at time zone 'Asia/Kolkata'),
 ('c237cce2-cdc6-52a4-b8ec-5f4ba6357059', 'f6aa333d-a1c8-5954-b268-86b4257003a5', 'Interface Futures', 20, ((current_date + 35) + time '18:30') at time zone 'Asia/Kolkata'),
 ('6336936b-baf9-582d-a740-3f2882394e50', '84291c94-c887-559e-b231-4d868cdb8929', 'Data Stories Studio', 16, ((current_date + 40) + time '18:30') at time zone 'Asia/Kolkata'),
 ('12d82cad-9902-50ad-a0c9-3ba1aeded804', '069ec420-b3f8-5206-9eee-179f9183253a', 'Flask from First Principles', 12, ((current_date + 45) + time '18:30') at time zone 'Asia/Kolkata'),
 ('efa66dba-8deb-5080-96ba-bdf0d46e4365', 'f6aa333d-a1c8-5954-b268-86b4257003a5', 'Build Your First API', 2, ((current_date + 50) + time '18:30') at time zone 'Asia/Kolkata'),
 ('8ebd30ee-9eb9-50cb-b256-4ddb4ade3475', '84291c94-c887-559e-b231-4d868cdb8929', 'Weekend Makers Circle', 30, ((current_date + -7) + time '18:30') at time zone 'Asia/Kolkata'),
 ('8415678e-2eeb-5fd4-82f5-ffec15121856', '069ec420-b3f8-5206-9eee-179f9183253a', 'Creative Coding Retrospective', 20, ((current_date + -21) + time '18:30') at time zone 'Asia/Kolkata')
on conflict (id) do nothing;

-- 3. Insert Registrations:
--    student_id -> user_id
--    "created_at" -> "createdAt"
--    e.event_id -> e.id
--    u.uuid -> u.id
with samples(id, user_id, event_id) as (
 values
 ('1300f5f7-c52f-5869-ad93-f42c5a7908ba'::uuid, '2e1bfce2-9204-5659-b776-032f59f1b0f6'::uuid, '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4'::uuid),
 ('f18a0642-69c9-548b-9b5a-ae76a5ff017e'::uuid, '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab'::uuid, '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4'::uuid),
 ('7e4c2915-a304-5150-ad59-23fc337c9db9'::uuid, '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab'::uuid, '71257d3a-f02a-53c2-a46f-928080b042c1'::uuid),
 ('0d0adf80-8528-52ab-95c0-3803bf0cd316'::uuid, '257c41c3-f1ad-59ed-869b-0f6d4ab962d7'::uuid, '71257d3a-f02a-53c2-a46f-928080b042c1'::uuid),
 ('db687f43-ed38-5f06-b894-4f2373bbe397'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, '71257d3a-f02a-53c2-a46f-928080b042c1'::uuid),
 ('f0e7f97e-f352-5ee8-be4e-85245ff18145'::uuid, '257c41c3-f1ad-59ed-869b-0f6d4ab962d7'::uuid, '72906fc9-b1b2-518b-85e6-be38bc865df6'::uuid),
 ('502a5c1b-c450-5969-b4ee-78f72464e42e'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, '72906fc9-b1b2-518b-85e6-be38bc865df6'::uuid),
 ('edd74d8d-b6e7-58e8-a01b-55ee44da7df7'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, '72906fc9-b1b2-518b-85e6-be38bc865df6'::uuid),
 ('5035ab62-a1d0-51e8-a662-e6267b3a7487'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '72906fc9-b1b2-518b-85e6-be38bc865df6'::uuid),
 ('7bd0479a-e047-551a-bfc2-1c3fd5f25f65'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3'::uuid),
 ('0f87b83b-6309-545d-9f4d-4555a6a5d3d7'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3'::uuid),
 ('8dee0700-2534-54d8-827e-2a22d0a1c990'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, '06141e68-0909-5069-b828-f0d4d2e83000'::uuid),
 ('f180c627-83d5-5eda-941f-676ef6a6d661'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '06141e68-0909-5069-b828-f0d4d2e83000'::uuid),
 ('0ef60c85-05ea-5668-8eee-005a5730f416'::uuid, 'd8d66d61-9ba6-58ed-bdee-a3143d57e657'::uuid, '06141e68-0909-5069-b828-f0d4d2e83000'::uuid),
 ('d2e96145-6f26-5982-8c08-03e866af7803'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '4a8ebb62-cc09-5b67-ab7d-70293ba84067'::uuid),
 ('c50855fd-b6c6-524c-aaa0-6328517cea3e'::uuid, 'd8d66d61-9ba6-58ed-bdee-a3143d57e657'::uuid, '4a8ebb62-cc09-5b67-ab7d-70293ba84067'::uuid),
 ('2b3f0121-ce55-53ea-968d-8fdbefe71419'::uuid, 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a'::uuid, '4a8ebb62-cc09-5b67-ab7d-70293ba84067'::uuid),
 ('055dd331-ad6f-5769-972f-2ab40523d700'::uuid, 'f8134f80-95d4-53fb-a796-e217dc9847c0'::uuid, '4a8ebb62-cc09-5b67-ab7d-70293ba84067'::uuid),
 ('ff36a8c3-ce0b-51ef-b17b-1a169fd1a105'::uuid, 'd8d66d61-9ba6-58ed-bdee-a3143d57e657'::uuid, 'acc78e86-b43e-5b02-8238-a70f779b8197'::uuid),
 ('f59a5194-2d8c-525e-af0a-8794b8ef8ffb'::uuid, 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a'::uuid, 'acc78e86-b43e-5b02-8238-a70f779b8197'::uuid),
 ('81bf12a2-665a-5f84-801a-4e3c7e62967a'::uuid, 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a'::uuid, '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f'::uuid),
 ('7ed8f6b8-0299-5fd1-8de9-5229b11ec1fc'::uuid, 'f8134f80-95d4-53fb-a796-e217dc9847c0'::uuid, '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f'::uuid),
 ('f92ef780-14a7-5c6a-9f93-eb766f4a1bc8'::uuid, '2e1bfce2-9204-5659-b776-032f59f1b0f6'::uuid, '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f'::uuid),
 ('31a80dcd-26d5-58f4-af82-29c93ad02d84'::uuid, 'f8134f80-95d4-53fb-a796-e217dc9847c0'::uuid, '93de5161-6e19-5c41-ae76-a7d760cb4bd4'::uuid),
 ('111e3279-2ad1-5dbb-900d-481e23ab5b17'::uuid, '2e1bfce2-9204-5659-b776-032f59f1b0f6'::uuid, '93de5161-6e19-5c41-ae76-a7d760cb4bd4'::uuid),
 ('783e942f-a304-5a6a-b21f-38786189e2a9'::uuid, '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab'::uuid, '93de5161-6e19-5c41-ae76-a7d760cb4bd4'::uuid),
 ('02af2ccd-577b-5edf-9bcf-3a24d1c31c74'::uuid, '257c41c3-f1ad-59ed-869b-0f6d4ab962d7'::uuid, '93de5161-6e19-5c41-ae76-a7d760cb4bd4'::uuid),
 ('ffa2abfb-572a-5426-be86-15bc953db366'::uuid, '2e1bfce2-9204-5659-b776-032f59f1b0f6'::uuid, 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059'::uuid),
 ('be51353b-2d65-5f09-8539-92f7f0d8b8fc'::uuid, '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab'::uuid, 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059'::uuid),
 ('2b125f60-8e45-5cd1-bc2f-6b154f3861f1'::uuid, '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab'::uuid, '6336936b-baf9-582d-a740-3f2882394e50'::uuid),
 ('781ba42b-95b3-5025-8d14-77388ef77995'::uuid, '257c41c3-f1ad-59ed-869b-0f6d4ab962d7'::uuid, '6336936b-baf9-582d-a740-3f2882394e50'::uuid),
 ('ecaf1cb0-3228-5fb5-974d-6a8ece70c0e7'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, '6336936b-baf9-582d-a740-3f2882394e50'::uuid),
 ('6860582e-4ad9-508a-b543-b3b94dd5dabe'::uuid, '257c41c3-f1ad-59ed-869b-0f6d4ab962d7'::uuid, '12d82cad-9902-50ad-a0c9-3ba1aeded804'::uuid),
 ('671a2e74-37c9-5b1b-8049-479a23a76f21'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, '12d82cad-9902-50ad-a0c9-3ba1aeded804'::uuid),
 ('a3def429-d095-588b-b9b8-dcfe88f70ebe'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, '12d82cad-9902-50ad-a0c9-3ba1aeded804'::uuid),
 ('36e18509-26c3-5578-87b5-a9012d9bd573'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '12d82cad-9902-50ad-a0c9-3ba1aeded804'::uuid),
 ('4065c05a-2605-5806-bdeb-b81bb8138fbb'::uuid, '0d14cdaa-bdff-5670-8c81-f5dee3342e8c'::uuid, 'efa66dba-8deb-5080-96ba-bdf0d46e4365'::uuid),
 ('b4c6c044-6807-5899-89af-e16a6698adb6'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, 'efa66dba-8deb-5080-96ba-bdf0d46e4365'::uuid),
 ('9618f811-07d2-509b-b04e-5b0969bafbe6'::uuid, '60bfffd0-236f-5c4e-999d-3777e639b226'::uuid, '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475'::uuid),
 ('54bd8585-de76-58f5-b5ea-f513c77d4184'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475'::uuid),
 ('5ee23f7f-b377-5c43-b1f7-1f7d46a7c598'::uuid, 'd8d66d61-9ba6-58ed-bdee-a3143d57e657'::uuid, '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475'::uuid),
 ('8f848296-7353-51dd-a89e-27dc311affa0'::uuid, '1293fbeb-3924-5ad1-8bb6-5e2ba344929d'::uuid, '8415678e-2eeb-5fd4-82f5-ffec15121856'::uuid),
 ('03cab63a-0c23-5a21-ae78-bbfd16fdf7de'::uuid, 'd8d66d61-9ba6-58ed-bdee-a3143d57e657'::uuid, '8415678e-2eeb-5fd4-82f5-ffec15121856'::uuid),
 ('66b2d80d-f352-5473-b252-a2bde3093e6c'::uuid, 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a'::uuid, '8415678e-2eeb-5fd4-82f5-ffec15121856'::uuid),
 ('27ab4204-8786-5493-b866-6106747dd249'::uuid, 'f8134f80-95d4-53fb-a796-e217dc9847c0'::uuid, '8415678e-2eeb-5fd4-82f5-ffec15121856'::uuid)
), candidates as (
 select s.*, e.capacity,
   (select count(*) from public.registrations r where r.event_id = s.event_id) as occupied,
   row_number() over (partition by s.event_id order by s.id) as position
 from samples s join public.events e on e.id = s.event_id
 where exists (select 1 from public.users u where u.id = s.user_id)
   and not exists (
     select 1 from public.registrations r
     where r.id = s.id or (r.user_id = s.user_id and r.event_id = s.event_id)
   )
)
insert into public.registrations(id, user_id, event_id, "createdAt")
 select id, user_id, event_id, now() - interval '2 days'
 from candidates where position <= capacity - occupied
on conflict do nothing;

-- 4. Verify the rows
select 'sample users' as dataset, count(*) as rows from public.users
 where email like '%.demo@example.invalid'
union all
select 'sample events', count(*) from public.events
 where id in (
 '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4'::uuid,
 '71257d3a-f02a-53c2-a46f-928080b042c1'::uuid,
 '72906fc9-b1b2-518b-85e6-be38bc865df6'::uuid,
 '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3'::uuid,
 '06141e68-0909-5069-b828-f0d4d2e83000'::uuid,
 '4a8ebb62-cc09-5b67-ab7d-70293ba84067'::uuid,
 'acc78e86-b43e-5b02-8238-a70f779b8197'::uuid,
 '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f'::uuid,
 '93de5161-6e19-5c41-ae76-a7d760cb4bd4'::uuid,
 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059'::uuid,
 '6336936b-baf9-582d-a740-3f2882394e50'::uuid,
 '12d82cad-9902-50ad-a0c9-3ba1aeded804'::uuid,
 'efa66dba-8deb-5080-96ba-bdf0d46e4365'::uuid,
 '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475'::uuid,
 '8415678e-2eeb-5fd4-82f5-ffec15121856'::uuid
)
union all
select 'sample registrations', count(*) from public.registrations
 where user_id in (select id from public.users where email like '%.demo@example.invalid');

commit;
