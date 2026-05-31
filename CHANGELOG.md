# Changelog

All notable changes to GastroUp are documented here.

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
