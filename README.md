# STRIATUM 4.0

The web application for **STRIATUM 4.0 — Medical Symposium 2026**, presented by SIGMA 2026 for
Indira Gandhi Medical College & Research Institute (IGMCRI).

STRIATUM is a delegate + event registration platform: participants sign in, apply for a
Delegate ID, register for individual events, pay manually via UPI (screenshot upload, reviewed
by an admin), and are checked in at venues by QR. There is no payment gateway integration —
every payment is verified by a human admin before any ID or QR is issued. See `docs/` for the
full product specification (`docs/00-PRODUCT.md`) and design system (`docs/01-DESIGN-SYSTEM.md`).

## Stack

Next.js 15 (App Router, TypeScript, Tailwind CSS v4) + Supabase (Postgres, Auth, private
Storage, RLS).

## Setup

1. Create a Supabase project at https://supabase.com.
2. Run the SQL files in `supabase/migrations/` against your project, in filename order (via the
   Supabase SQL editor or the Supabase CLI).
3. Run `supabase/seed.sql` (if present) to load reference/seed data.
4. Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
5. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

6. Visit `/styleguide` to review the design system in isolation (development only — the route
   returns a 404 in production).

## Bootstrapping the first admin

The operations console (`/admin`) has no public sign-up — every admin account is granted by an
existing `SUPER_ADMIN` from **Settings → Admins** (`/admin/settings/admins`), which calls
`addAdminUser()` in `lib/actions/admin.ts`. That action itself requires `SUPER_ADMIN` access, so
the very first admin cannot be created through the UI — it must be inserted directly with SQL.

1. Sign in to the app once with the account that should become the first admin (this creates its
   `profiles` row).
2. In the Supabase SQL editor, run:

   ```sql
   insert into admin_users (user_id, role)
   select id, 'SUPER_ADMIN'
   from auth.users
   where email = 'the-admin-email@example.com';
   ```

3. That account can now sign in and reach `/admin`, and can grant admin access to anyone else
   from `/admin/settings/admins`.

## Project structure

- `app/` — routes (App Router)
- `components/` — UI primitives, shell, brand, signal, and delegate-imprint components
- `lib/` — utilities, Supabase clients, and shared types
- `supabase/` — SQL migrations and seed data
- `docs/` — authoritative product spec and design system

## Documentation

See `docs/00-PRODUCT.md` for product requirements and `docs/01-DESIGN-SYSTEM.md` for the visual
language, tokens, and component inventory.
