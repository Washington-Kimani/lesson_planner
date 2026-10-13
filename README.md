# Lesson Planner Web

Next.js frontend for the lesson planner. One app serves three portals, one per role, each on its own subdomain, with a glass-style UI that supports light and dark mode.

| Portal | Dev URL | Purpose |
|---|---|---|
| Admin | `http://admin.localhost:3000` | Set up subjects, classes, teachers and assignments |
| Teachers | `http://teachers.localhost:3000` | Plan lessons, manage students and enrolment |
| Students | `http://students.localhost:3000` | View published lessons |

## Stack

- Next.js 16 (App Router) and React
- TypeScript
- Tailwind CSS v4
- `next-themes` for light and dark mode
- `lucide-react` for icons

## Project structure

```
web/
  proxy.ts                          Subdomain -> portal rewrite
  next.config.ts                    allowedDevOrigins for the portal hosts
  .env.local                        ROOT_DOMAIN
  app/
    layout.tsx                      Font, ThemeProvider
    globals.css                     Theme tokens, glass utility
    page.tsx                        Bare-domain landing page
    teachers/(portal)/layout.tsx    App shell for the teachers portal
    teachers/(portal)/page.tsx      Calendar
    students/(portal)/...           Same shape, read-only
    admin/(portal)/...              Same shell, admin screens
  components/
    app-shell.tsx                   Header, side nav, theme toggle
    theme-toggle.tsx
    planner.tsx                     Month calendar and schedule panel
  lib/
    types.ts                        Lesson type, mirrors the API schema
    dates.ts                        Month grid, formatting, subject colours
    lessons.ts                      Data access (mock for now)
```

## Getting started

You need Node.js 20.9 or newer.

```bash
cd web
npm install
echo "ROOT_DOMAIN=localhost" > .env.local
npm run dev
```

Open one of the portal URLs above. The plain `http://localhost:3000` shows a small landing page, and direct visits to `/admin`, `/teachers` or `/students` on a non-portal host return 404.

If a browser doesn't resolve `*.localhost`, add this line to `/etc/hosts`:

```
127.0.0.1 admin.localhost teachers.localhost students.localhost
```

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `ROOT_DOMAIN` | `localhost` | Domain the portal subdomains hang off. Use your real domain in production, for example `yourschool.app`. |

## How subdomain routing works

`proxy.ts` (called `middleware.ts` before Next.js 16) reads the `Host` header and rewrites the request to the matching folder. The browser URL doesn't change.

```
teachers.localhost:3000/        ->  app/teachers/(portal)/page.tsx
teachers.localhost:3000/foo     ->  app/teachers/(portal)/foo/page.tsx
```

- Navigation links inside a portal use plain paths such as `/` or `/classes`.
- The `(portal)` route group keeps the app shell off pages that shouldn't have it, such as `/login`. The group name isn't part of the URL.
- Cookies and `localStorage` are scoped to each host, so a session in one portal isn't visible to the others. The theme choice is also stored per portal.
- The proxy only separates portals. The API enforces roles.

### Production

Point wildcard DNS (`*.yourschool.app`) at the app, serve over HTTPS, and set `ROOT_DOMAIN=yourschool.app`. For local development, `allowedDevOrigins` in `next.config.ts` lists the portal hosts so the dev server accepts their requests.

## Theming

Light and dark mode are driven by CSS variables in `app/globals.css`. Components use token classes such as `bg-panel`, `bg-cell`, `border-line`, `text-fg`, `text-muted` and `bg-accent`, so they adapt automatically and rarely need `dark:` variants.

- The theme defaults to the OS setting. The toggle in the header overrides it.
- To restyle, change the variables in `:root` (light) and `.dark`. `--bg-glow` controls the colour wash behind the glass panels, and the alpha of `--panel` and `--cell` controls how see-through they are.
- The `glass` utility applies the translucent background, border, shadow and blur.

## Calendar and schedule

`components/planner.tsx` renders the month grid and the schedule panel for the selected day.

- The visible month is the `?month=YYYY-MM` search parameter. The server page reads it, fetches that month's lessons, and passes them to `Planner`. The component is keyed by month, so navigating remounts it with fresh state.
- "Today" is computed in the school's timezone (`Africa/Nairobi`, set in `lib/dates.ts`) so server and browser agree.
- Each subject gets a stable colour from `subjectColor` in `lib/dates.ts`.
- Draft lessons appear dimmed with a badge. The API never returns drafts to students.

## Data

`lib/lessons.ts` currently returns sample data from `getLessonsForMonth(year, month)`. When the API is wired in, only the body of that function changes: it will call `GET /lessons?date_from=...&date_to=...` with the signed-in user's token.

`lib/types.ts` mirrors the API's `LessonOut`. The calendar needs `start_time`, `subject_name` and `class_name`, so the backend's lesson model and schemas must include them (see `server/README.md`).

## Adding a page to a portal

1. Create `app/<portal>/(portal)/<route>/page.tsx`.
2. Add a nav item for it in the `NAV` map in `components/app-shell.tsx`, using a path relative to the subdomain, for example `/classes`.

## Roadmap

- Login page per portal, backed by a Next route handler that calls the API and stores tokens in httpOnly cookies.
- Check that the signed-in role matches the subdomain, and redirect otherwise.
- Token refresh, logout, and the real user name in the header.
- Replace the mock lessons with API calls.
- Lesson create and edit dialog (`POST /lessons`, `PATCH /lessons/{id}`).
- Admin screens for subjects, classes, teachers and assignments.
- Mobile layout, with the side nav becoming a bottom bar on small screens.
- A time-of-day greeting in the header as a small client component.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
