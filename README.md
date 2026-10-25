# Eventra - Campus Event Management System

Eventra is a lightweight campus event management web application built with **React** and **Next.js (App Router)** in plain JavaScript.

This repository contains:
- **Module 1: Authentication & User Management**
- **Module 2: Event Management (with Module 4 Venue Validation Integration)**

All code is written with zero complex abstractions so any beginner can read, understand, and explain it.

---

## What Was Done in Module 1: Authentication & User Management

### 1. Architectural Foundation & Tech Rules
- **Framework:** Next.js (App Router) using plain JavaScript (`.js` files, no TypeScript).
- **Zero Database Server:** User and event records are safely stored and managed in local JSON files (`data/users.json`, `data/events.json`).
- **Minimal Dependencies:** Only two third-party libraries:
  - `bcryptjs`: For hashing passwords securely with salt.
  - `jsonwebtoken`: For issuing and verifying secure session tokens.
- **Cookie-Based Authentication:** JWT session tokens are stored in an `httpOnly`, `sameSite: "lax"` browser cookie.
- **Pure HTML / Semantic UI:** Standard HTML elements (`<form>`, `<input>`, `<select>`, `<button>`, `<table>`) with zero Tailwind, CSS files, or external UI libraries.

### 2. User Roles & Permission Model
The system supports three user roles:
- **`student`**: Verified by default (`isVerified: true`). Can log in, view details, and edit profile.
- **`organiser`**: Starts as unverified (`isVerified: false`). Requires a `clubName` upon registration and must be verified by an administrator before managing events.
- **`admin`**: System administrator (`isVerified: true`). Has exclusive access to verify unverified organisers and approve/publish events.

---

## What Was Done in Module 2: Event Management

### 1. Purpose & Core Features
Allows campus club organisers to:
- **Create an Event:** Title, description, poster upload, category, tags, date, start time, end time, venue, capacity, registration deadline, free/paid pricing.
- **Edit Events:** Organisers can update their own events.
- **Cancel Events:** Organisers can cancel their events (`status: 'Cancelled'`).
- **View My Events:** Dedicated management view showing events created by the logged-in organiser.
- **Poster Upload:** Upload image posters directly via `POST /api/upload` (stored in `public/uploads/`) or enter image URL.
- **Publishing Workflow:**
  - `Draft` → `Pending Approval` → `Published` (or `Cancelled`).
  - Organisers create events as `Draft` or submit for `Pending Approval`.
  - Organisers cannot directly publish events; approval requires administrator review.

### 2. Module 4 Integration (Venue & Time Validation)
Before any event can be published by the admin:
- Validates that venue name is provided and valid.
- Validates that the event date is not in the past.
- Validates that start time is strictly earlier than end time.
- Validates that registration deadline is not after event date.
- **Conflict Detection:** Checks whether another published event already occupies the same venue on the same date with overlapping hours (`(startA < endB) && (endA > startB)`). If a conflict exists, publishing is blocked with a descriptive error message.

### 3. Database Entities (`data/`)
- `data/users.json`: User accounts and roles.
- `data/events.json`: Event records:
  - `id`: Unique timestamp ID.
  - `title`, `description`, `poster`, `category`, `tags`.
  - `date`, `startTime`, `endTime`, `venue`, `capacity`, `registrationDeadline`.
  - `isPaid`, `ticketPrice`.
  - `status`: `'Draft'` | `'Pending Approval'` | `'Published'` | `'Cancelled'`.
  - `organiserId`, `organiserName`, `clubName`.
  - `createdAt`, `updatedAt`.
- `data/categories.json`: Pre-configured categories (`Technical`, `Cultural`, `Sports`, `Academic`, `Workshop`, `Seminar`).
- `data/tags.json`: Pre-configured event tags (`coding`, `web`, `hackathon`, `ai`, etc.).

---

## API Routes Implemented

### Module 1: Auth & User Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Registers a new student or organiser. |
| **POST** | `/api/auth/login` | Public | Validates credentials, issues JWT in `httpOnly` cookie. |
| **POST** | `/api/auth/logout` | Public | Clears session cookie. |
| **GET** | `/api/users/me` | Authenticated | Returns logged-in user profile. |
| **PATCH** | `/api/users/me` | Authenticated | Updates current user's profile. |
| **GET** | `/api/organisers/pending` | Admin Only | Lists unverified organisers. |
| **POST** | `/api/organisers/verify` | Admin Only | Verifies a pending organiser. |

### Module 2: Event Management
| Method | Endpoint (Standard & Alias) | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/events` & `/events` | Organiser | Creates a new event (`Draft` or `Pending Approval`). |
| **GET** | `/api/events/mine` & `/events/mine` | Organiser | Returns all events created by logged-in organiser. |
| **GET** | `/api/events/:id` & `/events/:id` | Authenticated | Returns event details by ID. |
| **PUT** | `/api/events/:id` & `/events/:id` | Organiser (Owner) | Updates an existing event. |
| **DELETE** | `/api/events/:id` & `/events/:id` | Organiser (Owner) | Cancels an event (`status: 'Cancelled'`). |
| **PATCH** | `/api/events/:id/status` & `/events/:id/status` | Organiser / Admin | Transitions status; Admin approval validates with Module 4. |
| **POST** | `/api/upload` | Authenticated | Uploads event poster to `public/uploads/`. |
| **GET** | `/api/categories` | Public | Returns available categories. |
| **GET** | `/api/tags` | Public | Returns available tags. |

---

## Pages Implemented

1. **Home (`/`)**: Dynamic greeting, links to Profile, My Events, Create Event, Admin panel.
2. **Register (`/register`)**: Student or Organiser registration.
3. **Login (`/login`)**: Login form setting `httpOnly` JWT session cookie.
4. **Profile (`/profile`)**: Displays user details and form to edit profile.
5. **My Events (`/my-events`)**: Organiser event list with status badges, edit link, submit/withdraw buttons, cancel button.
6. **Create Event (`/events/create`)**: Full event creation form with poster upload, pricing, and category selection.
7. **Edit Event (`/events/edit/:id`)**: Form to update existing event details.
8. **Admin Panel (`/admin`)**: Verify pending organisers and review/approve pending events with Module 4 validation.

---

## Getting Started

### 1. Installation
```bash
git clone https://github.com/tanishsarkar28/Eventra.git
cd Eventra
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm run build
npm start
# In a separate terminal:
node scripts/test-module2.js
```

---

## Manual Testing Guide
See [TESTING.md](TESTING.md) for detailed step-by-step instructions.
