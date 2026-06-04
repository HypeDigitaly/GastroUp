# Changelog

All notable changes to GastroUp are documented here.

## [1.1.0] — 2026-06-04

### Fixed

**Cal.com Demo zdarma modal — rebuild on official embed loader**
- Modal rebuild on the official cal.com embed loader (IIFE verbatim) with SDK-native declarative binding (`[data-cal-namespace][data-cal-link]`), eliminating repeated-invocation freeze/double-load/unclosable overlay bugs caused by the previous bespoke lazy-load state machine.
- **SDK-native binding:** Shadow state machine removed; the official loader auto-binds 6 Demo zdarma triggers. No custom `modal()` calls on the happy path.
- **Interaction warm-up loading:** `embed.js` loads on first hover/touch/focus of any booking trigger (not pre-load) — preserves consent posture (zero `app.cal.com` requests for passive visitors who never approach a trigger).
- **Early-click bridge:** Click before SDK readiness queues the modal open via the official stub queue and opens automatically on load (no dead click, no visible lag). Official stub queue semantics prevent fallback on working SDK.
- **Stuck-loading watchdog:** Single shared timer (15 s) removes only `state="loading"`/`state="failed"` boxes; cleared by official `linkReady` event. Broken-box cleanup prevents stacking overlays without breaking SDK fast-reopen path.
- **Failure fallback:** Scripted error + poll exhaustion or load-grace window blown → window.open + `.cal-fallback-toast` recovery UX (unchanged).
- **Test coverage:** New `test-cal-modal.cjs` regression suite (20 checks, requires network, run on demand: `node build.js && node test-cal-modal.cjs`). Covers open → close (X) → reopen → rapid 5× invocation → different triggers → stuck-loading fallback.
- See `docs/cal-embed-rebuild-2026-06-04.md` for architecture details, tuning constants (STUCK_MS=15000, LOAD_GRACE_MS=9000, POLL_INTERVAL=200, POLL_TRIES=50), testing instructions, and CSP requirements.

### Changed

**Modular `src/` architecture (componentization refactor)**
- Split the monolithic `index.html` (3,727 lines) into build-time partials under `src/` — every file ≤ 500 lines: `pages/` (4 page templates), `components/` (reusable parametrized blocks), `sections/index/` (landing sections in page order), `styles/` (16 CSS modules), `js/` (5 JS modules)
- New build-time include engine `scripts/assemble.js`: `<!-- @include path key="value" -->` directives + `{{param}}` substitution; fail-fast on missing partials, missing params, malformed directives, circular includes, and path escapes
- Reusable parametrized components replace 14 hand-copied button instances: `cal-button` / `cal-link` (Cal.com demo, 6×), `checkout-button` / `checkout-cta` / `checkout-promo-cta` (FAPI checkout, 8×)
- Legal pages + 404 now share partials with the landing page: `components/analytics.html` (GA4 + Consent Mode v2), `components/cookie-banner.html`, `components/legal/{nav,footer,head-meta,mobile-menu}` (~450 duplicated lines per page eliminated); legal pages are now minified in `dist/` (previously copied verbatim)
- Build integrity gates in `build.js`: pages must contain no unresolved directives/placeholders and must include the cookie banner + GA snippet + closing `</html>`
- Verification: refactored `dist/index.html` byte-identical to pre-refactor build; 31/31 consent E2E tests pass
- Root `index.html`, `obchodni-podminky.html`, `ochrana-osobnich-udaju.html`, `404.html` removed — `src/` is the single source of truth
- `npm run dev` now builds before starting `netlify dev`; added `npm run test:consent`

### Fixed

- Cookie banner: declining consent now pushes `analytics_storage: 'denied'` to gtag immediately (same-session withdrawal after accept previously kept GA collecting until next page load)
- Cal.com embed: when multiple demo buttons were clicked while embed.js was loading, every queued click opened a modal back-to-back; now only the most recent click opens
- Nav scroll handler null-guarded (`#nav`-less pages no longer throw)
- Removed dead CSS (~90 lines): `.dark-tile` (incl. wrong "shared selector usage" comment), `.logo-dot`, `.logo-text`, `.logo-mark`, `.logo-bubbles`/`.bubble` + `bubbleFloat` keyframes, `.founder-pill`, `.price-foot`; deleted `legacy-dark.css`; renamed `popup-logomark.css` → `lead-popup.css`
- Removed unused `EXCLUDE_DIRS` constant from `build.js`

## [1.0.2] — 2026-05-31

### Fixed

**Mobile Layout & UX Optimization**
- Eliminated horizontal viewport overflow on small devices (320–430px) via `overflow-x: clip` containment + fixed overflow source elements
  - Hero ghost CTA: changed `min-width: 160px` to `flex: 1 1 100%; min-width: 0` at ≤520px (now expands to container)
  - Gold CTA label: changed `white-space: nowrap` to `white-space: normal` at ≤400px (now wraps to 2-line pill)
  - Modal scroll-lock: changed `overflow: hidden` to `overflow-y: hidden` (prevents re-introducing horizontal pan)
- Fixed header logo alignment against 46×46 hamburger icon via `min-height: 46px` at ≤580px
- Unified spacing system:
  - Introduced spacing tokens (`:root` custom properties): `--gutter-page`, `--gutter-page-md`, `--gutter-page-sm`, `--section-v-lg`, `--section-v-md`, `--card-p`, `--card-p-sm`, `--radius-card`
  - Normalized section vertical rhythm: 64px (desktop) → 48px (mobile), with specific floor of 56px for navy formfounder
  - Reduced excessive situace card inset: 34px total → 28px at ≤420px
  - Standardized card padding: 28/24px (desktop) → 22/18px (mobile)
- Implemented WCAG 2.5.5 touch targets (≥44×44px on pointer: coarse):
  - `.acc-toggle` (FAQ): 44×44 via @media (pointer: coarse)
  - `.lp-close` (modal close): 44×44 on touch
  - `.foot-socials a` (footer social icons): 44×44 hit area on touch
  - `.btn-gold` (main CTA): min-height: 44px
- Applied per-section polish:
  - Hero pill margin: 12px → 8px (compact spacing)
  - Hero H1 line-height: 1.05 at ≤420px (prevents orphans)
  - Partners strip: scaled + stacked cleanly at ≤400px
  - Fine-print (`.micro`): centered at ≤580px (matches centered CTAs)
  - Founder portrait clearance: added padding-bottom: 56px at ≤900px (prevents badge overlap)

### Documentation

- Added comprehensive mobile layout optimization guide: `docs/mobile-layout-optimization.md`
  - Details overflow containment strategy, spacing tokens, touch target implementation
  - Includes verification checklist (viewport tests, device testing, WCAG compliance)
  - Documents all responsive breakpoints (400px, 420px, 520px, 580px, 980px)

## [1.0.1] — 2026-05-31

### Added

**Contact Configuration**
- Visible contact email `jakub.hnat@gastroup.cz` in website footer (mailto link)
- Organization email field added to JSON-LD structured data in index.html

### Changed

- Updated form-notification recipient documentation from `pavelcermak@hypedigitaly.ai` to `jakub.hnat@gastroup.cz` in:
  - `.env.example`
  - `README.md`
  - `docs/netlify-deployment.md`

### Deployment Note

- **Important:** The live form recipient is controlled by the Netlify environment variable `NOTIFICATION_TO`. Changes made to repo files are documentation only; you must update the environment variable in the Netlify dashboard (Site settings → Environment variables) for the change to take effect in production.

## [1.0.0] — 2026-05-31

### Added

**Build Pipeline**
- New `build.js` Node.js script for optimized production builds
- `npm run build` command for minifying HTML and generating image variants
- Automated WebP and AVIF image generation using sharp library
- HTML minification with html-minifier-terser (~22% size reduction)
- `.netlifyignore` file to exclude development artifacts from deployment

**Performance Optimizations**
- Removed `.reveal` opacity gate from hero section for instant H1 paint (improved LCP)
- Google Fonts loaded non-blocking via preload + onload swap pattern
- Iconify icon script deferred with `:not(:defined)` fallback
- Narrowed Fraunces font axes (opsz 36..144, wght 300..600) for faster delivery
- Added `<picture>` elements with AVIF/WebP/PNG fallback chains for all images
- Founder portrait optimized with lazy loading and explicit dimensions
- Founder avatar and nav/footer logo wrapped in responsive `<picture>` elements
- Added srcset + sizes to Unsplash stock images
- Moved nav `backdrop-filter` to `.nav.scrolled` (only apply after scroll)
- Paused `.btn-gold` spin animation when off-screen, respects prefers-reduced-motion
- Removed invalid `will-change: --gp-spin` declaration
- Removed unused CSS classes (.choice-*, .lead-*, .dark-section*, .dark-tile token)

**SEO Optimization**
- Comprehensive Open Graph metadata (og:image, og:image:alt, og:locale cs_CZ, og:site_name)
- Twitter summary_large_image card metadata
- Full favicon set (favicon.ico, favicon-192.png, favicon-512.png, apple-touch-icon.png)
- PWA manifest (site.webmanifest) with brand colors and app icons
- JSON-LD structured data (@graph pattern):
  - Organization schema (no unverified social links)
  - ProfessionalService with 3 real pricing tiers (465/4650/11950 CZK)
  - WebSite schema with search action
  - FAQPage schema with 7 on-site questions/answers
- Created `robots.txt` with sitemap reference
- Created `sitemap.xml` (single-page site URL)
- Created `llms.txt` (AI/LLM content guidelines)
- Content-Language header set to Czech (cs)
- Meta robots with max-image-preview:large, unlimited snippet/video preview

**Netlify Configuration**
- Updated netlify.toml with publish = "dist" (curated build output)
- Build command changed to `npm run build` for optimized deployments
- Cache-Control headers:
  - Images/fonts: immutable, 1-year max-age (rename-on-change policy)
  - HTML: must-revalidate, always fresh
  - API: no-store, never cached
- Security headers: HSTS, CSP Report-Only, Permissions-Policy, X-XSS-Protection: 0
- Production context ALLOWED_ORIGIN pinned to https://gastroup.cz
- www→apex redirect (301) and /index.html→/ redirect
- Go-live checklist documented as comments in netlify.toml

**File Management**
- Renamed `Zakladatel_Jakub_Hnát.png` to ASCII `Zakladatel_Jakub_Hnat.png` for compatibility
- Created placeholder `404.html` (branded Czech error page)
- Created `fonts/README.md` documenting font self-hosting setup (deferred)

### Changed

- **index.html:** Removed render-blocking resources, optimized LCP, added image variants
- **package.json:** Added `"build": "node build.js"` script, added sharp and html-minifier-terser dependencies
- **README.md:** Updated with build process documentation, deployment notes, documentation links

### Deferred

- Font self-hosting (subsetting tooling not available; currently Google-hosted non-blocking)
- Dead CSS removal (.dark-tile token cleanup)
- CSP hardening (currently Report-Only; needs production monitoring before enforce)
- GDPR consent validation (legal blocker for EU launch)
- Anti-bot protection / rate limiting (recommended before scaling traffic)

## [0.1.0] — Initial Release

### Added

- Initial commit: GastroUp marketing site + email integration
- Static HTML/CSS/JavaScript frontend (index.html)
- Netlify Functions for email delivery (contact.ts, ebook.ts)
- Resend API integration for transactional emails
- Email templates with brand colors
- Environment configuration for Netlify
- Pre-launch checklist (README.md)

---

## Format Notes

This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.

Dates in `[YYYY-MM-DD]` format correspond to deployment dates.

### Categories

- **Added** — new features or files
- **Changed** — modifications to existing features
- **Fixed** — bug fixes
- **Removed** — removed features
- **Deferred** — items paused for future work
- **Deprecated** — features planned for removal

### Versioning

GastroUp uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR (1.0)** — Full page-speed + SEO optimization (2026-05-31)
- **MINOR** — New sections, features (blog, testimonials, etc.)
- **PATCH** — Bug fixes, minor improvements
