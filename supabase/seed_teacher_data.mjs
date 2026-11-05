import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqpzenlyqsrcjjeamnyh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2LrfbiLq7ZTFAOkVKdlxCQ_GGDGBuul';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const users = [
  { id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', email: 'maya.demo@example.invalid', role: 'organiser' },
  { id: '84291c94-c887-559e-b231-4d868cdb8929', email: 'arjun.demo@example.invalid', role: 'organiser' },
  { id: '069ec420-b3f8-5206-9eee-179f9183253a', email: 'leah.demo@example.invalid', role: 'organiser' },
  { id: '2e1bfce2-9204-5659-b776-032f59f1b0f6', email: 'noah.demo@example.invalid', role: 'attendee' },
  { id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', email: 'isha.demo@example.invalid', role: 'attendee' },
  { id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', email: 'omar.demo@example.invalid', role: 'attendee' },
  { id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', email: 'ava.demo@example.invalid', role: 'attendee' },
  { id: '60bfffd0-236f-5c4e-999d-3777e639b226', email: 'liam.demo@example.invalid', role: 'attendee' },
  { id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', email: 'zara.demo@example.invalid', role: 'attendee' },
  { id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', email: 'ethan.demo@example.invalid', role: 'attendee' },
  { id: 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', email: 'priya.demo@example.invalid', role: 'attendee' },
  { id: 'f8134f80-95d4-53fb-a796-e217dc9847c0', email: 'lucas.demo@example.invalid', role: 'attendee' }
];

const events = [
  { id: '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4', organiser_id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', title: 'Synthesis AI Summit', capacity: 40 },
  { id: '71257d3a-f02a-53c2-a46f-928080b042c1', organiser_id: '84291c94-c887-559e-b231-4d868cdb8929', title: 'Resonance: Electronic Night', capacity: 60 },
  { id: '72906fc9-b1b2-518b-85e6-be38bc865df6', organiser_id: '069ec420-b3f8-5206-9eee-179f9183253a', title: 'Latent Space Design Lab', capacity: 24 },
  { id: '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3', organiser_id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', title: 'Autonomous Agents Workshop', capacity: 18 },
  { id: '06141e68-0909-5069-b828-f0d4d2e83000', organiser_id: '84291c94-c887-559e-b231-4d868cdb8929', title: 'Ethereal Frequencies', capacity: 50 },
  { id: '4a8ebb62-cc09-5b67-ab7d-70293ba84067', organiser_id: '069ec420-b3f8-5206-9eee-179f9183253a', title: 'NOIR: Creative Collective', capacity: 30 },
  { id: 'acc78e86-b43e-5b02-8238-a70f779b8197', organiser_id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', title: 'Quantum Horizons', capacity: 35 },
  { id: '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f', organiser_id: '84291c94-c887-559e-b231-4d868cdb8929', title: 'Python After Hours', capacity: 25 },
  { id: '93de5161-6e19-5c41-ae76-a7d760cb4bd4', organiser_id: '069ec420-b3f8-5206-9eee-179f9183253a', title: 'Open Source Community Meetup', capacity: 45 },
  { id: 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059', organiser_id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', title: 'Interface Futures', capacity: 20 },
  { id: '6336936b-baf9-582d-a740-3f2882394e50', organiser_id: '84291c94-c887-559e-b231-4d868cdb8929', title: 'Data Stories Studio', capacity: 16 },
  { id: '12d82cad-9902-50ad-a0c9-3ba1aeded804', organiser_id: '069ec420-b3f8-5206-9eee-179f9183253a', title: 'Flask from First Principles', capacity: 12 },
  { id: 'efa66dba-8deb-5080-96ba-bdf0d46e4365', organiser_id: 'f6aa333d-a1c8-5954-b268-86b4257003a5', title: 'Build Your First API', capacity: 2 },
  { id: '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475', organiser_id: '84291c94-c887-559e-b231-4d868cdb8929', title: 'Weekend Makers Circle', capacity: 30 },
  { id: '8415678e-2eeb-5fd4-82f5-ffec15121856', organiser_id: '069ec420-b3f8-5206-9eee-179f9183253a', title: 'Creative Coding Retrospective', capacity: 20 }
];

const samples = [
  { id: '1300f5f7-c52f-5869-ad93-f42c5a7908ba', user_id: '2e1bfce2-9204-5659-b776-032f59f1b0f6', event_id: '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4' },
  { id: 'f18a0642-69c9-548b-9b5a-ae76a5ff017e', user_id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', event_id: '9ed8f060-6ed2-51e0-90e8-d1797e4bb6b4' },
  { id: '7e4c2915-a304-5150-ad59-23fc337c9db9', user_id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', event_id: '71257d3a-f02a-53c2-a46f-928080b042c1' },
  { id: '0d0adf80-8528-52ab-95c0-3803bf0cd316', user_id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', event_id: '71257d3a-f02a-53c2-a46f-928080b042c1' },
  { id: 'db687f43-ed38-5f06-b894-4f2373bbe397', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: '71257d3a-f02a-53c2-a46f-928080b042c1' },
  { id: 'f0e7f97e-f352-5ee8-be4e-85245ff18145', user_id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', event_id: '72906fc9-b1b2-518b-85e6-be38bc865df6' },
  { id: '502a5c1b-c450-5969-b4ee-78f72464e42e', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: '72906fc9-b1b2-518b-85e6-be38bc865df6' },
  { id: 'edd74d8d-b6e7-58e8-a01b-55ee44da7df7', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: '72906fc9-b1b2-518b-85e6-be38bc865df6' },
  { id: '5035ab62-a1d0-51e8-a662-e6267b3a7487', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '72906fc9-b1b2-518b-85e6-be38bc865df6' },
  { id: '7bd0479a-e047-551a-bfc2-1c3fd5f25f65', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3' },
  { id: '0f87b83b-6309-545d-9f4d-4555a6a5d3d7', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: '13ddd652-b9ca-5c7f-b2ca-2d0e58a157d3' },
  { id: '8dee0700-2534-54d8-827e-2a22d0a1c990', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: '06141e68-0909-5069-b828-f0d4d2e83000' },
  { id: 'f180c627-83d5-5eda-941f-676ef6a6d661', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '06141e68-0909-5069-b828-f0d4d2e83000' },
  { id: '0ef60c85-05ea-5668-8eee-005a5730f416', user_id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', event_id: '06141e68-0909-5069-b828-f0d4d2e83000' },
  { id: 'd2e96145-6f26-5982-8c08-03e866af7803', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '4a8ebb62-cc09-5b67-ab7d-70293ba84067' },
  { id: 'c50855fd-b6c6-524c-aaa0-6328517cea3e', user_id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', event_id: '4a8ebb62-cc09-5b67-ab7d-70293ba84067' },
  { id: '2b3f0121-ce55-53ea-968d-8fdbefe71419', user_id: 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', event_id: '4a8ebb62-cc09-5b67-ab7d-70293ba84067' },
  { id: '055dd331-ad6f-5769-972f-2ab40523d700', user_id: 'f8134f80-95d4-53fb-a796-e217dc9847c0', event_id: '4a8ebb62-cc09-5b67-ab7d-70293ba84067' },
  { id: 'ff36a8c3-ce0b-51ef-b17b-1a169fd1a105', user_id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', event_id: 'acc78e86-b43e-5b02-8238-a70f779b8197' },
  { id: 'f59a5194-2d8c-525e-af0a-8794b8ef8ffb', user_id: 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', event_id: 'acc78e86-b43e-5b02-8238-a70f779b8197' },
  { id: '81bf12a2-665a-5f84-801a-4e3c7e62967a', user_id: 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', event_id: '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f' },
  { id: '7ed8f6b8-0299-5fd1-8de9-5229b11ec1fc', user_id: 'f8134f80-95d4-53fb-a796-e217dc9847c0', event_id: '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f' },
  { id: 'f92ef780-14a7-5c6a-9f93-eb766f4a1bc8', user_id: '2e1bfce2-9204-5659-b776-032f59f1b0f6', event_id: '9fcceb11-b83d-5aef-9bb1-cb0593d0d15f' },
  { id: '31a80dcd-26d5-58f4-af82-29c93ad02d84', user_id: 'f8134f80-95d4-53fb-a796-e217dc9847c0', event_id: '93de5161-6e19-5c41-ae76-a7d760cb4bd4' },
  { id: '111e3279-2ad1-5dbb-900d-481e23ab5b17', user_id: '2e1bfce2-9204-5659-b776-032f59f1b0f6', event_id: '93de5161-6e19-5c41-ae76-a7d760cb4bd4' },
  { id: '783e942f-a304-5a6a-b21f-38786189e2a9', user_id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', event_id: '93de5161-6e19-5c41-ae76-a7d760cb4bd4' },
  { id: '02af2ccd-577b-5edf-9bcf-3a24d1c31c74', user_id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', event_id: '93de5161-6e19-5c41-ae76-a7d760cb4bd4' },
  { id: 'ffa2abfb-572a-5426-be86-15bc953db366', user_id: '2e1bfce2-9204-5659-b776-032f59f1b0f6', event_id: 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059' },
  { id: 'be51353b-2d65-5f09-8539-92f7f0d8b8fc', user_id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', event_id: 'c237cce2-cdc6-52a4-b8ec-5f4ba6357059' },
  { id: '2b125f60-8e45-5cd1-bc2f-6b154f3861f1', user_id: '9f9a16d4-1e9f-5ccc-8ec1-0927ff27d4ab', event_id: '6336936b-baf9-582d-a740-3f2882394e50' },
  { id: '781ba42b-95b3-5025-8d14-77388ef77995', user_id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', event_id: '6336936b-baf9-582d-a740-3f2882394e50' },
  { id: 'ecaf1cb0-3228-5fb5-974d-6a8ece70c0e7', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: '6336936b-baf9-582d-a740-3f2882394e50' },
  { id: '6860582e-4ad9-508a-b543-b3b94dd5dabe', user_id: '257c41c3-f1ad-59ed-869b-0f6d4ab962d7', event_id: '12d82cad-9902-50ad-a0c9-3ba1aeded804' },
  { id: '671a2e74-37c9-5b1b-8049-479a23a76f21', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: '12d82cad-9902-50ad-a0c9-3ba1aeded804' },
  { id: 'a3def429-d095-588b-b9b8-dcfe88f70ebe', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: '12d82cad-9902-50ad-a0c9-3ba1aeded804' },
  { id: '36e18509-26c3-5578-87b5-a9012d9bd573', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '12d82cad-9902-50ad-a0c9-3ba1aeded804' },
  { id: '4065c05a-2605-5806-bdeb-b81bb8138fbb', user_id: '0d14cdaa-bdff-5670-8c81-f5dee3342e8c', event_id: 'efa66dba-8deb-5080-96ba-bdf0d46e4365' },
  { id: 'b4c6c044-6807-5899-89af-e16a6698adb6', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: 'efa66dba-8deb-5080-96ba-bdf0d46e4365' },
  { id: '9618f811-07d2-509b-b04e-5b0969bafbe6', user_id: '60bfffd0-236f-5c4e-999d-3777e639b226', event_id: '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475' },
  { id: '54bd8585-de76-58f5-b5ea-f513c77d4184', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475' },
  { id: '5ee23f7f-b377-5c43-b1f7-1f7d46a7c598', user_id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', event_id: '8ebd30ee-9eb9-50cb-b256-4ddb4ade3475' },
  { id: '8f848296-7353-51dd-a89e-27dc311affa0', user_id: '1293fbeb-3924-5ad1-8bb6-5e2ba344929d', event_id: '8415678e-2eeb-5fd4-82f5-ffec15121856' },
  { id: '03cab63a-0c23-5a21-ae78-bbfd16fdf7de', user_id: 'd8d66d61-9ba6-58ed-bdee-a3143d57e657', event_id: '8415678e-2eeb-5fd4-82f5-ffec15121856' },
  { id: '66b2d80d-f352-5473-b252-a2bde3093e6c', user_id: 'bc749cd9-cd5c-5c99-b787-7c60a1fa4c0a', event_id: '8415678e-2eeb-5fd4-82f5-ffec15121856' },
  { id: '27ab4204-8786-5493-b866-6106747dd249', user_id: 'f8134f80-95d4-53fb-a796-e217dc9847c0', event_id: '8415678e-2eeb-5fd4-82f5-ffec15121856' }
];

async function seed() {
  console.log('1. Upserting Users...');
  for (const u of users) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'id' });
    if (error) console.error('User insert error:', u.email, error.message);
  }

  console.log('2. Upserting Events...');
  for (const ev of events) {
    const { error } = await supabase.from('events').upsert(ev, { onConflict: 'id' });
    if (error) console.error('Event insert error:', ev.title, error.message);
  }

  console.log('3. Checking & inserting registrations respecting capacity and duplicate constraints...');
  const { data: currentRegs } = await supabase.from('registrations').select('id, user_id, event_id');
  const existingSet = new Set((currentRegs || []).map(r => `${r.event_id}_${r.user_id}`));
  const existingIdSet = new Set((currentRegs || []).map(r => r.id));

  let insertedCount = 0;
  for (const s of samples) {
    const key = `${s.event_id}_${s.user_id}`;
    if (existingSet.has(key) || existingIdSet.has(s.id)) {
      continue;
    }

    // Check capacity
    const { count: currentOccupied } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', s.event_id);

    const event = events.find(e => e.id === s.event_id);
    if (event && currentOccupied >= event.capacity) {
      console.log(`Event ${event.title} is full (${currentOccupied}/${event.capacity}), skipping registration`);
      continue;
    }

    const { error } = await supabase.from('registrations').insert({
      id: s.id,
      user_id: s.user_id,
      event_id: s.event_id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    if (!error) {
      existingSet.add(key);
      existingIdSet.add(s.id);
      insertedCount++;
    } else {
      console.error('Registration insert error:', error.message);
    }
  }

  console.log(`Inserted ${insertedCount} new registrations.`);

  // 4. Verification Check
  console.log('\n--- VERIFICATION CHECKS ---');
  const { count: userCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .like('email', '%.demo@example.invalid');
  console.log('sample users:', userCount, 'rows');

  const { count: eventCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .in('id', events.map(e => e.id));
  console.log('sample events:', eventCount, 'rows');

  const demoUserIds = users.map(u => u.id);
  const { count: regCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .in('user_id', demoUserIds);
  console.log('sample registrations:', regCount, 'rows');
}

seed().catch(console.error);
