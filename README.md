# Eventra - Campus Event Management System

**Eventra** is a lightweight, modern campus event management web application developed as a college project using **React** and **Next.js 14 (App Router)** in plain JavaScript.

The repository is built following a clean, modular structure with zero complex abstractions, making it readable, explainable, and easy to evaluate for college demonstrations.

---

## 📌 Project Team & Module Distribution

| Student | Assigned Modules | Current Status |
| :--- | :--- | :--- |
| **Student 1** | **Module 1** (Auth & User Management), **Module 4** (Venue Scheduling), **Module 7** | Module 1 Completed |
| **Student 2 (Rishi)** | **Module 2** (Event Management), **Module 5** (Registration/Ticketing), **Module 8** | Module 2 Completed ✅ |
| **Student 3** | **Module 3**, **Module 6**, **Module 9** | Upcoming |

---

## 🏗️ Architecture & Technical Stack

- **Frontend Framework:** Next.js 14 (App Router) + React 18
- **Language:** Plain JavaScript (`.js` files, beginner-friendly, zero TypeScript overhead)
- **Styling:** Custom lightweight CSS (`app/globals.css`) with clean card containers, modern pill navigation, responsive tables, and status badges. Zero heavy UI frameworks (no Tailwind/Bootstrap required).
- **Backend & APIs:** Next.js Route Handlers (`app/api/...` with alias compatibility for `/events/...`)
- **Database System:** File-based JSON storage inside `data/` (`users.json`, `events.json`, `categories.json`, `tags.json`), accessed via safe atomic read/write functions in `lib/db.js`.
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
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── route.js        # GET, PUT, DELETE /api/events/:id
│   │   │   │   └── status/route.js # PATCH /api/events/:id/status (Module 4 check)
│   │   │   ├── mine/route.js       # GET /api/events/mine
│   │   │   └── route.js            # GET, POST /api/events
│   │   ├── organisers/
│   │   │   ├── pending/route.js    # GET /api/organisers/pending
│   │   │   └── verify/route.js     # POST /api/organisers/verify
│   │   ├── tags/route.js           # GET, POST /api/tags
│   │   ├── upload/route.js         # POST /api/upload (Poster upload)
│   │   └── users/
│   │       └── me/route.js         # GET, PATCH /api/users/me
│   ├── events/
│   │   ├── [id]/
│   │   │   ├── route.js            # Alias handler for /events/:id
│   │   │   └── status/route.js     # Alias handler for /events/:id/status
│   │   ├── create/page.js          # Create Event Form Page
│   │   ├── edit/[id]/page.js       # Edit Event Form Page
│   │   ├── mine/route.js           # Alias handler for /events/mine
│   │   └── route.js                # Alias handler for /events
│   ├── globals.css                 # Simple, modern responsive stylesheet
│   ├── layout.js                   # Root HTML shell & top navigation bar
│   ├── login/page.js               # User Login Page
│   ├── my-events/page.js           # Organiser Event Management Dashboard
│   ├── page.js                     # Home Landing Page with dynamic role greeting
│   ├── profile/page.js             # User Profile & Edit Details Page
│   └── register/page.js            # User Registration Page (Student / Organiser)
├── data/
│   ├── categories.json             # Event categories database
│   ├── events.json                 # Events database
│   ├── tags.json                   # Event tags database
│   └── users.json                  # User accounts database
├── lib/
│   ├── auth.js                     # Bcrypt hashing & JWT token verification helpers
│   ├── db.js                       # Safe atomic JSON read/write persistence functions
│   └── venueValidation.js          # Module 4 Venue & Schedule Validation adapter
├── public/
│   └── uploads/                    # Local storage directory for uploaded posters
├── scripts/
│   └── test-module2.js             # Automated 16-point end-to-end integration test suite
├── package.json                    # Project dependencies & scripts
├── README.md                       # Comprehensive documentation
└── TESTING.md                      # Detailed manual testing guide
```

---

## 🔑 Pre-Configured Test Accounts

| Account Type | Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@eventra.edu` | `admin123` | `admin` | Verify organisers, review & publish events |
| **Verified Organiser** | `rishiraj18sep2005@gmail.com` | *(your password)* | `organiser` | Create, edit, manage, and cancel events |

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
Eventra includes an automated test script (`scripts/test-module2.js`) that validates all 16 authentication, event CRUD, status transition, role permission, and Module 4 venue conflict detection rules:

```bash
# 1. Build and start production server
npm run build
npm start

# 2. In a second terminal, execute the test runner
node scripts/test-module2.js
```

### Method B: Manual Testing Walkthrough
For step-by-step browser testing of user registration, organiser verification, event creation, poster upload, and admin publishing with Module 4 venue conflict testing, refer to the full walkthrough in **[TESTING.md](TESTING.md)**.
