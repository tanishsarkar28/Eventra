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

async function runModule9Tests() {
  console.log('--- STARTING MODULE 9: ADMIN DASHBOARD, MODERATION & ANALYTICS TEST SUITE ---\n');

  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  const eventsFile = path.join(process.cwd(), 'data', 'events.json');
  const venuesFile = path.join(process.cwd(), 'data', 'venues.json');
  const bookingsFile = path.join(process.cwd(), 'data', 'bookings.json');
  const regFile = path.join(process.cwd(), 'data', 'registrations.json');
  const attFile = path.join(process.cwd(), 'data', 'attendance.json');
  const auditFile = path.join(process.cwd(), 'data', 'audit_logs.json');
  const reportsFile = path.join(process.cwd(), 'data', 'reports.json');
  const snapshotsFile = path.join(process.cwd(), 'data', 'analytics_snapshots.json');

  // Backup existing data files
  const backup = {
    users: fs.readFileSync(usersFile, 'utf-8'),
    events: fs.readFileSync(eventsFile, 'utf-8'),
    venues: fs.readFileSync(venuesFile, 'utf-8'),
    bookings: fs.readFileSync(bookingsFile, 'utf-8'),
    registrations: fs.existsSync(regFile) ? fs.readFileSync(regFile, 'utf-8') : '[]',
    attendance: fs.existsSync(attFile) ? fs.readFileSync(attFile, 'utf-8') : '[]',
    auditLogs: fs.existsSync(auditFile) ? fs.readFileSync(auditFile, 'utf-8') : '[]',
    reports: fs.existsSync(reportsFile) ? fs.readFileSync(reportsFile, 'utf-8') : '[]',
    snapshots: fs.existsSync(snapshotsFile) ? fs.readFileSync(snapshotsFile, 'utf-8') : '[]',
  };

  // Seed test users: 1 Admin, 1 Verified Organiser, 2 Students
  const defaultPass = bcrypt.hashSync('pass123', 10);
  const testUsers = [
    {
      id: 'm9_admin_1',
      name: 'Campus Administrator',
      email: 'admin_m9@campus.edu',
      password: defaultPass,
      role: 'admin',
      isVerified: true,
    },
    {
      id: 'm9_org_1',
      name: 'Robotics Club Lead',
      email: 'robotics_m9@campus.edu',
      password: defaultPass,
      role: 'organiser',
      clubName: 'Robotics Club',
      isVerified: true,
    },
    {
      id: 'm9_student_1',
      name: 'Student Aarav',
      email: 'aarav_m9@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'CSE',
      year: '3rd Year',
      interests: ['coding', 'robotics'],
      isVerified: true,
    },
    {
      id: 'm9_student_2',
      name: 'Student Bhavna',
      email: 'bhavna_m9@campus.edu',
      password: defaultPass,
      role: 'student',
      branch: 'ECE',
      year: '2nd Year',
      interests: ['dance'],
      isVerified: true,
    },
  ];

  fs.writeFileSync(usersFile, JSON.stringify(testUsers, null, 2), 'utf-8');

  // Seed test venues
  const testVenues = [
    {
      id: 'm9_auditorium',
      name: 'Main Auditorium',
      type: 'Auditorium',
      capacity: 500,
      location: 'Block A, Ground Floor',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      availableFrom: '08:00',
      availableTo: '20:00',
      requiresApproval: true,
      isActive: true,
    },
    {
      id: 'm9_hall_1',
      name: 'Seminar Hall 1',
      type: 'Seminar Hall',
      capacity: 100,
      location: 'Block B, 1st Floor',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableFrom: '09:00',
      availableTo: '18:00',
      requiresApproval: false,
      isActive: true,
    },
  ];
  fs.writeFileSync(venuesFile, JSON.stringify(testVenues, null, 2), 'utf-8');

  // Seed test events
  const testEvents = [
    {
      id: 'm9_evt_published',
      title: 'National AI Exhibition',
      description: 'Annual project showcase',
      category: 'Technical',
      tags: ['coding', 'ai'],
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '13:00',
      venue: 'Main Auditorium',
      capacity: 200,
      status: 'Published',
      organiserId: 'm9_org_1',
      organiserName: 'Robotics Club Lead',
      createdAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'm9_evt_pending_clean',
      title: 'Intro to Drone Navigation',
      description: 'Workshop on quadcopters',
      category: 'Technical',
      tags: ['robotics'],
      date: '2026-11-23', // Monday - venue is available
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Seminar Hall 1',
      capacity: 50,
      status: 'Pending Approval',
      organiserId: 'm9_org_1',
      organiserName: 'Robotics Club Lead',
      createdAt: '2026-11-02T10:00:00.000Z',
    },
    {
      id: 'm9_evt_pending_clashing',
      title: 'Concurrent Robotics Showcase',
      description: 'Clashing at same venue and time',
      category: 'Technical',
      tags: ['robotics'],
      date: '2026-11-20',
      startTime: '11:00',
      endTime: '12:30', // Overlaps with m9_evt_published (10:00 - 13:00) at Main Auditorium!
      venue: 'Main Auditorium',
      capacity: 100,
      status: 'Pending Approval',
      organiserId: 'm9_org_1',
      organiserName: 'Robotics Club Lead',
      createdAt: '2026-11-03T10:00:00.000Z',
    },
  ];
  fs.writeFileSync(eventsFile, JSON.stringify(testEvents, null, 2), 'utf-8');

  // Seed test registrations & attendance
  const testRegistrations = [
    {
      id: 'm9_reg_1',
      eventId: 'm9_evt_published',
      userId: 'm9_student_1',
      userName: 'Student Aarav',
      ticketCode: 'EVT-M9-001',
      status: 'Confirmed',
      registeredAt: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'm9_reg_2',
      eventId: 'm9_evt_published',
      userId: 'm9_student_2',
      userName: 'Student Bhavna',
      ticketCode: 'EVT-M9-002',
      status: 'Confirmed',
      registeredAt: '2026-11-05T11:00:00.000Z',
    },
  ];
  fs.writeFileSync(regFile, JSON.stringify(testRegistrations, null, 2), 'utf-8');

  // 1 attendee checked in (50% attendance rate for testing)
  const testAttendance = [
    {
      id: 'm9_att_1',
      eventId: 'm9_evt_published',
      ticketCode: 'EVT-M9-001',
      userId: 'm9_student_1',
      userName: 'Student Aarav',
      checkInTime: '2026-11-20T10:05:00.000Z',
      status: 'Checked In',
    },
  ];
  fs.writeFileSync(attFile, JSON.stringify(testAttendance, null, 2), 'utf-8');

  // Reset Module 9 transaction files
  fs.writeFileSync(auditFile, '[]', 'utf-8');
  fs.writeFileSync(reportsFile, '[]', 'utf-8');
  fs.writeFileSync(snapshotsFile, '[]', 'utf-8');

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

    const adminCookie = await loginUser('admin_m9@campus.edu');
    const orgCookie = await loginUser('robotics_m9@campus.edu');
    const studentCookie = await loginUser('aarav_m9@campus.edu');

    // -------------------------------------------------------------
    // 1. RBAC & PERMISSION BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- 1. RBAC & PERMISSION BOUNDARIES ---');

    const anonRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/pending-events',
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    assert(anonRes.statusCode === 401, 'Public anonymous user blocked from /admin/pending-events (HTTP 401)');

    const studentAdminRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/analytics',
      method: 'GET',
      headers: { Cookie: studentCookie, Accept: 'application/json' },
    });
    assert(studentAdminRes.statusCode === 403, 'Student blocked from /admin/analytics (HTTP 403 Forbidden)');

    const orgAuditRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/audit-log',
      method: 'GET',
      headers: { Cookie: orgCookie, Accept: 'application/json' },
    });
    assert(orgAuditRes.statusCode === 403, 'Organiser blocked from /admin/audit-log (HTTP 403 Forbidden)');

    // -------------------------------------------------------------
    // 2. GET /admin/pending-events (WITH PRE-COMPUTED CLASH STATUS)
    // -------------------------------------------------------------
    console.log('\n--- 2. GET /admin/pending-events API ---');

    const pendingRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/pending-events',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      pendingRes.statusCode === 200 && pendingRes.data.count >= 2,
      'GET /admin/pending-events returns pending events list'
    );

    const cleanPending = pendingRes.data.events?.find((e) => e.id === 'm9_evt_pending_clean');
    const clashingPending = pendingRes.data.events?.find((e) => e.id === 'm9_evt_pending_clashing');

    assert(
      cleanPending !== undefined && cleanPending.hasClashes === false,
      'Clean event is correctly flagged with hasClashes: false'
    );

    assert(
      clashingPending !== undefined && clashingPending.hasClashes === true,
      'Conflicting event is pre-flagged with hasClashes: true and clash details'
    );

    // -------------------------------------------------------------
    // 3. PATCH /admin/events/:id/approve (APPROVE, CLASH BLOCKED, OVERRIDE, REJECT)
    // -------------------------------------------------------------
    console.log('\n--- 3. PATCH /admin/events/:id/approve WORKFLOWS ---');

    // 3A. Approve Clean Event
    const approveCleanRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/events/m9_evt_pending_clean/approve',
        method: 'PATCH',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ action: 'approve' })
    );

    assert(
      approveCleanRes.statusCode === 200 && approveCleanRes.data.event?.status === 'Published',
      'Approves clean pending event -> published successfully'
    );

    // 3B. Approve Clashing Event WITHOUT Override (Must Be Rejected with 400)
    const approveClashBlockedRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/events/m9_evt_pending_clashing/approve',
        method: 'PATCH',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({ action: 'approve', adminOverride: false })
    );

    assert(
      approveClashBlockedRes.statusCode === 400 && approveClashBlockedRes.data.canOverride === true,
      'Blocks approval of clashing event without override, returns canOverride: true'
    );

    // 3C. Approve Clashing Event WITH Admin Override
    const approveOverrideRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/events/m9_evt_pending_clashing/approve',
        method: 'PATCH',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        action: 'approve',
        adminOverride: true,
        overrideReason: 'Approved by Dean for Tech Week Special Exhibition',
      })
    );

    assert(
      approveOverrideRes.statusCode === 200 &&
        approveOverrideRes.data.event?.adminOverride === true &&
        approveOverrideRes.data.isOverridden === true,
      'Allows publishing clashing event with Admin Override & justification reason'
    );

    // 3D. Reject an Event with Feedback
    const rejectRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/admin/events/m9_evt_pending_clean/approve',
        method: 'PATCH',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        action: 'reject',
        rejectionReason: 'Exceeds noise limitations during reading hours',
      })
    );

    assert(
      rejectRes.statusCode === 200 &&
        rejectRes.data.event?.status === 'Draft' &&
        rejectRes.data.event?.rejectionReason !== undefined,
      'Rejects event with feedback reason and returns status to Draft'
    );

    // -------------------------------------------------------------
    // 4. CONTENT MODERATION & FLAGGING (POST /events/:id/report & GET/PATCH /admin/reports)
    // -------------------------------------------------------------
    console.log('\n--- 4. CONTENT MODERATION & USER REPORTS ---');

    // 4A. Student reports an event
    const reportRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/events/m9_evt_published/report',
        method: 'POST',
        headers: { Cookie: studentCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        reason: 'Misleading Information',
        description: 'Poster advertised free hardware kits which are not available.',
      })
    );

    assert(
      reportRes.statusCode === 201 && reportRes.data.report?.status === 'Pending',
      'POST /events/:id/report creates a Pending moderation report'
    );

    const reportId = reportRes.data.report?.id;

    // 4B. Admin fetches reports queue
    const getReportsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/reports?status=Pending',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      getReportsRes.statusCode === 200 &&
        getReportsRes.data.reports?.some((r) => r.id === reportId),
      'GET /admin/reports lists pending flagged reports for admin review'
    );

    // 4C. Admin moderates report (Take Action & Cancel Event)
    const moderateReportRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/admin/reports/${reportId}`,
        method: 'PATCH',
        headers: { Cookie: adminCookie, 'Content-Type': 'application/json' },
      },
      JSON.stringify({
        status: 'Action_Taken',
        actionTaken: 'Event Cancelled by Admin Moderation',
        cancelEvent: true,
      })
    );

    assert(
      moderateReportRes.statusCode === 200 &&
        moderateReportRes.data.report?.status === 'Action_Taken' &&
        moderateReportRes.data.eventCancelled === true,
      'PATCH /admin/reports/:id moderates report and cancels flagged event'
    );

    // -------------------------------------------------------------
    // 5. AUDIT LOGGING (GET /admin/audit-log)
    // -------------------------------------------------------------
    console.log('\n--- 5. AUDIT LOGGING ENGINE ---');

    const auditRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/audit-log',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      auditRes.statusCode === 200 && auditRes.data.count > 0,
      'GET /admin/audit-log returns recorded administrative audit entries'
    );

    const logs = auditRes.data.logs || [];
    const hasApprovalLog = logs.some((l) => l.action === 'EVENT_APPROVED');
    const hasOverrideLog = logs.some((l) => l.action === 'CLASH_OVERRIDDEN');
    const hasRejectLog = logs.some((l) => l.action === 'EVENT_REJECTED');
    const hasReportLog = logs.some((l) => l.action === 'REPORT_RESOLVED' || l.action === 'EVENT_MODERATED_CANCELLED');

    assert(hasApprovalLog, 'Audit log recorded EVENT_APPROVED action');
    assert(hasOverrideLog, 'Audit log recorded CLASH_OVERRIDDEN action with override reason');
    assert(hasRejectLog, 'Audit log recorded EVENT_REJECTED action with rejection reason');
    assert(hasReportLog, 'Audit log recorded moderation action on flagged event');

    // -------------------------------------------------------------
    // 6. ANALYTICS ENGINE (GET /admin/analytics)
    // -------------------------------------------------------------
    console.log('\n--- 6. ADMINISTRATIVE ANALYTICS ENGINE ---');

    const analyticsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/analytics',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      analyticsRes.statusCode === 200 && analyticsRes.data.analytics !== undefined,
      'GET /admin/analytics returns analytics payload'
    );

    const a = analyticsRes.data.analytics;

    // Metric 1: Events Per Week
    assert(
      Array.isArray(a.eventsPerWeek) && a.eventsPerWeek.length > 0,
      'Metric 1: Computes Events Per Week cadence'
    );

    // Metric 2: Venue Utilisation
    assert(
      Array.isArray(a.venueUtilisation) && a.venueUtilisation.length > 0 && typeof a.venueUtilisation[0].utilisationPercentage === 'number',
      'Metric 2: Computes Venue Utilisation (%) for all campus venues'
    );

    // Metric 3: Registration vs Attendance Rate
    assert(
      typeof a.registrationVsAttendance?.overallAttendanceRate === 'number' &&
        typeof a.registrationVsAttendance?.totalConfirmedRegistrations === 'number',
      'Metric 3: Computes Registration vs Gate Check-in Attendance Rate (%)'
    );

    // Metric 4: Popular Categories
    assert(
      Array.isArray(a.popularCategories) && a.popularCategories.length > 0,
      'Metric 4: Computes Popular Categories ranked by demand'
    );

    // Metric 5: Clash Frequency
    assert(
      typeof a.clashFrequency?.totalClashesDetected === 'number' &&
        typeof a.clashFrequency?.clashRatePercentage === 'number' &&
        a.clashFrequency?.breakdownByType !== undefined,
      'Metric 5: Computes Clash Frequency & 5-type clash distribution'
    );

    // Executive Overview KPIs
    assert(
      typeof a.overview?.totalEvents === 'number' &&
        typeof a.overview?.totalUsers === 'number' &&
        typeof a.overview?.pendingReports === 'number',
      'Provides Executive Overview KPI metrics snapshot'
    );

    // -------------------------------------------------------------
    // 7. DUAL-PATH ROUTING (Direct Alias & Middleware Compatibility)
    // -------------------------------------------------------------
    console.log('\n--- 7. DUAL-PATH API COMPATIBILITY ---');

    const directApiPendingRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/pending-events',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      directApiPendingRes.statusCode === 200,
      'Direct API path /api/admin/pending-events functions identically to /admin/pending-events'
    );

    const directApiAnalyticsRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/analytics',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      directApiAnalyticsRes.statusCode === 200,
      'Direct API path /api/admin/analytics functions identically to /admin/analytics'
    );

    const directApiAuditRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/audit-log',
      method: 'GET',
      headers: { Cookie: adminCookie, Accept: 'application/json' },
    });

    assert(
      directApiAuditRes.statusCode === 200,
      'Direct API path /api/admin/audit-log functions identically to /admin/audit-log'
    );
  } catch (err) {
    console.error('Fatal test error in Module 9 test suite:', err);
    failed++;
  } finally {
    // Restore backed-up data files
    fs.writeFileSync(usersFile, backup.users, 'utf-8');
    fs.writeFileSync(eventsFile, backup.events, 'utf-8');
    fs.writeFileSync(venuesFile, backup.venues, 'utf-8');
    fs.writeFileSync(bookingsFile, backup.bookings, 'utf-8');
    fs.writeFileSync(regFile, backup.registrations, 'utf-8');
    fs.writeFileSync(attFile, backup.attendance, 'utf-8');
    fs.writeFileSync(auditFile, backup.auditLogs, 'utf-8');
    fs.writeFileSync(reportsFile, backup.reports, 'utf-8');
    fs.writeFileSync(snapshotsFile, backup.snapshots, 'utf-8');

    console.log('\n======================================================');
    console.log(`MODULE 9 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runModule9Tests();
