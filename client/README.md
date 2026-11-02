# Bellpath Web

Next.js frontend for Bellpath. Public pages and role-specific portals are served from the same host, with portal paths under `/admin`, `/teachers` and `/students`.

| Host | Purpose |
|---|---|
| `http://localhost:3000` | Home, accounts, help, contact and privacy pages |
| `http://localhost:3000/teachers` | Teacher portal |
| `http://localhost:3000/students` | Student portal |
| `http://localhost:3000/admin` | Administrator portal |

## Stack

- Next.js 16 App Router and React
- TypeScript
- Tailwind CSS v4
- `next-themes` for light and dark mode
- `lucide-react` for icons

## Getting started

You need Node.js 20.9 or newer.

```bash
cd client
npm install
cat > .env.local <<'EOF'
API_BASE_URL=http://127.0.0.1:8000
EOF
npm run dev
```

Run the FastAPI service separately (see [the server README](../server/README.md)).

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:8000` | Internal URL for the FastAPI service. |

For production, serve the app over HTTPS at your school domain. Public and portal routes share the same origin.

## Routing and sessions

`proxy.ts` checks authentication and role on portal paths without changing the browser URL.

- Public routes include `/`, `/accounts`, `/help`, `/contact` and `/privacy`.
- Portal routes are rooted at `/admin`, `/teachers` and `/students`; each login page is available at its portal's `/login` path.
- An authenticated portal is checked against `/auth/me` on each page request. A user opening the wrong role's portal is redirected to their correct portal path.
- Login and password changes call the FastAPI service through Next route handlers. Access and refresh tokens live in host-only, `httpOnly`, `SameSite=Lax` cookies; the access cookie is `Secure` in production. Tokens are never stored in local storage or exposed to client JavaScript.
- When an access token expires, the proxy rotates the refresh token through `/auth/refresh` and updates both cookies. The server stores only a hash of the refresh token.
- First sign-in requires a new password of at least 10 characters. Protected portal requests are redirected to `/change-password` until that succeeds.
- Sign out revokes the refresh token and clears the browser cookies.
- Role checks are a user-experience boundary, not the security boundary: FastAPI validates the current account and permissions on protected API operations.

The authentication cookies are shared across portal paths on the same origin. The proxy checks the account role for each portal request and redirects users to the matching portal.

## Public information pages

The home page introduces the three portals and account setup. The accounts, help, contact and privacy pages follow the supplied school-facing copy. Replace the remaining bracketed contact, retention and provider details before publishing the privacy page; it is clearly marked as a draft.

## Portal pages and data

- The teacher portal renders the lesson planner.
- The student timetable only renders published lessons.
- The administrator portal provides a role-specific school setup overview.
- Calendar samples remain local demo data in `lib/lessons.ts`. The FastAPI lesson response currently does not include the subject, class or start-time fields required by the calendar; wire live lessons only after those API fields and the client data layer are aligned.

The theme defaults to light mode. The header toggle switches light and dark modes. CSS variables in `app/globals.css` define the theme palette and reusable glass utility.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run the development server |
| `npm run build` | Create the production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint the client |


## Features by role

- **Public:** home, help, privacy, contact, and `/request-account`, the form teachers use to ask for an account.
- **Admin:** overview stats, account requests (approve/decline), teachers, students, classes and rosters, subjects, teaching assignments, school calendar, all lessons.
- **Teacher:** calendar with create/edit/publish/delete lessons, lesson search, my classes and rosters, create and manage student accounts.
- **Student:** timetable, lesson search and detail, homework, my classes.
- **Everyone:** profile (name, picture) and password change.

Browser calls go through `app/api/proxy/[...path]`, which attaches the session token and refreshes it when needed.
The endpoints the screens expect are listed in `BACKEND_CONTRACT.md`.
