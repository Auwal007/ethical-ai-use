# Technical Documentation: Ethical AI Literacy System

This document outlines the architecture, technology stack, and technical implementation details of the Ethical AI Literacy System. It is intended for developers, maintainers, and DevOps engineers interacting with the codebase.

---

## 🏗️ Architecture Overview

The application is built using a monolithic architecture on top of the **Next.js App Router**. It heavily utilizes React Server Components (RSC) for initial page loads and secure backend logic, alongside Client Components for interactive UI elements.

### Technology Stack
* **Framework:** Next.js 15.5+ (App Router)
* **Frontend Library:** React 19
* **Language:** TypeScript (Strict Mode)
* **Styling:** Tailwind CSS v4 + Native CSS Custom Properties (`globals.css`)
* **Icons:** Lucide React
* **Database:** SQLite3 via the `better-sqlite3` driver
* **Authentication:** Custom JWT-based Authentication using HTTP-Only Cookies via `jose`.

---

## 🗄️ Database Schema & Data Layer

The database is powered by a localized SQLite file (`app.db`). The initialization logic is housed in `lib/db.ts` and runs automatically to ensure schema integrity.

### Core Tables

1. **`users` Table**
   * Stores authentication and gamification data.
   * `id` (INTEGER PRIMARY KEY)
   * `name`, `email` (UNIQUE), `password_hash` (Bcrypt)
   * `role` (TEXT: 'student' or 'admin')
   * `xp` (INTEGER): Total experience points.
   * `current_streak` (INTEGER): Daily login streak.
   * `last_active_date` (TEXT): ISO date string used to calculate streak continuation/resets.

2. **`progress` Table**
   * Tracks student interaction with learning modules.
   * `id` (INTEGER PRIMARY KEY)
   * `user_id` (FOREIGN KEY referencing `users`)
   * `module_id` (INTEGER)
   * `status` (TEXT: 'in_progress', 'completed')
   * `score` (INTEGER): The percentage score achieved on the module scenarios.
   * `completed_at` (DATETIME)
   * *Constraint:* Unique constraint on `(user_id, module_id)` ensures only one progress record per module per user.

---

## 🔐 Authentication & Security

Authentication is handled entirely in-house without third-party providers (like NextAuth/Auth.js) to minimize dependencies and maximize data privacy.

1. **Registration & Login (`app/api/register`, `app/api/login`):**
   Passwords are hashed using standard cryptographic APIs before being stored. Upon successful login, a JWT is generated using the `jose` library.
2. **Session Management (`lib/auth.ts`):**
   The JWT is signed and set as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie (`auth_token`). This prevents XSS attacks from accessing the session token.
3. **Middleware (`middleware.ts`):**
   Next.js edge middleware intercepts requests. It verifies the JWT signature before allowing access to protected routes (`/dashboard`, `/admin`, `/modules/*`). Unauthenticated users are redirected to `/login`.
4. **Client State (`components/AuthProvider.tsx`):**
   A React Context provider that fetches the user's decoded JWT payload (including XP and role) on mount and exposes it to the React tree.

---

## 🎨 UI & Theming System

The application utilizes a highly customized styling approach that blends Tailwind CSS utility classes with native CSS Variables for robust Dark/Light mode support.

### Theme Persistence & Hydration
A common issue in SSR React apps is the "hydration mismatch" when rendering dark mode. We solved this via:
1. **Inline Script Injection (`app/layout.tsx`):** A raw JavaScript block runs *before* React hydrates to check `localStorage` and system preferences, appending a `data-theme="dark"` attribute to the `<html>` tag.
2. **Theme Provider (`components/ui/ThemeProvider.tsx`):** Syncs the initial server state with the client state and exposes a `toggleTheme` function.
3. **CSS Variables (`globals.css`):** All colors (e.g., `--bg-card`, `--text-primary`) are mapped to the `[data-theme="dark"]` selector, instantly swapping the palette without a flash of unstyled content (FOUC).

---

## 🎮 Gamification Engine

The logic for awarding XP, levels, and streaks is centralized in the backend API endpoints to prevent client-side manipulation.

* **XP Calculation (`app/api/progress/route.ts`):** 
  When a user successfully completes a module (score >= 70%), the API calculates XP based on the score and updates the `users` table. 
* **Level Mapping (`components/AuthProvider.tsx`):**
  Raw XP is mapped to standard levels on the client:
  * Novice (0 - 49 XP)
  * Apprentice (50 - 149 XP)
  * Scholar (150 - 299 XP)
  * Guardian (300+ XP)
* **Streak Calculation (`app/api/me/route.ts`):**
  When the client fetches the user session, the server compares the current date with the user's `last_active_date`. If the date is exactly 1 day after, the streak increments. If > 1 day, the streak resets to 1. The new date is then saved.

---

## 📊 Administrator Analytics

The Admin dashboard (`app/admin/page.tsx`) requires aggregated data across all users.

* **Endpoint (`app/api/progress/route.ts` - GET):** 
  If the requesting user is an admin, the API performs complex SQLite `JOIN` operations to merge the `users` table with the `progress` table.
* **Calculations:** It calculates the total number of students, global average scores, and aggregates completions per module. This data feeds directly into the Recharts/Lucide visualizations on the frontend.
