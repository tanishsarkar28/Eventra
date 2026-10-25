# Eventra - Module 1 & Module 2: Testing Guide & Architecture Explanation

---

## 4. Manual Testing Steps

Follow these step-by-step instructions to test all features of Module 1 and Module 2:

### Step 1: Register a Student
1. Open your browser and navigate to: [http://localhost:3000/register](http://localhost:3000/register)
2. Fill in the form fields:
   - **Name:** Alice
   - **Email:** `alice@campus.edu`
   - **Password:** `secret123`
   - **Role:** Student
3. Click the **Register** button.
4. **Expected Result:** A message appears: *"Registration successful! You can now log in."*

---

### Step 2: Register an Organiser
1. On the same register page ([http://localhost:3000/register](http://localhost:3000/register)):
2. Select **Role:** Organiser from the dropdown.
3. Notice that the **Club Name** input field dynamically appears.
4. Fill in the form fields:
   - **Name:** Bob
   - **Email:** `bob@campus.edu`
   - **Password:** `secret123`
   - **Role:** Organiser
   - **Club Name:** Robotics Club
5. Click the **Register** button.
6. **Expected Result:** Registration succeeds, and Bob is created with `isVerified: false`.

---

### Step 3: Create an Admin by editing `data/users.json`
1. Open the file `data/users.json` in your code editor.
2. Find Alice's user entry.
3. Change `"role": "student"` to `"role": "admin"`.
4. Save the file.

---

### Step 4: Verify the Organiser as Admin
1. Open your browser and navigate to: [http://localhost:3000/login](http://localhost:3000/login)
2. Log in using Alice's credentials:
   - **Email:** `alice@campus.edu`
   - **Password:** `secret123`
3. Click **Admin** in the top navigation bar (or visit [http://localhost:3000/admin](http://localhost:3000/admin)).
4. You will see Bob listed in the pending organisers table with Club Name **Robotics Club**.
5. Click the **Verify** button next to Bob.
6. **Expected Result:** Bob is verified and disappears from the pending verification table.

---

### Step 5: Login as Organiser
1. Navigate to [http://localhost:3000/profile](http://localhost:3000/profile) and click the **Logout** button.
2. Go to the login page ([http://localhost:3000/login](http://localhost:3000/login)).
3. Log in using Bob's credentials:
   - **Email:** `bob@campus.edu`
   - **Password:** `secret123`
4. On the Profile page ([http://localhost:3000/profile](http://localhost:3000/profile)), verify the displayed information:
   - **Role:** organiser
   - **Club Name:** Robotics Club
   - **Verification Status:** Verified

---

### Step 6: Edit Profile
1. On the Profile page ([http://localhost:3000/profile](http://localhost:3000/profile)), scroll to the **Edit Profile** form.
2. Fill in the details:
   - **Branch:** Computer Science
   - **Year:** 3rd Year
   - **Interests:** Robotics, AI, IoT
3. Click **Save Changes**.
4. **Expected Result:** The profile details update immediately on screen and are persisted in `data/users.json`.

---

### Step 7: Create an Event as Organiser (Module 2)
1. While logged in as Bob (verified organiser), click **My Events** in the top navigation bar (or visit [http://localhost:3000/my-events](http://localhost:3000/my-events)).
2. Click **+ Create New Event** (or visit [http://localhost:3000/events/create](http://localhost:3000/events/create)).
3. Fill in the event form:
   - **Title:** Annual Robotics Showcase
   - **Description:** An exhibition of autonomous robots built by students.
   - **Category:** Technical
   - **Tags:** robotics, ai, coding
   - **Date:** 2026-11-20
   - **Start Time:** 10:00
   - **End Time:** 16:00
   - **Venue:** Main Auditorium
   - **Capacity:** 100
   - **Registration Deadline:** 2026-11-19
   - **Pricing:** Free
   - **Poster:** (Optionally upload an image or enter a URL)
4. Click **Save as Draft**.
5. **Expected Result:** Redirects back to My Events. The new event is listed with status `Draft`.

---

### Step 8: Edit and Submit Event for Approval (Module 2)
1. On the My Events page, click **Edit** next to "Annual Robotics Showcase".
2. Update the capacity to `150` and click **Save Changes**.
3. On My Events, click **Submit for Approval**.
4. **Expected Result:** The event status updates to `Pending Approval`.

---

### Step 9: Admin Review & Module 4 Venue Validation (Module 2 & 4 Integration)
1. Log out and log back in as Alice (the Admin user).
2. Visit [http://localhost:3000/admin](http://localhost:3000/admin).
3. Scroll down to **Pending Events for Approval (Module 2 & 4 Integration)**.
4. You will see Bob's event listed.
5. Click **Approve & Publish**.
6. **Expected Result:** Module 4 validates that the venue "Main Auditorium" is valid and that there are no overlapping events at that venue/date/time. The event is approved and published!
7. *(Conflict Test)*: If another event requests the same venue on the same date with an overlapping time range, clicking "Approve & Publish" will be rejected by Module 4 validation and display an error explaining the conflict.

---

### Step 10: Cancel Event (Module 2)
1. Log back in as Bob (organiser).
2. Go to [http://localhost:3000/my-events](http://localhost:3000/my-events).
3. Click **Cancel Event** next to an event and confirm.
4. **Expected Result:** The event status is changed to `Cancelled`.

---

## 5. Automated Testing Script
You can run the complete automated test suite covering all Module 1 and Module 2 APIs:
```bash
node scripts/test-module2.js
```

---

## 6. How Login Works (in 5 Simple Lines)

1. **User Submits Form:** The browser sends the user's email and password to `POST /api/auth/login`.
2. **Server Validates Password:** The server finds the user in `data/users.json` and uses `bcrypt.compare` to check if the password matches.
3. **Server Creates Token & Sets Cookie:** If valid, the server signs a JWT token with the user's ID and role, and attaches it as an `httpOnly` cookie named `token` in the response.
4. **Browser Stores Cookie:** The browser automatically saves this cookie and quietly sends it with every future HTTP request to the server.
5. **Protected Pages Verify User:** Protected API routes read the cookie using `getLoggedInUser(request)`, decode the JWT, verify the user's existence and role, and grant or deny access.
