@AGENTS.md

## Stack

- **Framework**: Next.js 16 App Router (params are `Promise<{}>`, must be awaited)
- **Database**: Supabase (Postgres + Auth + RLS) — project region: **eu-west-2 (London)**
- **Styling**: Tailwind CSS v4 with CSS custom properties — theme vars are in `src/app/globals.css`
- **Email**: Resend via `src/lib/email.ts` — API key in `RESEND_API_KEY` env var
- **Push notifications**: Web Push (VAPID) via `src/lib/push.ts`, subscriptions in `push_subscriptions` table
- **Theme**: `next-themes` with `attribute="class"` — dark mode adds `.dark` to `<html>`
- **Language**: Norwegian (nb) throughout the UI
- **Deployment**: Vercel, region `arn1` (Stockholm) — co-located close to Supabase London and Norwegian users

## Key conventions

- All server actions are in `actions.ts` files colocated with the page
- RLS policies use SECURITY DEFINER functions to avoid circular references
- Supabase types are hand-maintained in `src/types/index.ts` (no generated types file)
- Mobile: bottom tab nav for core pages; profile/admin/theme toggle in hamburger menu (top right avatar)
- Desktop: left sidebar always dark, main content area respects light/dark theme
- **Auth in pages**: use `supabase.auth.getSession()` (reads cookie locally, no network call) — the middleware (`src/proxy.ts`) already calls `getUser()` on every request to validate/refresh tokens
- **Auth in actions**: use `supabase.auth.getUser()` — server actions are called directly and need full token validation
- **Parallel fetching**: run `getSession()` and data queries that don't need `user.id` together in `Promise.all`

## Git remote

`https://github.com/robfosse/moldhaugen-portal.git` (repo moved from `Moldhaugen/moldhaugen-portal`)

## Env vars

### Local (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `CRON_SECRET` — shared secret for the hourly reminder cron endpoint

### Vercel (must also be set there)
All of the above, plus confirm `NEXT_PUBLIC_SITE_URL` points to the live deployment URL.

## Cron job

`/api/cron/reminders` runs hourly (`0 * * * *`), secured with `Authorization: Bearer $CRON_SECRET`.
- **18:00 Oslo**: sends day-before reminder for assignments due tomorrow
- **At scheduled hour (or 09:00 if no time set)**: sends on-day reminder for assignments due today
- Tracks sends via `reminder_day_before_sent_at` / `reminder_on_day_sent_at` columns on `maintenance_assignments`

## TODOs

- [ ] **Run `supabase/migration_reminders.sql`** in Supabase SQL editor to add `scheduled_time`, `reminder_day_before_sent_at`, `reminder_on_day_sent_at` columns to `maintenance_assignments`.
