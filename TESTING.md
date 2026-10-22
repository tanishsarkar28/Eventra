# Eventra - Module 1: Testing Guide & Architecture Explanation

---

## 4. Manual Testing Steps

Follow these step-by-step instructions to test all features of Module 1:

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
1. Open the file [data/users.json](file:///c:/Users/sarka/OneDrive/Documents/Codes/Projects/Eventra/data/users.json) in your code editor.
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
4. **Expected Result:** The profile details update immediately on screen and are persisted in [data/users.json](file:///c:/Users/sarka/OneDrive/Documents/Codes/Projects/Eventra/data/users.json).

---

## 5. How Login Works (in 5 Simple Lines)

1. **User Submits Form:** The browser sends the user's email and password to `POST /api/auth/login`.
2. **Server Validates Password:** The server finds the user in `data/users.json` and uses `bcrypt.compare` to check if the password matches.
3. **Server Creates Token & Sets Cookie:** If valid, the server signs a JWT token with the user's ID and role, and attaches it as an `httpOnly` cookie named `token` in the response.
4. **Browser Stores Cookie:** The browser automatically saves this cookie and quietly sends it with every future HTTP request to the server.
5. **Protected Pages Verify User:** Protected API routes read the cookie using `getLoggedInUser(request)`, decode the JWT, verify the user's existence and role, and grant or deny access.
