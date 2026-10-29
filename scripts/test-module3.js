const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function runModule3Tests() {
  console.log('====================================================');
  console.log('--- STARTING MODULE 3: VENUE MANAGEMENT E2E TESTS ---');
  console.log('====================================================\n');

  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  // 1. Setup clean test database
  const dataDir = path.join(process.cwd(), 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const eventsFile = path.join(dataDir, 'events.json');
  const venuesFile = path.join(dataDir, 'venues.json');
  const bookingsFile = path.join(dataDir, 'bookings.json');

  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('admin123', salt);
  const orgPassword = bcrypt.hashSync('org123', salt);

  const testUsers = [
    {
      id: 'admin_test_1',
      name: 'System Administrator',
      email: 'admin@eventra.edu',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      clubName: '',
      branch: 'Administration',
      year: 'N/A',
      interests: [],
    },
    {
      id: 'org_test_1',
      name: 'Campus Organiser',
      email: 'organiser@eventra.edu',
      password: orgPassword,
      role: 'organiser',
      isVerified: true,
      clubName: 'Robotics Club',
      branch: 'Mechanical',
      year: '3rd Year',
      interests: ['robotics'],
    },
  ];

  const initialVenues = [
    {
      id: 'test_auditorium_1',
      name: 'Main Auditorium',
      type: 'Auditorium',
      capacity: 500,
      location: 'Block A, Ground Floor',
      facilities: ['AC', 'Projector', 'Microphone', 'Sound System', 'WiFi'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      availableFrom: '08:00',
      availableTo: '20:00',
      requiresApproval: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test_seminar_1',
      name: 'Seminar Hall A',
      type: 'Seminar Hall',
      capacity: 120,
      location: 'Block B, 1st Floor',
      facilities: ['AC', 'Projector', 'Whiteboard'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableFrom: '09:00',
      availableTo: '18:00',
      requiresApproval: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2), 'utf-8');
  fs.writeFileSync(venuesFile, JSON.stringify(initialVenues, null, 2), 'utf-8');
  fs.writeFileSync(eventsFile, '[]', 'utf-8');
  fs.writeFileSync(bookingsFile, '[]', 'utf-8');

  console.log('✓ Initialized clean test database (users, venues, events, bookings)');

  // 2. Login as Admin
  const adminLogin = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'admin@eventra.edu', password: 'admin123' }));

  if (adminLogin.statusCode !== 200) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  }
  const adminCookie = getCookie(adminLogin.headers);
  console.log('✓ Test 1: Admin authentication succeeded');

  // 3. Login as Organiser
  const orgLogin = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ email: 'organiser@eventra.edu', password: 'org123' }));

  if (orgLogin.statusCode !== 200) {
    throw new Error('Organiser login failed: ' + JSON.stringify(orgLogin.data));
  }
  const orgCookie = getCookie(orgLogin.headers);
  console.log('✓ Test 2: Organiser authentication succeeded');

  // 4. Test GET /venues (Public & Dual Path via rewrite)
  const getVenuesRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/venues',
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (getVenuesRes.statusCode !== 200) {
    throw new Error('GET /venues failed: ' + JSON.stringify(getVenuesRes.data));
  }
  const venuesList = Array.isArray(getVenuesRes.data) ? getVenuesRes.data : getVenuesRes.data.venues;
  if (!venuesList || venuesList.length !== 2) {
    throw new Error(`Expected 2 venues, got: ${venuesList ? venuesList.length : 'none'}`);
  }
  console.log(`✓ Test 3: GET /venues returned ${venuesList.length} venues`);

  // 5. Test POST /venues (Admin permissions & validation)
  // 5a. Unauthorized attempt
  const unauthPost = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/venues',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, JSON.stringify({ name: 'Hacker Venue', type: 'Lab', capacity: 10, location: 'Dark Web' }));

  if (unauthPost.statusCode !== 401) {
    throw new Error(`Expected 401 Unauthorized for anonymous POST /venues, got: ${unauthPost.statusCode}`);
  }
  console.log('✓ Test 4: Anonymous user blocked from POST /venues (401)');

  // 5b. Non-admin organiser attempt
  const orgPost = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/venues',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({ name: 'Org Venue', type: 'Lab', capacity: 10, location: 'Nowhere' }));

  if (orgPost.statusCode !== 403) {
    throw new Error(`Expected 403 Forbidden for organiser POST /venues, got: ${orgPost.statusCode}`);
  }
  console.log('✓ Test 5: Non-admin organiser blocked from POST /venues (403)');

  // 5c. Admin creates new venue successfully
  const newVenuePayload = {
    name: 'Advanced Computing Lab',
    type: 'Lab',
    capacity: 60,
    location: 'Block C, Room 304',
    facilities: ['AC', 'Projector', 'WiFi', 'High-End PCs'],
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    availableFrom: '08:30',
    availableTo: '17:30',
    requiresApproval: true,
  };

  const createVenueRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/venues',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify(newVenuePayload));

  if (createVenueRes.statusCode !== 201 || !createVenueRes.data.venue) {
    throw new Error('Admin failed to create venue: ' + JSON.stringify(createVenueRes.data));
  }
  const createdVenue = createVenueRes.data.venue;
  console.log(`✓ Test 6: POST /venues created venue "${createdVenue.name}" (ID: ${createdVenue.id})`);

  // 5d. Duplicate venue name rejected
  const dupVenueRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/venues',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify(newVenuePayload));

  if (dupVenueRes.statusCode !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate venue name, got: ${dupVenueRes.statusCode}`);
  }
  console.log('✓ Test 7: Duplicate venue name prevented (409 Conflict)');

  // 6. Test GET /venues/:id and PUT /venues/:id
  const getSingleRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (getSingleRes.statusCode !== 200 || !getSingleRes.data.venue) {
    throw new Error('GET /venues/:id failed');
  }
  console.log(`✓ Test 8: GET /venues/:id fetched venue details`);

  // Update venue capacity & facilities
  const updateRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ capacity: 75, location: 'Block C, Room 304 (Expanded)' }));

  if (updateRes.statusCode !== 200 || updateRes.data.venue.capacity !== 75) {
    throw new Error('PUT /venues/:id failed: ' + JSON.stringify(updateRes.data));
  }
  console.log(`✓ Test 9: PUT /venues/:id updated venue capacity to 75`);

  // 7. Test GET /venues/:id/availability?date=
  // 7a. Check date when venue is closed (e.g. Sunday)
  // 2026-11-22 is a Sunday
  const sundayCheck = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/availability?date=2026-11-22`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (sundayCheck.statusCode !== 200 || sundayCheck.data.isAvailable !== false) {
    throw new Error('Expected venue to be closed on Sunday: ' + JSON.stringify(sundayCheck.data));
  }
  console.log(`✓ Test 10: Availability check correctly identified closed day (Sunday)`);

  // 7b. Check date when venue is open (2026-11-20 is Friday)
  const fridayCheck = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/availability?date=2026-11-20`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (fridayCheck.statusCode !== 200 || fridayCheck.data.isAvailable !== true) {
    throw new Error('Expected venue to be open on Friday: ' + JSON.stringify(fridayCheck.data));
  }
  console.log(`✓ Test 11: Availability check confirmed venue is open and available on Friday`);

  // 8. Test POST /venues/:id/blackouts (Block dates)
  // 8a. Admin blocks date due to "Semester Exams"
  const blackoutRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/blackouts`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({
    date: '2026-11-20',
    reason: 'Semester Exams',
    note: 'Final practical lab examinations',
  }));

  if (blackoutRes.statusCode !== 201 || !blackoutRes.data.blackout) {
    throw new Error('Failed to create blackout: ' + JSON.stringify(blackoutRes.data));
  }
  const blackoutId = blackoutRes.data.blackout.id;
  console.log(`✓ Test 12: POST /venues/:id/blackouts blocked venue for "Semester Exams"`);

  // 8b. Check availability on blacked out date -> Must now report isAvailable: false
  const blockedCheck = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/availability?date=2026-11-20`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (blockedCheck.statusCode !== 200 || blockedCheck.data.isAvailable !== false || !blockedCheck.data.blackout) {
    throw new Error('Expected availability to show blackout: ' + JSON.stringify(blockedCheck.data));
  }
  console.log(`✓ Test 13: Availability verified venue is blocked on 2026-11-20 (${blockedCheck.data.blackout.reason})`);

  // 8c. Remove blackout
  const removeBlackoutRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/blackouts?blackoutId=${blackoutId}`,
    method: 'DELETE',
    headers: { 'Cookie': adminCookie },
  });

  if (removeBlackoutRes.statusCode !== 200) {
    throw new Error('Failed to remove blackout: ' + JSON.stringify(removeBlackoutRes.data));
  }
  console.log(`✓ Test 14: DELETE /venues/:id/blackouts unblocked the date`);

  // Verify availability restored
  const unblockedCheck = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/availability?date=2026-11-20`,
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (unblockedCheck.data.isAvailable !== true) {
    throw new Error('Venue should be available after removing blackout');
  }
  console.log(`✓ Test 15: Venue availability restored after unblocking`);

  // 9. Test Venue Booking & Conflict Prevention
  // 9a. Request booking from 10:00 to 12:00
  const bookRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/bookings`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '12:00',
    title: 'AI Lab Practice Session',
  }));

  if (bookRes.statusCode !== 201 || !bookRes.data.booking) {
    throw new Error('Failed to request booking: ' + JSON.stringify(bookRes.data));
  }
  const booking1 = bookRes.data.booking;
  if (booking1.status !== 'Pending') {
    throw new Error(`Expected booking status 'Pending', got '${booking1.status}'`);
  }
  console.log(`✓ Test 16: Booking request created with status "Pending" (ID: ${booking1.id})`);

  // 9b. Admin approves the booking
  const approveRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/bookings`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ bookingId: booking1.id, action: 'approve' }));

  if (approveRes.statusCode !== 200 || approveRes.data.booking.status !== 'Approved') {
    throw new Error('Admin booking approval failed: ' + JSON.stringify(approveRes.data));
  }
  console.log(`✓ Test 17: Admin approved booking request -> status is "Approved"`);

  // 9c. Second booking attempt with overlapping time (11:00 to 13:00) -> MUST FAIL (409)
  const conflictBookRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/bookings`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    date: '2026-11-20',
    startTime: '11:00',
    endTime: '13:00',
    title: 'Conflicting Python Workshop',
  }));

  if (conflictBookRes.statusCode !== 409) {
    throw new Error(`Expected 409 Conflict for overlapping booking, got: ${conflictBookRes.statusCode}`);
  }
  console.log('✓ Test 18: Overlapping venue booking prevented (409 Conflict)');

  // 10. Test Event Management Integration (Module 2 + Module 3)
  // 10a. Create an event in Draft status for the same venue and conflicting time
  const createConflictEvent = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Conflicting Event Alpha',
    description: 'Should fail to publish due to venue conflict',
    category: 'Technical',
    date: '2026-11-20',
    startTime: '10:30',
    endTime: '11:30',
    venue: createdVenue.name,
    capacity: 50,
    registrationDeadline: '2026-11-19',
    status: 'Pending Approval',
  }));

  if (createConflictEvent.statusCode !== 201) {
    throw new Error('Failed to create test event: ' + JSON.stringify(createConflictEvent.data));
  }
  const conflictEventId = createConflictEvent.data.event.id;

  // 10b. Admin attempts to publish this event -> MUST BE REJECTED due to Module 3 venue conflict!
  const publishConflictRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/events/${conflictEventId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (publishConflictRes.statusCode !== 400) {
    throw new Error(`Expected 400 Bad Request when publishing conflicting event, got: ${publishConflictRes.statusCode}`);
  }
  console.log('✓ Test 19: Module 3 blocked event publication due to venue schedule conflict');

  // 10c. Create an event on a blacked-out date
  // Put a blackout on 2026-11-25
  await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/blackouts`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ date: '2026-11-25', reason: 'Annual Maintenance' }));

  const blackoutEvent = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Event During Maintenance',
    description: 'Should fail to publish',
    category: 'Workshop',
    date: '2026-11-25',
    startTime: '13:00',
    endTime: '15:00',
    venue: createdVenue.name,
    capacity: 40,
    registrationDeadline: '2026-11-24',
    status: 'Pending Approval',
  }));

  const publishBlackoutEvent = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/events/${blackoutEvent.data.event.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (publishBlackoutEvent.statusCode !== 400) {
    throw new Error(`Expected 400 Bad Request when publishing event on blacked-out date, got: ${publishBlackoutEvent.statusCode}`);
  }
  console.log('✓ Test 20: Module 3 blocked event publication due to blackout date');

  // 10d. Create and publish a VALID event in an available time slot (14:00 to 16:00 on 2026-11-20)
  const validEvent = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Valid Robotics Exhibition',
    description: 'Official exhibition in free slot',
    category: 'Technical',
    date: '2026-11-20',
    startTime: '14:00',
    endTime: '16:00',
    venue: createdVenue.name,
    capacity: 60,
    registrationDeadline: '2026-11-19',
    status: 'Pending Approval',
  }));

  const publishValidRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/events/${validEvent.data.event.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (publishValidRes.statusCode !== 200 || publishValidRes.data.event.status !== 'Published') {
    throw new Error('Valid event failed to publish: ' + JSON.stringify(publishValidRes.data));
  }
  console.log('✓ Test 21: Valid event approved and published successfully');

  // Verify that publishing the event automatically registered a Confirmed booking in bookings.json
  const checkBookingsRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}/bookings`,
    method: 'GET',
    headers: { 'Cookie': adminCookie },
  });

  const eventBooking = checkBookingsRes.data.bookings.find(b => b.eventId === validEvent.data.event.id);
  if (!eventBooking || eventBooking.status !== 'Confirmed') {
    throw new Error('Published event was not synchronized into venue bookings');
  }
  console.log('✓ Test 22: Event automatically synchronized into venue bookings as "Confirmed"');

  // 10e. Verify that another event cannot be published during this newly published event's time
  const doubleBookEvent = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/api/events',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': orgCookie },
  }, JSON.stringify({
    title: 'Double Booking Attempt',
    description: 'Should fail due to valid robotics exhibition',
    category: 'Seminar',
    date: '2026-11-20',
    startTime: '15:00',
    endTime: '17:00',
    venue: createdVenue.name,
    capacity: 50,
    registrationDeadline: '2026-11-19',
    status: 'Pending Approval',
  }));

  const publishDoubleBook = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/api/events/${doubleBookEvent.data.event.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
  }, JSON.stringify({ status: 'Published' }));

  if (publishDoubleBook.statusCode !== 400) {
    throw new Error('Double booking event should not have published');
  }
  console.log('✓ Test 23: Prevented second event from booking the venue at the same time');

  // 11. Test DELETE /venues/:id (Deactivation)
  const deactivateRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: `/venues/${createdVenue.id}`,
    method: 'DELETE',
    headers: { 'Cookie': adminCookie },
  });

  if (deactivateRes.statusCode !== 200 || deactivateRes.data.venue.isActive !== false) {
    throw new Error('Failed to deactivate venue: ' + JSON.stringify(deactivateRes.data));
  }
  console.log('✓ Test 24: DELETE /venues/:id soft-deactivated venue');

  console.log('\n====================================================');
  console.log('ALL 24 MODULE 3 END-TO-END TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runModule3Tests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
