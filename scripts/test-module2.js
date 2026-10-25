const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper to send HTTP requests with cookie handling
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function getCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function runTests() {
  console.log('--- STARTING MODULE 2 & MODULE 1 END-TO-END TESTS ---');
  const baseUrl = 'http://localhost:3000';

  // 1. Reset data files for clean test run
  const dataDir = path.join(process.cwd(), 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const eventsFile = path.join(dataDir, 'events.json');

  // Backup existing data if any
  fs.writeFileSync(eventsFile, '[]', 'utf-8');

  console.log('✓ Initialized clean events.json');

  // 2. Register an Admin user directly in users.json or via registration
  const bcrypt = require('bcryptjs');
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('admin123', salt);
  const orgPassword = bcrypt.hashSync('org123', salt);

  const testUsers = [
    {
      id: 'admin_1',
      name: 'System Admin',
      email: 'admin@eventra.edu',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      clubName: '',
      branch: 'Admin',
      year: 'N/A',
      interests: [],
    },
    {
      id: 'org_1',
      name: 'Tech Lead',
      email: 'tech@eventra.edu',
      password: orgPassword,
      role: 'organiser',
      isVerified: true,
      clubName: 'Coding Club',
      branch: 'CSE',
      year: '3rd Year',
      interests: ['coding'],
    },
    {
      id: 'org_unverified',
      name: 'New Organiser',
      email: 'neworg@eventra.edu',
      password: orgPassword,
      role: 'organiser',
      isVerified: false,
      clubName: 'Music Club',
      branch: 'ECE',
      year: '2nd Year',
      interests: ['music'],
    },
  ];
  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2), 'utf-8');
  console.log('✓ Initialized test users (Admin, Verified Organiser, Unverified Organiser)');

  // 3. Login as Organiser
  let loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'tech@eventra.edu', password: 'org123' }));

  if (loginRes.statusCode !== 200) {
    throw new Error('Organiser login failed: ' + JSON.stringify(loginRes.data));
  }
  const orgCookie = getCookie(loginRes.headers);
  console.log('✓ Test: Organiser login successful');

  // 4. Test Categories & Tags APIs
  let catRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/categories',
    method: 'GET',
  });
  if (catRes.statusCode !== 200 || !catRes.data.categories) {
    throw new Error('Categories fetch failed');
  }
  console.log('✓ Test: GET /api/categories returned: ' + catRes.data.categories.length + ' categories');

  let tagRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tags',
    method: 'GET',
  });
  if (tagRes.statusCode !== 200 || !tagRes.data.tags) {
    throw new Error('Tags fetch failed');
  }
  console.log('✓ Test: GET /api/tags returned: ' + tagRes.data.tags.length + ' tags');

  // 5. Test Unverified Organiser cannot create events
  let unverifiedLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'neworg@eventra.edu', password: 'org123' }));
  const unverifiedCookie = getCookie(unverifiedLogin.headers);

  let unverifiedCreate = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': unverifiedCookie },
  }, JSON.stringify({
    title: 'Illegal Event',
    description: 'Should fail',
    category: 'Technical',
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '12:00',
    venue: 'Room 101',
    capacity: 50,
    registrationDeadline: '2026-11-19',
  }));
  if (unverifiedCreate.statusCode !== 403) {
    throw new Error('Unverified organiser was allowed to create event!');
  }
  console.log('✓ Test: Unverified organiser blocked from creating event (403 Forbidden)');

  // 6. Test Event Creation (POST /api/events and /events)
  let createRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Hackathon 2026',
    description: '24-hour national level coding hackathon',
    category: 'Technical',
    tags: ['coding', 'web', 'hackathon'],
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '18:00',
    venue: 'Auditorium A',
    capacity: 150,
    registrationDeadline: '2026-11-18',
    isPaid: true,
    ticketPrice: 200,
    poster: '/uploads/hackathon.jpg',
    status: 'Draft',
  }));

  if (createRes.statusCode !== 201 || !createRes.data.event) {
    throw new Error('Event creation failed: ' + JSON.stringify(createRes.data));
  }
  const event1 = createRes.data.event;
  console.log('✓ Test: POST /api/events created event successfully: ' + event1.title + ' (Status: ' + event1.status + ')');

  // Test POST /events (alias route)
  let createRes2 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'AI Workshop',
    description: 'Hands-on AI workshop',
    category: 'Workshop',
    tags: ['ai', 'coding'],
    date: '2026-11-20',
    startTime: '14:00',
    endTime: '17:00',
    venue: 'Auditorium A', // same venue & date, overlapping time!
    capacity: 60,
    registrationDeadline: '2026-11-19',
    isPaid: false,
    status: 'Pending Approval',
  }));

  if (createRes2.statusCode !== 201 || !createRes2.data.event) {
    throw new Error('Event creation via /events failed: ' + JSON.stringify(createRes2.data));
  }
  const event2 = createRes2.data.event;
  console.log('✓ Test: POST /events created second event successfully: ' + event2.title + ' (Status: ' + event2.status + ')');

  // 7. Test GET /api/events/mine and GET /events/mine
  let mineRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/mine',
    method: 'GET',
    headers: { 'Cookie': orgCookie },
  });
  if (mineRes.statusCode !== 200 || mineRes.data.events.length !== 2) {
    throw new Error('GET /api/events/mine failed: ' + JSON.stringify(mineRes.data));
  }
  console.log('✓ Test: GET /api/events/mine returned ' + mineRes.data.events.length + ' events for organiser');

  let mineResAlias = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/events/mine',
    method: 'GET',
    headers: { 'Cookie': orgCookie },
  });
  if (mineResAlias.statusCode !== 200 || mineResAlias.data.events.length !== 2) {
    throw new Error('GET /events/mine failed');
  }
  console.log('✓ Test: GET /events/mine alias returned correctly');

  // 8. Test PUT /api/events/:id (Update Event)
  let updateRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event1.id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Hackathon 2026 (Updated)',
    capacity: 200,
  }));
  if (updateRes.statusCode !== 200 || updateRes.data.event.capacity !== 200) {
    throw new Error('PUT /api/events/:id failed: ' + JSON.stringify(updateRes.data));
  }
  console.log('✓ Test: PUT /api/events/:id updated event title and capacity');

  // 9. Test Organiser cannot directly bypass approval and set status to Published
  let bypassRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event1.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (bypassRes.statusCode !== 403) {
    throw new Error('Organiser was able to directly publish event! Expected 403.');
  }
  console.log('✓ Test: Organiser cannot bypass approval to Published (403 Forbidden received)');

  // 10. Organiser submits event1 for approval (Draft -> Pending Approval)
  let submitRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event1.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({ status: 'Pending Approval' }));

  if (submitRes.statusCode !== 200 || submitRes.data.event.status !== 'Pending Approval') {
    throw new Error('Failed to submit event for approval: ' + JSON.stringify(submitRes.data));
  }
  console.log('✓ Test: Organiser transitioned status Draft -> Pending Approval');

  // 11. Login as Admin
  let adminLogin = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'admin@eventra.edu', password: 'admin123' }));
  const adminCookie = getCookie(adminLogin.headers);
  console.log('✓ Test: Admin logged in successfully');

  // 12. Admin approves event1 (Pending Approval -> Published)
  // This triggers Module 4 validation!
  let approveRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event1.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (approveRes.statusCode !== 200 || approveRes.data.event.status !== 'Published') {
    throw new Error('Admin approve event1 failed: ' + JSON.stringify(approveRes.data));
  }
  console.log('✓ Test: Module 4 validated and Admin approved event1 to Published');

  // 13. Test Module 4 Conflict Detection:
  // Now try to approve event2, which is on the SAME date (2026-11-20), SAME venue ('Auditorium A'),
  // and overlapping time (14:00 - 17:00, while event1 is 10:00 - 18:00)!
  let conflictRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event2.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (conflictRes.statusCode !== 400 || !conflictRes.data.message.includes('Module 4 Conflict')) {
    throw new Error('Module 4 conflict validation failed to trigger: ' + JSON.stringify(conflictRes.data));
  }
  console.log('✓ Test: Module 4 venue & time conflict detected successfully:');
  console.log('       "' + conflictRes.data.message + '"');

  // 14. Fix venue for event2 and verify Module 4 passes
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event2.id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({ venue: 'Lab 302' }));

  let approveRes2 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event2.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (approveRes2.statusCode !== 200 || approveRes2.data.event.status !== 'Published') {
    throw new Error('Admin approve event2 after fixing venue failed: ' + JSON.stringify(approveRes2.data));
  }
  console.log('✓ Test: Event2 published after moving to non-conflicting venue');

  // 15. Test DELETE /api/events/:id (Cancel Event)
  let cancelRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/events/${event2.id}`,
    method: 'DELETE',
    headers: { 'Cookie': orgCookie },
  });

  if (cancelRes.statusCode !== 200 || cancelRes.data.event.status !== 'Cancelled') {
    throw new Error('Cancel event failed: ' + JSON.stringify(cancelRes.data));
  }
  console.log('✓ Test: DELETE /api/events/:id cancelled event successfully');

  // 16. Test Module 1 APIs still work:
  // - Verify unverified organiser as Admin
  let verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/organisers/verify',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ id: 'org_unverified' }));

  if (verifyRes.statusCode !== 200) {
    throw new Error('Module 1 Organiser verification failed: ' + JSON.stringify(verifyRes.data));
  }
  console.log('✓ Test: Module 1 Admin organiser verification works');

  // - Check GET /api/users/me
  let meRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/me',
    method: 'GET',
    headers: { 'Cookie': orgCookie },
  });
  if (meRes.statusCode !== 200 || meRes.data.user.email !== 'tech@eventra.edu') {
    throw new Error('Module 1 /api/users/me failed');
  }
  console.log('✓ Test: Module 1 /api/users/me works perfectly');

  console.log('\n===========================================');
  console.log('ALL MODULE 1 AND MODULE 2 TESTS PASSED! 100%');
  console.log('===========================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
