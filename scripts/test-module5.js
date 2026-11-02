const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
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
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function getCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function runModule5Tests() {
  console.log('--- STARTING MODULE 5: STUDENT EVENT DISCOVERY TEST SUITE ---');

  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  const eventsFile = path.join(process.cwd(), 'data', 'events.json');
  const bookmarksFile = path.join(process.cwd(), 'data', 'bookmarks.json');

  // Reset bookmarks
  fs.writeFileSync(bookmarksFile, '[]', 'utf-8');

  // Prepare test student with interests
  const studentPass = bcrypt.hashSync('student123', 10);
  const testStudent = {
    id: 'test_student_m5',
    name: 'Rahul Sharma',
    email: 'rahul@campus.edu',
    password: studentPass,
    role: 'student',
    branch: 'Computer Science',
    year: '3rd Year',
    interests: ['coding', 'ai', 'hackathon'],
    clubName: '',
    isVerified: true,
  };

  // Prepare test published events
  const testEvents = [
    {
      id: 'event_ai_hackathon',
      title: 'National AI Hackathon 2026',
      description: 'Annual competitive 24h hackathon focused on machine learning and web systems for Computer Science 3rd Year students.',
      category: 'Technical',
      tags: ['coding', 'ai', 'hackathon'],
      date: '2026-11-10',
      startTime: '10:00',
      endTime: '18:00',
      venue: 'Main Auditorium',
      capacity: 150,
      registrationDeadline: '2026-11-08',
      isPaid: false,
      ticketPrice: 0,
      status: 'Published',
      organiserId: 'org_1',
      organiserName: 'Tech Club',
      clubName: 'Tech Club',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event_dance_night',
      title: 'Inter-College Dance Night',
      description: 'Cultural dance performances and musical gala.',
      category: 'Cultural',
      tags: ['dance', 'music'],
      date: '2026-11-25',
      startTime: '18:00',
      endTime: '21:00',
      venue: 'Open Amphitheatre',
      capacity: 300,
      registrationDeadline: '2026-11-24',
      isPaid: true,
      ticketPrice: 150,
      status: 'Published',
      organiserId: 'org_cultural',
      organiserName: 'Cultural Secretary',
      clubName: 'Dance Society',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event_draft_unseen',
      title: 'Unapproved Secret Event',
      description: 'This is in draft and must NOT show up in discovery feed.',
      category: 'Workshop',
      tags: ['secret'],
      date: '2026-11-12',
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Lab 1',
      capacity: 50,
      registrationDeadline: '2026-11-11',
      isPaid: false,
      status: 'Draft',
      organiserId: 'org_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Update files
  let users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  users = users.filter(u => u.id !== testStudent.id);
  users.push(testStudent);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.writeFileSync(eventsFile, JSON.stringify(testEvents, null, 2), 'utf-8');

  console.log('✓ Initialized clean test data for Module 5');

  // 1. Student Login
  let loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'rahul@campus.edu', password: 'student123' }));

  if (loginRes.statusCode !== 200) {
    throw new Error('Student login failed: ' + JSON.stringify(loginRes.data));
  }
  const studentCookie = getCookie(loginRes.headers);
  console.log('✓ Test 1: Student authenticated successfully');

  // 2. GET /api/discover - Only Published events returned (Draft excluded)
  let discoverRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/discover',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });

  if (discoverRes.statusCode !== 200 || !discoverRes.data.events) {
    throw new Error('GET /api/discover failed: ' + JSON.stringify(discoverRes.data));
  }
  const eventsInFeed = discoverRes.data.events;
  if (eventsInFeed.length !== 2) {
    throw new Error(`Expected 2 published events in feed, got ${eventsInFeed.length}`);
  }
  if (eventsInFeed.some(e => e.status !== 'Published')) {
    throw new Error('Non-published event appeared in discovery feed!');
  }
  console.log('✓ Test 2: GET /api/discover returned only Published events (Draft filtered out)');

  // 3. Relevance / "Relevant to me" score calculation
  const aiEvent = eventsInFeed.find(e => e.id === 'event_ai_hackathon');
  const danceEvent = eventsInFeed.find(e => e.id === 'event_dance_night');

  if (aiEvent.relevanceScore <= danceEvent.relevanceScore) {
    throw new Error(`AI event score (${aiEvent.relevanceScore}) should be strictly higher than Dance event score (${danceEvent.relevanceScore}) for a CSE AI student`);
  }
  console.log(`✓ Test 3: Recommendation engine correctly calculated relevance scores:`);
  console.log(`         AI Hackathon Match: ${aiEvent.relevanceScore}% (Matched: coding, ai, hackathon, Computer Science)`);
  console.log(`         Dance Night Match:  ${danceEvent.relevanceScore}%`);

  // 4. GET /api/discover/recommended - returns ranked by score
  let recRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/discover/recommended',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });
  if (recRes.statusCode !== 200 || recRes.data.events[0].id !== 'event_ai_hackathon') {
    throw new Error('GET /api/discover/recommended failed ranking');
  }
  console.log('✓ Test 4: GET /api/discover/recommended returned top-ranked event first');

  // 5. Search by query: GET /api/events/search?q=hackathon
  let searchRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/search?q=hackathon',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });
  if (searchRes.statusCode !== 200 || searchRes.data.count !== 1 || searchRes.data.events[0].id !== 'event_ai_hackathon') {
    throw new Error('GET /api/events/search failed');
  }
  console.log('✓ Test 5: GET /api/events/search?q=hackathon returned matching event');

  // 6. Filter by pricing: free
  let freeFilterRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/discover?pricing=free',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });
  if (freeFilterRes.data.events.length !== 1 || freeFilterRes.data.events[0].isPaid) {
    throw new Error('Pricing filter (free) failed');
  }
  console.log('✓ Test 6: Pricing filter (free) works as expected');

  // 7. Filter by category: Cultural
  let catFilterRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/discover?category=Cultural',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });
  if (catFilterRes.data.events.length !== 1 || catFilterRes.data.events[0].category !== 'Cultural') {
    throw new Error('Category filter failed');
  }
  console.log('✓ Test 7: Category filter (Cultural) works as expected');

  // 8. Bookmark Event: POST /api/events/:id/bookmark (Save)
  let bookmarkRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/event_ai_hackathon/bookmark',
    method: 'POST',
    headers: { 'Cookie': studentCookie },
  });
  if (bookmarkRes.statusCode !== 200 || !bookmarkRes.data.isBookmarked || bookmarkRes.data.bookmarkCount !== 1) {
    throw new Error('POST /api/events/:id/bookmark failed: ' + JSON.stringify(bookmarkRes.data));
  }
  console.log('✓ Test 8: POST /api/events/:id/bookmark saved event (isBookmarked: true, count: 1)');

  // 9. Unsave / Toggle Bookmark: POST /api/events/:id/bookmark again
  let unbookmarkRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/event_ai_hackathon/bookmark',
    method: 'POST',
    headers: { 'Cookie': studentCookie },
  });
  if (unbookmarkRes.statusCode !== 200 || unbookmarkRes.data.isBookmarked !== false || unbookmarkRes.data.bookmarkCount !== 0) {
    throw new Error('Bookmark toggle removal failed: ' + JSON.stringify(unbookmarkRes.data));
  }
  console.log('✓ Test 9: POST /api/events/:id/bookmark toggle unsaved event (isBookmarked: false, count: 0)');

  // 10. Unauthenticated bookmark attempt should return 401
  let unauthBookmark = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/events/event_ai_hackathon/bookmark',
    method: 'POST',
  });
  if (unauthBookmark.statusCode !== 401) {
    throw new Error('Unauthenticated user was allowed to bookmark! Expected 401.');
  }
  console.log('✓ Test 10: Unauthenticated bookmark blocked (401 Unauthorized)');

  // 11. Dual-path alias tests: /events/:id/bookmark and /events/search
  let aliasBookmark = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/events/event_dance_night/bookmark',
    method: 'POST',
    headers: { 'Cookie': studentCookie },
  });
  if (aliasBookmark.statusCode !== 200 || !aliasBookmark.data.isBookmarked) {
    throw new Error('Alias /events/:id/bookmark failed');
  }
  console.log('✓ Test 11: Dual-path alias /events/:id/bookmark works');

  let aliasSearch = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/events/search?q=dance',
    method: 'GET',
    headers: { 'Cookie': studentCookie },
  });
  if (aliasSearch.statusCode !== 200 || aliasSearch.data.count !== 1) {
    throw new Error('Alias /events/search?q=dance failed');
  }
  console.log('✓ Test 12: Dual-path alias /events/search?q=dance works');

  console.log('\n===========================================');
  console.log('ALL MODULE 5 TESTS PASSED! 100% SUCCESS');
  console.log('===========================================\n');
}

runModule5Tests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
