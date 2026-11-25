import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Eventra — 3-Member Presentation Script & Projector Demonstration Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  @page {
    size: A4;
    margin: 14mm 14mm 14mm 14mm;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }

  .header-card {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 10px;
    margin-bottom: 18px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .header-card h1 {
    margin: 0 0 6px 0;
    font-size: 20pt;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .header-card .subtitle {
    font-size: 11pt;
    color: #93c5fd;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background: rgba(255, 255, 255, 0.08);
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 8.5pt;
  }

  .meta-grid div strong {
    color: #e2e8f0;
  }

  .speaker-section {
    margin-bottom: 22px;
  }

  .speaker-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 10pt;
    margin-bottom: 12px;
  }

  .badge-tanish {
    background: #dbeafe;
    color: #1e40af;
    border: 1.5px solid #93c5fd;
  }

  .badge-rishi {
    background: #ede9fe;
    color: #4338ca;
    border: 1.5px solid #c7d2fe;
  }

  .badge-anush {
    background: #d1fae5;
    color: #065f46;
    border: 1.5px solid #a7f3d0;
  }

  .badge-all {
    background: #f1f5f9;
    color: #0f172a;
    border: 1.5px solid #cbd5e1;
  }

  .feature-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .feature-title {
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .projector-cue {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 7px 12px;
    border-radius: 4px;
    font-size: 8.5pt;
    color: #78350f;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .speech-block {
    background: #f8fafc;
    border-left: 4px solid #3b82f6;
    padding: 9px 13px;
    border-radius: 4px;
    font-size: 9.2pt;
    color: #1e293b;
    margin-bottom: 9px;
  }

  .speech-block.purple {
    border-left-color: #6366f1;
  }

  .speech-block.emerald {
    border-left-color: #10b981;
  }

  .speech-block p {
    margin: 0 0 6px 0;
  }

  .speech-block p:last-child {
    margin: 0;
  }

  .tech-callout {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #16a34a;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 8.5pt;
    color: #14532d;
  }

  .tech-callout-title {
    font-weight: 700;
    color: #166534;
    margin-bottom: 4px;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.5px;
  }

  .tech-callout ul {
    margin: 0;
    padding-left: 16px;
  }

  .tech-callout li {
    margin-bottom: 3px;
  }

  .tech-callout li:last-child {
    margin-bottom: 0;
  }

  .page-break {
    page-break-before: always;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-top: 10px;
    margin-bottom: 12px;
  }

  th {
    background: #1e3a8a;
    color: white;
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .tag-blue { background: #dbeafe; color: #1e40af; }
  .tag-purple { background: #ede9fe; color: #4338ca; }
  .tag-green { background: #d1fae5; color: #065f46; }

  .footer-note {
    text-align: center;
    font-size: 8pt;
    color: #64748b;
    margin-top: 16px;
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
  }
</style>
</head>
<body>

<!-- COVER / INTRO -->
<div class="header-card">
  <h1>🎪 EVENTRA — Projector Demo & Speaking Script</h1>
  <div class="subtitle">Complete 3-Member Oral Presentation Guide with Live Cues & Technical Justifications</div>
  <div class="meta-grid">
    <div><strong>Course:</strong> INT252 — Web App Development with ReactJS</div>
    <div><strong>Assessment:</strong> Continuous Assessment 3 (Autumn 2026)</div>
    <div><strong>Live Projector URL:</strong> https://eventra-fchm.onrender.com/</div>
    <div><strong>GitHub Codebase:</strong> https://github.com/tanishsarkar28/Eventra.git</div>
    <div><strong>Team Members:</strong> Tanish (12407229), Rishi (12408074), Anush (12407704)</div>
    <div><strong>Framework:</strong> React 18 • Next.js 14 App Router • Tailwind CSS</div>
  </div>
</div>

<!-- JOINT OPENING -->
<div class="feature-box" style="border-left: 4px solid #0f172a;">
  <div class="speaker-badge badge-all">👥 Joint Opening (All 3 Members on Stage — 45 Seconds)</div>
  <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Show Homepage (<code>/</code>) displaying the Hero Section and Modern Pill Navigation Bar.</div>
  
  <div class="speech-block">
    <p><strong>Member 1 (Tanish):</strong> "Good morning, respected Professor and classmates. Today, our team is proud to present <strong>Eventra — Campus Event Management System</strong>. In our university, event management has always suffered from friction: paper posters get torn down, two societies accidentally book the same auditorium at the same hour, students register and forget to attend, and paper registers at the gate cause long lines. Eventra solves all of this under a single, integrated web platform built on <strong>Next.js 14 App Router</strong> and <strong>React 18</strong>."</p>
    <p><strong>Member 2 (Rishi):</strong> "We have divided Eventra into 9 modular subsystems distributed across the three of us. Today, we will demonstrate the entire live system directly on the projector, walking you through every feature from proposal creation to gate check-in and analytics."</p>
    <p><strong>Member 3 (Anush):</strong> "Everything you see is live, fully deployed on cloud infrastructure, and completely backed by secure, atomic data persistence. Let's begin with Member 1 covering our Authentication, Intelligent Clash Detection, and Notification systems."</p>
  </div>
</div>

<!-- MEMBER 1: TANISH -->
<div class="page-break"></div>
<div class="speaker-section">
  <div class="speaker-badge badge-tanish">👤 Member 1: Tanish (12407229) — Security, Intelligent Scheduling & Real-Time Alert Engine</div>

  <!-- Feature 1 -->
  <div class="feature-box">
    <div class="feature-title">🔐 Feature 1: Authentication, Role-Based Access Control (RBAC) & Profiles (Module 1)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Open <code>/login</code>, switch to <code>/register</code>, then log in as student and open <code>/profile</code>. Show editable interest tags.</div>
    <div class="speech-block">
      <p>"I'll start with how Eventra handles security and identity. Our platform supports three distinct user roles: <strong>Student</strong>, <strong>Club Organiser</strong>, and <strong>Administrator</strong>.</p>
      <p>When a student registers, they specify their branch, academic year, and personal interests like 'Coding', 'Robotics', or 'Music'. Students are automatically verified.</p>
      <p>However, if someone signs up as an <strong>Organiser</strong>, they must provide their registered Club Name, and their account starts in an unverified state. They cannot publish events until an administrator explicitly reviews and verifies their credentials. Here on the profile page, students can update their interests at any time, which directly feeds our recommendation engine."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For password cryptography:</strong> We used <code>bcryptjs</code> with a salt work factor of 10 rounds so no plaintext password is ever stored or logged.</li>
        <li><strong>For session tokens:</strong> We used <code>jsonwebtoken</code> (JWT). Instead of storing tokens in insecure <code>localStorage</code> (vulnerable to XSS), we store the JWT inside an <strong><code>httpOnly</code> cookie with <code>sameSite: 'lax'</code></strong>.</li>
        <li><strong>For route authorization:</strong> We used Next.js <code>middleware.js</code> as an edge proxy that decodes the cookie and intercepts unauthorized access with HTTP 401/403 before page rendering.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 2 -->
  <div class="feature-box">
    <div class="feature-title">🛡️ Feature 2: Multi-Dimensional Clash Detection & Alternative Suggestion Engine (Module 4)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Navigate to <code>/events/create</code> or open the Clash Report view at <code>/clash/report</code>. Trigger a venue overlap test.</div>
    <div class="speech-block">
      <p>"Now let's examine one of our most advanced features: <strong>proactive collision prevention</strong>. In college, two clubs often book the same hall on the same day, or schedule parties during semester exams without knowing.</p>
      <p>In Eventra, our <strong>Clash Engine</strong> inspects proposals and catches 5 distinct clash categories: <em>Venue Clash</em> (room occupied), <em>Blackout Clash</em> (official exams/holidays), <em>Capacity Clash</em> (attendees exceed room seats), <em>Organiser Clash</em> (same club in two places at once), and <em>Audience Clash</em> (two events competing for 3rd-year CSE at the same hour)."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For collision detection:</strong> We used the mathematical <strong>Golden Interval Overlap rule</strong>: <code>(start1 &lt; end2) &amp;&amp; (start2 &lt; end1)</code>. If both are true, intervals crash.</li>
        <li><strong>For smooth user interaction:</strong> We used a custom <code>useDebounce</code> hook in React. As the user selects dates, the form waits 300ms and calls <code>POST /clash/check</code> in the background without UI lag.</li>
        <li><strong>For remedial options:</strong> We built <code>GET /clash/suggestions</code> which calculates free open slots at that venue today, alternative venues with sufficient seats, and open nearby dates.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 3 -->
  <div class="feature-box">
    <div class="feature-title">🔔 Feature 3: Event-Driven Multi-Channel Notifications & Scheduled Reminders (Module 7)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Click the Bell Icon in the Navbar to open <code>/notifications</code>. Highlight unread count badge and reminder alerts.</div>
    <div class="speech-block">
      <p>"When events change, students need real-time alerts without email spam. We built an <strong>Event-Driven Architecture</strong>.</p>
      <p>When an event is published, the backend computes the set intersection between student interests and event tags. If there's a match, only interested students receive the alert. Furthermore, our background engine scans events and dispatches deduplicated <strong>24-hour and 1-hour pre-event reminders</strong> so students never miss their kickoff."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For architectural decoupling:</strong> We used Node.js <code>EventEmitter</code> as a Singleton Event Bus in <code>lib/eventBus.js</code>. Calling code simply emits events, and listeners dispatch across In-App, Email Outbox, and Push Outbox.</li>
        <li><strong>For deduplication:</strong> We compute time deltas (Δt) in UTC and verify against <code>notifications.json</code> to guarantee zero duplicate 24h or 1h reminder alerts.</li>
        <li><strong>For on-demand examiner testing:</strong> We exposed <code>POST /notifications/reminders/run</code> and a CLI script <code>scripts/run-reminders.js</code> accepting any target timestamp.</li>
      </ul>
    </div>
  </div>
</div>

<!-- MEMBER 2: RISHI -->
<div class="page-break"></div>
<div class="speaker-section">
  <div class="speaker-badge badge-rishi">👤 Member 2: Rishi (12408074) — Event Lifecycle, Smart Discovery & Academic Schedule Harmony</div>

  <!-- Feature 4 -->
  <div class="feature-box">
    <div class="feature-title">🎪 Feature 4: Event Creation, Poster Upload & Lifecycle Management (Module 2)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Log in as an Organiser, navigate to <code>/events/create</code>, then open <code>/my-events</code> dashboard.</div>
    <div class="speech-block">
      <p>"Thank you, Tanish. I will now demonstrate the event creation and publishing lifecycle. Club organisers can configure titles, descriptions, categories, tags, timings, seating capacity, and free or paid ticket pricing.</p>
      <p>We enforce a strict 4-stage State Machine: <strong>Draft &rarr; Pending Approval &rarr; Published &rarr; Cancelled</strong>. Organisers cannot publish directly—it must be vetted by Admin. If an organiser edits the venue or timing of an already published event, the system safely reverts its status to <em>Pending Approval</em> to prevent unverified room changes."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For form validation:</strong> We used declarative <strong>Zod schemas</strong> in <code>lib/schemas.js</code>, strictly validating string boundaries, positive integers, and enforcing <code>startTime &lt; endTime</code> and <code>registrationDeadline &le; date</code>.</li>
        <li><strong>For image file handling:</strong> We used native multipart <code>FormData</code> in <code>app/api/upload/route.js</code>, verifying formats (.png, .jpg, .webp), assigning unique timestamps, saving to <code>public/uploads/</code>, and rendering a live image preview.</li>
        <li><strong>For cache revalidation:</strong> We used Next.js Server Actions with <code>revalidatePath('/discover')</code> to purge cached pages immediately after mutations.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 5 -->
  <div class="feature-box">
    <div class="feature-title">🔍 Feature 5: Student Event Discovery & "Relevant to Me" Recommendation Engine (Module 5)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Open <code>/discover</code>. Type in search bar, toggle Category pills, filter by Free/Paid, and highlight the "Relevant to Me: 85% Match" badge.</div>
    <div class="speech-block">
      <p>"Now let's switch to the student's perspective on the discovery feed. Students can search across event titles, descriptions, tags, and club names, filter by category pills, filter by Free vs Paid, and toggle dates.</p>
      <p>Notice the match badge on every card: <strong>'Relevant to Me: 85%'</strong>. This is powered by our transparent Recommendation Engine, calculating a 100-point personalized score based on the student's interests, branch alignment, event time proximity, and community popularity. Students can also click the star icon to bookmark events to their personal watchlist."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For algorithmic relevance:</strong> In <code>lib/recommendation.js</code>, we evaluate: Interests Match (Max 40 pts) + Branch/Year Alignment (Max 25 pts) + Proximity in next 3–7 days (Max 20 pts) + Bookmark popularity (Max 15 pts).</li>
        <li><strong>For search performance:</strong> We used React <code>useMemo</code> to memoize the filtered and sorted list in memory, guaranteeing instant client-side filtering without re-renders.</li>
        <li><strong>For watchlists:</strong> We built an atomic bookmark toggle updating <code>data/bookmarks.json</code> with instant UI feedback.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 6 -->
  <div class="feature-box">
    <div class="feature-title">📅 Feature 6: Personal Calendar, Timetable Clash Prevention & RFC 5545 Export (Module 8)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Navigate to <code>/calendar</code>. Show Weekly Agenda (Mon–Sun), click "⚡ Load Sample College Timetable", then click "Export .ics".</div>
    <div class="speech-block">
      <p>"Students always ask: <em>'Can I attend this event without missing my classes or double-booking myself?'</em> Module 8 solves this.</p>
      <p>Here on <code>/calendar</code>, the student sees a **Unified Weekly Agenda** combining their recurring lectures (DBMS, Operating Systems), their confirmed event passes, and saved bookmarks. When registering for an event, the engine checks their lecture timetable. If a class overlaps, registration is blocked with <code>HTTP 409 Conflict</code>. Students can also download an <strong>.ics calendar file</strong> with one click to sync directly with Google or Apple Calendar."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For lecture clash checks:</strong> We extract the day of week from the event date and compare interval boundaries against recurring slots in <code>data/timetable.json</code>.</li>
        <li><strong>For free-slot gap finding:</strong> The engine merges busy blocks and calculates all open time windows between 08:00 and 18:00 with duration in minutes.</li>
        <li><strong>For calendar export:</strong> We built an RFC 5545 iCalendar stream generator in <code>/calendar/export.ics</code> generating standard <code>VEVENT</code> blocks and recurring <code>RRULE:FREQ=WEEKLY</code> rules.</li>
      </ul>
    </div>
  </div>
</div>

<!-- MEMBER 3: ANUSH -->
<div class="page-break"></div>
<div class="speaker-section">
  <div class="speaker-badge badge-anush">👤 Member 3: Anush (12407704) — Venue Operations, QR Gate Check-In & Admin Command Analytics</div>

  <!-- Feature 7 -->
  <div class="feature-box">
    <div class="feature-title">🏛️ Feature 7: Campus Venue Administration & Date Blackout Scheduling (Module 3)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Open <code>/venues</code>. Show Venue KPI cards, interactive availability checker, facilities tags, and blackout dates.</div>
    <div class="speech-block">
      <p>"Thank you, Rishi. I'll begin with campus infrastructure. In Module 3, administrators register and schedule college facilities: auditoriums, seminar halls, computer labs, and grounds.</p>
      <p>Each venue records seating capacity, location, operational days, and daily timings. Notice our <strong>Interactive Availability Checker</strong>: selecting a venue and date computes all occupied hours and reveals remaining free slots. Administrators can also enforce <strong>Date Blackouts</strong>—for example, blocking the Main Auditorium for 'Semester Exams' or 'Renovation', which immediately halts all bookings on that date."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For schedule validation:</strong> We built <code>lib/venueValidation.js</code> verifying that the venue is active, open on that day of week, within operating hours, and not blacked out.</li>
        <li><strong>For booking sync:</strong> Approving an event automatically syncs a confirmed reservation in <code>data/bookings.json</code>, keeping room availability in real-time sync with event approvals.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 8 -->
  <div class="feature-box">
    <div class="feature-title">🎟️ Feature 8: Registration, Waitlist Auto-Promotion & Gate QR Attendance (Module 6)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Open event detail, click Register to display Base64 QR Ticket, then open <code>/events/[id]/attendees</code> to show Gatekeeper Scanner & CSV button.</div>
    <div class="speech-block">
      <p>"Now let's see how seat allocation and venue admission work. When a student registers, the system verifies capacity. If seats are open, it issues a confirmed seat with a <strong>Digital Ticket containing a scannable QR Code</strong>.</p>
      <p>If full, the student joins our <strong>FIFO Waitlist</strong> with queue positions (#1, #2). If an attendee cancels, our **Auto-Promotion Engine** instantly promotes Waitlist #1 and generates their QR pass automatically! On event day, organisers open the <strong>Gatekeeper Console</strong> at <code>/events/:id/attendees</code>. The webcam scans the attendee's QR ticket, verifies it, marks it as 'Used', and records the check-in time. If someone tries to re-use the same ticket code, the scanner immediately rejects it with a duplicate scan alert. Organisers can then export the roster as a standard CSV spreadsheet."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For server-side QR generation:</strong> We used the <code>qrcode</code> library to render high-contrast Base64 PNG data URLs embedded directly in <code>data/tickets.json</code> with zero external web API calls.</li>
        <li><strong>For live camera check-in:</strong> We used <code>html5-qrcode</code> running client-side in React with continuous canvas frame parsing.</li>
        <li><strong>For attendance export:</strong> We built an RFC 4180 streaming CSV exporter in <code>/api/events/[id]/attendees?format=csv</code>.</li>
      </ul>
    </div>
  </div>

  <!-- Feature 9 -->
  <div class="feature-box">
    <div class="feature-title">🛡️ Feature 9: Admin Command Center, Moderation, Audit Logs & Analytics (Module 9)</div>
    <div class="projector-cue">🖥️ <strong>PROJECTOR ACTION:</strong> Log in as Admin, open <code>/admin</code>. Show Pending Proposals with clash badges, student reports queue, audit log, and analytics charts.</div>
    <div class="speech-block">
      <p>"Finally, we come to the executive command center in Module 9. This gives university leadership total oversight, safety, and campus insights across 5 critical tools:</p>
      <p>1. <strong>Proposal Review & Clash Override:</strong> Admins can review pending events. If a clash exists, approval is blocked unless the admin checks 'Admin Override' and enters an official reason.<br>
      2. <strong>Student Content Moderation:</strong> Students can flag inappropriate events via 'Report Event'. Admins investigate flags and can resolve or cancel the event.<br>
      3. <strong>Organiser Account Verifications:</strong> Reviewing and activating new club societies.<br>
      4. <strong>Immutable Audit Log:</strong> Every sensitive operation is permanently recorded in <code>audit_logs.json</code> with timestamp, admin ID, IP, and details.<br>
      5. <strong>Campus Analytics Engine:</strong> Real-time metrics showing weekly event cadence, venue utilization percentages, attendance conversion rates, and clash trends."</p>
    </div>
    <div class="tech-callout">
      <div class="tech-callout-title">🛠️ Technical Implementation — "For this we have used..."</div>
      <ul>
        <li><strong>For atomic data integrity:</strong> We used safe write-and-rename atomic patterns in <code>lib/db.js</code> with Node.js <code>fs.promises</code>, guaranteeing zero file corruption during ungraceful server restarts.</li>
        <li><strong>For utilization metrics:</strong> We built <code>lib/analyticsEngine.js</code> calculating booked hours against weekly operating windows: <code>(Total Booked Hours / Total Operating Hours) * 100%</code>.</li>
        <li><strong>For auditability:</strong> Our <code>lib/auditLogger.js</code> enforces an immutable append-only ledger for all governance actions.</li>
      </ul>
    </div>
  </div>
</div>

<!-- JOINT CLOSING & EXAMINER Q&A -->
<div class="page-break"></div>
<div class="feature-box" style="border-left: 4px solid #0f172a;">
  <div class="speaker-badge badge-all">🎯 Joint Closing & Conclusion (All 3 Members — 30 Seconds)</div>
  <div class="speech-block">
    <p><strong>Member 1 (Tanish):</strong> "To summarize: Eventra transforms university campus life with role-based access control, cryptographic security, and proactive scheduling collision prevention."</p>
    <p><strong>Member 2 (Rishi):</strong> "It empowers students with personalized discovery, transparent relevance match scoring, and seamless calendar integration protecting class attendance."</p>
    <p><strong>Member 3 (Anush):</strong> "And it equips college administrators with venue scheduling, automated FIFO waitlists, duplicate-proof QR admission, immutable audit logging, and utilization analytics."</p>
    <p><strong>All Together:</strong> "Eventra is live, fully deployed, and verified with 100% automated test coverage across all 9 modules. Thank you, and we are now ready for your questions!"</p>
  </div>
</div>

<!-- VIVA / EXAMINER Q&A TABLE -->
<div class="feature-box">
  <div class="feature-title">🧠 Examiner Rapid-Fire Q&A Cheat Sheet (Keep in Hand on Stage!)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Examiner Question</th>
        <th style="width: 14%;">Who Answers</th>
        <th style="width: 58%;">Exact Direct Answer to Say</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>"Why Next.js App Router over plain React (Vite/CRA)?"</strong></td>
        <td><span class="tag tag-blue">Tanish</span></td>
        <td>"Next.js App Router gives us a hybrid architecture: React Server Components for zero-bundle-size server rendering, Route Handlers for our REST backend, and Server Actions for data mutations without an external Express server."</td>
      </tr>
      <tr>
        <td><strong>"Where are passwords and sessions stored?"</strong></td>
        <td><span class="tag tag-blue">Tanish</span></td>
        <td>"Passwords are hashed with <code>bcryptjs</code> using 10 salt rounds. Sessions use JWT stored in tamper-proof <code>httpOnly</code> cookies (<code>sameSite: 'lax'</code>), completely immune to client-side XSS token theft."</td>
      </tr>
      <tr>
        <td><strong>"How does the clash formula work?"</strong></td>
        <td><span class="tag tag-blue">Tanish</span></td>
        <td>"We enforce the Golden Interval Overlap rule: <code>(start1 &lt; end2) &amp;&amp; (start2 &lt; end1)</code>. If both conditions evaluate to true, the two time intervals mathematically intersect."</td>
      </tr>
      <tr>
        <td><strong>"How does the recommendation algorithm score events?"</strong></td>
        <td><span class="tag tag-purple">Rishi</span></td>
        <td>"It uses a transparent 100-point algorithm in <code>lib/recommendation.js</code>: 40 points for interest tag intersection, 25 points for branch/year alignment, 20 points for 3–7 day proximity, and 15 points for bookmark popularity."</td>
      </tr>
      <tr>
        <td><strong>"How does the .ics calendar export work?"</strong></td>
        <td><span class="tag tag-purple">Rishi</span></td>
        <td>"In <code>app/calendar/export.ics/route.js</code>, we construct an RFC 5545 string with <code>BEGIN:VCALENDAR</code>, <code>VEVENT</code> blocks, and <code>RRULE:FREQ=WEEKLY</code> recurrence rules, served with <code>Content-Type: text/calendar</code>."</td>
      </tr>
      <tr>
        <td><strong>"What happens if an attendee cancels their ticket?"</strong></td>
        <td><span class="tag tag-green">Anush</span></td>
        <td>"Our Auto-Promotion Engine in <code>lib/registrationEngine.js</code> fetches the earliest entry in <code>waitlist.json</code> (ordered by <code>createdAt</code>), promotes them to 'Confirmed', generates their QR ticket, and dispatches a notification."</td>
      </tr>
      <tr>
        <td><strong>"How do you stop fake or duplicate tickets at the gate?"</strong></td>
        <td><span class="tag tag-green">Anush</span></td>
        <td>"Each ticket code is unique. When scanned via <code>html5-qrcode</code> calling <code>POST /attendance/scan</code>, the server marks the ticket as 'Used'. Scanning an already-used barcode is rejected with an instant alert showing the previous check-in time."</td>
      </tr>
      <tr>
        <td><strong>"Can an administrator override a clash?"</strong></td>
        <td><span class="tag tag-green">Anush</span></td>
        <td>"Yes! On <code>/admin</code>, an admin can check 'Admin Override' and provide an official justification reason. This override is permanently recorded in <code>audit_logs.json</code> for full institutional accountability."</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="footer-note">
  Eventra — Campus Event Management System • Continuous Assessment 3 • Course Code: INT252 • Autumn 2026
</div>

</body>
</html>
"""

with open("presentation_script.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML script generated successfully.")
