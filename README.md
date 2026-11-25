# Eventra — Campus Event Management System

[![Next.js](https://img.shields.io/badge/Next.js-14.2_(App_Router)-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Render-Deployed_Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://eventra-fchm.onrender.com/)
[![Tests](https://img.shields.io/badge/Tests-8_Suites_Passing-brightgreen?style=for-the-badge&logo=jest&logoColor=white)](TESTING.md)

> A modern, full-stack campus event management, scheduling clash prevention, and digital admission web platform built with **Next.js 14 (App Router)** and **React 18** in plain JavaScript.

🔗 **Production Live URL:** [https://eventra-fchm.onrender.com/](https://eventra-fchm.onrender.com/)  
📦 **GitHub Repository:** [https://github.com/tanishsarkar28/Eventra](https://github.com/tanishsarkar28/Eventra)  

---

## 📌 Project Team & Module Ownership

| Student Name | Registration No. | Assigned Modules & Core Responsibilities | Status |
| :--- | :--- | :--- | :--- |
| **Tanish** | **12407229** | **Module 1** (Auth, RBAC & Profiles)<br>**Module 4** (Multi-Dimensional Clash Engine)<br>**Module 7** (Notifications & 24h/1h Reminders) | Completed ✅ |
| **Rishi** | **12408074** | **Module 2** (Event Lifecycle & Poster Uploads)<br>**Module 5** (Personalized Event Discovery & Match %)<br>**Module 8** (Academic Timetable & RFC 5545 .ics) | Completed ✅ |
| **Anush** | **12407704** | **Module 3** (Campus Venue Registry & Blackouts)<br>**Module 6** (Registration, FIFO Waitlist & Gate QR Check-in)<br>**Module 9** (Admin Command Center, Moderation & Analytics) | Completed ✅ |

---

## 💡 The Problem Eventra Solves

University campuses host dozens of cultural fests, technical hackathons, guest lectures, and sports tournaments every month. Traditional management relies on physical notice boards, scattered social media posters, and uncoordinated WhatsApp groups. This causes recurring campus headaches:
1. **Venue Double-Booking:** Two societies book the same auditorium at the exact same hour.
2. **Student Lecture Clashes:** Events overlap mandatory academic classes and lab sessions.
3. **Overcrowding & Gate Queues:** Venues exceed physical capacities, and paper gate registers cause long queues.
4. **Attendance Drop-off:** Students register but forget to show up due to lack of timely reminders.

**Eventra eliminates these problems** through an automated, intelligent campus coordination platform.

---

## ✨ Key Subsystems & Feature Breakdown

### 🔐 1. Authentication, RBAC & Profile Management (Module 1)
- **Role-Based Access Control:** Strict permission model separating **Student**, **Club Organiser**, and **Administrator** accounts.
- **Cryptographic Security:** Salted password hashing with `bcryptjs` (10 rounds) and stateless session tokens using `jsonwebtoken` (JWT) stored in tamper-proof `httpOnly` cookies (`sameSite: "lax"`).
- **Edge Security Proxy:** Next.js `middleware.js` intercepts unauthorized route access (HTTP 401/403) before page rendering.
- **Student Profile Hub:** Manage branch, academic year, and interest tags (e.g. *Coding*, *Robotics*, *Sports*, *Music*) powering recommendations.

### 🎪 2. Event Lifecycle Management (Module 2)
- **4-Stage State Machine:** `Draft` $\rightarrow$ `Pending Approval` $\rightarrow$ `Published` $\rightarrow$ `Cancelled`.
- **Approval Governance:** Organisers cannot self-publish; all events must be vetted by administrators. Editing an active event's date or venue safely reverts its status to *Pending Approval*.
- **Poster File Processing:** Native multipart `FormData` processor validating formats (.png, .jpg, .webp), assigning timestamps, and saving to `public/uploads/` with live preview.
- **My Events Console:** Organiser control panel with live status badges, attendee counts, and quick actions.

### 🏛️ 3. Venue Administration & Date Blackouts (Module 3)
- **Campus Facility Registry:** Comprehensive catalog tracking capacities, locations, operational days, daily operating windows (`availableFrom` to `availableTo`), and facility checkboxes (AC, Projector, Sound System, WiFi).
- **Interactive Availability Checker:** Select any venue and date to dynamically calculate booked intervals and open free time slots.
- **Date Blackout Management:** Block venues on specific dates for semester exams, official inspections, or maintenance, immediately locking reservations.

### 🛡️ 4. Multi-Dimensional Clash Detection Engine (Module 4)
- **Mathematical Overlap Detection:** Enforces the Golden Interval Overlap rule:
  $$\text{Overlap} = (\text{start}_1 < \text{end}_2) \land (\text{start}_2 < \text{end}_1)$$
- **5-Category Conflict Radar:**
  - `Venue Clash (Critical)`: Same facility occupied for overlapping hours.
  - `Blackout Clash (Critical)`: Event scheduled during university exams or maintenance.
  - `Capacity Clash (High)`: Expected attendees exceed venue seating.
  - `Organiser Clash (High)`: Same club hosting two events at overlapping times.
  - `Audience Clash (Medium)`: Two events competing for the same student cohort simultaneously.
- **Alternative Suggestion Engine:** Automatically computes alternative open slots today, alternative facilities with sufficient capacity, and open dates in the coming week.
- **Administrative Override:** Authorized administrators can override clashes with mandatory written justification recorded in audit logs.

### 🔍 5. Personalized Discovery & Recommendation Engine (Module 5)
- **Dynamic Search & Filters:** Case-insensitive search across titles, descriptions, tags, and clubs, combined with category pills, date pickers, and Free vs Paid toggles.
- **"Relevant to Me" 100-Point Match Score:** Transparent scoring algorithm in `lib/recommendation.js`:
  - *Interests Match (Max 40 pts)*: Set intersection between profile interests and event tags.
  - *Academic Alignment (Max 25 pts)*: Alignment with student branch and academic year.
  - *Time Proximity (Max 20 pts)*: Temporal boost for events in the upcoming 3–7 days.
  - *Popularity Boost (Max 15 pts)*: Community engagement based on bookmark counts.
- **Personal Watchlist:** Single-click bookmark toggle saving events to `data/bookmarks.json`.

### 🎟️ 6. Registration, FIFO Waitlist & Gate QR Check-In (Module 6)
- **Capacity Boundaries:** Real-time seat allocation preventing overbooking.
- **FIFO Waitlist Queue:** When capacity is reached, students join a First-In, First-Out waitlist with position ranks (`#1`, `#2`...).
- **Instant Auto-Promotion:** When an attendee cancels (allowed up to 2 hours before start), the engine automatically promotes Waitlist candidate #1, generates their ticket, and alerts them.
- **Base64 QR Code Tickets:** Client-free, server-rendered high-contrast Base64 PNG QR code tickets embedded directly in database records.
- **Live Gatekeeper Scanner:** Mobile camera/webcam QR code scanner via `html5-qrcode` with instant duplicate scan rejection.
- **CSV Attendance Export:** Organisers can download an RFC 4180 compliant attendance spreadsheet with one click.

### 🔔 7. Event-Driven Multi-Channel Notifications & Reminders (Module 7)
- **Decoupled Architecture:** Asynchronous Node.js `EventEmitter` Singleton Event Bus in `lib/eventBus.js`.
- **Omni-Channel Delivery:** Dispatches across In-App Bell notifications, simulated Email Outbox, and Mobile Push Outbox.
- **Interest-Matched Alerts:** Automatically notifies students when newly published events match their profile tags.
- **Scheduled Reminder Engine:** Automated background check calculating UTC time deltas ($\Delta t$) and delivering strictly deduplicated **24-hour** and **1-hour** event kickoff reminders.

### 📅 8. Personal Calendar, Timetable Clash Prevention & .ics Export (Module 8)
- **Unified Weekly Agenda:** Displays student recurring classes (Mon–Sun), confirmed registered events, and saved bookmarks side-by-side.
- **Lecture Clash Prevention:** Checks the student's personal timetable before confirming event registration; if a lecture overlaps, registration is blocked with `HTTP 409 Conflict`.
- **Free-Slot Gap Finder:** Computes open, unoccupied time blocks between 08:00 and 18:00 for any selected date.
- **RFC 5545 .ics Export:** One-click download of `eventra-calendar.ics` compatible with **Google Calendar**, **Apple Calendar**, and **Microsoft Outlook**.

### 📊 9. Admin Command Center, Moderation & Analytics (Module 9)
- **Proposal Review & Clash Badges:** Visual `✓ Conflict-Free` and `⚠️ Clash Detected` indicators on pending proposals.
- **Student Content Moderation:** Flagging mechanism (`POST /events/:id/report`) allowing students to report inappropriate content or fake events for administrative investigation.
- **Immutable Audit Logging:** Append-only ledger in `data/audit_logs.json` recording every sensitive operation with timestamp, admin ID, and IP address.
- **Real-Time Campus Analytics:** Computes weekly event cadence, venue utilization percentages, registration-to-attendance conversion rates, and clash frequency trends.

---

## 🏗️ Architecture & Technology Stack

```
                          ┌─────────────────────────────────────┐
                          │     Client Web Browser / Mobile     │
                          │   (React 18 + Tailwind UI + HTML5)  │
                          └──────────────────┬──────────────────┘
                                             │ HTTPS / Cookies
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Next.js 14 App Router Server     │
                          │   middleware.js (Edge Proxy & RBAC) │
                          └──────┬───────────────────────┬──────┘
                                 │                       │
                 ┌───────────────┴──────┐         ┌──────┴───────────────┐
                 │ React Server Comp.   │         │ Route Handlers (API) │
                 │ app/layout.js, SSR   │         │ app/api/...          │
                 └───────────────┬──────┘         └──────┬───────────────┘
                                 │                       │
                                 ▼                       ▼
                          ┌─────────────────────────────────────┐
                          │      Eventra Core Engine (lib/)     │
                          │  auth • clash • recommendation      │
                          │  reminders • validation • eventBus  │
                          └──────────────────┬──────────────────┘
                                             │ Atomic Read/Write
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Atomic JSON Data Layer (data/)   │
                          │  users • events • venues • bookings │
                          │  registrations • tickets • audits   │
                          └─────────────────────────────────────┘
```

| Layer | Technologies & Libraries Used | Purpose & Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router) + React 18** | Hybrid architecture (Server Components + Client Components `'use client'`), file-based routing. |
| **Language** | **Modern JavaScript (ES6+)** | Clean, readable `.js` files with zero TypeScript build overhead. |
| **Styling** | **Tailwind CSS 3.4 + Custom Tokens** | Utility-first responsive design, modern pill navigation, status badges, and accessible modals. |
| **Backend & Routing** | **Next.js Route Handlers + Server Actions** | RESTful endpoints (`app/api/`) and Server Actions (`'use server'`) with on-demand `revalidatePath()`. |
| **Edge Security** | **`middleware.js`** | Edge proxy for URL rewriting, protected route shielding, and JWT cookie verification. |
| **Authentication** | **`bcryptjs` + `jsonwebtoken` (JWT)** | Salted password hashing (10 rounds) and stateless JWT sessions in secure `httpOnly` cookies. |
| **Form Validation** | **Zod 3.x** | Declarative schema validation (`loginSchema`, `registerSchema`, `eventSchema`) with typed error mappings. |
| **QR Engine** | **`qrcode` + `html5-qrcode`** | Server-side Base64 QR code ticket generation and client-side camera/webcam gate check-in scanning. |
| **Calendar Sync** | **RFC 5545 iCalendar (`.ics`)** | Standard `.ics` stream generator supporting recurring weekly lecture rules (`RRULE`). |
| **Persistence** | **Atomic JSON File Store (`lib/db.js`)** | Non-volatile, fault-tolerant persistence using write-and-rename atomic patterns with zero external database daemons. |

---

## 📂 Project Directory Structure

```text
Eventra/
├── app/                              # Next.js 14 App Router Directory
│   ├── actions/                      # Server Actions (eventActions.js)
│   ├── admin/                        # Admin Command Center & Analytics views
│   ├── api/                          # RESTful Route Handlers (auth, events, venues, etc.)
│   ├── calendar/                     # Personal Calendar, Timetable & .ics export
│   ├── discover/                     # Student Event Discovery feed
│   ├── events/                       # Event details, creation, and attendee consoles
│   ├── login/ & register/            # Controlled authentication forms
│   ├── my-events/                    # Organiser event management dashboard
│   ├── notifications/                # Multi-channel notification center
│   ├── profile/                      # Student profile & interest tags
│   ├── venues/                       # Campus venue directory & availability
│   ├── layout.js                     # Root shell wrapping <AuthProvider> & Navbar
│   ├── loading.js & error.js         # Convention-based Suspense & Error Boundaries
│   └── globals.css                   # Minimal design system & CSS utility tokens
├── components/                       # Atomic Reusable UI Components
│   ├── Badge.js                      # Status indicators (memoized with React.memo)
│   ├── Button.js                     # Accessible button with loading states
│   ├── Card.js                       # Container component utilizing props.children
│   ├── Modal.js                      # Accessible dialog modal with ESC key cleanup
│   ├── Navbar.js                     # Responsive navigation bar with role-aware links
│   └── LoadingSpinner.js             # Minimalist SVG transition spinner
├── context/                          # Global React State Management
│   └── AuthContext.js                # React Context API provider & useAuth() hook
├── data/                             # Atomic File-Based Database Stores (.json)
│   ├── users.json                    # User credentials, roles, and profiles
│   ├── events.json                   # Events catalog and lifecycle states
│   ├── venues.json                   # Venue registry and facilities
│   ├── bookings.json                 # Venue reservations and date blackouts
│   ├── registrations.json            # Confirmed event registrations
│   ├── waitlist.json                 # FIFO waitlist queue entries
│   ├── tickets.json                  # Digital tickets with embedded Base64 QR codes
│   ├── attendance.json               # Gatekeeper check-in logs
│   ├── timetable.json                # Student recurring class schedules
│   ├── notifications.json            # In-app notifications
│   └── audit_logs.json               # Immutable administrative audit logs
├── lib/                              # Core Backend Engines & Utilities
│   ├── auth.js                       # Password hashing & JWT verification
│   ├── db.js                         # Atomic file read/write transactions
│   ├── clashEngine.js                # Multi-dimensional scheduling conflict radar
│   ├── recommendation.js             # "Relevant to Me" 100-point match score
│   ├── reminders.js                  # 24h & 1h deduplicated reminder engine
│   ├── eventBus.js                   # Node.js EventEmitter Singleton bus
│   ├── personalSchedule.js           # Timetable clash checks & RFC 5545 generator
│   ├── schemas.js                    # Declarative Zod validation schemas
│   └── hooks.js                      # Custom React hooks (useAuth, useDebounce, etc.)
├── public/                           # Static Assets & Uploads
│   └── uploads/                      # Uploaded event poster images (.png, .jpg, .webp)
├── scripts/                          # Automated Integration Test Suites & Utilities
│   ├── test-module2.js – module9.js  # 8 Automated end-to-end integration test suites
│   └── run-reminders.js              # On-demand CLI reminder runner
├── middleware.js                     # Edge proxy for route rewrites and security checks
├── CURRICULUM_GUIDE.md               # Unit-by-unit React & Next.js syllabus guide
├── TESTING.md                        # Verification and test execution guide
├── SRS.md                            # Complete IEEE Std 830-1998 Specification
└── package.json                      # Project dependencies and npm scripts
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js**: Version `18.17.0+` or `20.x LTS` installed on your machine.
- **Git**: For cloning the repository.

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/tanishsarkar28/Eventra.git

# Navigate into the project folder
cd Eventra

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. The application will hot-reload automatically as you edit files.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Pre-Configured Demo Accounts

For evaluation, testing, and live demonstrations, use the following verified accounts:

| Role | Email Address | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@eventra.edu` | `admin123` | Full governance: Approve/reject events, clash overrides, verify organiser clubs, add venues & blackouts, audit logs, analytics. |
| **Verified Club Organiser** | `rishiraj18sep2005@gmail.com` | `123456` | Organiser access: Create events, upload posters, request venue bookings, gatekeeper QR scanner, CSV export. |
| **Student Attendee** | `tanish@lpu.in` | `123456` | Student access: Discover events, 1-click registration, digital QR ticket passes, class timetable integration, free-slot view. |

---

## 🧪 Automated Testing & Verification

Eventra includes **8 comprehensive, automated end-to-end test suites** located in `scripts/`:

```bash
# Run individual test suites
node scripts/test-module2.js   # Event Management CRUD & status transitions
node scripts/test-module3.js   # Venue availability, bookings & blackouts
node scripts/test-module4.js   # 5-Category clash detection engine
node scripts/test-module5.js   # Event discovery, filters & match scoring
node scripts/test-module6.js   # Registration, waitlist auto-promotion & QR attendance
node scripts/test-module7.js   # Notification bus & 24h/1h scheduled reminders
node scripts/test-module8.js   # Personal calendar, timetable clashes & .ics export
node scripts/test-module9.js   # Admin command center, overrides, moderation & analytics
```
*(All test suites execute real HTTP requests against the application, verifying response codes, payloads, and atomic database persistence with 100% pass rates).*

---

## 📖 Academic Documentation & References

- **[CURRICULUM_GUIDE.md](CURRICULUM_GUIDE.md):** Complete academic syllabus mapping for **Next.js (Units I–VI)** and **React (Units I–VI)**, including design patterns, examiner Viva cheat sheet, and 30-second speaking scripts.
- **[TESTING.md](TESTING.md):** Detailed testing methodology, assertions, and verification procedures for each module.
- **[SRS.md](SRS.md):** IEEE Std 830-1998 Software Requirements Specification with functional requirements, measurable non-functional metrics, and visual analysis models (DFD Levels 0, 1, 2, and ERD).

---

## 📄 License
Developed for educational evaluation under Course **INT252: Web App Development with ReactJS**, Department of Computer Science & Engineering. All rights reserved © 2026.
