# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **psyKasten**, a Next.js-based web application suite for cognitive assessments and neuropsychological tests. The platform serves researchers and educational purposes, providing standardized tests for measuring memory, attention, and executive functions.

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Generate test data**: `npm run generate-data` (RPM test data generation)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 13.x with Pages Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Internationalization**: next-i18next (German default, English/Spanish support)
- **Styling**: CSS Modules with custom themes
- **UI Components**: React with custom component library

### Key Directory Structure
- `pages/` - Next.js pages and API routes
  - Individual test pages: `corsi.js`, `pvt.js`, `tol.js`, `rpm.js`, `gng.js`, `vm.js`, `akt.js`, `wtb.js`
  - Auth pages: `auth/signin.js`, `auth/signup.js`
  - Dashboard: `dashboard/index.js`, `dashboard/studies/[studyId].js`, `dashboard/results/index.js`, `dashboard/results/[resultId].js`
  - Proposals: `dashboard/proposals/new.js`
  - Admin interface: `admin/proposals.js`
- `components/` - Reusable React components
  - `ui/` - UI components (modal, footer, themeToggle, BulkImportModal, ShareLinkModal, MetadataEditorModal, uploadProposal, proposalList)
  - `layouts/` - DashboardLayout
  - `settings/` - Test-specific configuration components
  - `tests/` - Test implementation components
  - `results/` - Per-test result visualization components
  - `analytics/` - StudyAnalytics component
  - `export/` - ExportConfigModal
- `lib/` - Utility functions and configurations
- `styles/` - CSS modules and global styles
- `prisma/` - Database schema and migrations
- `locales/` - Translation files (de, en, es)

### Database Schema
The application uses Prisma with SQLite and includes:
- **User management**: NextAuth-compatible User, Account, Session models
- **Role-based access**: UserRole enum (RESEARCHER, ADMIN)
- **Research workflow**: Study, Participant, TestAssignment, TestResult models
- **Test proposals**: TestProposal model for researcher submissions

### Authentication & Authorization
- NextAuth.js handles authentication with Google OAuth
- Role-based middleware protection for admin routes (`middleware.js`)
- Protected routes: `/dashboard/*`, `/admin/*`, `/api/studies/*`, etc.
- Admin-only access to test proposal review and management

### Test Configuration System
Tests are configured in `lib/testConfig.js` with:
- Unique IDs, routes, colors, and icons
- Internationalization keys for titles/descriptions
- Tag-based categorization for filtering
- Currently available tests: Corsi, PVT, TOL, RPM, GNG-SST, AKT, WTB (vm is implemented but commented out in testConfig)
- Each test has a dedicated settings component and locale file

### Internationalization
- Default locale: German (`de`)
- Supported locales: German, English (`en`), Spanish (`es`)
- Translation files structure:
  - `/locales/{locale}/common.json` - Shared translations (landing page, tags, proposal page)
  - `/locales/{locale}/{test-name}.json` - Test-specific translations
- Dynamic locale switching with persistent user preference
- Test components use translation function with fallback: `const translate = t || ((key) => key)`
- **All three locales must have matching keys** — missing keys fall back to the key name string, not the English value
- Dashboard pages use `serverSideTranslations(locale, ['common'])` via `getServerSideProps`

### Theme System
- Light/dark theme support via `next-themes`
- Uses `data-theme` attribute (not `prefers-color-scheme`)
- **CSS variables** (defined in `globals.css`) are the correct approach — `var(--bg-primary)`, `var(--card-bg)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`, `var(--link-color)`, `var(--link-hover-color)`, `var(--shadow-color)`, `var(--bg-accent)`, `var(--bg-secondary)`, `var(--icon-color)`
- Theme toggle component with localStorage persistence
- **Never use hardcoded hex colors** in CSS modules — always use CSS variables so dark mode works automatically

### CSRF Protection
- All state-changing API requests (POST, PUT, DELETE, PATCH) require a CSRF token
- Backend: `lib/csrf.js` exports `withCsrfProtection(handler)` — used in all protected API routes
- Frontend: **Always use `fetchWithCsrf` from `lib/fetchWithCsrf.js`** instead of plain `fetch()` for any state-changing request in dashboard pages and components
- The `fetchWithCsrf` helper automatically fetches the NextAuth CSRF token and adds the `x-csrf-token` header
- Plain `fetch()` is fine for GET requests and for unauthenticated participant-facing routes

### Dashboard — Shared Modal Styles
- `styles/ModalShared.module.css` provides reusable classes for all modals: buttons (`.btnPrimary`, `.btnSecondary`, `.btnDanger`, `.btnSuccess`), inputs (`.textInput`, `.textareaInput`, `.selectInput`), layout (`.flexRow`, `.flexEnd`), status boxes (`.errorBox`, `.successBox`, `.warningBox`), etc.
- Import as `import s from '../../styles/ModalShared.module.css'` in modal components

### Test Architecture Pattern
Enhanced tests (TOL, GNG, PVT) follow a standardized flow:
1. **Welcome Screen** - Introduction and overview
2. **Tutorial** - Step-by-step instructions with numbered steps
3. **Demo** - Animated demonstration showing how the test works
4. **Practice** - Shorter practice session with real-time feedback
5. **Practice Complete** - Statistics and option to retry or start real test
6. **Countdown** - 3-2-1 countdown before test begins
7. **Test** - Actual test with fullscreen mode
8. **Results** - Visualization and data export

**Key Implementation Details**:
- Game states managed via useState: `welcome`, `tutorial`, `demo`, `practice`, `practiceComplete`, `countdown`, `playing`, `results`
- Fullscreen managed via custom `useFullscreen` hook
- Settings stored in `components/tests/{test}/data.js` with DEFAULT_SETTINGS and PRACTICE_SETTINGS
- Dedicated settings components in `components/settings/{test}.js`
- Timer management using refs to avoid stale closures
- Translation support with parameter interpolation

### Test-Specific Files Structure
For each test (e.g., `pvt`):
```
/locales/en/pvt.json          # English translations (~60-70 keys)
/locales/de/pvt.json          # German translations
/locales/es/pvt.json          # Spanish translations
/components/tests/pvt/
  ├── test.js                 # Main test component
  └── data.js                 # Configuration (settings, colors, constants)
/components/settings/pvt.js   # Settings panel component
/components/results/pvt.js    # Results visualization component
/styles/PVT.module.css        # Test-specific styles
/pages/pvt.js                 # Next.js page with i18n and assignment handling
```

## Development Guidelines

### Adding New Tests
1. Add test configuration to `lib/testConfig.js` with unique color and icon
2. Create test-specific locale files in `/locales/{en,de,es}/{test}.json` — all three locales required
3. Create data configuration file: `components/tests/{test}/data.js`
4. Create main test component: `components/tests/{test}/test.js`
5. Create settings component: `components/settings/{test}.js`
6. Create results component: `components/results/{test}.js`
7. Create CSS module: `styles/{TEST}.module.css`
8. Create page component: `pages/{test}.js` with i18n support
9. Follow the standard game state flow pattern
10. Update database schema if new result structure needed

### Working with Database
- Schema file: `prisma/schema.prisma`
- Generate client after schema changes: `npx prisma generate`
- Apply migrations: `npx prisma migrate dev`
- Database browser: `npx prisma studio`

### API Routes Structure
- `/api/auth/` - NextAuth endpoints
- `/api/studies/` - Study management (CSRF protected)
- `/api/participants/` - Participant management (CSRF protected)
- `/api/assignments/` - Test assignments (CSRF protected)
- `/api/results/` - Test result submission (POST unauthenticated, GET authenticated)
- `/api/proposals/` - Test proposal system (CSRF protected)
- `/api/admin/` - Admin-only endpoints (CSRF protected)

### Security Considerations
- Environment variables in `.env` for secrets
- Role-based access control via middleware
- Secure test access keys for assignments
- Input validation on API endpoints
- CSRF protection on all state-changing API routes via `withCsrfProtection`
- Rate limiting on result submission endpoint

## Common Pitfalls & Best Practices

**CSRF / Fetch**:
- ❌ Don't use plain `fetch()` for POST/PUT/DELETE/PATCH in dashboard pages
- ✅ Use `fetchWithCsrf` from `lib/fetchWithCsrf.js` for all state-changing requests
- ✅ Plain `fetch()` is fine for GET requests and unauthenticated participant routes

**Timer Management**:
- ❌ Don't include state variables in timer useCallback dependencies if they cause stale closures
- ✅ Use refs to track current values: `const timerRef = useRef(0)` and sync with useEffect
- ✅ Always call `clearAllTimers()` before starting new timers to prevent duplicates

**Dark Mode Styling**:
- ❌ Don't use `@media (prefers-color-scheme: dark)` - it ignores the app's theme toggle
- ❌ Don't use hardcoded hex colors like `#fff`, `#333`, `#f8f9fa` in CSS modules
- ✅ Use CSS variables: `var(--bg-primary)`, `var(--card-bg)`, `var(--text-primary)`, etc.
- ✅ Using CSS variables means dark mode works automatically — no `html[data-theme="dark"]` overrides needed

**Stimulus Display**:
- ❌ Don't set `background-color` in CSS for elements controlled by inline styles
- ✅ Let inline styles fully control dynamic background colors
- ✅ Use white text with dark shadow for visibility on any background

**Translation**:
- ✅ Always provide fallback: `const translate = t || ((key) => key)`
- ✅ Support parameter interpolation: `translate('key', { param: value })`
- ✅ Create dedicated locale files for ALL THREE locales (en, de, es) when adding a new test
- ✅ Add keys to all three `common.json` files simultaneously — missing keys show the raw key string, not a fallback
- ❌ Dashboard pages don't use i18n (they use hardcoded English strings) — don't add `useTranslation` there

**Study/Dashboard UI**:
- ✅ Wrap tables in `.tableWrapper` with `overflow-x: auto` for responsive design
- ✅ Use participant search + status filter + pagination (20/page) on study detail page
- ✅ Use test type + date range filters + pagination (25/page) on results page
- ✅ No emojis in buttons or UI elements

## Important Configuration Files

- `next.config.js` - Next.js configuration with i18n
- `next-i18next.config.js` - Internationalization settings
- `middleware.js` - Authentication and authorization middleware
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies and scripts
- `lib/testConfig.js` - Central test configuration registry
- `lib/csrf.js` - CSRF protection middleware
- `lib/fetchWithCsrf.js` - Frontend fetch wrapper that adds CSRF token
- `styles/ModalShared.module.css` - Shared modal component styles
