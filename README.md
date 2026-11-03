# Eventra - Campus Event Management System

**Eventra** is a lightweight, modern campus event management web application developed as a college project using **React** and **Next.js 14 (App Router)** in plain JavaScript.

The repository is built following a clean, modular structure with zero complex abstractions, making it readable, explainable, and easy to evaluate for college demonstrations.

---

## 📌 Project Team & Module Distribution

| Student | Assigned Modules | Current Status |
| :--- | :--- | :--- |
| **Student 1 (Tanish)** | **Module 1** (Auth & User Management), **Module 4** (Venue & Clash Management), **Module 7** | Module 1 Completed ✅, Module 4 Completed ✅ |
| **Student 2 (Rishi)** | **Module 2** (Event Management), **Module 5** (Student Event Discovery), **Module 8** | Module 2 Completed ✅, Module 5 Completed ✅ |
| **Student 3 (Anush)** | **Module 3** (Venue Management), **Module 6**, **Module 9** | Module 3 Completed ✅ |

---

## 🏗️ Architecture & Technical Stack

- **Frontend Framework:** Next.js 14 (App Router) + React 18
- **Language:** Plain JavaScript (`.js` files, beginner-friendly, zero TypeScript overhead)
- **Styling:** Custom lightweight CSS (`app/globals.css`) with clean card containers, modern pill navigation, responsive tables, and status badges. Zero heavy UI frameworks (no Tailwind/Bootstrap required).
- **Backend & APIs:** Next.js Route Handlers (`app/api/...`) with seamless dual-path compatibility (`/events/...` and `/venues/...`) powered by `middleware.js`.
- **Database System:** File-based JSON storage inside `data/` (`users.json`, `events.json`, `categories.json`, `tags.json`, `venues.json`, `bookings.json`), accessed via safe atomic read/write functions in `lib/db.js`.
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

## 📂 Project Directory Structure

```text
Eventra/
├── app/
│   ├── admin/
│   │   └── page.js                 # Admin Panel: Verify Organisers & Approve/Publish Events
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js      # POST /api/auth/login
│   │   │   ├── logout/route.js     # POST /api/auth/logout
│   │   │   └── register/route.js   # POST /api/auth/register
│   │   ├── categories/route.js     # GET, POST /api/categories
│   │   ├── discover/
│   │   ├── api/route.js            # Alias handler for /discover
│   │   └── page.js                 # Module 5 Student Event Discovery Feed UI
│   ├── clash/
│   │   │   ├── check/route.js      # POST /api/clash/check (Module 4 Clash Engine)
│   │   │   ├── report/route.js     # GET /api/clash/report (Module 4 Audit Report)
│   │   │   └── suggestions/route.js# GET /api/clash/suggestions (Smart Alternatives)
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── route.js        # GET, PUT, DELETE /api/events/:id
│   │   │   │   └── status/route.js # PATCH /api/events/:id/status (Module 4 validation & Admin override)
│   │   │   ├── mine/route.js       # GET /api/events/mine
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
│   ├── clash/
│   │   ├── check/route.js          # Direct route alias for POST /clash/check
│   │   ├── report/page.js          # Module 4 Clash Audit Report View Page
│   │   └── suggestions/route.js    # Direct route alias for GET /clash/suggestions
│   ├── events/
│   │   ├── [id]/
│   │   │   ├── route.js            # Alias handler for /events/:id
│   │   │   └── status/route.js     # Alias handler for /events/:id/status
│   │   ├── create/page.js          # Create Event Form (Live Module 4 validation & suggestions)
│   │   ├── edit/[id]/page.js       # Edit Event Form (Live Module 4 validation)
│   │   ├── mine/route.js           # Alias handler for /events/mine
│   │   └── route.js                # Alias handler for /events
│   ├── globals.css                 # Simple, modern responsive stylesheet
│   ├── layout.js                   # Root HTML shell & top navigation bar (with Clash Report)
│   ├── login/page.js               # User Login Page
│   ├── my-events/page.js           # Organiser Event Management Dashboard
│   ├── page.js                     # Home Landing Page with dynamic role greeting
│   ├── profile/page.js             # User Profile & Edit Details Page
│   ├── register/page.js            # User Registration Page (Student / Organiser)
│   └── venues/
│       ├── [id]/page.js            # Venue Detail, Blackouts & Booking Management Page
│       ├── create/page.js          # Add New Venue Form Page (Admin)
│       ├── edit/[id]/page.js       # Edit Venue Form Page (Admin)
│       └── page.js                 # Venue Management Dashboard
├── data/
│   ├── bookings.json               # Venue bookings and blackout records database
│   ├── categories.json             # Event categories database
│   ├── events.json                 # Events database
│   ├── tags.json                   # Event tags database
│   ├── users.json                  # User accounts database
│   └── venues.json                 # Campus venues database
├── lib/
│   ├── auth.js                     # Bcrypt hashing & JWT token verification helpers
│   ├── clashEngine.js              # Module 4 Clash Engine (interval logic, 5 clashes, suggestions, report)
│   ├── db.js                       # Safe atomic JSON read/write persistence functions
│   └── venueValidation.js          # Module 3 & 4 Venue, Clash, & Admin Override adapter
├── middleware.js                   # Dual-path routing for Venues and Clash APIs
├── public/
│   └── uploads/                    # Local storage directory for uploaded posters
├── scripts/
│   ├── test-module2.js             # Automated Module 1 & 2 integration test suite
│   ├── test-module3.js             # Automated 24-point Module 3 venue management test suite
│   └── test-module4.js             # Automated 19-point Module 4 clash management test suite
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
```

### Method B: Manual Testing Walkthrough (Module 3)
1. **View Venue Directory:** Log in as Admin (`admin@eventra.edu` / `admin123`) and click **Venues** in the navigation bar. Check the summary stats (Total Venues, Active Venues, Capacity).
2. **Add a New Venue:** Click **+ Add New Venue**, fill in the form (Name: "Mechanical Workshop", Type: Lab, Capacity: 80, Location: "Workshop Block", select facilities and timings), and click **Create Venue**.
3. **Inspect Availability & Conflicts:** On `/venues`, scroll to the **Venue Availability Checker**, select "Main Auditorium", choose a date, and click **Check Availability**. Notice the display of open time slots and any booked slots.
4. **Block a Venue (Blackout Date):** Click on "Main Auditorium", navigate to **Block Venue (Blackout Dates)**, pick a date (e.g. `2026-12-15`), reason: "Exams", and click **Block Date**. Re-running availability for that date now shows **UNAVAILABLE** due to Exams.
5. **Request a Booking & Admin Approval:** While on the venue page, submit a booking request for an open slot. Notice it starts as `Pending Approval`. As Admin, click **Approve** on the dashboard to confirm it.
6. **Verify Event Management Conflict Prevention:** Log in as Organiser and create an event at the same venue and overlapping time. When Admin tries to **Approve & Publish** the event, the system rejects it with a clear conflict error, proving Module 3 and Module 2 are integrated.

For full step-by-step browser testing for all modules, refer to **[TESTING.md](TESTING.md)**.
