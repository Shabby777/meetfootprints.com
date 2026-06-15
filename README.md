Footprints to Feel Better — Static site

What this repo is
- A static HTML/CSS/vanilla-JS website for "Footprints to Feel Better" (therapist directory, booking, and therapist portal).
- Data fallback lives in data/therapists.json. Booking uses Cal.com links/embeds. Therapist portal uses Supabase for auth and data storage.

Quick local preview
- No build step required. Open index.html (and other HTML files) in a browser, or run a simple static server:
  - Python 3: python -m http.server 8000
  - Node: npx serve .

Key files
- index.html — main directory / search UI
- script.js — client filtering, pagination, UI wiring
- data/therapists.json — fallback dataset
- therapist-profile.html + therapist-profile.js — single therapist view
- book-consultation.html + booking.js — Cal.com booking embeds
- therapist-portal.html + therapist-portal.js — admin/therapist editor (Supabase)
- supabase-config.js, supabase-client.js — Supabase setup
- CSS: style.css, home.css, pages.css
- assets: data/portraits/, icons/, Designs/
- supabase-*.sql — schema and seed scripts for Supabase

Supabase notes
- supabase-config.js includes a publishable anonKey for client use. Verify this is the intended public key (never commit service_role or private keys).
- To enable full portal features, set FOOTPRINTS_SUPABASE_CONFIG.url and anonKey appropriately.

Development notes
- The app is intentionally simple (no bundler). JS modules are monolithic; consider refactoring into smaller modules if adding complexity.
- Client-side events and storage are used to propagate therapist updates between pages.

Suggested next tasks
1. Inventory & docs (done: README created)
2. Confirm Supabase project settings and keys
3. Add a simple CI smoke test (link check or visual smoke)
4. Optional: add an npm script for starting a local server

Contributing
- Open an issue or submit a PR with a clear summary of the change and any verification steps.

License
- Add LICENSE file or specify license in README if desired.
