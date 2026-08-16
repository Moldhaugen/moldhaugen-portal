@AGENTS.md

## Stack

- **Framework**: Next.js 16 App Router (params are `Promise<{}>`, must be awaited)
- **Database**: Supabase (Postgres + Auth + RLS)
- **Styling**: Tailwind CSS v4 with CSS custom properties — theme vars are in `src/app/globals.css`
- **Email**: Resend via `src/lib/email.ts` — API key in `RESEND_API_KEY` env var
- **Theme**: `next-themes` with `attribute="class"` — dark mode adds `.dark` to `<html>`
- **Language**: Norwegian (nb) throughout the UI

## Key conventions

- All server actions are in `actions.ts` files colocated with the page
- RLS policies use SECURITY DEFINER functions to avoid circular references
- Supabase types are hand-maintained in `src/types/index.ts` (no generated types file)
- Mobile: bottom tab nav for core pages; profile/admin/theme toggle in hamburger menu (top right avatar)
- Desktop: left sidebar always dark, main content area respects light/dark theme

## Pending env vars (Vercel)

- `RESEND_API_KEY` — get from resend.com
- `EMAIL_FROM` — e.g. `Moldhaugen <noreply@robinfosse.com>` (needs verified domain)
- `NEXT_PUBLIC_SITE_URL` — the Vercel deployment URL
- `SUPABASE_SERVICE_ROLE_KEY` — for admin user deletion

## TODOs

- [ ] **Verify Resend domain** to enable email delivery to real residents. Currently in test mode — only delivers to `moldhaugen@robinfosse.com`. Go to resend.com → Domains → verify `robinfosse.com`, then set `EMAIL_FROM=Moldhaugen <noreply@robinfosse.com>` in `.env.local` and Vercel env vars.
