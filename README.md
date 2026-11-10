# Eventra - Campus Event Management System

**Eventra** is a lightweight, modern campus event management web application developed as a college project using **React** and **Next.js 14 (App Router)** in plain JavaScript.

The repository is built following a clean, modular structure with zero complex abstractions, making it readable, explainable, and easy to evaluate for college demonstrations.

---

## 📌 Project Team & Module Distribution

| Student | Assigned Modules | Current Status |
| :--- | :--- | :--- |
| **Student 1 (Tanish)** | **Module 1** (Auth & User Management), **Module 4** (Venue & Clash Management), **Module 7** (Notifications & Reminders) | Module 1 Completed ✅, Module 4 Completed ✅, Module 7 Completed ✅ |
| **Student 2 (Rishi)** | **Module 2** (Event Management), **Module 5** (Student Event Discovery), **Module 8** (Personal Calendar & Schedule Integration) | Module 2 Completed ✅, Module 5 Completed ✅, Module 8 Completed ✅ |
| **Student 3 (Anush)** | **Module 3** (Venue Management), **Module 6** (Registration & Attendance), **Module 9** | Module 3 Completed ✅, Module 6 Completed ✅ |

---

## 🏗️ Architecture & Technical Stack

- **Frontend Framework:** Next.js 14 (App Router) + React 18
- **Language:** Plain JavaScript (`.js` files, beginner-friendly, zero TypeScript overhead)
- **Styling:** Custom lightweight CSS (`app/globals.css`) with clean card containers, modern pill navigation, responsive tables, and status badges. Zero heavy UI frameworks (no Tailwind/Bootstrap required).
- **Backend & APIs:** Next.js Route Handlers (`app/api/...`) with seamless dual-path compatibility (`/events/...` and `/venues/...`) powered by `middleware.js`.
- **Database System:** File-based JSON storage inside `data/` (`users.json`, `events.json`, `categories.json`, `tags.json`, `venues.json`, `bookings.json`, `registrations.json`, `waitlist.json`, `tickets.json`, `attendance.json`, `notifications.json`, `notification_preferences.json`, `email_outbox.json`, `push_outbox.json`, `timetable.json`), accessed via safe atomic read/write functions in `lib/db.js`.
- **Authentication & Security:** 
  - Password hashing using `bcryptjs` with salt.
  - Session issuing & verification using `jsonwebtoken` (JWT).
  - Secure `httpOnly` cookie storage (`sameSite: "lax"`).
- **File Uploads:** Native multipart `FormData` processor saving image assets directly to `public/uploads/`.

---

## 📋 Comprehensive Breakdown of Module 1: Authentication & User Management

### 1. Purpose & Scope
Module 1 establishes the system's security, user identity, role-based access control (RBAC), and profile management.

### 2. User Roles & Permission Model
The system enforces strict permission rules across three distinct user roles:

1. **Student (`role: "student"`)**:
   - Automatically verified upon registration (`isVerified: true`).
   - Can log in, inspect their profile, and edit student details (Name, Branch, Year, Interests).
2. **Organiser (`role: "organiser"`)**:
   - Represents college clubs/societies (e.g., Coding Club, Robotics Club, Dance Society).
   - Requires providing a `clubName` at the time of registration.
   - Starts in an unverified state (`isVerified: false`).
   - **Protection:** Cannot create or manage events until an Administrator explicitly reviews and verifies the club account.
3. **Administrator (`role: "admin"`)**:
   - Pre-configured system administrator (`isVerified: true`).
   - Exclusive access to the **Admin Panel** (`/admin`).
   - Verifies pending organiser accounts.
   - Reviews and approves/publishes pending events submitted by organisers.

### 3. How Authentication Works
1. **Registration:** User enters credentials via `/register`. The backend validates mandatory fields, generates a salt, hashes the password using `bcryptjs`, and appends the user to `data/users.json`.
2. **Login:** User submits email & password via `/login`. The server looks up the user, runs `bcrypt.compare`, signs a JWT containing the user ID and role, and attaches it as an `httpOnly` cookie named `token`.
3. **Session Verification:** Protected API routes and pages call the helper function `getLoggedInUser(request)` in `lib/auth.js`. It decodes the JWT, verifies the user in `data/users.json`, strips the password field, and injects the authenticated user into the request context.
4. **Logout:** Sends a request to `/api/auth/logout`, clearing the cookie (`maxAge: 0`) and redirecting to the login page.

### 4. Module 1 Database Schema (`data/users.json`)
```json
[
  {
    "id": "1730000000000",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "password": "$2a$10$hashedPasswordString...",
    "role": "student",
    "branch": "Computer Science",
    "year": "2nd Year",
    "interests": ["Coding", "Robotics"],
    "clubName": "",
    "isVerified": true
  }
]
```

### 5. Module 1 API Endpoints
| HTTP Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a student or organiser. Hashes password. |
| `POST` | `/api/auth/login` | Public | Validates credentials, issues JWT token in `httpOnly` cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Clears the `token` cookie and terminates session. |
| `GET` | `/api/users/me` | Authenticated | Fetches logged-in user profile (excludes password). |
| `PATCH` | `/api/users/me` | Authenticated | Updates name, branch, year, and interests. |
| `GET` | `/api/organisers/pending`| Admin Only | Lists unverified organisers awaiting approval. |
| `POST` | `/api/organisers/verify` | Admin Only | Approves and verifies an organiser account by ID. |

---

## 🎪 Comprehensive Breakdown of Module 2: Event Management

### 1. Purpose & Scope
Module 2 is the core module empowering verified college club organisers to create, customize, edit, publish, track, and cancel campus events.

### 2. Core Functional Features Implemented

1. **Event Creation (`/events/create`):**
   - Verified organisers can create events with comprehensive parameters.
   - Immediate choice to either **Save as Draft** or **Submit for Approval**.
2. **Event Editing (`/events/edit/:id`):**
   - Form pre-populated with existing event details.
   - Organisers can only edit events created by their own club (enforced by `organiserId === user.id`).
   - If a published event's venue, date, or timing is edited, the system safely resets its status to `Pending Approval` for re-verification.
3. **Event Cancellation:**
   - Organisers can cancel active events via single-click confirmation (`status: 'Cancelled'`).
   - Cancelled events are preserved for record-keeping and display a clear `Cancelled` state.
4. **My Events Dashboard (`/my-events`):**
   - Dedicated management view displaying events created by the logged-in organiser.
   - Summary view showing: Poster Thumbnail, Title, Description, Category, Date & Time, Venue, Capacity, Pricing, Status Badge, and contextual Action Buttons.
5. **Event Poster Upload:**
   - Upload local poster images (`.png`, `.jpg`, `.webp`) via the `POST /api/upload` route.
   - Files are stored on the server in `public/uploads/` and previewed live on the form.
   - Organisers can also enter an external image URL if preferred.
6. **Categories & Tags Management:**
   - Pre-loaded categories: `Technical`, `Cultural`, `Sports`, `Academic`, `Workshop`, `Seminar`.
   - Pre-loaded tags: `coding`, `web`, `hackathon`, `robotics`, `dance`, `music`, `gaming`, `quiz`, `sports`, `ai`.
   - Organisers can tag events for easy campus discovery.
7. **Capacity & Pricing Controls:**
   - Set maximum attendee capacity (must be $> 0$).
   - Toggle between **Free** and **Paid**. If paid, an input for Ticket Price (₹) appears.
   - Set a registration deadline (enforced to be on or before the event date).

---

### 3. Event Status State Machine & Workflow

```
   [ Create Event ]
          │
          ▼
      ┌───────┐         Submit for Approval
      │ Draft │ ──────────────────────────────────┐
      └───────┘                                   │
          │                                       ▼
          │                              ┌──────────────────┐
          │     Withdraw to Draft        │ Pending Approval │
          │ ◄─────────────────────────── └──────────────────┘
          │                                       │
          │                                       │ Admin Review &
          │                                       │ Module 4 Validation
          │                                       ▼
          │                                 ┌───────────┐
          │                                 │ Published │
          │                                 └───────────┘
          ▼                                       │
   ┌─────────────┐                                │
   │  Cancelled  │ ◄──────────────────────────────┘
   └─────────────┘
```

#### Workflow Rules Enforced:
- **No Direct Self-Publishing:** Organisers **cannot** directly set status to `Published`. Attempting to bypass approval returns HTTP `403 Forbidden`.
- **Admin Approval:** Only administrators have authorization to approve an event from `Pending Approval` to `Published`.
- **Dynamic Action Buttons:**
  - `Draft`: Show *Edit*, *Submit for Approval*, and *Cancel*.
  - `Pending Approval`: Show *Edit*, *Withdraw to Draft*, and *Cancel*.
  - `Published`: Show *Edit* and *Cancel*.
  - `Cancelled`: Read-only state.

---

### 4. Module 4 Integration: Campus Venue & Scheduling Validation

Before an event is published by the Admin, the backend automatically executes the Module 4 integration helper in `lib/venueValidation.js`:

```javascript
import { validateVenueAndTime } from '@/lib/venueValidation';
```

#### Validation Rules Checked:
1. **Venue Check:** Verifies that a venue name is provided and non-empty.
2. **Date Validity:** Ensures the event date is valid and not in the past.
3. **Time Ordering:** Enforces that `startTime < endTime`.
4. **Deadline Verification:** Enforces that `registrationDeadline <= date`.
5. **Venue & Time Slot Conflict Detection:**
   - Scans all existing `Published` events.
   - Checks if any other event is booked at the **same venue** on the **same date** with **overlapping hours**:
     $$\text{Conflict} = (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$
   - **Result on Conflict:** The publishing attempt is immediately rejected with HTTP `400 Bad Request` and a descriptive message:
     > *"Module 4 Conflict: Venue 'Auditorium A' is already booked on 2026-11-20 from 10:00 to 18:00 by event 'Hackathon 2026'."*

---

### 5. Module 2 Database Entities (`data/`)

#### Event Entity (`data/events.json`)
```json
[
  {
    "id": "1730000000001",
    "title": "Hackathon 2026",
    "description": "24-hour national level coding hackathon",
    "poster": "/uploads/1730000000000_poster.png",
    "category": "Technical",
    "tags": ["coding", "web", "hackathon"],
    "date": "2026-11-20",
    "startTime": "10:00",
    "endTime": "18:00",
    "venue": "Auditorium A",
    "capacity": 150,
    "registrationDeadline": "2026-11-18",
    "isPaid": true,
    "ticketPrice": 200,
    "status": "Published",
    "organiserId": "1730000000000",
    "organiserName": "Tech Lead",
    "clubName": "Coding Club",
    "createdAt": "2026-10-25T10:00:00.000Z",
    "updatedAt": "2026-10-25T11:00:00.000Z"
  }
]
```

#### Categories Entity (`data/categories.json`)
```json
["Technical", "Cultural", "Sports", "Academic", "Workshop", "Seminar"]
```

#### Tags Entity (`data/tags.json`)
```json
["coding", "web", "hackathon", "robotics", "dance", "music", "gaming", "quiz", "sports", "ai"]
```

---

### 6. Module 2 API Endpoints
All routes support dual-path access (`/api/events/...` standard and `/events/...` aliases):

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/events` / `/events` | Verified Organiser | Creates a new event in `Draft` or `Pending Approval` state. |
| `GET` | `/api/events/mine` / `/events/mine` | Organiser | Retrieves all events created by currently logged-in organiser. |
| `GET` | `/api/events/:id` / `/events/:id` | Authenticated | Fetches full event details by ID. |
| `PUT` | `/api/events/:id` / `/events/:id` | Event Owner / Admin | Updates existing event attributes. |
| `DELETE` | `/api/events/:id` / `/events/:id` | Event Owner / Admin | Cancels an event (`status: 'Cancelled'`). |
| `PATCH` | `/api/events/:id/status` / `/events/:id/status` | Organiser / Admin | Updates status. Admin approval executes Module 4 validation. |
| `POST` | `/api/upload` | Authenticated | Uploads poster image file to `public/uploads/`. |
| `GET` | `/api/categories` | Public | Returns available event categories. |
| `GET` | `/api/tags` | Public | Returns available event tags. |

---

## 🏛️ Comprehensive Breakdown of Module 3: Venue Management

### 1. Purpose & Scope
Module 3 provides an end-to-end college venue administration system. It allows campus administrators to register, edit, inspect, and schedule college facilities—such as auditoriums, seminar halls, computer labs, and sports grounds. It enforces real-time availability checks, date blackouts (for maintenance, exams, and holidays), prevents overlapping bookings, and provides an admin approval workflow for club reservation requests.

### 2. Core Functional Features Implemented

1. **Venue Directory & Management Dashboard (`/venues`):**
   - Clean summary KPI cards tracking Total Venues, Active Venues, Total Campus Capacity, and Pending Booking Requests.
   - Directory listing each venue with Name, Type, Capacity, Location, Facilities badges, Operational Days, Daily Timings, and Active Status.
   - Admin controls to add venues, edit venues, inspect individual venue schedules, and toggle active/inactive status with instant UI updates.

2. **Add & Edit Venues (`/venues/create` and `/venues/edit/[id]`):**
   - Admin-only forms capturing:
     - **Name** (e.g. "Main Auditorium", "Raman Seminar Hall", "CS Lab 1", "Main Sports Ground")
     - **Type** (Auditorium, Seminar Hall, Lab, Playground, Conference Room, Classroom)
     - **Capacity** (strictly validated positive integers)
     - **Location** (e.g. Block A Ground Floor, Behind Block D)
     - **Facilities** (interactive checkboxes: AC, Projector, Microphone, Sound System, WiFi, Whiteboard, Stage Lighting, Video Conferencing)
     - **Available Days** (Monday through Sunday)
     - **Operating Hours** (`availableFrom` to `availableTo`, strictly validated)
     - **Requires Admin Approval** toggle (controls whether bookings confirm instantly or await admin review)
     - **Active Status** (allows soft-deactivating venues under renovation)

3. **Interactive Availability & Conflict Checker:**
   - Real-time tool on the dashboard and detail pages to select a venue, date, and optional time range.
   - Verifies whether the venue is open on that day of the week.
   - Detects date blackouts (exams, maintenance, etc.).
   - Displays all occupied/booked time slots.
   - Automatically computes all open, free time windows between operating hours.
   - Instantly checks whether a requested time range has conflicts.

4. **Date Blackout Management:**
   - Administrators can block venues on specific dates or date ranges for exams, maintenance, college holidays, or official inspections.
   - When a blackout is placed, all event publishing and booking requests on that date are automatically rejected.
   - Admins can review and unblock dates at any time.

5. **Venue Booking Requests & Admin Approval Workflow:**
   - Clubs and organizers can submit booking requests for venues (`POST /api/venues/:id/bookings`).
   - If `requiresApproval` is true, bookings start in `Pending` state.
   - Admins can review pending booking requests on the `/venues` dashboard with one-click **Approve** and **Reject** buttons.
   - Conflict detection prevents any overlapping approved bookings.

6. **Deep Integration with Module 2 (Event Management):**
   - Before an event can be approved and published (`PATCH /api/events/:id/status`), the system validates the venue schedule via `lib/venueValidation.js`.
   - Publication is automatically blocked if:
     - The venue does not exist or is inactive/decommissioned.
     - The event date falls on a day the venue is closed.
     - The event time falls outside the venue's operating hours.
     - The date is blocked by an admin blackout.
     - Another event or approved venue booking overlaps in time.
   - When an event is approved to `Published`, a synchronized `Confirmed` booking is automatically recorded in `bookings.json`.
   - If an event is cancelled, its corresponding venue booking is marked `Cancelled`.
   - Event creation and editing forms feature a dynamic `<datalist>` populated from registered venues.

### 3. Module 3 Database Schemas

#### Venues Entity (`data/venues.json`)
```json
[
  {
    "id": "venue_auditorium_1",
    "name": "Main Auditorium",
    "type": "Auditorium",
    "capacity": 500,
    "location": "Block A, Ground Floor",
    "facilities": ["AC", "Projector", "Microphone", "Sound System", "WiFi", "Stage Lighting"],
    "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "availableFrom": "08:00",
    "availableTo": "20:00",
    "requiresApproval": true,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

#### Bookings & Blackouts Entity (`data/bookings.json`)
```json
[
  {
    "id": "1730000000001",
    "venueId": "venue_auditorium_1",
    "venueName": "Main Auditorium",
    "type": "booking",
    "date": "2026-11-20",
    "startTime": "10:00",
    "endTime": "13:00",
    "title": "Robotics Club Workshop",
    "reason": "",
    "note": "Rehearsal and exhibition",
    "eventId": "event_12345",
    "requestedBy": "user_1",
    "requestedByName": "Tech Lead",
    "status": "Confirmed",
    "createdAt": "2026-10-28T05:00:00.000Z",
    "updatedAt": "2026-10-28T05:00:00.000Z"
  },
  {
    "id": "1730000000002",
    "venueId": "venue_auditorium_1",
    "venueName": "Main Auditorium",
    "type": "blackout",
    "date": "2026-12-01",
    "startTime": "08:00",
    "endTime": "20:00",
    "title": "Blackout: Semester Exams",
    "reason": "Semester Exams",
    "note": "University final exam centre",
    "eventId": null,
    "requestedBy": "admin_default",
    "requestedByName": "System Administrator",
    "status": "Confirmed",
    "createdAt": "2026-10-28T05:00:00.000Z",
    "updatedAt": "2026-10-28T05:00:00.000Z"
  }
]
```

### 4. Module 3 API Endpoints
All endpoints support dual-path access (`/api/venues/...` as well as direct `/venues/...` via Next.js middleware):

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/venues` / `/api/venues` | Public | Returns all active venues (or all venues with `?all=true`). |
| `POST` | `/venues` / `/api/venues` | Admin Only | Registers a new venue with capacity, facilities, and schedule. |
| `GET` | `/venues/:id` / `/api/venues/:id` | Public | Fetches detailed venue information by ID. |
| `PUT` | `/venues/:id` / `/api/venues/:id` | Admin Only | Updates venue attributes, facilities, hours, or active status. |
| `DELETE` | `/venues/:id` / `/api/venues/:id` | Admin Only | Soft-deactivates venue (`isActive: false`). |
| `GET` | `/venues/:id/availability?date=` | Public | Checks venue availability, returns blackout info, booked slots, and open slots. |
| `POST` | `/venues/:id/blackouts` | Admin Only | Blocks a venue on specific dates for exams, maintenance, holidays. |
| `GET` | `/venues/:id/blackouts` | Authenticated | Lists all blackout dates for the venue. |
| `DELETE` | `/venues/:id/blackouts` | Admin Only | Unblocks a previously blacked-out date. |
| `GET` | `/venues/:id/bookings` | Authenticated | Lists bookings for a specific venue (supports `?status=Pending`). |
| `POST` | `/venues/:id/bookings` | Authenticated | Requests a venue booking (verifies schedule and time conflicts). |
| `PATCH` | `/venues/:id/bookings` | Admin Only | Approves or rejects a booking request. |
| `GET` | `/api/venues/bookings` | Authenticated | Lists all bookings across all venues. |

---

### 5. Required APIs — Detailed Specifications & Examples

#### A. `GET /venues` (View All Venues)
- **Description:** Returns the active venue directory with capacity, equipment, and weekly operating hours.
- **Query Parameters:** `?all=true` (optional, includes inactive venues).
- **Sample Request:**
  ```http
  GET /venues HTTP/1.1
  Host: localhost:3000
  Accept: application/json
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "message": "Venues retrieved successfully",
    "venues": [
      {
        "id": "venue_auditorium_1",
        "name": "Main Auditorium",
        "type": "Auditorium",
        "capacity": 500,
        "location": "Block A, Ground Floor",
        "facilities": ["AC", "Projector", "Microphone", "Sound System", "WiFi", "Stage Lighting"],
        "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "availableFrom": "08:00",
        "availableTo": "20:00",
        "requiresApproval": true,
        "isActive": true
      }
    ]
  }
  ```

#### B. `POST /venues` (Add a New Venue)
- **Description:** Creates and saves a new campus venue in `data/venues.json`. (Admin only).
- **Sample Request:**
  ```http
  POST /venues HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Cookie: token=<admin_jwt_token>

  {
    "name": "Advanced Computing Lab",
    "type": "Lab",
    "capacity": 60,
    "location": "Block C, Room 304",
    "facilities": ["AC", "Projector", "WiFi", "High-End PCs"],
    "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "availableFrom": "08:30",
    "availableTo": "17:30",
    "requiresApproval": true
  }
  ```
- **Sample Response (HTTP 201 Created):**
  ```json
  {
    "message": "Venue created successfully",
    "venue": {
      "id": "1730000000005",
      "name": "Advanced Computing Lab",
      "type": "Lab",
      "capacity": 60,
      "location": "Block C, Room 304",
      "facilities": ["AC", "Projector", "WiFi", "High-End PCs"],
      "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "availableFrom": "08:30",
      "availableTo": "17:30",
      "requiresApproval": true,
      "isActive": true,
      "createdAt": "2026-10-28T05:27:18.337Z",
      "updatedAt": "2026-10-28T05:27:18.337Z"
    }
  }
  ```

#### C. `GET /venues/:id/availability?date=YYYY-MM-DD` (Check Venue Availability)
- **Description:** Computes whether a venue is open on the requested date, verifies operating days, checks for date blackouts, lists already booked intervals, and returns calculated open free time windows.
- **Optional Query Parameters:** `&startTime=HH:MM&endTime=HH:MM` (validates if a specific time window is free).
- **Sample Request:**
  ```http
  GET /venues/venue_auditorium_1/availability?date=2026-11-20&startTime=14:00&endTime=16:00 HTTP/1.1
  Host: localhost:3000
  Accept: application/json
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "venue": {
      "id": "venue_auditorium_1",
      "name": "Main Auditorium",
      "type": "Auditorium",
      "capacity": 500,
      "location": "Block A, Ground Floor"
    },
    "date": "2026-11-20",
    "dayOfWeek": "Friday",
    "isAvailable": true,
    "isSlotAvailable": true,
    "slotConflictReason": null,
    "blackout": null,
    "bookedSlots": [
      {
        "id": "1730000000001",
        "startTime": "10:00",
        "endTime": "12:00",
        "title": "AI Lab Practice Session",
        "type": "booking"
      }
    ],
    "availableSlots": [
      { "startTime": "08:00", "endTime": "10:00" },
      { "startTime": "12:00", "endTime": "20:00" }
    ],
    "availableFrom": "08:00",
    "availableTo": "20:00"
  }
  ```

#### D. `POST /venues/:id/blackouts` (Block a Venue on Specific Dates)
- **Description:** Blocks a venue on specific dates for exams, maintenance, or holidays. Prevents any events from being scheduled or published during this time. (Admin only).
- **Sample Request:**
  ```http
  POST /venues/venue_auditorium_1/blackouts HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Cookie: token=<admin_jwt_token>

  {
    "date": "2026-12-01",
    "reason": "Semester Exams",
    "note": "Main exam centre for final examinations"
  }
  ```
- **Sample Response (HTTP 201 Created):**
  ```json
  {
    "message": "Venue 'Main Auditorium' successfully blocked for 1 date(s).",
    "blackout": {
      "id": "1730000000010",
      "venueId": "venue_auditorium_1",
      "venueName": "Main Auditorium",
      "type": "blackout",
      "date": "2026-12-01",
      "startTime": "08:00",
      "endTime": "20:00",
      "title": "Blackout: Semester Exams",
      "reason": "Semester Exams",
      "note": "Main exam centre for final examinations",
      "status": "Confirmed"
    }
  }
  ```

---

## 🛡️ Comprehensive Breakdown of Module 4: Venue & Clash Management (Problem Module 3)

### 1. Purpose & Scope
Module 4 is the core **validation engine** of Eventra. Acting as an intelligent campus "traffic controller", it proactively identifies, warns about, and prevents scheduling collisions before events are approved and published.

It unifies event schedules, venue reservations, expected attendance numbers, club commitments, student audience demographics, and college blackout dates into a single validation framework.

---

### 2. How to Explain Module 4 "Like You're Explaining to a 5-Year-Old" 👶
| Problem in Real Life | The Baby-Simple Story | Eventra Rule Enforced |
| :--- | :--- | :--- |
| **Venue Clash** | Two kids try to slide down the playground slide at the exact same time. **BOOM!** | Only one event can use a room at a time. |
| **Capacity Clash** | You invite 500 friends into a tiny treehouse built for only 50 kids. **The floor will crack!** | Expected attendees cannot exceed venue capacity. |
| **Organiser Clash** | The Coding Club President tries to run a coding contest in Hall A and a robotics demo in Hall B at 2:00 PM. **A person cannot be in two places at once!** | One club cannot host two different events at the same hour. |
| **Audience Clash** | Two different clubs throw parties for "3rd-Year CSE students" at the exact same hour on Friday. **Students cannot cut themselves in half!** | Two events cannot target the exact same student group at the same time. |
| **Blackout Clash** | A club wants to have a dance party in the auditorium while semester final exams or ceiling painting are happening. **NO WAY!** | No events allowed during official exam or maintenance blackout dates. |

---

### 3. The Core Logic: The Golden Interval Overlap Rule
How does the computer know when two time periods overlap?

$$\text{Overlap} = (\text{start}_1 < \text{end}_2) \land (\text{start}_2 < \text{end}_1)$$

```text
Event 1:  [start1 = 10:00 ──────────────── end1 = 12:00]
Event 2:               [start2 = 11:00 ──────────────── end2 = 13:00]
```

#### Why does this work so cleanly?
1. Event 1 starts **before** Event 2 finishes: `(10:00 < 13:00)` is **TRUE**.
2. Event 2 starts **before** Event 1 finishes: `(11:00 < 12:00)` is **TRUE**.
3. Because **both conditions are true**, their time intervals crash into each other!
4. If Event 2 started at `12:00` (right when Event 1 finishes), `(12:00 < 12:00)` is **FALSE**, correctly indicating no overlap!

---

### 4. The 5 Clash Types & Severity Hierarchy
| Clash Type | Severity | Description | Remedy / Action |
| :--- | :--- | :--- | :--- |
| **Venue clash** | `CRITICAL` | Same venue booked for overlapping hours on the same date. | Move event to open time slot or alternate campus venue. |
| **Capacity clash** | `HIGH` | Expected attendees exceed maximum seating capacity of the venue. | Reduce attendee limit or move to a larger facility (e.g. Auditorium). |
| **Organiser clash** | `HIGH` | The same club hosting two events at the exact same time. | Reschedule one event so club staff can manage both. |
| **Audience clash** | `MEDIUM` | Two events competing for the same student group (e.g. 3rd-year CSE). | Adjust timing so students can attend both events. |
| **Blackout clash** | `CRITICAL` | Event scheduled during exams, campus holidays, or maintenance. | Move event to a date after the blackout period ends. |

---

### 5. Core Functional Features Implemented

1. **Real-Time Validation on Event Forms (`/events/create` and `/events/edit/:id`):**
   - As an organiser enters Date, Time, Venue, Capacity, and Target Audience, a live debounced checker automatically calls `POST /clash/check`.
   - Displays a dynamic status panel:
     - 🟢 **All Clear:** *"No venue, capacity, organiser, audience, or blackout conflicts detected."*
     - 🔴 **Conflict Alert:** Lists each detected clash with severity badge, message, conflicting event details, and remedial tip.
2. **Alternative Slot, Venue & Date Suggestions (`GET /clash/suggestions`):**
   - When a clash occurs, clicking **"💡 View Alternative Slots & Venues"** computes:
     - **Free Slots Today:** Open windows at the requested venue with click-to-apply buttons.
     - **Alternative Venues:** Other campus facilities with sufficient capacity that are free at that exact hour.
     - **Alternative Nearby Dates:** Dates in the upcoming week when the requested venue and slot are completely open.
3. **Admin Override with Reason:**
   - In `/admin`, administrators reviewing pending events with clashes can click **"⚡ Override & Publish"**.
   - Prompts for an official administrative justification (e.g. *"Approved by Dean for Annual College Fest"*).
   - Records `adminOverride: true`, `overrideReason`, `overriddenBy`, and `overriddenAt` directly onto the event record.
4. **Clash Report View (`/clash/report`):**
   - An interactive system-wide audit dashboard scanning all events and bookings.
   - Provides summary KPI cards, category filter tabs (All, Critical, Venue, Capacity, Organiser, Audience, Blackout), detailed conflict breakdown per event, and live re-scanning.

---

### 6. Module 4 API Specifications

#### A. `POST /clash/check` (Real-Time Conflict Checker)
- **Description:** Checks an event payload against venues, bookings, and existing published events for all 5 clash types.
- **Sample Request:**
  ```http
  POST /clash/check HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json

  {
    "venue": "Main Auditorium",
    "date": "2026-11-20",
    "startTime": "10:00",
    "endTime": "12:00",
    "capacity": 600,
    "targetAudience": "3rd-year CSE",
    "clubName": "Coding Club"
  }
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "hasClash": true,
    "hasCriticalClash": true,
    "clashCount": 2,
    "clashes": [
      {
        "type": "Capacity clash",
        "severity": "HIGH",
        "title": "Venue Capacity Exceeded",
        "message": "Expected attendees (600) exceed 'Main Auditorium' maximum capacity (500) by 100 seats.",
        "remedy": "Reduce event capacity to 500 or move to a larger venue."
      },
      {
        "type": "Venue clash",
        "severity": "CRITICAL",
        "title": "Venue Collision with Published Event",
        "message": "Venue 'Main Auditorium' is already occupied on 2026-11-20 from 10:00 to 14:00 by event 'Hackathon 2026'.",
        "remedy": "Choose an open slot before 10:00 or after 14:00."
      }
    ],
    "summary": { "critical": 1, "high": 1, "medium": 0, "total": 2 }
  }
  ```

#### B. `GET /clash/suggestions` (Alternative Slots & Venues)
- **Description:** Suggests alternative clash-free slots on the same date, alternative venues with sufficient capacity, and alternative dates.
- **Sample Request:**
  ```http
  GET /clash/suggestions?venue=Main+Auditorium&date=2026-11-20&startTime=10:00&endTime=12:00&capacity=100 HTTP/1.1
  Host: localhost:3000
  Accept: application/json
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "requested": { "venue": "Main Auditorium", "date": "2026-11-20", "startTime": "10:00", "endTime": "12:00" },
    "alternativeSlots": [
      { "startTime": "14:00", "endTime": "16:00", "venue": "Main Auditorium", "note": "Available slot (14:00 - 20:00)" }
    ],
    "alternativeVenues": [
      { "id": "venue_seminar_1", "name": "Seminar Hall 1", "capacity": 150, "location": "Block B" }
    ],
    "alternativeDates": [
      { "date": "2026-11-21", "dayOfWeek": "Saturday", "venue": "Main Auditorium" }
    ]
  }
  ```

#### C. `GET /clash/report` (System Clash Audit Report)
- **Description:** Scans all events in the system and returns a complete health audit with breakdown metrics and conflict logs.
- **Sample Request:**
  ```http
  GET /clash/report HTTP/1.1
  Host: localhost:3000
  Accept: application/json
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "generatedAt": "2026-11-02T16:00:00.000Z",
    "totalEventsChecked": 4,
    "eventsWithClashesCount": 1,
    "totalClashesFound": 1,
    "breakdownByType": {
      "venueClashes": 1,
      "capacityClashes": 0,
      "organiserClashes": 0,
      "audienceClashes": 0,
      "blackoutClashes": 0
    },
    "breakdownBySeverity": {
      "critical": 1,
      "high": 0,
      "medium": 0
    },
    "reports": [ ... ]
  }
  ```

---


---

## 🔍 Comprehensive Breakdown of Module 5: Student Event Discovery (Problem Module 2)

### 1. Purpose & Scope
Module 5 solves the discovery problem for students on campus. With dozens of events organized by different clubs, departments, and societies every month, students often miss out on workshops, competitions, and seminars aligned with their career and personal interests.

Module 5 provides:
- A personalized discovery feed displaying only verified, **Published** events.
- An intelligent, beginner-friendly **Recommendation Engine** calculating a **"Relevant to Me" Match Score (0–100%)** based on the student's profile (interests, branch, academic year, proximity, and popularity).
- Multi-dimensional search and filters (Category, Pricing: Free/Paid, and Date).
- A 1-click **Save / Bookmark** system for students to curate their personal event watchlist.
- Clean, semantic event detail views with complete information.

---

### 2. Core Functional Features Implemented

1. **Student Discovery Feed (`/discover`):**
   - Clean, lightweight tabular view of all upcoming campus events.
   - Filtered automatically to show only approved, `Published` events (drafts and cancelled events are excluded).
   - Shows Category, Date & Time, Venue, Fee (Free or ₹ ticket price), and the custom **Match Score %** for each event.
   - 1-click action buttons to View Details or Save/Bookmark directly from the feed.

2. **Multi-Parameter Search & Filtering:**
   - **Keyword Search:** Instant search matching event title, description, tags, and organizer club.
   - **Category Filter:** Filter by Technical, Cultural, Sports, Academic, Workshop, Seminar.
   - **Pricing Filter:** Quickly isolate Free Events vs Paid Events.
   - **Date Filter:** Find events happening on specific campus days.
   - **Sorting:**
     - ⭐ **Relevant to Me (AI Relevance Rank):** Sorts events by highest match percentage first.
     - 🔥 **Trending / Most Bookmarked:** Sorts events by popularity and bookmark count.
     - 📅 **Date:** Chronological order (earliest first).

3. **Recommendation Engine & "Relevant to Me" Score (`lib/recommendation.js`):**
   A transparent scoring algorithm designed so any student can explain it in a viva:
   - **Interests Match (Max 40 points):** Matches student's profile interests (e.g., Coding, AI, Robotics) against event tags, title, description, and category.
   - **Academic & Branch Alignment (Max 25 points):** Boosts events targeting student's branch (e.g. CSE) or academic year.
   - **Time Proximity (Max 20 points):** Events happening within the next 3 to 7 days receive a temporal boost.
   - **Popularity Boost (Max 15 points):** Community interest based on student bookmark count and event venue capacity.
   - **Final Output:** Normalised score between 10% and 100% displayed as a visual badge on every event.

4. **Event Detail Page (`/events/:id`):**
   - Direct, distraction-free page with poster preview, full description, schedule, venue, club name, capacity, registration deadline, fee, and tags.
   - Single-click **Save / Bookmark** toggle button with live status updates (`Save ☆` ↔ `Saved ★`).

5. **Personalized Watchlist / Bookmarking (`data/bookmarks.json`):**
   - Students can bookmark events they plan to attend.
   - Toggling the bookmark updates community interest in real-time.

---

### 3. Module 5 Database Entities

#### Bookmarks Entity (`data/bookmarks.json`)
```json
[
  {
    "id": "1730000000000",
    "userId": "1792921156058",
    "eventId": "1792921081004",
    "createdAt": "2026-11-03T10:00:00.000Z"
  }
]
```

---

### 4. Module 5 API Endpoints
All endpoints support standard `/api/...` and clean dual-path alias routes via `middleware.js`:

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/discover` / `/api/discover` | Public / Students | Returns published events with search query, filters, and relevance scores. |
| `GET` | `/api/discover/recommended` | Authenticated | Returns personalized events ranked strictly by relevance score. |
| `GET` | `/events/search?q=` / `/api/events/search?q=` | Public / Students | Direct keyword search across event titles, tags, and clubs. |
| `POST` | `/events/:id/bookmark` / `/api/events/:id/bookmark` | Authenticated | Toggles save/bookmark state for current student on the specified event. |

---

## 🎟️ Comprehensive Breakdown of Module 6: Registration & Attendance

### 1. Purpose & Scope
Module 6 bridges the gap between campus event discovery and active participation. It converts student interest into registered attendance, enforces event capacity boundaries, manages registration overflow via an automated FIFO waitlist, generates secure digital QR code tickets, enables real-time organiser check-ins at venue gates, and exports formatted attendance spreadsheets (CSV) for college administration records.

---

### 2. How to Explain Module 6 "Like You're Explaining to a 5-Year-Old" 👶
| Problem in Real Life | The Baby-Simple Story | Eventra Rule Enforced |
| :--- | :--- | :--- |
| **Full Capacity** | A school bus has only 30 seats. 30 kids sit down; the 31st kid gets a yellow queue ticket. | Once `event.capacity` is reached, students join the **Waitlist** with queue positions (`#1`, `#2`...). |
| **Empty Seat Left Behind** | Kid #5 gets sick and goes home. Kid #31 instantly jumps into seat #5 and gets a shiny gold pass! | When an attendee unregisters, the **Auto-Promotion Engine** instantly promotes the first waitlisted student and issues their QR ticket! |
| **Clashing Schedules** | You cannot be playing football on the ground AND doing a chemistry test in the lab at 11:00 AM! | **Module 8 Schedule Clash:** Rejects registration if a student is already registered for another overlapping event on the same day. |
| **Fake / Duplicate Tickets** | You show your ticket to the conductor, who punches it. If your friend brings a photocopy of your ticket, the alarm rings **BEEP!** | **Duplicate Scan Prevention:** A ticket code can only be used once. Scanning an already-used ticket returns a strict error with the previous check-in time. |
| **Last-Minute No-Shows** | You can't return a movie ticket 5 minutes after the movie starts and expect someone else to rush over. | **Cancellation Window:** Cancellations are locked when within $N$ hours of event start (e.g. 2 hours before kickoff). |

---

### 3. Architecture & Registration State Machine

```
                   [ Student Clicks "Register Now" ]
                                  │
                                  ▼
                   ┌─────────────────────────────┐
                   │ Module 8 Schedule Clash     │ ──(Clash Detected)──► [ Reject 409 Conflict ]
                   │ Check (Interval Overlap)    │                         (Allow override toggle)
                   └─────────────────────────────┘
                                  │
                                  │ (No Clash)
                                  ▼
                   ┌─────────────────────────────┐
                   │ Capacity Check              │
                   │ (Confirmed < Capacity?)     │
                   └─────────────────────────────┘
                             │           │
                    YES      │           │ NO (Full)
                             ▼           ▼
                   ┌────────────────┐ ┌────────────────┐
                   │  Registration  │ │    Waitlist    │
                   │  [Confirmed]   │ │   [Waiting]    │
                   └────────────────┘ └────────────────┘
                             │                 │
                             ▼                 │
                   ┌────────────────┐          │
                   │  Issue Ticket  │          │
                   │  with QR Code  │          │
                   └────────────────┘          │
                             │                 │
            ┌────────────────┴───────────────┐ │
            │                                │ │
            ▼ (On Event Day)                 ▼ │ (When Attendee Cancels)
 ┌──────────────────────┐        ┌─────────────────────────┐
 │ Organiser QR Scan    │        │ Auto-Promotion Engine   │
 │ POST /attendance/scan│        │ Waitlist[0] ──► Confirmed│
 └──────────────────────┘        └─────────────────────────┘
            │                                  │
            ▼                                  ▼
 ┌──────────────────────┐        ┌─────────────────────────┐
 │  Attendance Record   │        │ Ticket Auto-Generated   │
 │  [Checked In]        │        │ Queue Re-Indexed (#1..) │
 └──────────────────────┘        └─────────────────────────┘
```

---

### 4. Golden Rules & Mathematical Logic Enforced

#### A. The Golden Interval Overlap Rule (Module 8 Personal Schedule Clash)
How does the system ensure a student cannot be in two places at once?

$$\text{Clash} = (\text{eventA.startTime} < \text{eventB.endTime}) \land (\text{eventA.endTime} > \text{eventB.startTime})$$

- When student requests registration for Event A on date $D$:
  - The engine queries all `Confirmed` registrations for the student on date $D$.
  - If any existing event overlaps in hours, registration is halted with HTTP `409 Conflict`.

#### B. Capacity Boundary Equation
$$\text{Available Seats} = \text{event.capacity} - \sum_{\text{Confirmed}} \text{Registrations}$$
- If $\text{Available Seats} > 0 \implies \text{Confirmed Registration + Digital Ticket Generated}$.
- If $\text{Available Seats} \le 0 \implies \text{Appended to Waitlist Queue at Position } (\text{Count}_{\text{Waiting}} + 1)$.

#### C. Cancellation Window Formula
$$\text{Cancellation Allowed} \iff \text{currentTime} \le (\text{eventDateTime} - \text{cancellationWindowHours})$$
- Default window: 2 hours prior to scheduled start time.

---

### 5. Module 6 Database Entities (`data/`)

#### A. Registration Entity (`data/registrations.json`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique registration ID (e.g. `reg_1730000000001`) |
| `eventId` | String | Identifier of the registered event |
| `userId` | String | Identifier of the student user |
| `userName` | String | Student's full name |
| `userEmail` | String | Student's campus email |
| `ticketId` | String | Foreign key linking to the issued Ticket |
| `ticketCode` | String | Human-readable scannable code (e.g. `EVT-1004-6058-AB3F`) |
| `status` | String | `"Confirmed"` or `"Cancelled"` |
| `teamSize` | Number | Registered team size (1 for individual, $>1$ for teams) |
| `teamMembers` | Array | Names/emails of registered teammates |
| `answers` | Object | Custom responses (Roll Number, special requirements, notes) |
| `registeredAt`| String | ISO timestamp of registration |
| `cancelledAt` | String/null | ISO timestamp of cancellation (or null if active) |

#### B. Waitlist Entity (`data/waitlist.json`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique waitlist ID (e.g. `wait_1730000000001`) |
| `eventId` | String | Identifier of the full event |
| `userId` | String | Identifier of the waiting student |
| `position` | Number | Current queue rank (`1`, `2`, `3`...) |
| `status` | String | `"Waiting"` \| `"Promoted"` \| `"Cancelled"` |
| `createdAt` | String | Timestamp when student joined the waitlist (FIFO ordering) |
| `promotedAt`| String/null | Timestamp when student was promoted to Confirmed |

#### C. Ticket Entity (`data/tickets.json`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique ticket record ID |
| `ticketCode` | String | Unique scannable code (e.g. `EVT-1004-6058-AB3F`) |
| `registrationId` | String | Reference to the parent registration |
| `eventId` | String | Event ID |
| `userId` | String | Student ID |
| `qrCode` | String | High-contrast Base64 PNG Data URL (`data:image/png;base64,...`) |
| `status` | String | `"Active"` \| `"Used"` \| `"Cancelled"` |
| `issuedAt` | String | Issuance timestamp |
| `usedAt` | String/null | Timestamp of gate check-in (or null) |

#### D. Attendance Record Entity (`data/attendance.json`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique attendance record ID |
| `eventId` | String | Event ID |
| `ticketCode` | String | Scanned ticket code |
| `userId` | String | Attendee student ID |
| `userName` | String | Attendee full name |
| `checkInTime` | String | Timestamp when ticket was scanned |
| `scannedBy` | String | User ID of organiser/admin who scanned |
| `status` | String | `"Checked In"` |

---

### 6. Detailed API Specifications & Sample Payloads

#### A. `POST /events/:id/register` (One-Click Event Registration)
- **Description:** Registers student, runs capacity check & Module 8 schedule clash check.
- **Sample Request:**
  ```http
  POST /events/1792921081004/register HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Cookie: token=eyJhbGciOi...

  {
    "teamSize": 2,
    "teamMembers": ["Priya Sharma"],
    "answers": {
      "rollNo": "21CS084",
      "notes": "Bringing HDMI adapters"
    }
  }
  ```
- **Sample Response (HTTP 201 Created — Seat Confirmed):**
  ```json
  {
    "success": true,
    "status": "Confirmed",
    "registration": {
      "id": "reg_1793897600001",
      "eventId": "1792921081004",
      "userId": "1792921156058",
      "userName": "Aarav Kumar",
      "ticketCode": "EVT-1004-6058-AB3F",
      "status": "Confirmed",
      "teamSize": 2,
      "registeredAt": "2026-11-05T17:00:00.000Z"
    },
    "ticket": {
      "ticketCode": "EVT-1004-6058-AB3F",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "status": "Active"
    },
    "message": "Registration successful! Your ticket has been generated."
  }
  ```
- **Sample Response (HTTP 200 OK — Queued to Waitlist):**
  ```json
  {
    "success": true,
    "status": "Waitlisted",
    "position": 1,
    "message": "Event is at full capacity (100 seats). You have been added to the waitlist at position #1."
  }
  ```

#### B. `DELETE /events/:id/register` (Cancel Registration & Auto-Promote)
- **Description:** Unregisters student, validates cancellation window, and auto-promotes the first waitlisted candidate.
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Registration successfully cancelled. Waitlisted student Bhavna Sharma was automatically promoted!",
    "autoPromoted": {
      "userId": "1792921156099",
      "userName": "Bhavna Sharma",
      "userEmail": "bhavna@campus.edu",
      "ticketCode": "EVT-1004-6099-C2D1"
    }
  }
  ```

#### C. `POST /attendance/scan` (QR Ticket Check-In)
- **Description:** Scans ticket code, checks organiser permissions, logs attendance, and rejects duplicate scans.
- **Sample Request:**
  ```http
  POST /attendance/scan HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Cookie: token=eyJhbGciOi...

  {
    "ticketCode": "EVT-1004-6058-AB3F",
    "eventId": "1792921081004"
  }
  ```
- **Sample Response (HTTP 200 OK — Successful Gate Check-In):**
  ```json
  {
    "success": true,
    "message": "Attendance Verified! Welcome, Aarav Kumar.",
    "attendee": {
      "ticketCode": "EVT-1004-6058-AB3F",
      "userName": "Aarav Kumar",
      "checkInTime": "2026-11-20T10:14:22.000Z",
      "status": "Checked In"
    }
  }
  ```
- **Sample Response (HTTP 400 Bad Request — Duplicate Scan Attempt):**
  ```json
  {
    "error": "Duplicate Scan: Ticket was already used for check-in on 2026-11-20T10:14:22.000Z.",
    "alreadyUsed": true
  }
  ```

#### D. `GET /events/:id/attendees` (Organiser Attendees Console & CSV Export)
- **Description:** Returns JSON dashboard metrics or direct downloadable CSV file.
- **Sample Request (JSON):**
  ```http
  GET /events/1792921081004/attendees HTTP/1.1
  Host: localhost:3000
  Accept: application/json
  Cookie: token=eyJhbGciOi...
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "event": { "title": "Hackathon 2026", "capacity": 100 },
    "summary": {
      "totalCapacity": 100,
      "totalRegistered": 42,
      "totalCheckedIn": 38,
      "totalWaitlist": 5,
      "attendanceRate": 90
    },
    "attendees": [ ... ],
    "waitlist": [ ... ]
  }
  ```
- **Sample Request (CSV Download):**
  ```http
  GET /api/events/1792921081004/attendees?format=csv HTTP/1.1
  Host: localhost:3000
  Cookie: token=eyJhbGciOi...
  ```
- **Sample CSV Output (`attendees-Hackathon_2026-1792921081004.csv`):**
  ```csv
  Registration ID,Ticket Code,Student Name,Student Email,Team Size,Registration Status,Attendance Status,Check-In Time,Registered At
  "reg_101","EVT-1004-6058-AB3F","Aarav Kumar","aarav@campus.edu",1,"Confirmed","Checked In","2026-11-20T10:14:22.000Z","2026-11-05T10:00:00.000Z"
  "reg_102","EVT-1004-6099-C2D1","Bhavna Sharma","bhavna@campus.edu",2,"Confirmed","Not Checked In","N/A","2026-11-05T10:05:00.000Z"
  ```

---

### 7. Viva & Evaluation Cheat Sheet 🎓
| Viva Question Asked by Examiner | Recommended Direct Answer |
| :--- | :--- |
| **Q1: How does capacity enforcement prevent overbooking?** | *"When a student registers, we count active registrations with `status: 'Confirmed'`. If this count meets `event.capacity`, the student is automatically added to `waitlist.json` with a sequence position instead of creating an overbooked ticket."* |
| **Q2: How does waitlist auto-promotion work?** | *"When an attendee unregisters, we look up the earliest entry in `waitlist.json` (`status: 'Waiting'` ordered by `createdAt`). We update that entry to `Promoted`, issue a confirmed registration with a new QR ticket, and re-index the remaining waitlist positions."* |
| **Q3: What math prevents double-booking in Module 8?** | *"We enforce the Golden Interval Overlap rule: `(newStart < existingEnd) && (newEnd > existingStart)`. If both conditions are true on the same calendar date, a collision exists, and registration returns HTTP 409 Conflict."* |
| **Q4: How are QR tickets generated without external web APIs?** | *"We use the standard `qrcode` library server-side to generate a high-contrast Base64 Data URL PNG string embedded directly in `tickets.json`. It renders locally in the browser with zero internet dependency and prints cleanly."* |
| **Q5: How do organisers prevent ticket duplication at the gate?** | *"Each ticket has a unique code. When scanned via `POST /attendance/scan`, the server updates the ticket to `Used`. If someone scans the same barcode a second time, the server detects `ticket.status === 'Used'` and rejects the scan with an instant alert."* |

---



## 🔔 Comprehensive Breakdown of Module 7: Notifications & Reminders

### 1. Purpose & Scope
Module 7 ensures the campus signal actually reaches people in real-time. It bridges the critical communication gap between event state changes and student attention.

Whenever events are published, seats open up, venues change, schedules update, or cancellation occurs, the system's event-driven architecture automatically alerts attendees and club organisers across multiple channels (**In-App Notifications**, **Email Outbox**, and **Push Notifications**).

Furthermore, Module 7 features an intelligent scheduled alarm engine that triggers **24-hour** and **1-hour** event reminders with strict, guaranteed deduplication.

---

### 2. How to Explain Module 7 "Like You're Explaining to a 5-Year-Old" 👶

| Real Life Situation | The Baby-Simple Story | Eventra Rule Enforced |
| :--- | :--- | :--- |
| **New Events Nobody Knows About** | The ice cream truck plays catchy music 🍦. Only the kids who love ice cream hear the chime and run outside! | **Interest-Matched Alerts:** When an event is published, students whose profile interests match the event category or tags receive instant alerts. |
| **Did My Seat Actually Get Booked?** | You buy a movie ticket at the box office and the clerk hands you a shiny gold printed pass 🎟️. | **Registration Confirmation:** A student with a confirmed seat receives immediate in-app, email, and push confirmations with their scannable ticket code. |
| **Waking Up Late & Forgetting the Event** | Mom sets a loud alarm clock 24 hours before your school picnic, and a friendly chime 1 hour before the bus departs ⏰. | **Scheduled Reminders (24h & 1h):** Automated background job scans upcoming events and reminds attendees at $T-24\text{h}$ and $T-1\text{h}$. |
| **Rain Moves the Picnic Indoors** | The picnic was scheduled on the open lawn, but sudden rain moves everyone into the gym 📍. | **Change Alerts:** When an organiser changes venue or timing, every confirmed and waitlisted attendee receives an instant location alert. |
| **Circus Performance Cancelled** | The circus clown gets sick so the performance is called off. The gatekeeper tells all ticket holders: "Don't come today!" ❌ | **Cancellation Alerts:** Cancelled events trigger alerts to all registered attendees and waitlisted candidates. |
| **Next Kid in Line Gets The Ticket** | The kid at the front of the line goes home. The next kid jumps up: "Hooray! I got the ticket!" 🚀 | **Waitlist Promotion Alert:** When an attendee cancels, the auto-promoted candidate receives a promotion notification + active QR ticket pass! |
| **Organiser Roll Call** | Every time a student climbs on the bus, the conductor taps the teacher: "Alice has arrived!" 👤 | **Organiser Alerts:** Club organisers receive real-time notifications when students register and when their accounts/events are verified. |
| **"Please Don't Spam My Phone"** | You tell the teacher you only want notes sent in your diary, not phone calls 🔕. | **User Preferences:** Students can toggle in-app, email, push, new event alerts, and reminders on/off at will. |

---

### 3. Architecture & Event-Driven Engine

Module 7 operates on an asynchronous **Event-Driven Architecture (EDA)** built around a central Singleton Event Bus (`lib/eventBus.js`):

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         BUSINESS EVENT TRIGGERS                        │
 ├───────────────────┬───────────────────┬───────────────────┬────────────┤
 │ POST /register    │ DELETE /register  │ PUT /events/:id   │ Admin      │
 │ (Seat Confirmed)  │ (Waitlist Promo)  │ (Venue Changed)   │ Approves   │
 └─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴──────┬─────┘
           │                   │                   │                │
           ▼                   ▼                   ▼                ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      EVENTRA EVENT BUS (Singleton)                     │
 │   'registration:confirmed'  'waitlist:promoted'  'event:updated' ...  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   FEATURE HANDLER & PREFERENCE CHECK                   │
 │   - Verify recipient user preferences (inApp? email? push?)            │
 │   - Filter by alert category (newEventAlerts? reminders? updates?)     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼────────────────────────┐
           ▼                         ▼                        ▼
 ┌───────────────────┐     ┌───────────────────┐    ┌───────────────────┐
 │  IN-APP CHANNEL   │     │   EMAIL OUTBOX    │    │    PUSH OUTBOX    │
 │ data/notifications│     │ data/email_outbox │    │ data/push_outbox  │
 │  Bell Icon & Pass │     │  Formatted HTML   │    │  Mobile App Ping  │
 └───────────────────┘     └───────────────────┘    └───────────────────┘
```

#### Scheduled Reminders Engine (`lib/reminders.js`):
```
 ┌────────────────────────┐
 │ Scheduled Timer / Cron │ ──► checkAndSendReminders({ referenceDate })
 └────────────────────────┘                  │
                                             ▼
                               ┌───────────────────────────┐
                               │ Query all Published Events│
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ Time Difference Window:   │
                               │ Δt = (EventUTC - RefUTC)  │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴────────────────────┐
                       ▼                                          ▼
            ┌──────────────────────┐                   ┌──────────────────────┐
            │ Window A (24-Hour):  │                   │  Window B (1-Hour):  │
            │  1.0h < Δt <= 25.0h  │                   │  0.0h < Δt <= 1.5h   │
            └──────────┬───────────┘                   └──────────┬───────────┘
                       │                                          │
                       ▼                                          ▼
            ┌──────────────────────┐                   ┌──────────────────────┐
            │ Deduplication Check: │                   │ Deduplication Check: │
            │ Already sent 24h?    │                   │ Already sent 1h?     │
            └──────────┬───────────┘                   └──────────┬───────────┘
                       │ (No)                                     │ (No)
                       ▼                                          ▼
            [ Dispatch 24h Alert ]                     [ Dispatch 1h Alert ]
```

---

### 4. Golden Rules & Mathematical Logic Enforced

#### A. Timezone-Independent Event Coordinate Calculation
To avoid localized daylight saving or UTC offset bugs between server and client:
$\Delta t = \frac{t_{\text{event}} - t_{\text{ref}}}{3.6 \times 10^6 \text{ ms/hour}}$

#### B. 24-Hour Reminder Window & Deduplication Rule
$\text{Trigger 24h} \iff (1.0 < \Delta t \le 25.0) \land \neg \text{Sent}(\text{userId}, \text{eventId}, \text{'reminder\_24h'})$
- If an attendee was already issued a 24-hour reminder for the event, subsequent runs skip the user.

#### C. 1-Hour Reminder Window & Deduplication Rule
$\text{Trigger 1h} \iff (0.0 < \Delta t \le 1.5) \land \neg \text{Sent}(\text{userId}, \text{eventId}, \text{'reminder\_1h'})$
- Fired when kickoff is within 90 minutes.

#### D. Interest Matching Set Intersection Rule
A student receives an automated "New Event" alert upon publication if:
$(\text{Student.Interests} \cap \{\text{Event.Category}\}) \ne \emptyset \quad \lor \quad (\text{Student.Interests} \cap \text{Event.Tags}) \ne \emptyset$
Case-insensitive matching ensures `"coding"` matches `"Coding"` or `"TECHNICAL"`.

---

### 5. Module 7 Database Entities (`data/`)

#### A. Notification Entity (`data/notifications.json`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique notification ID (e.g. `notif_1793947200000_a1b2c`) |
| `userId` | String | Recipient user ID |
| `title` | String | Notification headline (e.g. `"🎟️ Registration Confirmed: Hackathon"`) |
| `message` | String | Human-readable detailed description |
| `type` | String | Categorical enum (`new_event`, `registration_confirmation`, `reminder_24h`, `reminder_1h`, `venue_change`, `schedule_change`, `event_updated`, `event_cancelled`, `waitlist_promotion`, `organiser_registration`, `event_approval`, `organiser_verified`) |
| `channels` | Array | Channels used: `['in_app', 'email', 'push']` |
| `isRead` | Boolean | Read state (`false` by default) |
| `readAt` | String/null | ISO timestamp when read |
| `metadata` | Object | Associated data (`eventId`, `ticketCode`, `venue`, `date`, `startTime`, `oldVenue`...) |
| `createdAt` | String | ISO timestamp of issuance |

#### B. NotificationPreference Entity (`data/notification_preferences.json`)
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `userId` | String | — | Foreign key linking to user account |
| `inApp` | Boolean | `true` | Receive in-app bell notifications |
| `email` | Boolean | `true` | Receive simulated email delivery |
| `push` | Boolean | `true` | Receive mobile push alerts |
| `newEventAlerts` | Boolean | `true` | Alerts for new events matching interests |
| `reminders` | Boolean | `true` | 24h & 1h event kickoff reminders |
| `statusUpdates` | Boolean | `true` | Venue changes, schedule edits, cancellations |
| `updatedAt` | String | — | Timestamp of last preference update |

#### C. Email Outbox Entity (`data/email_outbox.json`)
Simulated delivery log recording outbound email dispatches with `id`, `to`, `subject`, `text`, `html`, `type`, `sentAt`, and `status: "Delivered"`.

#### D. Push Outbox Entity (`data/push_outbox.json`)
Simulated mobile delivery log recording push notification payloads with `id`, `userId`, `title`, `body`, `payload`, `sentAt`, and `status: "Sent"`.

---

### 6. Detailed API Specifications & Sample Payloads

#### A. `GET /notifications` (Fetch User Notifications)
- **Description:** Returns all notifications for the authenticated user, unread counter, and optional filters (`?unreadOnly=true`, `?type=...`, `?limit=...`).
- **Sample Request:**
  ```http
  GET /notifications?unreadOnly=true HTTP/1.1
  Host: localhost:3000
  Cookie: token=eyJhbGciOi...
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "unreadCount": 2,
    "totalCount": 8,
    "returnedCount": 2,
    "notifications": [
      {
        "id": "notif_1793947200001_8f2d",
        "userId": "1792921156058",
        "title": "⏰ 24-Hour Reminder: Full Stack Hackathon 2026",
        "message": "Friendly reminder! \"Full Stack Hackathon 2026\" starts in 24 hours on 2026-11-20 at 10:00 in Main Auditorium. Don't forget your digital ticket (EVT-1004-6058-AB3F)!",
        "type": "reminder_24h",
        "channels": ["in_app", "email", "push"],
        "isRead": false,
        "readAt": null,
        "metadata": {
          "eventId": "1792921081004",
          "ticketCode": "EVT-1004-6058-AB3F",
          "date": "2026-11-20",
          "startTime": "10:00",
          "venue": "Main Auditorium"
        },
        "createdAt": "2026-11-19T10:00:00.000Z"
      }
    ]
  }
  ```

#### B. `PATCH /notifications/:id/read` (Mark Notification As Read)
- **Description:** Marks a single notification as read, or batch marks all if `:id` is `'all'`. Enforces user ownership check (HTTP 403 if attempting to alter someone else's alerts).
- **Sample Request (Single):**
  ```http
  PATCH /notifications/notif_1793947200001_8f2d/read HTTP/1.1
  Host: localhost:3000
  Cookie: token=eyJhbGciOi...
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Notification marked as read.",
    "notification": {
      "id": "notif_1793947200001_8f2d",
      "isRead": true,
      "readAt": "2026-11-19T10:05:22.100Z"
    }
  }
  ```

#### C. `PUT /notifications/preferences` (Update Notification Preferences)
- **Description:** Updates channel and alert category preferences for the logged-in user.
- **Sample Request:**
  ```http
  PUT /notifications/preferences HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json
  Cookie: token=eyJhbGciOi...

  {
    "inApp": true,
    "email": true,
    "push": false,
    "newEventAlerts": true,
    "reminders": true,
    "statusUpdates": true
  }
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Notification preferences updated successfully.",
    "preferences": {
      "userId": "1792921156058",
      "inApp": true,
      "email": true,
      "push": false,
      "newEventAlerts": true,
      "reminders": true,
      "statusUpdates": true,
      "updatedAt": "2026-11-19T10:06:00.000Z"
    }
  }
  ```

#### D. `POST /notifications/reminders/run` (Execute Scheduled Reminders)
- **Description:** Triggers the reminder check on demand. Accepts optional `{ referenceDate }` for testing future time horizons.
- **Sample Request:**
  ```http
  POST /notifications/reminders/run HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json

  {
    "referenceDate": "2026-11-20T09:00:00.000Z"
  }
  ```
- **Sample Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Reminder check executed. 4 reminder(s) generated.",
    "referenceTime": "2026-11-20T09:00:00.000Z",
    "checkedEventsCount": 3,
    "remindersSentCount": 4,
    "reminders": [ ... ]
  }
  ```

---

### 7. Viva & Evaluation Cheat Sheet 🎓

| Viva Question Asked by Examiner | Recommended Direct Answer |
| :--- | :--- |
| **Q1: Why did you choose an event-driven architecture for notifications?** | *"By using an Event Bus (`EventEmitter`), we decoupled the notification system completely from registration, event editing, and admin approval workflows. When an event occurs, the caller simply emits an event, allowing multiple listeners (in-app, email, push) to react independently without cluttering core business logic."* |
| **Q2: How do you prevent duplicate reminder notifications when the cron job runs frequently?** | *"Before dispatching a `reminder_24h` or `reminder_1h`, the engine queries `notifications.json` for an existing notification with the same `userId`, `eventId`, and `type`. If found, the reminder is skipped, ensuring students receive exactly one 24h reminder and one 1h reminder."* |
| **Q3: How are new event alerts targeted to specific students?** | *"When an event is published, the handler inspects all student accounts and computes the set intersection between the student's `interests` array and the event's `category` and `tags`. If there is any match, the student receives an alert; otherwise, irrelevant notifications are suppressed."* |
| **Q4: How do user preferences stop unwanted notifications?** | *"Every notification dispatch passes through `createNotification()`. It loads the recipient's `NotificationPreference` record and verifies both channel toggles (`inApp`, `email`, `push`) and category toggles (`newEventAlerts`, `reminders`, `statusUpdates`). If the user disabled that category or channel, the dispatch is cleanly suppressed."* |
| **Q5: How can examiners test the 24h and 1h reminders without waiting for tomorrow?** | *"We exposed `POST /notifications/reminders/run` and the CLI runner `node scripts/run-reminders.js --date YYYY-MM-DDTHH:MM:SSZ`. Evaluators can pass any future target timestamp as `referenceDate`, and the engine calculates the time delta and fires the appropriate reminders instantly."* |

---



---

## 📅 Comprehensive Breakdown of Module 8: Personal Calendar & Schedule Integration

### 1. Purpose & Scope
Module 8 fits campus events into a student's actual weekly life. While other modules focus on event listings and venue bookings, Module 8 solves the real student problem: **"Can I actually attend this event without missing my classes or double-booking myself?"**

### 2. Core Functional Features Implemented
1. **Personal Unified Calendar (`/calendar`):**
   - Displays a weekly agenda (Monday through Sunday) combining:
     - 📚 Recurring class timetable lectures (e.g., DBMS, OS, Data Structures).
     - 🎟️ Confirmed registered campus events.
     - ⭐ Bookmarked events saved for later.
2. **Class Timetable Management:**
   - **Manual Slot Entry:** Students can add recurring lecture slots with Subject name, Day of week, Start time, End time, Room/Lab, and Instructor.
   - **1-Click College Preset:** "⚡ Load Sample College Timetable" automatically populates a realistic engineering schedule (DBMS, OS, AI, Networks).
   - **File Import:** Supports importing weekly schedules directly from `.json` or `.csv` files.
   - **Slot Deletion:** Instant removal of slots with confirmation.
3. **Personal Clash Warning Engine:**
   - Detects when an event clashes with recurring class lectures:
     - *"Personal Clash: This event overlaps your DBMS Lecture on Thursday from 10:00 to 11:00 (Room: Lab 3)."*
   - Detects double-booking when an event overlaps another already registered event:
     - *"Personal Clash: You are already registered for 'Robotics Seminar' on 2026-11-13 from 14:00 to 16:00."*
   - Integrated directly into the **Module 6 Event Registration flow** (`registerStudent`), blocking conflicting registrations with `HTTP 409 Conflict` unless overridden.
4. **Free-Slot Finder:**
   - Computes open, unoccupied time blocks between campus hours (`08:00` to `18:00`) for any selected date.
   - Merges contiguous busy intervals and reports exact available time blocks and duration in minutes.
5. **.ics Calendar Export (RFC 5545):**
   - One-click `.ics` download (`/calendar/export.ics` and `/api/calendar/export.ics`).
   - Generates standards-compliant iCalendar files compatible with **Google Calendar**, **Apple Calendar**, and **Microsoft Outlook**.
   - Includes recurring weekly lecture rules (`RRULE:FREQ=WEEKLY;BYDAY=TH`).

---

### 3. Mathematical Overlap & Free-Slot Interval Algorithms

#### A. The Golden Interval Overlap Formula
Two time intervals `[A_start, A_end]` and `[B_start, B_end]` collide if and only if:
```text
(A_start < B_end) AND (A_end > B_start)
```
- If an event runs `10:30 - 12:00` and a DBMS lecture runs `10:00 - 11:00`:
  - `10:30 < 11:00` (True) AND `12:00 > 10:00` (True) => **COLLISION DETECTED**.
- If an event starts exactly when class ends (`11:00 - 12:00`):
  - `11:00 < 11:00` (False) => **NO CLASH (Adjacent times permitted)**.

#### B. Chronological Gap-Finding Algorithm for Free Slots
1. Collect all busy intervals for date D (timetable lectures for that day of week + registered events).
2. Sort intervals chronologically by `startTime`.
3. Merge overlapping or contiguous busy intervals.
4. Iterate from `dayStart` (`08:00`) to `dayEnd` (`18:00`):
   - If `currentTime < busy.startTime`, add `[currentTime, busy.startTime]` as a **Free Slot**.
   - Advance `currentTime` to `max(currentTime, busy.endTime)`.
5. If `currentTime < dayEnd`, append final interval `[currentTime, dayEnd]`.

---

### 4. Data Entities & Schema

#### A. TimetableSlot (`data/timetable.json`)
```json
[
  {
    "id": "slot_1731234567_abc12",
    "userId": "1730000000001",
    "subject": "DBMS Lecture",
    "dayOfWeek": "Thursday",
    "startTime": "10:00",
    "endTime": "11:00",
    "room": "Lab 3",
    "instructor": "Prof. Sharma",
    "createdAt": "2026-11-10T10:00:00.000Z"
  }
]
```

#### B. PersonalSchedule Composite Entity
```json
{
  "user": { "id": "1730000000001", "name": "Rishi Student", "role": "student" },
  "schedule": {
    "timetable": [ ... ],
    "registeredEvents": [ ... ],
    "bookmarkedEvents": [ ... ]
  },
  "weeklyAgenda": {
    "Monday": [ ... ],
    "Tuesday": [ ... ],
    "Wednesday": [ ... ],
    "Thursday": [ ... ],
    "Friday": [ ... ],
    "Saturday": [ ... ],
    "Sunday": [ ... ]
  },
  "freeSlots": [
    { "startTime": "08:00", "endTime": "10:00", "durationMinutes": 120 },
    { "startTime": "11:00", "endTime": "14:00", "durationMinutes": 180 },
    { "startTime": "16:00", "endTime": "18:00", "durationMinutes": 120 }
  ]
}
```

---

### 5. Module 8 API Endpoints
| HTTP Method | Route & Middleware Alias | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/calendar` & `/api/calendar` | Authenticated | Fetches student schedule, weekly agenda, and optional `?date=` free slots. |
| `POST` | `/calendar/timetable` & `/api/calendar/timetable` | Authenticated | Adds a single timetable slot or bulk array (`slots: [...]`) from file import. |
| `GET` | `/calendar/timetable` & `/api/calendar/timetable` | Authenticated | Lists all recurring class timetable slots for the logged-in student. |
| `DELETE` | `/calendar/timetable?id=` & `/api/calendar/timetable?id=` | Authenticated | Removes a specific timetable slot by ID. |
| `GET` | `/calendar/clashes` & `/api/calendar/clashes` | Authenticated | Checks if `?eventId=` or custom date/time overlaps lectures or registered events. |
| `GET` | `/calendar/export.ics` & `/api/calendar/export.ics` | Authenticated | Generates and downloads an RFC 5545 iCalendar (`.ics`) file. |

---

### 6. Viva & Evaluation Cheat Sheet 🎓

| Viva Question Asked by Examiner | Recommended Direct Answer |
| :--- | :--- |
| **Q1: Why is personal schedule clash detection different from venue clash detection?** | *"Venue clash detection (Module 4) checks if two physical events are competing for the same room. Personal schedule clash detection (Module 8) checks the student's personal schedule: preventing double-booking across registered events and warning when an event overlaps their recurring class timetable."* |
| **Q2: How does the system map a specific calendar date (e.g. `2026-11-12`) to a recurring weekly lecture?** | *"The helper `getDayOfWeekFromDate()` parses the target event date and extracts the day name (e.g., 'Thursday'). The engine filters the student's `timetable.json` for slots on that day of week, and applies the interval overlap condition `(startA < endB) && (endA > startB)`."* |
| **Q3: How does the `.ics` export work with Google Calendar or Apple Calendar?** | *"We generate an RFC 5545 compliant iCalendar string containing `BEGIN:VCALENDAR`, `VEVENT` blocks with UTC/local timestamps, and `RRULE:FREQ=WEEKLY;BYDAY=...` recurrence rules. We serve it with `Content-Type: text/calendar` and `Content-Disposition: attachment; filename=eventra-calendar.ics`, enabling one-click import into any calendar app."* |
| **Q4: How does the free-slot calculation handle multiple overlapping classes?** | *"The algorithm first sorts all occupied intervals chronologically and merges contiguous or overlapping intervals into unified busy blocks. It then scans between `08:00` and `18:00` to find remaining gaps, accurately outputting start times, end times, and duration minutes."* |
| **Q5: Is Module 8 integrated into Module 6 registration?** | *"Yes! In `lib/registrationEngine.js`, before confirming a registration, `checkPersonalScheduleClash()` is executed. If a clash exists with the student's class timetable or an existing event, registration is rejected with HTTP 409 Conflict, protecting the student's attendance."* |

---

## 📂 Project Directory Structure

```text
Eventra/
├── app/
│   ├── admin/
│   │   └── page.js                 # Admin Panel: Verify Organisers & Approve/Publish Events
│   ├── api/
│   │   ├── attendance/
│   │   │   └── scan/route.js       # POST /api/attendance/scan (Organiser QR Ticket Check-In)
│   │   ├── auth/
│   │   │   ├── login/route.js      # POST /api/auth/login
│   │   │   ├── logout/route.js     # POST /api/auth/logout
│   │   │   └── register/route.js   # POST /api/auth/register
│   │   ├── calendar/
│   │   │   ├── clashes/route.js    # GET /api/calendar/clashes (Module 8 Clash Checker)
│   │   │   ├── export.ics/route.js # GET /api/calendar/export.ics (Module 8 .ics Calendar Export)
│   │   │   ├── timetable/route.js  # GET, POST, DELETE /api/calendar/timetable
│   │   │   └── route.js            # GET /api/calendar (Schedule, Weekly Agenda & Free Slots)
│   │   ├── categories/route.js     # GET, POST /api/categories
│   │   ├── notifications/
│   │   │   ├── [id]/
│   │   │   │   └── read/route.js   # PATCH /api/notifications/:id/read
│   │   │   ├── outbox/route.js     # GET /api/notifications/outbox
│   │   │   ├── preferences/route.js# GET, PUT /api/notifications/preferences
│   │   │   ├── reminders/
│   │   │   │   └── run/route.js    # POST /api/notifications/reminders/run
│   │   │   └── route.js            # GET, DELETE /api/notifications
│   │   ├── discover/
│   │   │   ├── api/route.js        # Alias handler for /discover
│   │   │   ├── recommended/route.js# GET /api/discover/recommended
│   │   │   └── route.js            # GET /api/discover
│   │   ├── clash/
│   │   │   ├── check/route.js      # POST /api/clash/check (Module 4 Clash Engine)
│   │   │   ├── report/route.js     # GET /api/clash/report (Module 4 Audit Report)
│   │   │   └── suggestions/route.js# GET /api/clash/suggestions (Smart Alternatives)
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── attendees/route.js # GET /api/events/:id/attendees (JSON & CSV export)
│   │   │   │   ├── bookmark/route.js  # POST /api/events/:id/bookmark
│   │   │   │   ├── register/route.js  # POST, DELETE, GET /api/events/:id/register
│   │   │   │   ├── status/route.js    # PATCH /api/events/:id/status
│   │   │   │   └── route.js           # GET, PUT, DELETE /api/events/:id
│   │   │   ├── mine/route.js       # GET /api/events/mine
│   │   │   ├── search/route.js     # GET /api/events/search
│   │   │   └── route.js            # GET, POST /api/events
│   │   ├── organisers/
│   │   │   ├── pending/route.js    # GET /api/organisers/pending
│   │   │   └── verify/route.js     # POST /api/organisers/verify
│   │   ├── tags/route.js           # GET, POST /api/tags
│   │   ├── upload/route.js         # POST /api/upload (Poster upload)
│   │   ├── users/
│   │   │   └── me/route.js         # GET, PATCH /api/users/me
│   │   └── venues/
│   │       ├── [id]/
│   │       │   ├── availability/route.js # GET /api/venues/:id/availability
│   │       │   ├── blackouts/route.js    # GET, POST, DELETE /api/venues/:id/blackouts
│   │       │   ├── bookings/route.js     # GET, POST, PATCH /api/venues/:id/bookings
│   │       │   └── route.js              # GET, PUT, DELETE /api/venues/:id
│   │       ├── bookings/route.js         # GET /api/venues/bookings
│   │       └── route.js                  # GET, POST /api/venues
│   ├── attendance/
│   │   └── scan/route.js           # Direct alias handler for POST /attendance/scan
│   ├── clash/
│   │   ├── check/route.js          # Direct route alias for POST /clash/check
│   │   ├── report/page.js          # Module 4 Clash Audit Report View Page
│   │   └── suggestions/route.js    # Direct route alias for GET /clash/suggestions
│   ├── discover/
│   │   └── page.js                 # Module 5 Student Event Discovery Feed UI
│   ├── events/
│   │   ├── [id]/
│   │   │   ├── attendees/page.js   # Module 6 Attendance Dashboard & QR Scanner
│   │   │   ├── bookmark/route.js   # Direct alias for POST /events/:id/bookmark
│   │   │   ├── register/route.js   # Direct alias for /events/:id/register
│   │   │   ├── status/route.js     # Alias handler for /events/:id/status
│   │   │   └── page.js             # Event Detail & QR Ticket Pass UI
│   │   ├── create/page.js          # Create Event Form (Live Module 4 validation & suggestions)
│   │   ├── edit/[id]/page.js       # Edit Event Form (Live Module 4 validation)
│   │   ├── mine/route.js           # Alias handler for /events/mine
│   │   ├── search/route.js         # Direct alias for GET /events/search
│   │   └── route.js                # Alias handler for /events
│   ├── globals.css                 # Simple, modern responsive stylesheet
│   ├── layout.js                   # Root HTML shell & top navigation bar (with Clash Report)
│   ├── login/page.js               # User Login Page
│   ├── my-events/page.js           # Organiser Event Management Dashboard
│   ├── page.js                     # Home Landing Page with dynamic role greeting
│   ├── notifications/
│   │   ├── [id]/read/route.js      # Direct alias for PATCH /notifications/:id/read
│   │   ├── preferences/route.js    # Direct alias for /notifications/preferences
│   │   ├── reminders/run/route.js  # Direct alias for /notifications/reminders/run
│   │   └── page.js                 # Module 7 Notifications Center UI & Preferences
│   ├── profile/page.js             # User Profile & Edit Details Page
│   ├── register/page.js            # User Registration Page (Student / Organiser)
│   └── venues/
│       ├── [id]/page.js            # Venue Detail, Blackouts & Booking Management Page
│       ├── create/page.js          # Add New Venue Form Page (Admin)
│       ├── edit/[id]/page.js       # Edit Venue Form Page (Admin)
│       └── page.js                 # Venue Management Dashboard
├── data/
│   ├── attendance.json             # Event check-in and attendance records
│   ├── bookmarks.json              # Student bookmarked events
│   ├── email_outbox.json           # Simulated multi-channel email transmission outbox
│   ├── bookings.json               # Venue bookings and blackout records database
│   ├── categories.json             # Event categories database
│   ├── events.json                 # Events database
│   ├── notification_preferences.json# User notification channel & category preferences
│   ├── notifications.json          # In-app notifications database
│   ├── push_outbox.json            # Simulated push notification transmission outbox
│   ├── registrations.json          # Student event registrations database
│   ├── tags.json                   # Event tags database
│   ├── tickets.json                # Digital QR tickets database
│   ├── users.json                  # User accounts database
│   ├── venues.json                 # Campus venues database
│   └── waitlist.json               # Event waitlist queues database
├── lib/
│   ├── auth.js                     # Bcrypt hashing & JWT token verification helpers
│   ├── clashEngine.js              # Module 4 Clash Engine (interval logic, 5 clashes, suggestions, report)
│   ├── db.js                       # Safe atomic JSON read/write persistence functions
│   ├── eventBus.js                 # Module 7 Event-driven singleton Event Bus
│   ├── notifications.js            # Module 7 Multi-channel dispatcher & event listeners
│   ├── reminders.js                # Module 7 Scheduled 24h & 1h reminder runner
│   ├── personalSchedule.js         # Module 8 Personal Schedule Clash Detection
│   ├── recommendation.js           # Module 5 Match score algorithm
│   ├── registrationEngine.js       # Module 6 Registration, Waitlist FIFO & QR engine
│   └── venueValidation.js          # Module 3 & 4 Venue, Clash, & Admin Override adapter
├── middleware.js                   # Dual-path routing for Venues, Clash, Events, Attendance
├── public/
│   └── uploads/                    # Local storage directory for uploaded posters
├── scripts/
│   ├── test-module2.js             # Automated Module 1 & 2 integration test suite
│   ├── test-module3.js             # Automated 24-point Module 3 venue management test suite
│   ├── test-module4.js             # Automated 19-point Module 4 clash management test suite
│   ├── test-module5.js             # Automated 12-point Module 5 event discovery test suite
│   ├── test-module6.js             # Automated 21-point Module 6 registration & attendance test suite
│   ├── test-module7.js             # Automated 27-point Module 7 notifications & reminders test suite
│   ├── test-module8.js             # Automated 30-point Module 8 personal calendar test suite
│   └── run-reminders.js            # Module 7 CLI scheduled reminder runner
├── package.json                    # Project dependencies & scripts
├── README.md                       # Comprehensive documentation
└── TESTING.md                      # Detailed manual testing guide
```

---

## 🔑 Pre-Configured Test Accounts & Venues

### Test Accounts
| Account Type | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@eventra.edu` | `admin123` | `admin` | Full access: Add/edit venues, verify organisers, block dates, approve bookings & events |
| **Verified Organiser** | `rishiraj18sep2005@gmail.com` | *(your password)* | `organiser` | Create, edit, manage, and request venue bookings for club events |

### Pre-Seeded College Venues (`data/venues.json`)
| Venue Name | Type | Capacity | Location | Operating Hours |
| :--- | :--- | :--- | :--- | :--- |
| **Main Auditorium** | Auditorium | 500 | Block A, Ground Floor | 08:00 - 20:00 (Mon-Sat) |
| **Seminar Hall 1** | Seminar Hall | 150 | Block B, First Floor | 09:00 - 18:00 (Mon-Fri) |
| **Computer Science Lab 1** | Lab | 60 | Block C, Second Floor | 08:30 - 17:30 (Mon-Sat) |
| **Main Sports Ground** | Playground | 1000 | Behind Block D | 06:00 - 19:00 (Daily) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18.x or higher
- **npm** v9.x or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/tanishsarkar28/Eventra.git
cd Eventra
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Testing & Verification

### Method A: Automated Test Suite (Recommended)
Eventra includes automated test suites that validate all authentication, event CRUD, status transition, role permission, venue management, and scheduling conflict rules:

```bash
# 1. Build and start production server
npm run build
npm start

# 2. In a second terminal, execute the test runners:
# Run Module 1 & 2 tests (16 checks)
node scripts/test-module2.js

# Run Module 3 Venue Management tests (24 checks)
node scripts/test-module3.js

# Run Module 4 Venue & Clash Management tests (19 checks)
node scripts/test-module4.js

# Run Module 5 Student Event Discovery tests (12 checks)
node scripts/test-module5.js

# Run Module 6 Registration & Attendance tests (21 checks)
node scripts/test-module6.js

# Run Module 7 Notifications & Reminders tests (27 checks)
node scripts/test-module7.js
```

### Method B: Manual Testing Walkthrough (Module 6: Registration & Attendance)
1. **Student Registration & QR Pass:** Log in as student (`rahul@campus.edu` / `pass123`), navigate to **Discover Events** (`/discover`), and click on an event to view its details (`/events/:id`). Fill in team size and optional student roll number, then click **⚡ One-Click Register Now**. The page immediately displays your **Confirmed Pass** containing your personal scannable QR ticket code!
2. **Module 8 Schedule Clash Prevention:** Try to register for another event scheduled on the same date and overlapping hours. Notice the system blocks duplicate scheduling with a clear warning: *"Module 8 Personal Schedule Clash Detected"*.
3. **Waitlist & Auto-Promotion:** When an event's confirmed registrations equal its venue capacity, the next student attempting to register receives a **Waitlisted (Position #1)** badge. If the registered student cancels their ticket, the waitlisted student is automatically promoted and issued a confirmed QR ticket!
4. **Organiser QR Check-in Console:** Log in as the club organiser (`rishiraj18sep2005@gmail.com`), go to **My Events** (`/my-events`), and click **📋 Attendees & QR**. You can scan student QR passes or type their ticket code to check them in with real-time attendance rate updates.
5. **Attendance Export (CSV):** Click **⬇️ Export Attendance (CSV)** on the attendees console to download a complete, formatted spreadsheet for college records.


### Method C: Manual Testing Walkthrough (Module 7: Notifications & Reminders)
1. **In-App Notification Bell & Center:** Open [http://localhost:3000/notifications](http://localhost:3000/notifications) (or click **🔔 Notifications** in the top navigation bar).
2. **Notification Preferences:** Click **⚙️ Preferences** to toggle channels (In-App, Email, Push) and categories (New Event alerts, Reminders, Status changes). Click **💾 Save Preferences**.
3. **Simulated Outbox Preview:** In the preferences panel, click **📬 Inspect Simulated Email/Push Outbox** to view recent outbound emails and push payloads.
4. **Trigger Reminders On-Demand:** Click **⏱️ Run Reminders** to run the scheduled reminder engine immediately on upcoming events.
5. **Mark Read / Clear:** Click **✓ Mark Read** on individual notification cards or **✓ Mark All Read** to clear unread badge counters.



### Method D: Manual Testing Walkthrough (Module 8: Personal Calendar & Timetable)
1. **Open Calendar View:** Log in as student and click **📅 My Calendar** in the navigation bar (or navigate to [http://localhost:3000/calendar](http://localhost:3000/calendar)).
2. **Weekly Agenda:** View the unified weekly schedule showing both registered campus events and classes.
3. **Add Timetable Lectures:** Click the **📚 Manage Timetable** tab. You can add a manual slot (e.g. *DBMS Lecture*, *Thursday*, *10:00 - 11:00*, *Lab 3*), or simply click **⚡ Load Sample College Timetable** to instantly load a full semester schedule!
4. **Test Personal Clash Warning:** Click the **⚠️ Personal Clash Checker** tab. Pick an event or type a time overlapping Thursday 10:00 - 11:00. The system displays an immediate warning: *"Personal Clash: This event overlaps your DBMS Lecture on Thursday from 10:00 to 11:00 (Room: Lab 3)"*.
5. **View Free Slots:** Click the **⏰ Free-Slot View** tab, pick any date, and see available open hours (e.g., *08:00 - 10:00 (120 mins)* and *11:00 - 14:00 (180 mins)*).
6. **Export .ics Calendar:** Click **📥 Export .ics (Sync with Google / Apple Calendar)** in the top right to download your standard calendar file.

For full step-by-step browser testing for all modules, refer to **[TESTING.md](TESTING.md)**.
