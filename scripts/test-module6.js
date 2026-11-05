const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
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

async function runModule6Tests() {
  console.log('--- STARTING MODULE 6: REGISTRATION & ATTENDANCE TEST SUITE ---\n');

  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  const eventsFile = path.join(process.cwd(), 'data', 'events.json');
  const regFile = path.join(process.cwd(), 'data', 'registrations.json');
  const waitFile = path.join(process.cwd(), 'data', 'waitlist.json');
  const ticketFile = path.join(process.cwd(), 'data', 'tickets.json');
  const attFile = path.join(process.cwd(), 'data', 'attendance.json');

  // Backup existing data files
  const backup = {
    users: fs.readFileSync(usersFile, 'utf-8'),
    events: fs.readFileSync(eventsFile, 'utf-8'),
    registrations: fs.existsSync(regFile) ? fs.readFileSync(regFile, 'utf-8') : '[]',
    waitlist: fs.existsSync(waitFile) ? fs.readFileSync(waitFile, 'utf-8') : '[]',
    tickets: fs.existsSync(ticketFile) ? fs.readFileSync(ticketFile, 'utf-8') : '[]',
    attendance: fs.existsSync(attFile) ? fs.readFileSync(attFile, 'utf-8') : '[]',
  };

  // Reset Module 6 data files to empty
  fs.writeFileSync(regFile, '[]', 'utf-8');
  fs.writeFileSync(waitFile, '[]', 'utf-8');
  fs.writeFileSync(ticketFile, '[]', 'utf-8');
  fs.writeFileSync(attFile, '[]', 'utf-8');

  // Seed test users: Organiser, Admin, and 4 Students
  const defaultPass = bcrypt.hashSync('pass123', 10);
  const testUsers = [
    {
      id: 'm6_organiser_1',
      name: 'Dev Club Organiser',
      email: 'organiser_m6@campus.edu',
      password: defaultPass,
      role: 'organiser',
      clubName: 'Dev Club',
      isVerified: true,
    },
    {
      id: 'm6_admin_1',
      name: 'System Admin',
      email: 'admin_m6@campus.edu',
      password: defaultPass,
      role: 'admin',
      isVerified: true,
    },
    {
      id: 'm6_student_1',
      name: 'Aarav Kumar',
      email: 'aarav@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'Computer Science',
      year: '2nd Year',
      isVerified: true,
    },
    {
      id: 'm6_student_2',
      name: 'Bhavna Sharma',
      email: 'bhavna@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'Electrical',
      year: '3rd Year',
      isVerified: true,
    },
    {
      id: 'm6_student_3',
      name: 'Chetan Verma',
      email: 'chetan@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'Mechanical',
      year: '1st Year',
      isVerified: true,
    },
    {
      id: 'm6_student_4',
      name: 'Divya Iyer',
      email: 'divya@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'IT',
      year: '4th Year',
      isVerified: true,
    },
  ];

  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2), 'utf-8');

  // Seed test events:
  // Event 1: Limited capacity = 1 (to test waitlist and auto-promotion)
  // Event 2: Overlapping schedule on same date (to test Module 8 clash)
  // Event 3: High capacity event
  const testEvents = [
    {
      id: 'm6_event_limited',
      title: 'AI Robotics Workshop (Cap 1)',
      description: 'Exclusive 1-seat workshop on robotics.',
      category: 'Technical',
      tags: ['robotics', 'ai'],
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'Main Auditorium',
      capacity: 1,
      registrationDeadline: '2026-11-19',
      isPaid: false,
      ticketPrice: 0,
      cancellationWindowHours: 2,
      status: 'Published',
      organiserId: 'm6_organiser_1',
      organiserName: 'Dev Club Organiser',
      clubName: 'Dev Club',
    },
    {
      id: 'm6_event_clashing',
      title: 'Web Dev Bootcamp',
      description: 'Bootcamp happening on the same morning.',
      category: 'Workshop',
      tags: ['web', 'coding'],
      date: '2026-11-20',
      startTime: '11:00',
      endTime: '13:00', // Overlaps with 10:00 - 12:00!
      venue: 'CS Lab 1',
      capacity: 50,
      registrationDeadline: '2026-11-19',
      isPaid: false,
      ticketPrice: 0,
      cancellationWindowHours: 2,
      status: 'Published',
      organiserId: 'm6_organiser_1',
      organiserName: 'Dev Club Organiser',
      clubName: 'Dev Club',
    },
    {
      id: 'm6_event_team',
      title: 'Campus Hackathon 2026',
      description: 'Team coding hackathon.',
      category: 'Technical',
      tags: ['hackathon'],
      date: '2026-11-25',
      startTime: '09:00',
      endTime: '18:00',
      venue: 'Main Auditorium',
      capacity: 50,
      registrationDeadline: '2026-11-24',
      isPaid: true,
      ticketPrice: 100,
      cancellationWindowHours: 2,
      status: 'Published',
      organiserId: 'm6_organiser_1',
      organiserName: 'Dev Club Organiser',
      clubName: 'Dev Club',
    },
  ];

  fs.writeFileSync(eventsFile, JSON.stringify(testEvents, null, 2), 'utf-8');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [TEST ${total}] PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${total}] FAIL: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Helper to log in a user and obtain cookie
    // -------------------------------------------------------------
    async function login(email, password = 'pass123') {
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        JSON.stringify({ email, password })
      );
      return getCookie(res.headers);
    }

    const orgCookie = await login('organiser_m6@campus.edu');
    const student1Cookie = await login('aarav@campus.edu');
    const student2Cookie = await login('bhavna@campus.edu');
    const student3Cookie = await login('chetan@campus.edu');
    const student4Cookie = await login('divya@campus.edu');

    // -------------------------------------------------------------
    // Test 1: Unauthenticated registration blocked
    // -------------------------------------------------------------
    const unauthReg = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events/m6_event_limited/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(unauthReg.statusCode === 401, 'Public user cannot register without authentication (HTTP 401)');

    // -------------------------------------------------------------
    // Test 2: Student 1 registers for Event 1 (Capacity 1)
    // -------------------------------------------------------------
    const s1Reg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_limited/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student1Cookie },
      },
      JSON.stringify({ teamSize: 1 })
    );

    assert(
      s1Reg.statusCode === 201 && s1Reg.data.status === 'Confirmed',
      'Student 1 registers successfully for available seat (HTTP 201 Confirmed)'
    );

    assert(
      s1Reg.data.ticket && s1Reg.data.ticket.ticketCode && s1Reg.data.ticket.qrCode?.startsWith('data:image/png;base64,'),
      'QR Ticket is generated with unique code and base64 PNG data URL'
    );

    const s1TicketCode = s1Reg.data.ticket.ticketCode;

    // -------------------------------------------------------------
    // Test 3: Fetch Registration Status & Ticket
    // -------------------------------------------------------------
    const s1Status = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/register',
      method: 'GET',
      headers: { Cookie: student1Cookie },
    });

    assert(
      s1Status.statusCode === 200 && s1Status.data.isRegistered === true && s1Status.data.status === 'Confirmed',
      'GET /events/:id/register returns current student confirmed registration status and ticket'
    );

    // -------------------------------------------------------------
    // Test 4: Duplicate Registration Prevented
    // -------------------------------------------------------------
    const dupReg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_limited/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student1Cookie },
      },
      JSON.stringify({})
    );

    assert(
      dupReg.statusCode === 400 && dupReg.data.error.includes('already registered'),
      'Prevent duplicate registration: Rejects second registration attempt (HTTP 400)'
    );

    // -------------------------------------------------------------
    // Test 5: Capacity Enforcement & Waitlist (Student 2)
    // -------------------------------------------------------------
    const s2Reg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_limited/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student2Cookie },
      },
      JSON.stringify({ teamSize: 1 })
    );

    assert(
      s2Reg.statusCode === 200 && s2Reg.data.status === 'Waitlisted' && s2Reg.data.position === 1,
      'Capacity Enforcement: When capacity (1) is reached, student 2 is queued to Waitlist at position #1'
    );

    // -------------------------------------------------------------
    // Test 6: Waitlist Position Queue Increment (Student 3)
    // -------------------------------------------------------------
    const s3Reg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_limited/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student3Cookie },
      },
      JSON.stringify({ teamSize: 1 })
    );

    assert(
      s3Reg.statusCode === 200 && s3Reg.data.status === 'Waitlisted' && s3Reg.data.position === 2,
      'Waitlist FIFO queue: Student 3 is added at position #2'
    );

    // -------------------------------------------------------------
    // Test 7: Module 8 Integration: Personal Schedule Clash Detection
    // -------------------------------------------------------------
    // Student 1 is registered for Event 1 (2026-11-20 10:00 - 12:00)
    // Event 2 is on 2026-11-20 11:00 - 13:00 (Overlapping!)
    const clashReg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_clashing/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student1Cookie },
      },
      JSON.stringify({})
    );

    assert(
      clashReg.statusCode === 409 && clashReg.data.isClash === true && clashReg.data.error.includes('Module 8 Personal Schedule Clash'),
      'Module 8 Integration: Personal schedule clash detected and rejected (HTTP 409 Conflict)'
    );

    // -------------------------------------------------------------
    // Test 8: Module 8 Clash Override (allowClash = true)
    // -------------------------------------------------------------
    const clashOverrideReg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_clashing/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student1Cookie },
      },
      JSON.stringify({ allowClash: true })
    );

    assert(
      clashOverrideReg.statusCode === 201 && clashOverrideReg.data.status === 'Confirmed',
      'Module 8 Clash Override: Explicit allowClash allows registration if student requests it'
    );

    // -------------------------------------------------------------
    // Test 9: Registration Form Fields (Team Size, Members, Custom Questions)
    // -------------------------------------------------------------
    const teamReg = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/events/m6_event_team/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: student4Cookie },
      },
      JSON.stringify({
        teamSize: 4,
        teamMembers: ['Alice', 'Bob', 'Charlie'],
        answers: { rollNo: '21CS099', notes: 'Brought 4 laptops and extension board' },
      })
    );

    assert(
      teamReg.statusCode === 201 &&
        teamReg.data.registration.teamSize === 4 &&
        teamReg.data.registration.answers?.rollNo === '21CS099',
      'Registration form fields: Persists teamSize, teamMembers, and custom question answers'
    );

    // -------------------------------------------------------------
    // Test 10: Organiser Attendees Endpoint (`GET /events/:id/attendees`)
    // -------------------------------------------------------------
    const orgAttendees = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/attendees',
      method: 'GET',
      headers: { Cookie: orgCookie, Accept: 'application/json' },
    });

    assert(
      orgAttendees.statusCode === 200 &&
        orgAttendees.data.summary.totalRegistered === 1 &&
        orgAttendees.data.summary.totalWaitlist === 2,
      'Organiser attendees endpoint returns summary KPI metrics, confirmed attendees, and waitlist'
    );

    // -------------------------------------------------------------
    // Test 11: Unauthorized Student Blocked from Viewing Organiser Attendees List
    // -------------------------------------------------------------
    const studentBlocked = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/attendees',
      method: 'GET',
      headers: { Cookie: student2Cookie, Accept: 'application/json' },
    });

    assert(studentBlocked.statusCode === 403, 'Unauthorized student cannot view event attendees list (HTTP 403)');

    // -------------------------------------------------------------
    // Test 12: CSV Export of Attendance List (`format=csv`)
    // -------------------------------------------------------------
    const csvExport = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events/m6_event_limited/attendees?format=csv',
      method: 'GET',
      headers: { Cookie: orgCookie },
    });

    assert(
      csvExport.statusCode === 200 &&
        csvExport.headers['content-type']?.includes('text/csv') &&
        typeof csvExport.data === 'string' &&
        csvExport.data.includes('Ticket Code') &&
        csvExport.data.includes('Aarav Kumar'),
      'CSV Attendance Export: Generates downloadable CSV with valid headers and attendee rows'
    );

    // -------------------------------------------------------------
    // Test 13: QR Check-In by Organiser (`POST /attendance/scan`)
    // -------------------------------------------------------------
    const scanRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/attendance/scan',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: orgCookie },
      },
      JSON.stringify({
        ticketCode: s1TicketCode,
        eventId: 'm6_event_limited',
      })
    );

    assert(
      scanRes.statusCode === 200 &&
        scanRes.data.success === true &&
        scanRes.data.attendee.status === 'Checked In',
      'QR Check-In: Organiser successfully scans valid ticket and records attendance (HTTP 200)'
    );

    // -------------------------------------------------------------
    // Test 14: Duplicate Check-In Prevented
    // -------------------------------------------------------------
    const dupScan = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/attendance/scan',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: orgCookie },
      },
      JSON.stringify({
        ticketCode: s1TicketCode,
        eventId: 'm6_event_limited',
      })
    );

    assert(
      dupScan.statusCode === 400 && dupScan.data.alreadyUsed === true,
      'Duplicate Check-In Prevention: Rejects second scan of already used ticket (HTTP 400)'
    );

    // -------------------------------------------------------------
    // Test 15: Invalid Ticket Scan Rejected
    // -------------------------------------------------------------
    const invalidScan = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/attendance/scan',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: orgCookie },
      },
      JSON.stringify({
        ticketCode: 'INVALID-CODE-9999',
        eventId: 'm6_event_limited',
      })
    );

    assert(invalidScan.statusCode === 404, 'Invalid ticket code rejected with HTTP 404');

    // -------------------------------------------------------------
    // Test 16: Waitlist Auto-Promotion upon Cancellation
    // -------------------------------------------------------------
    // When Student 1 unregisters, Student 2 (waiting at pos #1) should be automatically promoted!
    const cancelRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/register',
      method: 'DELETE',
      headers: { Cookie: student1Cookie },
    });

    assert(
      cancelRes.statusCode === 200 &&
        cancelRes.data.success === true &&
        cancelRes.data.autoPromoted?.userName === 'Bhavna Sharma',
      'Waitlist Auto-Promotion: When attendee unregisters, waiting student 2 is automatically promoted to Confirmed'
    );

    // Verify Student 2 now has an active ticket and Confirmed registration
    const s2StatusAfterPromotion = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/register',
      method: 'GET',
      headers: { Cookie: student2Cookie },
    });

    assert(
      s2StatusAfterPromotion.data.status === 'Confirmed' &&
        s2StatusAfterPromotion.data.ticket &&
        s2StatusAfterPromotion.data.ticket.status === 'Active',
      'Auto-Promoted student receives Confirmed status and an active scannable QR ticket'
    );

    // Verify Student 3's waitlist position shifted from #2 to #1
    const s3StatusAfterShift = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/register',
      method: 'GET',
      headers: { Cookie: student3Cookie },
    });

    assert(
      s3StatusAfterShift.data.position === 1,
      'Waitlist re-indexing: Remaining waitlisted student moves forward to position #1'
    );

    // -------------------------------------------------------------
    // Test 17: Waitlist Cancellation (Student 3 leaves waitlist)
    // -------------------------------------------------------------
    const s3LeaveWaitlist = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/events/m6_event_limited/register',
      method: 'DELETE',
      headers: { Cookie: student3Cookie },
    });

    assert(
      s3LeaveWaitlist.statusCode === 200 && s3LeaveWaitlist.data.success === true,
      'Student on waitlist can leave/cancel waitlist entry'
    );

    // -------------------------------------------------------------
    // Test 18: Dual-Path API Routing (/api/events/... and /events/...)
    // -------------------------------------------------------------
    const dualApi = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events/m6_event_team/register',
      method: 'GET',
      headers: { Cookie: student4Cookie },
    });

    assert(
      dualApi.statusCode === 200 && dualApi.data.isRegistered === true,
      'Dual-path API compatibility: /api/events/:id/register works seamlessly alongside /events/:id/register'
    );
  } finally {
    // Restore backed up data files
    fs.writeFileSync(usersFile, backup.users, 'utf-8');
    fs.writeFileSync(eventsFile, backup.events, 'utf-8');
    fs.writeFileSync(regFile, backup.registrations, 'utf-8');
    fs.writeFileSync(waitFile, backup.waitlist, 'utf-8');
    fs.writeFileSync(ticketFile, backup.tickets, 'utf-8');
    fs.writeFileSync(attFile, backup.attendance, 'utf-8');
  }

  console.log(`\n=================================================`);
  console.log(`MODULE 6 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log(`=================================================`);

  if (passed === total) {
    console.log('🎉 ALL MODULE 6 TESTS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runModule6Tests().catch((err) => {
  console.error('Fatal error during Module 6 test execution:', err);
  process.exit(1);
});
