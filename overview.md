# Codebase Overview: meetfootprints.com

`meetfootprints.com` (Footprints to Feel Better) is a warm, modern, static website for a therapist directory, booking platform, and therapist administration portal. The site provides a client-facing discovery experience alongside a secure portal where clinical staff can manage their profiles, rates, and availability.

---

## 📂 Codebase Directory Structure

Below is an overview of the key directories and files within the codebase:

| Path | Type | Description |
| :--- | :--- | :--- |
| `index.html` | File | The site landing page. Currently displays a focused Hero section; legacy sections are preserved inside a template tag. |
| `about.html` | File | About Us page containing descriptions of the organization. |
| `services.html` | File | Details on therapy pathways (Individual, Couples, Family, Group therapy). |
| `clinical-staff.html` | File | Client-facing therapist directory and search/filter interface. |
| `therapist-profile.html` | File | Individual detailed therapist profile page. |
| `book-consultation.html`| File | Client booking page featuring an embedded Cal.com widget. |
| `therapist-portal.html` | File | Secure therapist and administrator profile management portal. |
| `price-update.html` | File | Notification page communicating fee adjustment details (effective June 2026). |
| `script.js` | File | Orchestrates client-side directory search, multi-faceted filtering, and pagination. |
| `booking.js` | File | Controls dynamic Cal.com widget embedding based on the selected therapist. |
| `therapist-profile.js` | File | Populates single-therapist details and checks for staff edit permissions. |
| `therapist-portal.js` | File | Controls secure login, editor form state, admin searches, and image optimizations. |
| `therapists-data.js` | File | Data access layer wrapping Supabase RPCs with client-side localStorage caching and JSON fallbacks. |
| `supabase-client.js` | File | Configures the Supabase JS client and processes session tokens. |
| `supabase-config.js` | File | Stores public configuration credentials (anon key, DB URL) for Supabase. |
| `data/` | Dir | Stores therapist fallback datasets (`therapists.json`, `therapists-new.json`) and local images. |
| `Designs/` | Dir | Houses design reference directories for desktop and mobile layouts. |
| `icons/` | Dir | Stores SVG and PNG graphical UI elements. |
| `supabase-*.sql` | Files | Database initialization scripts, schema files, performance fixes, and seed scripts. |
| `clinical-staff-live.html`| File | Legacy GoDaddy Website Builder page, kept in repository for historical reference. |

---

## 🛠️ Technology Stack & Architecture

### 1. Frontend Layer
* **Core**: Monolithic Vanilla JavaScript modules (`script.js`, `therapist-portal.js`, etc.) and standard semantic HTML5 pages.
* **Styling**:
  * Core website pages (`index.html`, `clinical-staff.html`, `about.html`) use standard CSS files (`style.css`, `home.css`, `pages.css`).
  * Sub-pages (`therapist-profile.html`, `book-consultation.html`) use **Tailwind CSS** loaded via a CDN (`cdn.tailwindcss.com`).
* **Routing**: The site is fully static. Inter-page routing is done using query strings (e.g., `therapist-profile.html?therapist=siham-abdelqader`).

### 2. Backend & Database Integration (Supabase)
* **Supabase Client**: Initialized client-side in `supabase-client.js` using credentials from `supabase-config.js`.
* **Data Access Wrapper**: `therapists-data.js` acts as an ORM/data client, defining default structures (`EMPTY_THERAPIST`), fallback handlers, and utility helpers like slugification.
* **Realtime Profile Updates**: The app implements local storage caching combined with custom event broadcasting (`footprints:therapist-updated` and `storage` listeners) to immediately sync profile changes across open browser tabs.

---

## 📊 Database Schema & Custom RPCs

The data layer is configured via custom PL/pgSQL Remote Procedure Calls (RPCs) to secure access and avoid exposing sensitive details:

### Tables
1. **`public.therapists`**: Holds details about clinicians (name, title, location, specialties, languages, therapy types, price, availability, summary, image URL).
2. **`public.staff_users`**: Defines staff credentials and roles (`admin` vs `therapist`). Constrained to allow only `@footprintstofeelbetter.com` emails.
3. **`public.staff_sessions`**: Tracks active session tokens.

### Key RPC Functions
* **`footprints_create_staff_session(p_email, p_password)`**: Validates credentials and returns a secure session token.
* **`footprints_get_staff_session(p_token)`**: Authenticates session tokens.
* **`footprints_list_portal_therapists(p_token)`**:
  * Admins: Returns a list of all therapists.
  * Therapists: Returns only the profile linked to their account.
  * *Optimization*: In listing view, the heavy `image` column is loaded as `null` to minimize bandwidth (implemented in `supabase-portal-performance-fix.sql`).
* **`footprints_get_portal_therapist(p_token, p_therapist_id)`**: Loads the full therapist profile (including images and description fields) upon editing.
* **`footprints_save_therapist_profile(...)`**: Handles inserting or updating profiles, including saving new password hashes/PINs.

### Storage
* **`therapist-images`**: A public storage bucket with size limits (5MB) and mime constraints (`jpg`, `png`, `webp`). Includes RLS policies permitting public select actions and staff-level inserts/updates.

---

## 🔍 Key Observations & Technical Notes

### 1. Legacy Code & Templates
* **`index.html` Template Block**: A large portion of the original landing page (from line 113 to 498) is hidden inside a `<template id="previous-homepage-sections">` tag. The active homepage is currently a clean hero landing page.
* **Unreferenced GoDaddy Artifacts**: `clinical-staff-live.html` contains the legacy Godaddy Website Builder layout with inline fonts, stylesheets, and meta assets. It is completely unreferenced by the website router and functions purely as a reference file.

### 2. Custom Authentication Flow
* Instead of using Supabase's native GoTrue Auth modules (`supabase.auth.signUp`/`signIn`), the codebase relies on a **custom token-based schema** using PG Crypto. Session checks and logins are handled entirely via custom tables (`staff_users`, `staff_sessions`) and RPC functions (`footprints_create_staff_session`, `footprints_get_staff_session`).

### 3. Client-Side Synchronizations
* Changes made in the Therapist Portal are updated in the local database and immediately reflected across pages using two sync methods:
  1. Custom DOM Event Dispatcher (`footprints:therapist-updated`).
  2. A local storage listener (`storage`) to communicate updates across multiple open browser tabs.
