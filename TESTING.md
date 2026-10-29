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

### Step 11: Venue Management Dashboard (Module 3)
1. Log in as an administrator (e.g. `admin@eventra.edu` / `admin123` or Alice).
2. Click **Venues** in the top navigation bar (or visit [http://localhost:3000/venues](http://localhost:3000/venues)).
3. Verify the summary dashboard:
   - **Total Venues**, **Active Venues**, **Total Capacity**, and **Pending Bookings** are calculated dynamically.
   - The venue directory table lists all registered facilities with their Type, Capacity, Location, Facilities badges, Operational Days, Daily Timings, and Active Status.
4. Click **Deactivate** on any venue:
   - Notice the status updates to `Inactive` and row opacity dims.
   - Click **Activate** to restore it to `Active`.

---

### Step 12: Add & Edit a College Venue (Module 3)
1. From the Venues dashboard, click **+ Add New Venue** (or visit [http://localhost:3000/venues/create](http://localhost:3000/venues/create)).
2. Fill in the form:
   - **Venue Name:** Mechanical Engineering Workshop
   - **Venue Type:** Lab
   - **Capacity:** 80
   - **Location:** Workshop Block, Ground Floor
   - **Facilities:** Check `AC`, `Projector`, `WiFi`, `Whiteboard`
   - **Available Days:** Check `Monday` through `Friday`
   - **Opening Time:** `08:30`
   - **Closing Time:** `17:30`
   - **Requires Approval:** Checked
3. Click **Create Venue**.
4. **Expected Result:** A success message appears and redirects to `/venues`. The new venue is immediately visible in the directory.
5. Click **Edit** next to the newly created venue, update capacity to `90`, and save changes.

---

### Step 13: Check Venue Availability & Time Slots (Module 3)
1. On the Venues dashboard ([http://localhost:3000/venues](http://localhost:3000/venues)), scroll to **Check Venue Availability & Conflicts**.
2. Select **Main Auditorium** and choose a Friday date (e.g. `2026-11-20`).
3. Click **Check Availability**.
4. **Expected Result:**
   - The status badge shows **AVAILABLE** in green.
   - Open time windows for scheduling are displayed.
5. Now choose a Sunday date (e.g. `2026-11-22`) where the venue is closed.
6. Click **Check Availability**.
7. **Expected Result:** The status badge shows **UNAVAILABLE** in red with the reason: *"Venue is closed on Sundays."*

---

### Step 14: Block Dates (Blackout Management) (Module 3)
1. Click **View & Book** (or click the venue name) next to **Main Auditorium** to open [http://localhost:3000/venues/venue_auditorium_1](http://localhost:3000/venues/venue_auditorium_1).
2. Scroll to the **Block Venue (Blackout Dates)** section.
3. Select a date (e.g. `2026-12-05`), choose **Reason:** `Semester Exams`, and enter an optional note.
4. Click **Block Date**.
5. **Expected Result:** The date is added to the blackout table.
6. Now test the availability tool for `2026-12-05`:
   - It immediately displays **UNAVAILABLE** due to: *"Semester Exams"*.
7. Click **Unblock** to remove the blackout.
8. Availability check confirms the venue is open again.

---

### Step 15: Venue Booking Requests & Event Integration (Module 3 & 2)
1. On the venue detail page, scroll to **Request Venue Booking**.
2. Fill in the booking form:
   - **Title:** Robotics Rehearsal Session
   - **Date:** `2026-11-20`
   - **Start Time:** `10:00`
   - **End Time:** `12:00`
3. Click **Submit Booking Request**.
4. Notice that if `Requires Approval` is enabled, the request starts with status `Pending Approval`.
5. Return to the Venues dashboard ([http://localhost:3000/venues](http://localhost:3000/venues)) to see the request under **Pending Venue Booking Requests**.
6. Click **Approve**.
7. **Integration Verification:**
   - Log in as an Organiser.
   - Go to `/events/create` and create an event at **Main Auditorium** on `2026-11-20` overlapping with the approved booking (e.g. `11:00` to `13:00`).
   - Log in as Admin and try to **Approve & Publish** this event on `/admin`.
   - **Expected Result:** The system blocks publication with a conflict error stating that the venue is already booked for "Robotics Rehearsal Session".

---

## 5. Automated Testing Scripts
You can run the complete automated test suites:
```bash
# Run Module 1 & Module 2 tests (16 checks)
node scripts/test-module2.js

# Run Module 3 Venue Management tests (24 checks)
node scripts/test-module3.js
```

---

## 6. How Login Works (in 5 Simple Lines)

1. **User Submits Form:** The browser sends the user's email and password to `POST /api/auth/login`.
2. **Server Validates Password:** The server finds the user in `data/users.json` and uses `bcrypt.compare` to check if the password matches.
3. **Server Creates Token & Sets Cookie:** If valid, the server signs a JWT token with the user's ID and role, and attaches it as an `httpOnly` cookie named `token` in the response.
4. **Browser Stores Cookie:** The browser automatically saves this cookie and quietly sends it with every future HTTP request to the server.
5. **Protected Pages Verify User:** Protected API routes read the cookie using `getLoggedInUser(request)`, decode the JWT, verify the user's existence and role, and grant or deny access.
