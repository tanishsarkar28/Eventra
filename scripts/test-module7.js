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

async function runModule7Tests() {
  console.log('--- STARTING MODULE 7: NOTIFICATIONS & REMINDERS TEST SUITE ---\n');

  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  const eventsFile = path.join(process.cwd(), 'data', 'events.json');
  const regFile = path.join(process.cwd(), 'data', 'registrations.json');
  const waitFile = path.join(process.cwd(), 'data', 'waitlist.json');
  const ticketFile = path.join(process.cwd(), 'data', 'tickets.json');
  const notifFile = path.join(process.cwd(), 'data', 'notifications.json');
  const prefsFile = path.join(process.cwd(), 'data', 'notification_preferences.json');
  const emailFile = path.join(process.cwd(), 'data', 'email_outbox.json');
  const pushFile = path.join(process.cwd(), 'data', 'push_outbox.json');

  // Backup existing data files
  const backup = {
    users: fs.readFileSync(usersFile, 'utf-8'),
    events: fs.readFileSync(eventsFile, 'utf-8'),
    registrations: fs.existsSync(regFile) ? fs.readFileSync(regFile, 'utf-8') : '[]',
    waitlist: fs.existsSync(waitFile) ? fs.readFileSync(waitFile, 'utf-8') : '[]',
    tickets: fs.existsSync(ticketFile) ? fs.readFileSync(ticketFile, 'utf-8') : '[]',
    notifications: fs.existsSync(notifFile) ? fs.readFileSync(notifFile, 'utf-8') : '[]',
    preferences: fs.existsSync(prefsFile) ? fs.readFileSync(prefsFile, 'utf-8') : '[]',
    emailOutbox: fs.existsSync(emailFile) ? fs.readFileSync(emailFile, 'utf-8') : '[]',
    pushOutbox: fs.existsSync(pushFile) ? fs.readFileSync(pushFile, 'utf-8') : '[]',
  };

  // Reset Module 7 & transaction data files
  fs.writeFileSync(regFile, '[]', 'utf-8');
  fs.writeFileSync(waitFile, '[]', 'utf-8');
  fs.writeFileSync(ticketFile, '[]', 'utf-8');
  fs.writeFileSync(notifFile, '[]', 'utf-8');
  fs.writeFileSync(prefsFile, '[]', 'utf-8');
  fs.writeFileSync(emailFile, '[]', 'utf-8');
  fs.writeFileSync(pushFile, '[]', 'utf-8');

  // Seed test users: Admin, Organiser, Student A (Tech/Coding), Student B (Dance/Cultural)
  const defaultPass = bcrypt.hashSync('pass123', 10);
  const testUsers = [
    {
      id: 'm7_admin_1',
      name: 'System Admin',
      email: 'admin_m7@campus.edu',
      password: defaultPass,
      role: 'admin',
      isVerified: true,
    },
    {
      id: 'm7_organiser_1',
      name: 'Code Club Organiser',
      email: 'codeclub_m7@campus.edu',
      password: defaultPass,
      role: 'organiser',
      clubName: 'Code Club',
      isVerified: true,
    },
    {
      id: 'm7_unverified_org',
      name: 'Pending Club Organiser',
      email: 'pending_m7@campus.edu',
      password: defaultPass,
      role: 'organiser',
      clubName: 'Robo Club',
      isVerified: false,
    },
    {
      id: 'm7_student_coder',
      name: 'Aarav Dev',
      email: 'aarav_m7@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'CSE',
      year: '3rd Year',
      interests: ['coding', 'web', 'hackathon'],
      isVerified: true,
    },
    {
      id: 'm7_student_dancer',
      name: 'Bhavna Arts',
      email: 'bhavna_m7@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'ECE',
      year: '2nd Year',
      interests: ['dance', 'music', 'cultural'],
      isVerified: true,
    },
  ];

  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2), 'utf-8');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Auth Logins
    // -------------------------------------------------------------
    const loginUser = async (email, password = 'pass123') => {
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
    };

    const adminCookie = await loginUser('admin_m7@campus.edu');
    const orgCookie = await loginUser('codeclub_m7@campus.edu');
    const coderCookie = await loginUser('aarav_m7@campus.edu');
    const dancerCookie = await loginUser('bhavna_m7@campus.edu');

    // -------------------------------------------------------------
    // Test 1: Notification Preferences - Default Values
    // -------------------------------------------------------------
    console.log('\n--- 1. NOTIFICATION PREFERENCES ---');
    const getPrefsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications/preferences',
      method: 'GET',
      headers: { Cookie: coderCookie, Accept: 'application/json' },
    });

    assert(
      getPrefsRes.statusCode === 200 &&
        getPrefsRes.data.preferences?.inApp === true &&
        getPrefsRes.data.preferences?.email === true &&
        getPrefsRes.data.preferences?.reminders === true,
      'GET /notifications/preferences returns default active preferences'
    );

    // -------------------------------------------------------------
    // Test 2: Notification Preferences - Update
    // -------------------------------------------------------------
    const updatePrefsRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/preferences',
        method: 'PUT',
        headers: { Cookie: coderCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ inApp: true, email: true, push: false, reminders: true })
    );

    assert(
      updatePrefsRes.statusCode === 200 &&
        updatePrefsRes.data.preferences?.push === false,
      'PUT /notifications/preferences updates user settings'
    );

    // -------------------------------------------------------------
    // Test 3: New-Event Alerts Matched to Student Interests
    // -------------------------------------------------------------
    console.log('\n--- 2. NEW-EVENT ALERTS MATCHED TO INTERESTS ---');

    // Admin creates and publishes a Technical Coding event
    const createEvtRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/events',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        title: 'Full Stack Hackathon 2026',
        description: '48 hour campus coding sprint',
        category: 'Technical',
        tags: ['coding', 'web', 'hackathon'],
        date: '2026-11-20',
        startTime: '10:00',
        endTime: '18:00',
        venue: 'Main Auditorium',
        capacity: 1, // small capacity to test waitlist later
        targetAudience: 'All Students',
        registrationDeadline: '2026-11-19',
        status: 'Published',
      })
    );

    const hackathonEvent = createEvtRes.data.event;
    assert(
      createEvtRes.statusCode === 201 && hackathonEvent?.id,
      'Event created as Published status'
    );

    // Check Aarav (coder) received interest-matched notification
    const coderNotifsRes1 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: coderCookie, Accept: 'application/json' },
    });

    const coderHasNewEventNotif = coderNotifsRes1.data.notifications?.some(
      (n) => n.type === 'new_event' && n.metadata?.eventId === hackathonEvent.id
    );

    assert(
      coderHasNewEventNotif,
      'Interested student (Aarav - coding) receives "new_event" alert'
    );

    // Check Bhavna (dancer) did NOT receive technical hackathon alert
    const dancerNotifsRes1 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: dancerCookie, Accept: 'application/json' },
    });

    const dancerHasHackathonNotif = dancerNotifsRes1.data.notifications?.some(
      (n) => n.metadata?.eventId === hackathonEvent.id
    );

    assert(
      !dancerHasHackathonNotif,
      'Uninterested student (Bhavna - dance) does NOT receive coding alert'
    );

    // -------------------------------------------------------------
    // Test 4: Registration Confirmation & Multi-Channel Dispatch
    // -------------------------------------------------------------
    console.log('\n--- 3. REGISTRATION CONFIRMATION & ORGANISER ALERTS ---');

    const regRes1 = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/events/${hackathonEvent.id}/register`,
        method: 'POST',
        headers: { Cookie: coderCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ answers: { rollNo: 'CS-001' } })
    );

    assert(
      regRes1.statusCode === 201 && regRes1.data.status === 'Confirmed',
      'Student registers with Confirmed seat'
    );

    // Check Aarav receives registration_confirmation
    const coderNotifsRes2 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: coderCookie, Accept: 'application/json' },
    });

    const regConfirmNotif = coderNotifsRes2.data.notifications?.find(
      (n) => n.type === 'registration_confirmation'
    );

    assert(
      regConfirmNotif !== undefined &&
        regConfirmNotif.metadata?.ticketCode === regRes1.data.ticket?.ticketCode,
      'Student receives "registration_confirmation" with digital ticket code'
    );

    // Check simulated Email Outbox has the confirmation email
    const emailOutbox = JSON.parse(fs.readFileSync(emailFile, 'utf-8'));
    const confirmEmail = emailOutbox.find(
      (em) => em.to === 'aarav_m7@campus.edu' && em.type === 'registration_confirmation'
    );

    assert(
      confirmEmail !== undefined && confirmEmail.status === 'Delivered',
      'Email Channel: Simulated outbox recorded confirmation email delivery'
    );

    // -------------------------------------------------------------
    // Test 5: Organiser Alert for New Registration
    // -------------------------------------------------------------
    const adminNotifsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    const orgAlertNotif = adminNotifsRes.data.notifications?.find(
      (n) => n.type === 'organiser_registration' && n.metadata?.eventId === hackathonEvent.id
    );

    assert(
      orgAlertNotif !== undefined && orgAlertNotif.metadata?.attendeeName === 'Aarav Dev',
      'Organiser receives "organiser_registration" alert with attendee info'
    );

    // -------------------------------------------------------------
    // Test 6: Waitlist Promotion Alert
    // -------------------------------------------------------------
    console.log('\n--- 4. WAITLIST PROMOTION NOTIFICATION ---');

    // Capacity was 1, so Bhavna now joins the waitlist at position #1
    const regRes2 = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/events/${hackathonEvent.id}/register`,
        method: 'POST',
        headers: { Cookie: dancerCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({})
    );

    assert(
      regRes2.statusCode === 200 && regRes2.data.status === 'Waitlisted',
      'Second student is added to Waitlist (Position #1)'
    );

    // Aarav cancels his seat -> triggers auto-promotion for Bhavna
    const cancelRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/events/${hackathonEvent.id}/register`,
      method: 'DELETE',
      headers: { Cookie: coderCookie },
    });

    assert(
      cancelRes.statusCode === 200 && cancelRes.data.autoPromoted !== null,
      'Confirmed attendee cancels registration, auto-promoting waitlisted candidate'
    );

    // Check Bhavna received waitlist_promotion alert
    const dancerNotifsRes2 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: dancerCookie, Accept: 'application/json' },
    });

    const waitlistPromotionNotif = dancerNotifsRes2.data.notifications?.find(
      (n) => n.type === 'waitlist_promotion'
    );

    assert(
      waitlistPromotionNotif !== undefined &&
        waitlistPromotionNotif.metadata?.ticketCode !== undefined,
      'Waitlisted student receives "waitlist_promotion" notification with new ticket'
    );

    // -------------------------------------------------------------
    // Test 7: Venue Change & Event Update Alert
    // -------------------------------------------------------------
    console.log('\n--- 5. CHANGE & CANCELLATION ALERTS ---');

    // Organiser updates venue from 'Main Auditorium' to 'Seminar Hall 1'
    const updateVenueRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/events/${hackathonEvent.id}`,
        method: 'PUT',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ venue: 'Seminar Hall 1' })
    );

    assert(
      updateVenueRes.statusCode === 200 &&
        updateVenueRes.data.event?.venue === 'Seminar Hall 1',
      'Event venue updated to Seminar Hall 1'
    );

    // Check Bhavna (now confirmed attendee) receives venue_change alert
    const dancerNotifsRes3 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: dancerCookie, Accept: 'application/json' },
    });

    const venueChangeNotif = dancerNotifsRes3.data.notifications?.find(
      (n) => n.type === 'venue_change'
    );

    assert(
      venueChangeNotif !== undefined &&
        venueChangeNotif.metadata?.newVenue === 'Seminar Hall 1',
      'Attendee receives "venue_change" notification with updated venue'
    );

    // -------------------------------------------------------------
    // Test 8: Event Cancellation Alert
    // -------------------------------------------------------------
    const cancelEvtRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/events/${hackathonEvent.id}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });

    assert(cancelEvtRes.statusCode === 200, 'Event cancelled by admin');

    const dancerNotifsRes4 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: dancerCookie, Accept: 'application/json' },
    });

    const cancelNotif = dancerNotifsRes4.data.notifications?.find(
      (n) => n.type === 'event_cancelled'
    );

    assert(
      cancelNotif !== undefined && cancelNotif.metadata?.eventId === hackathonEvent.id,
      'Attendee receives "event_cancelled" notification'
    );

    // -------------------------------------------------------------
    // Test 9: Organiser Verification Alert
    // -------------------------------------------------------------
    console.log('\n--- 6. ORGANISER APPROVAL ALERTS ---');

    const verifyOrgRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/organisers/verify',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ id: 'm7_unverified_org' })
    );

    assert(verifyOrgRes.statusCode === 200, 'Admin verifies club organiser account');

    const pendingOrgCookie = await loginUser('pending_m7@campus.edu');
    const orgNotifsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: pendingOrgCookie, Accept: 'application/json' },
    });

    const orgVerifiedNotif = orgNotifsRes.data.notifications?.find(
      (n) => n.type === 'organiser_verified'
    );

    assert(
      orgVerifiedNotif !== undefined,
      'Organiser receives "organiser_verified" approval alert'
    );

    // -------------------------------------------------------------
    // Test 10: Scheduled Reminders (24h and 1h) & Deduplication
    // -------------------------------------------------------------
    console.log('\n--- 7. SCHEDULED REMINDERS & DEDUPLICATION ---');

    // Create an event scheduled for 2026-11-25 at 10:00 AM
    const createReminderEvtRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/events',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        title: 'Annual Tech Summit 2026',
        description: 'Keynotes and demos',
        category: 'Technical',
        tags: ['tech'],
        date: '2026-11-25',
        startTime: '10:00',
        endTime: '16:00',
        venue: 'Main Auditorium',
        capacity: 50,
        targetAudience: 'All Students',
        registrationDeadline: '2026-11-24',
        status: 'Published',
      })
    );

    const summitEvent = createReminderEvtRes.data.event;

    // Register Aarav for the Tech Summit
    await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/events/${summitEvent.id}/register`,
        method: 'POST',
        headers: { Cookie: coderCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({})
    );

    // Subtest 10A: Trigger 24h reminder (Reference time: 2026-11-24T10:00:00Z -> exactly 24h before)
    const run24hRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/reminders/run',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ referenceDate: '2026-11-24T10:00:00.000Z' })
    );

    assert(
      run24hRes.statusCode === 200 && run24hRes.data.remindersSentCount >= 1,
      '24h Reminder Trigger: Generates 24-hour reminder when within 24h window'
    );

    // Subtest 10B: Deduplication test (Running 24h reminder again produces 0 new reminders)
    const runDuplicateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/reminders/run',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ referenceDate: '2026-11-24T10:30:00.000Z' })
    );

    assert(
      runDuplicateRes.statusCode === 200 && runDuplicateRes.data.remindersSentCount === 0,
      'Deduplication: Running reminder job again does NOT send duplicate 24h reminder'
    );

    // Subtest 10C: Trigger 1h reminder (Reference time: 2026-11-25T09:15:00Z -> 45 minutes before event)
    const run1hRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/reminders/run',
        method: 'POST',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ referenceDate: '2026-11-25T09:15:00.000Z' })
    );

    assert(
      run1hRes.statusCode === 200 && run1hRes.data.remindersSentCount >= 1,
      '1h Reminder Trigger: Generates 1-hour final call reminder within 1h window'
    );

    // -------------------------------------------------------------
    // Test 11: Read Status & Security Checks (PATCH /notifications/:id/read)
    // -------------------------------------------------------------
    console.log('\n--- 8. READ STATUS & SECURITY BOUNDARIES ---');

    const coderNotifsRes3 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: coderCookie, Accept: 'application/json' },
    });

    const unreadItem = coderNotifsRes3.data.notifications?.find((n) => !n.isRead);
    assert(unreadItem !== undefined, 'Found unread notification for Aarav');

    // Mark single notification as read
    const markSingleRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/notifications/${unreadItem.id}/read`,
      method: 'PATCH',
      headers: { Cookie: coderCookie },
    });

    assert(
      markSingleRes.statusCode === 200 && markSingleRes.data.notification?.isRead === true,
      'PATCH /notifications/:id/read marks notification as read'
    );

    // Security check: Bhavna attempts to mark Aarav's notification as read
    const hackAttemptRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/notifications/${unreadItem.id}/read`,
      method: 'PATCH',
      headers: { Cookie: dancerCookie },
    });

    assert(
      hackAttemptRes.statusCode === 403,
      'Security: User B cannot mark User A\'s notification as read (HTTP 403 Forbidden)'
    );

    // Mark all as read
    const markAllRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications/all/read',
      method: 'PATCH',
      headers: { Cookie: coderCookie },
    });

    assert(
      markAllRes.statusCode === 200,
      'PATCH /notifications/all/read marks all notifications as read'
    );

    const coderFinalNotifsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/notifications',
      method: 'GET',
      headers: { Cookie: coderCookie, Accept: 'application/json' },
    });

    assert(
      coderFinalNotifsRes.data.unreadCount === 0,
      'Unread count is now 0 after mark-all-as-read'
    );

    // -------------------------------------------------------------
    // Test 12: Channel Suppression via Preferences
    // -------------------------------------------------------------
    console.log('\n--- 9. CHANNEL PREFERENCES SUPPRESSION ---');

    // Bhavna turns off email channel
    await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/notifications/preferences',
        method: 'PUT',
        headers: { Cookie: dancerCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ inApp: true, email: false, push: false })
    );

    const emailCountBefore = JSON.parse(fs.readFileSync(emailFile, 'utf-8')).filter(
      (e) => e.to === 'bhavna_m7@campus.edu'
    ).length;

    // Trigger an alert for Bhavna
    await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/events/${summitEvent.id}/register`,
        method: 'POST',
        headers: { Cookie: dancerCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({})
    );

    const emailCountAfter = JSON.parse(fs.readFileSync(emailFile, 'utf-8')).filter(
      (e) => e.to === 'bhavna_m7@campus.edu'
    ).length;

    assert(
      emailCountBefore === emailCountAfter,
      'Channel Preference: No email was dispatched when user disabled email notifications'
    );
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    // Restore backed-up data files
    fs.writeFileSync(usersFile, backup.users, 'utf-8');
    fs.writeFileSync(eventsFile, backup.events, 'utf-8');
    fs.writeFileSync(regFile, backup.registrations, 'utf-8');
    fs.writeFileSync(waitFile, backup.waitlist, 'utf-8');
    fs.writeFileSync(ticketFile, backup.tickets, 'utf-8');
    fs.writeFileSync(notifFile, backup.notifications, 'utf-8');
    fs.writeFileSync(prefsFile, backup.preferences, 'utf-8');
    fs.writeFileSync(emailFile, backup.emailOutbox, 'utf-8');
    fs.writeFileSync(pushFile, backup.pushOutbox, 'utf-8');

    console.log('\n========================================');
    console.log(`MODULE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runModule7Tests();
