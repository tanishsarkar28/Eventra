# Eventra - Campus Event Management System

Eventra is a lightweight campus event management web application built with **React** and **Next.js (App Router)** in plain JavaScript.

This repository currently contains **Module 1: Authentication & User Management**, designed with zero complex abstractions so any beginner can read, understand, and explain it.

---

## What Was Done in Module 1

### 1. Architectural Foundation & Tech Rules
- **Framework:** Next.js (App Router) using plain JavaScript (`.js` files, no TypeScript).
- **Zero Database Server:** User records are safely stored and managed in a local JSON file (`data/users.json`).
- **Minimal Dependencies:** Only two third-party libraries are used:
  - `bcryptjs`: For hashing passwords securely with salt.
  - `jsonwebtoken`: For issuing and verifying secure session tokens.
- **Cookie-Based Authentication:** JWT session tokens are stored in an `httpOnly`, `sameSite: "lax"` browser cookie.
- **Pure HTML / Semantic UI:** Built exclusively using standard HTML elements (`<form>`, `<input>`, `<select>`, `<button>`, `<table>`) with zero Tailwind, CSS files, or external UI libraries.

---

### 2. User Roles & Permission Model
The system supports three user roles:
- **`student`**: Verified by default (`isVerified: true`). Can log in, view details, and edit profile.
- **`organiser`**: Starts as unverified (`isVerified: false`). Requires a `clubName` upon registration and must be verified by an administrator.
- **`admin`**: System administrator (`isVerified: true`). Has exclusive access to view and verify unverified organisers.

#### User Data Schema (`data/users.json`)
```json
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
```

---

### 3. API Routes Implemented

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Registers a new student or organiser. Hashes password and validates required fields. |
| **POST** | `/api/auth/login` | Public | Validates email & password, generates JWT, and sets an `httpOnly` cookie. |
| **POST** | `/api/auth/logout` | Public | Clears the session cookie (`maxAge: 0`). |
| **GET** | `/api/users/me` | Authenticated | Returns current logged-in user profile (password excluded). Returns `401` if not logged in. |
| **PATCH** | `/api/users/me` | Authenticated | Updates current user's `name`, `branch`, `year`, and `interests`. |
| **GET** | `/api/organisers/pending` | Admin Only | Lists unverified organisers. Returns `401` if unauthenticated, `403` if not admin. |
| **POST** | `/api/organisers/verify` | Admin Only | Verifies a pending organiser by their `id`. |

---

### 4. Pages Implemented

1. **Home (`/`)**
   - Displays a dynamic greeting `"Hello, <name> (<role>)"` when logged in.
   - Shows navigation links to Register, Login, Profile, or Admin panel.

2. **Register (`/register`)**
   - Form with `name`, `email`, `password`, and `role` dropdown (`Student` or `Organiser`).
   - Dynamically reveals the `clubName` input field when `Organiser` is selected.

3. **Login (`/login`)**
   - Form with `email` and `password`.
   - On success, sets authentication cookie and redirects to `/profile`.

4. **Profile (`/profile`)**
   - Displays user details in an HTML table (ID, Name, Email, Role, Club Name, Verification status, Branch, Year, Interests).
   - Form to edit `name`, `branch`, `year`, and comma-separated `interests`.
   - Logout button that clears the session.

5. **Admin Panel (`/admin`)**
   - Restricted to `admin` users only (`403` access denied otherwise).
   - Shows an HTML table listing unverified organisers with a **Verify** action button.

---

### 5. Helper Modules
- **`lib/db.js`**:
  - `readUsers()`: Safely reads and parses `data/users.json`.
  - `saveUsers(users)`: Persists user records back to `data/users.json`.
- **`lib/auth.js`**:
  - `hashPassword(password)`: Hashes plain text password.
  - `checkPassword(password, hashedPassword)`: Compares password against stored hash.
  - `createToken(user)`: Generates signed JWT valid for 7 days.
  - `getLoggedInUser(request)`: Extracts token from cookies, validates JWT, fetches user from file, and strips the password field before returning.

---

## Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/tanishsarkar28/Eventra.git
cd Eventra
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## How Authentication Works (In 5 Simple Lines)
1. **User Submits Form:** The browser sends the user's email and password to `POST /api/auth/login`.
2. **Server Validates Password:** The server finds the user in `data/users.json` and uses `bcrypt.compare` to check if the password matches.
3. **Server Creates Token & Sets Cookie:** If valid, the server signs a JWT token with the user's ID and role, and attaches it as an `httpOnly` cookie named `token` in the response.
4. **Browser Stores Cookie:** The browser automatically saves this cookie and quietly sends it with every future HTTP request to the server.
5. **Protected Pages Verify User:** Protected API routes read the cookie using `getLoggedInUser(request)`, decode the JWT, verify the user's existence and role, and grant or deny access.

---

## Manual Testing Guide
Detailed step-by-step instructions for manual testing can be found in [TESTING.md](TESTING.md).
