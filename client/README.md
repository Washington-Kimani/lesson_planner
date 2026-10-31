# Tutorium Web

Next.js frontend for Tutorium. The bare domain hosts public school information, and role-specific subdomains provide teacher, student and administrator portals.

| Host | Purpose |
|---|---|
| `http://localhost:3000` | Home, accounts, help, contact and privacy pages |
| `http://teachers.localhost:3000` | Teacher sign-in and lesson calendar |
| `http://students.localhost:3000` | Student sign-in and published timetable |
| `http://admin.localhost:3000` | Administrator sign-in and school overview |

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
ROOT_DOMAIN=localhost
NEXT_PUBLIC_ROOT_DOMAIN=localhost
API_BASE_URL=http://127.0.0.1:8000
EOF
npm run dev
```

Run the FastAPI service separately (see [the server README](../server/README.md)). If a browser doesn't resolve `*.localhost`, add this line to `/etc/hosts`:

```text
127.0.0.1 admin.localhost teachers.localhost students.localhost
```

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `ROOT_DOMAIN` | `localhost` | Root host used by `proxy.ts` to identify role subdomains. Set to your production domain. |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `localhost` | Root domain used to build links from sign-in screens to the public site and other portals. Set to the same domain as `ROOT_DOMAIN`. |
| `API_BASE_URL` | `http://127.0.0.1:8000` | Internal URL for the FastAPI service. |

For production, point wildcard DNS (`*.yourschool.app`) at the app, serve over HTTPS, and set both domain variables to `yourschool.app`. Portal links use HTTPS outside local development.

## Routing and sessions

`proxy.ts` rewrites each role subdomain into its matching App Router folder. Portal paths are hidden on the bare domain, so `/admin`, `/teachers` and `/students` there return 404.

- The bare domain has public routes: `/`, `/accounts`, `/help`, `/contact` and `/privacy`.
- Each portal has a `/login` page outside its authenticated app shell.
- An authenticated portal is checked against `/auth/me` on each page request. A user visiting the wrong role host is sent to their correct portal.
- Login and password changes call the FastAPI service through Next route handlers. Access and refresh tokens live in host-only, `httpOnly`, `SameSite=Lax` cookies; the access cookie is `Secure` in production. Tokens are never stored in local storage or exposed to client JavaScript.
- When an access token expires, the proxy rotates the refresh token through `/auth/refresh` and updates both cookies. The server stores only a hash of the refresh token.
- First sign-in requires a new password of at least 10 characters. Protected portal requests are redirected to `/change-password` until that succeeds.
- Sign out revokes the refresh token and clears the browser cookies.
- Role checks are a user-experience boundary, not the security boundary: FastAPI validates the current account and permissions on protected API operations.

Cookies are host-only. A teacher session on `teachers.yourschool.app` is not shared with the student or administrator portal.

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
