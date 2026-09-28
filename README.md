# Campus Duty

Campus Duty is a Vite + React + TypeScript student productivity application. It combines academic planning, attendance and grades tracking, classroom collaboration, notes, notifications, study tools, and administrative features in a single responsive web app.

## Features

- Authentication with Supabase email/password sign-in and sign-up.
- Student dashboard with schedules, progress, deadlines, attendance, grades, goals, achievements, and study widgets.
- Agenda, calendar, timetable, subjects, teachers, terms, tasks, grades, and attendance management.
- Notes with an editor and exam-focused study mode.
- Classroom posts, comments, reactions, bookmarks, scheduled posts, public post/profile pages, and file attachments.
- Announcements, notifications, direct messaging, marketplace listings, tutor profiles, and collaborative study rooms.
- Import/share-link flows for transferring supported data.
- Admin and coordinator tooling for user management, moderation, audit logs, analytics, system settings, maintenance mode, and role management.
- Mini Store tools including Pomodoro, CGPA Calculator, Flashcards, Unit Converter, QR Generator, Habit Tracker, Quick Poll, Text to Speech, Dice & Coin, Meeting Cost, Snake, Tetris, 2048, Group Maker, Tutor Match, Study Rooms, Expenses, Exam Mode, and role-restricted Announcements.
- PWA support with installable app metadata, offline-aware caching, service-worker registration, and browser notifications.
- Theme and primary-color customization with persisted client-side settings.

## How It Works

1. The browser loads the React application through Vite.
2. React Router handles public, authenticated, and public-sharing routes.
3. Supabase Auth manages user sessions. Authenticated users are checked before protected routes are rendered.
4. Supabase Postgres stores server-backed application data exposed through typed database definitions and RPC functions.
5. Supabase Storage is used for classroom file uploads.
6. React Query handles server-state fetching and invalidation, while Zustand persists selected local planner/settings state in browser storage.
7. The PWA service worker is registered in production and caches static assets and selected Supabase requests according to `vite.config.ts`.
8. Supabase Edge Functions provide server-side jobs for scheduled post publishing and message cleanup.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in |
| `/signup` | Create an account |
| `/` | Main dashboard |
| `/agenda` | Tasks and agenda |
| `/calendar` | Calendar |
| `/timetable` | Weekly class timetable |
| `/subjects` | Subjects and subject details |
| `/teachers` | Teachers |
| `/classroom` | Classroom and posts |
| `/notes` | Notes |
| `/exam-mode` | Exam mode |
| `/marketplace` | Marketplace |
| `/tools` | Mini Store tools |
| `/profile` | User profile |
| `/settings` | Application settings |
| `/admin` | Administrative controls |
| `/import` | Import entry point |
| `/u/:username` | Public profile |
| `/p/:slug` | Public post |

Additional nested routes are defined in `src/App.tsx` for editing, details, occurrences, notifications, and import tokens.

## Project Structure

```text
campus-duty-main/
├── public/                    # Static assets, PWA icons, robots.txt
├── src/
│   ├── components/            # Shared layout and UI components
│   ├── features/              # Feature-based application modules
│   ├── hooks/                 # Reusable React hooks
│   ├── integrations/
│   │   └── supabase/          # Supabase client, generated DB types, auth storage
│   ├── lib/                   # Utilities and application helpers
│   ├── pages/                 # Generic application pages
│   ├── store/                 # Zustand persisted client state
│   ├── test/                  # Vitest setup and tests
│   ├── types/                 # Shared TypeScript types
│   ├── App.tsx                # Routing and application shell
│   └── main.tsx               # Browser entry point and startup behavior
├── supabase/
│   ├── functions/             # Edge Functions
│   ├── migrations/            # Database schema and policy migrations
│   └── config.toml            # Supabase project configuration
├── index.html                 # HTML entry point and metadata
├── package.json               # Scripts and dependencies
├── package-lock.json          # npm dependency lockfile
├── bun.lockb                  # Bun lockfile
├── vite.config.ts             # Vite and PWA configuration
├── vitest.config.ts           # Test configuration
├── tailwind.config.ts         # Tailwind configuration
├── vercel.json                # SPA rewrite for Vercel
└── tsconfig*.json              # TypeScript configuration
```

## Requirements

- Node.js with npm.
- A Supabase project matching the database schema in `supabase/migrations/`.
- Supabase Auth configured for email/password authentication.
- Supabase Storage configured for the application buckets used by the code, including `classroom-files`.
- Environment variables described below for the frontend.
- Additional server-side secrets for the Supabase Edge Functions when those functions are deployed.

## Installation and Setup

Clone or extract the repository, then install the npm dependencies:

```bash
npm install
```

Create a local `.env` file in the project root with the frontend Supabase configuration:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

The application reads these values through `import.meta.env` in `src/integrations/supabase/client.ts`.

### Database setup

The repository contains the Supabase schema and security policies as SQL migrations under `supabase/migrations/`. Apply those migrations to the target Supabase project before using server-backed features.

The generated database types are stored in `src/integrations/supabase/types.ts` and are used by the application for typed Supabase access.

### Run locally

Start the Vite development server:

```bash
npm run dev
```

The Vite configuration binds to all interfaces and uses port `8080` by default.

For a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables and Secrets

### Frontend variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | Frontend environment/configuration | Supabase project identifier |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase client | Public/publishable Supabase key |
| `VITE_SUPABASE_URL` | Supabase client | Supabase project URL |

Because Vite exposes `VITE_*` variables to browser code, do not place a Supabase service-role key or other server-only secret in these variables.

### Edge Function secrets

The two Supabase Edge Functions use the following server-side variables:

| Variable | Function(s) | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Both functions | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Both functions | Server-side Supabase access |
| `CRON_SECRET` | Both functions | Authorization for protected job endpoints |

These secrets are read with `Deno.env.get(...)` inside the Edge Functions and should be configured in the Supabase project, not in frontend code.

## Usage and Execution

### Available npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

### Authentication flow

Unauthenticated users can access `/login`, `/signup`, and the public sharing/import routes. Protected routes are guarded by the authentication layer in `src/App.tsx`. The auth provider also ensures a profile record exists for a signed-in user.

### Notifications

Browser notifications are used for upcoming classes, approaching task deadlines, and classroom activity when notification permission has been granted. Notification checks run from the authenticated application session.

### PWA and caching

The app uses `vite-plugin-pwa`. Production builds generate the web manifest and service worker. Supabase requests and static assets are cached according to the runtime rules in `vite.config.ts`.

## Supabase Backend

The repository includes database migrations covering profiles, subjects, classes, attendance, tasks, grades, notes, classroom posts, messaging, marketplace data, study rooms, polls, roles, notifications, and related supporting tables.

Two Edge Functions are included:

```text
supabase/functions/cleanup-messages/index.ts
supabase/functions/publish-scheduled-posts/index.ts
```

Both functions require authorization. They use `SUPABASE_SERVICE_ROLE_KEY`, while `CRON_SECRET` is used to protect job execution.

The repository does not contain a GitHub Actions workflow or another scheduler for these functions. Configure any required scheduling in the Supabase/external infrastructure used by the deployment.

## Deployment

### Vercel

The repository includes `vercel.json` with a catch-all rewrite to `/index.html`. This is required for the client-side React Router routes to resolve correctly on direct navigation.

Typical deployment flow:

1. Connect the repository to Vercel.
2. Set the three `VITE_*` environment variables in the Vercel project.
3. Build using the existing `npm run build` script.
4. Deploy the generated Vite output.

The repository does not include a custom Vercel build configuration beyond the SPA rewrite.

### Supabase

Deploy the database migrations and Edge Functions to the Supabase project used by the frontend. Configure the server-side Edge Function secrets separately from the Vercel frontend variables.

## Configuration

- `vite.config.ts` controls the dev server, PWA generation, service-worker caching, path aliases, and production chunking.
- `vercel.json` controls the SPA fallback rewrite.
- `tailwind.config.ts` controls Tailwind styling.
- `components.json` configures the shared UI component setup.
- `tsconfig*.json` controls TypeScript compilation.
- `vitest.config.ts` configures the jsdom test environment and test setup file.
- `supabase/config.toml` identifies the Supabase project used by the repository.

## Testing and Verification

The project uses Vitest with a jsdom environment and `src/test/setup.ts` as the test setup file.

Run the test suite with:

```bash
npm test
```

Run lint checks with:

```bash
npm run lint
```

For a deployment check, also run:

```bash
npm run build
```

The current repository contains a basic example test at `src/test/example.test.ts`. Additional application behavior is primarily implemented in the feature modules and Supabase-backed flows.

## Troubleshooting

### Supabase connection errors

Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are present in the environment used to start or build the app. Restart the Vite server after changing `.env` values.

### Authentication works locally but not after deployment

Verify the deployed site's URL is allowed by the Supabase Auth configuration and that the same frontend Supabase variables are configured in the deployment environment.

### Direct route loads return 404 on Vercel

Keep the `vercel.json` SPA rewrite in place so routes such as `/classroom`, `/notes`, and `/timetable` fall back to `index.html`.

### Edge Function requests return `401 Unauthorized`

Check the `Authorization: Bearer ...` header and confirm that the token matches the configured `CRON_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`, as required by the individual function.

### Browser notifications do not appear

Grant browser notification permission and use a browser/context that supports the Notification API and service workers. The app only starts its periodic notification checks after permission is granted.

### PWA or cached data looks stale

The service worker uses caching strategies defined in `vite.config.ts`. During development, test production PWA behavior with a production build and preview/deployment rather than relying on the Vite development server.

## Maintenance

When modifying the project:

- Keep database changes in new Supabase migration files rather than editing already-applied migrations.
- Update `src/integrations/supabase/types.ts` when the database schema changes so typed queries remain aligned with the database.
- Keep frontend `VITE_*` variables limited to values that are safe to expose to the browser.
- Keep service-role and cron credentials server-side only.
- Run `npm run lint`, `npm test`, and `npm run build` before deployment.
- Update `vercel.json` only when the client-side routing/deployment behavior changes.
- Preserve the feature-based structure under `src/features/` when adding new modules.

## License

No license file is included in the repository, so no license terms are documented here.
