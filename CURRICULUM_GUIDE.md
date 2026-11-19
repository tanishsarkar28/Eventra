# 🎓 Eventra — Complete Academic Curriculum & Topic Mapping Guide

This guide maps every unit, concept, and industry practice from the **Next.js (Units I–VI)** and **React (Units I–V)** university courses directly to the **Eventra** codebase.

Use this document to prepare for evaluations, practical vivas, and project presentations. Every topic is explained in clear, beginner-friendly terms with exact file locations.

---

## 📑 Quick Syllabus Navigation

1. [Next.js Unit I: Fundamentals & Routing / Navigation](#nextjs-unit-i-fundamentals--routing-and-navigation)
2. [Next.js Unit II: Rendering Strategies & Data Fetching](#nextjs-unit-ii-rendering-strategies--data-fetching)
3. [Next.js Unit III: API Development & Forms and Server Actions](#nextjs-unit-iii-api-development--forms-and-server-actions)
4. [Next.js Unit IV: Authentication & Authorization, Database Integration](#nextjs-unit-iv-authentication-and-authorization--database-integration)
5. [Next.js Unit V: Performance, SEO & Deployment](#nextjs-unit-v-performance-seo--deployment)
6. [Next.js Unit VI: Advanced Next.js Features & Industry Practices](#nextjs-unit-vi-advanced-nextjs-features--industry-practices)
7. [React Unit I: Refreshing JavaScript & React Fundamentals / Tooling](#react-unit-i-refreshing-javascript--react-fundamentals)
8. [React Unit II: Component Design & Minimalist Styling](#react-unit-ii-component-design--styling-in-react)
9. [React Unit III: States, Events, Hooks & Side Effects](#react-unit-iii-states-events-hooks--side-effects)
10. [React Unit IV: Form Handling & Validation](#react-unit-iv-form-handling--validation)
11. [React Unit V: Client-Server Communication & Client Navigation](#react-unit-v-client-server-communication--client-side-routing)
12. [🎓 Master Viva & Evaluation Cheat Sheet (15 Q&A)](#-master-viva--evaluation-cheat-sheet)

---

## ⚡ Part 1: Next.js Curriculum Mapping

### Next.js Unit I: Fundamentals & Routing and Navigation

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Introduction & Features of Next.js** | Next.js 14 App Router with React Server Components, file-based routing, server actions, and route handlers. | `package.json`, `next.config.js` |
| **Project Structure** | Clean modular architecture separating pages (`app/`), reusable components (`components/`), backend engines (`lib/`), static uploads (`public/`), and database records (`data/`). | Root directory tree |
| **App Router** | Modern `app/` directory paradigm using `layout.js`, `page.js`, `route.js`, `loading.js`, `error.js`, and `not-found.js`. | `app/` |
| **File-Based Routing** | Pages map directly to filesystem folders: `/` -> `app/page.js`, `/discover` -> `app/discover/page.js`, `/calendar` -> `app/calendar/page.js`. | `app/` |
| **Dynamic Routes** | Parameterized route segments using brackets: `/events/[id]`, `/events/edit/[id]`, `/venues/[id]`. | `app/events/[id]/page.js`, `app/venues/[id]/page.js` |
| **Nested Routes** | Sub-resource child routes: `/events/[id]/attendees` for ticket scanning and attendance rosters. | `app/events/[id]/attendees/page.js` |
| **Layouts** | Shared root shell `app/layout.js` wrapping all pages with minimal navigation (`Navbar.js`) and consistent styling. | `app/layout.js` |
| **Navigation** | Declarative client navigation using `<Link href="...">` from `next/link` and programmatic routing with `useRouter` and `usePathname`. | `components/Navbar.js`, `app/page.js` |
| **Error and Loading UI** | Native App Router suspense boundaries: `app/loading.js` (minimalist spinner during page transitions) and `app/error.js` (error recovery with reset button). | `app/loading.js`, `app/error.js` |
| **Not Found UI** | Custom 404 page `app/not-found.js` with direct return navigation. | `app/not-found.js` |

---

### Next.js Unit II: Rendering Strategies & Data Fetching

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Server Components vs Client Components** | Default pages run on the server for performance and SEO; interactive pages use the `'use client'` directive to enable React hooks (`useState`, `useEffect`). | `app/layout.js` (Server), `app/discover/page.js` (Client) |
| **SSR / SSG / ISR Concepts** | Static pages generated at build time (`/`, `/venues`, `/login`), while real-time authenticated views render dynamically on request. | Next.js build output |
| **Data Fetching via Fetch API** | Standardized `fetch('/api/...')` with HTTP methods (GET, POST, PATCH, DELETE). | `lib/hooks.js`, `app/discover/page.js` |
| **Caching & Revalidation** | Next.js `revalidatePath('/discover')` and `revalidatePath('/my-events')` triggered by Server Actions to instantly update server caches after data mutations. | `app/actions/eventActions.js` |

---

### Next.js Unit III: API Development & Forms and Server Actions

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Route Handlers & REST APIs** | Backend endpoints defined using Next.js Route Handlers (`app/api/.../route.js`). | `app/api/events/route.js`, `app/api/venues/route.js` |
| **HTTP Methods** | Full REST support: `GET` (fetch), `POST` (create), `PUT`/`PATCH` (update/approve/read), `DELETE` (cancel/remove). | `app/api/admin/events/[id]/approve/route.js` |
| **Dynamic Route Handlers** | Route parameters extracted from `{ params }` object: `params.id`. | `app/api/events/[id]/route.js` |
| **Request & Response Handling** | `NextRequest` for reading headers/cookies/JSON bodies; `NextResponse.json(data, { status })` for structured responses. | All files in `app/api/` |
| **Server Actions (`'use server'`)** | Native server-side functions invoked directly from client components or HTML forms: `createEventAction()`, `toggleBookmarkAction()`. | `app/actions/eventActions.js` |
| **Form Handling & Validation** | Server-side validation of mandatory fields, date/time logic, and capacity boundaries before mutating data. | `app/actions/eventActions.js` |
| **File Upload** | Native multipart `FormData` processor saving event poster assets directly to `public/uploads/`. | `app/api/upload/route.js` |

---

### Next.js Unit IV: Authentication and Authorization & Database Integration

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Authentication Concepts** | Password hashing using `bcryptjs` with cryptographically secure salt. Token signing using `jsonwebtoken` (JWT). | `lib/auth.js`, `app/api/auth/login/route.js` |
| **Session Management** | Stateless JWT tokens stored in secure, tamper-proof `httpOnly` cookies (`sameSite: "lax"`). | `app/api/auth/login/route.js`, `app/api/auth/logout/route.js` |
| **Protected Routes & RBAC** | Role-based access control protecting routes across 3 roles: `student`, `organiser`, and `admin`. Unauthenticated requests receive HTTP 401; unauthorized roles receive HTTP 403. | `middleware.js`, `lib/auth.js`, `app/api/admin/` |
| **Database Integration (ORM/DB Basics)** | Safe, atomic read and write operations on JSON databases inside `data/` (`users.json`, `events.json`, `venues.json`, `audit_logs.json`, etc.). | `lib/db.js` |
| **Environment Variables** | Configuration loaded via `process.env.JWT_SECRET` with college project fallbacks. | `lib/auth.js`, `app/actions/eventActions.js` |

---

### Next.js Unit V: Performance, SEO & Deployment

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Metadata API (SEO)** | Static `metadata` export in `app/layout.js` defining title templates, description, keywords, and author tags for search engines. | `app/layout.js` |
| **Code Splitting & Lazy Loading** | Automatic route-based code splitting by Next.js App Router; individual chunks created per route. | `.next/static/chunks/` |
| **Production Build** | Verified production build with `npm run build` achieving 0 compilation errors and optimized client bundles. | `package.json` |
| **Performance & Error Logging** | Detailed error logging in `app/error.js` and immutable administrative audit logs in `lib/auditLogger.js`. | `lib/auditLogger.js`, `app/error.js` |

---

### Next.js Unit VI: Advanced Next.js Features & Industry Practices

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Middleware & Request Rewriting** | `middleware.js` acts as an edge proxy, rewriting friendly URLs (`/events`, `/venues`, `/admin`) directly to API route handlers while protecting private paths. | `middleware.js` |
| **Component Organization** | Clean, atomic component folder structure (`components/Navbar.js`, `components/Badge.js`, `components/Card.js`, `components/Button.js`, etc.). | `components/` |
| **Security Best Practices** | Multi-layer defenses: bcrypt password hashing, JWT validation, HTTP-only cookie flags, input trimming, and immutable audit logs. | `lib/auth.js`, `lib/auditLogger.js` |
| **Testing Overview** | 8 automated end-to-end integration test suites covering Modules 1 through 9 with 100% pass rates. | `scripts/test-module*.js` |

---

## ⚛️ Part 2: React Curriculum Mapping

### React Unit I: Refreshing JavaScript & React Fundamentals

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Arrow Functions, let & const** | Consistent modern ES6+ syntax across all components and server functions. | Codebase-wide |
| **Array Methods (map, filter, reduce)** | Declarative rendering of event lists, filtering clashes, and computing attendance metrics. | `app/discover/page.js`, `lib/analyticsEngine.js` |
| **Destructuring & Spread / Rest** | Object/array destructuring `const { user, loading } = useAuth()` and prop forwarding `{ ...rest }`. | `components/Button.js`, `lib/hooks.js` |
| **ES Modules (import / export)** | Named and default ES module exports connecting modules cleanly. | Codebase-wide |
| **Declarative UI Paradigm** | UI is a pure function of state: `{loading ? <LoadingSpinner /> : <EventList />}`. | All pages in `app/` |
| **JSX Syntax & Expressions** | Clean HTML-in-JavaScript expressions embedding dynamic data. | `components/Card.js`, `app/page.js` |

---

### React Unit II: Component Design & Minimalist Styling

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Functional Components** | 100% functional components using modern hooks (zero legacy class components). | `components/`, `app/` |
| **Props-Driven Reusability** | Components receive configurable props (`variant`, `size`, `loading`, `onClick`). | `components/Button.js`, `components/Badge.js` |
| **Component Composition Patterns** | Flexible container components accepting `children` and named slots (`title`, `subtitle`, `footer`). | `components/Card.js`, `components/Modal.js` |
| **Conditional Rendering** | Short-circuit evaluation (`{user && ...}`) and ternary operators for clean UI branching. | `app/page.js`, `components/Navbar.js` |
| **Minimalist Styling in React** | Modern, clean CSS design system in `app/globals.css` with subtle slate borders, soft shadows, responsive typography, and minimal cards. | `app/globals.css` |
| **Accessibility (a11y) & Semantic HTML** | Semantic elements (`<header>`, `<nav>`, `<main>`, `<table>`), `role="dialog"`, `aria-modal="true"`, and `role="alert"`. | `components/Modal.js`, `components/Navbar.js` |

---

### React Unit III: States, Events, Hooks & Side Effects

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Local State Management (`useState`)** | Managing form inputs, search filters, modal visibility, and active tab toggles. | `app/discover/page.js`, `app/admin/page.js` |
| **Event Handling** | Clean React event handlers: `onSubmit={handleSubmit}`, `onClick={handleBookmark}`. | `app/login/page.js`, `app/discover/page.js` |
| **Side Effects & Cleanup (`useEffect`)** | Data fetching on mount, listening for ESC key in modals with cleanup functions (`removeEventListener`). | `components/Modal.js`, `app/profile/page.js` |
| **Performance Optimization (`useCallback`)** | Memoized callbacks in custom hooks preventing unnecessary re-renders. | `lib/hooks.js` |
| **Custom Hooks for Logic Reuse** | Reusable logic abstracted into clean custom hooks: `useAuth()`, `useFetch()`, `useDebounce()`, `useToggle()`, and `useDocumentTitle()`. | `lib/hooks.js` |

---

### React Unit IV: Form Handling & Validation

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **Controlled Components** | Form inputs bound to React state via `value={state}` and `onChange={(e) => setState(e.target.value)}`. | `app/login/page.js`, `app/register/page.js` |
| **Form Submission Workflows** | Intercepting form submissions with `e.preventDefault()`, validating inputs, and managing loading indicators. | `app/profile/page.js`, `app/events/create/page.js` |
| **Reusable Form Component Design** | Unified CSS form styling (`.form-group`, clean labels, focus rings, and submit buttons). | `app/globals.css` |
| **Client-Side Form Validation** | Real-time checks for required inputs, date sequence (`startTime < endTime`), and capacity constraints. | `app/events/create/page.js`, `app/register/page.js` |

---

### React Unit V: Client-Server Communication & Client-Side Routing

| Syllabus Topic | How It Is Implemented in Eventra | Source Files |
| :--- | :--- | :--- |
| **HTTP Fundamentals & REST** | Standardized HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`. | All API route handlers |
| **Handling Loading, Error & Empty States** | Clean UI feedback across all states: `<LoadingSpinner />`, `<ErrorBoundary />`, and `<EmptyState />`. | `components/EmptyState.js`, `components/LoadingSpinner.js` |
| **Client-Side Navigation** | Next.js `<Link>` for instant page switches without full browser reloads. | `components/Navbar.js` |
| **Query Parameter Handling** | Reading and updating URL query strings (`?q=...&category=...`) via `URLSearchParams`. | `app/discover/page.js`, `app/admin/audit-log/route.js` |

---

## 🎓 Master Viva & Evaluation Cheat Sheet

| # | Examiner Question | Recommended Direct Answer |
| :- | :--- | :--- |
| **1** | **Why did you choose Next.js App Router over traditional React (Vite/CRA)?** | *"Next.js App Router gives us a hybrid architecture: React Server Components for zero-bundle-size server rendering, native Route Handlers for full REST API backends, and Server Actions for secure data mutations without needing an external Express server."* |
| **2** | **What is the difference between Server Components and Client Components in Eventra?** | *"Server Components (like `layout.js`) render on the server, have direct access to backend resources, and send zero JavaScript to the browser. Client Components (marked with `'use client'`, like `discover/page.js`) run in the browser to handle interactivity, user state, and React hooks like `useState`."* |
| **3** | **How does Eventra handle Error Boundaries and Loading states in the App Router?** | *"Next.js uses convention-based files: `app/loading.js` automatically renders a minimalist spinner during route transitions, and `app/error.js` acts as a React Error Boundary catching unexpected runtime exceptions with an interactive reset button."* |
| **4** | **What are Server Actions and where are they used in the project?** | *"Server Actions (defined with `'use server'` in `app/actions/eventActions.js`) are asynchronous functions that execute securely on the server. They handle event creation, validate form data, mutate the database, and trigger `revalidatePath()` to refresh cached pages."* |
| **5** | **How is Role-Based Access Control (RBAC) enforced?** | *"We enforce RBAC at two layers: Edge middleware (`middleware.js`) intercepts requests to `/admin` routes and checks JWT cookies, while Route Handlers call `getLoggedInUser(request)` to ensure users only access actions permitted for their role (`student`, `organiser`, `admin`)."* |
| **6** | **How does session management work without third-party services like Firebase?** | *"When a user logs in, the server verifies their password with `bcryptjs`, signs a JSON Web Token (JWT) with their ID and role, and attaches it as an `httpOnly` cookie. This prevents XSS attacks because client-side JavaScript cannot read the token."* |
| **7** | **What custom React hooks did you build and why?** | *"In `lib/hooks.js`, we built `useAuth()` to manage user sessions and permissions, `useFetch()` for declarative data fetching with loading/error states, `useDebounce()` for smooth search input filtering, and `useToggle()` for clean modal controls."* |
| **8** | **How does the project maintain clean, minimalist component design?** | *"We built an atomic component library in `components/` (`Badge.js`, `Button.js`, `Card.js`, `Modal.js`, `EmptyState.js`, `LoadingSpinner.js`). Each component uses props-driven reusability, composition with `children`, and clean CSS styling without heavy third-party UI libraries."* |
| **9** | **How do you prevent scheduling clashes in Module 4?** | *"We use the Golden Interval Overlap rule: two events overlap if and only if `(start1 < end2) && (start2 < end1)`. Our clash engine tests 5 conflict types: venue collisions, capacity overflows, organiser conflicts, student audience clashes, and blackout exam dates."* |
| **10** | **Can an administrator override a clash in Module 9?** | *"Yes! If an urgent college event requires scheduling over a clash, the administrator can check 'Admin Override' and provide an official justification reason. This override is permanently recorded in `audit_logs.json` for full accountability."* |
| **11** | **How does the personal schedule clash detection in Module 8 work?** | *"It checks the student's personal weekly schedule: comparing the event's date and time against both the student's recurring class timetable (e.g. DBMS lecture on Thursday 10:00) and other registered events, preventing double-booking."* |
| **12** | **How does the QR check-in and attendance export work in Module 6?** | *"Upon registration, the server issues a digital ticket with a unique code and base64 QR code. At the event entrance, organisers scan the QR code via `/attendance/scan` to verify and record attendance, and can export the roster as a standard CSV spreadsheet."* |
| **13** | **How does Module 7 handle event reminders without spamming?** | *"The reminder engine computes 24-hour and 1-hour time windows using UTC timestamps and checks notification records to guarantee that reminder alerts are strictly deduplicated and sent only once per student."* |
| **14** | **How does the metadata API improve SEO in Next.js?** | *"In `app/layout.js`, we export a `metadata` object defining standard OpenGraph titles, descriptions, and keywords. Next.js automatically injects these into the HTML `<head>` during server-side rendering for optimal search engine indexing."* |
| **15** | **How did you verify and test the codebase?** | *"We built 8 automated integration test suites (`scripts/test-module2.js` through `test-module9.js`) that make real HTTP requests against all API endpoints, verifying authentication, permissions, CRUD flows, clash detection, and data persistence with 100% pass rates."* |
