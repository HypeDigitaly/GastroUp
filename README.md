# GastroUp

GastroUp is a marketing website for restaurant/hospitality industry clients. It combines a static HTML/CSS/JS frontend with Netlify Functions for serverless email delivery via Resend API, enabling transactional emails (contact form, ebook delivery, lead notifications) without managing servers.

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript (no build step required)
- **Serverless**: TypeScript Netlify Functions (Node.js 20 runtime)
- **Email**: Resend REST API for transactional emails
- **Hosting**: Netlify (static site + Functions)

## Local Development

Install Netlify CLI and dependencies:

```bash
npm install -g netlify-cli
npm install
netlify link            # Link to Netlify site (one-time setup)
netlify env:pull        # Pull environment variables from Netlify into .env
netlify dev             # Start local dev server at http://localhost:8888
```

The `netlify dev` command starts a local server simulating the Netlify environment, including Functions. Submit forms to test locally.

## Build Process

The site uses an optimized build pipeline for production:

```bash
npm run build
```

This command (also run automatically by Netlify during deploy):
1. **Minifies `index.html`** — removes whitespace, comments, minifies inline CSS/JS (~22% size reduction)
2. **Optimizes images** — generates WebP and AVIF variants for PNG images (up to 97% smaller)
3. **Copies curated files** — bundles only production-ready assets to `dist/` directory
4. **Excludes development artifacts** — internal pages, brand-assets, design files, node_modules

**Output:** `dist/` directory (served directly to CDN by Netlify)

For detailed build documentation, see **[Build Pipeline](./docs/build-pipeline.md)**.

## Environment Variables

All variables are **runtime-only** (set in Netlify UI under **Site settings > Environment variables**, scope: **Functions only**). They are not available at build time.

| Name | Required | Description | Default |
|------|----------|-------------|---------|
| `RESEND_API_KEY` | Yes | Resend API key for GastroUp (scope: "Sending access" only, domain: `notifications.gastroup.cz`). **Dedicated key, not shared with other projects.** | — |
| `NOTIFICATION_TO` | Yes | Email address for team notifications (received when users submit forms) | `jakub.hnat@gastroup.cz` |
| `FROM_EMAIL` | Yes | Sender email address used in all outbound emails | `GastroUp <noreply@notifications.gastroup.cz>` |
| `EBOOK_PDF_URL` | Yes | Public HTTPS URL to ebook PDF for download. Hosted at `ebook/` folder, built to `dist/ebook/`. | `https://gastroup.cz/ebook/28-nametu.pdf` |
| `EBOOK_COVER_URL` | Yes | Public HTTPS URL to ebook cover image displayed in delivery emails. Optimized via build.js (JPEG + WebP + AVIF). | `https://gastroup.cz/Ebook_Image.jpeg` |
| `CTA_URL` | Yes | Call-to-action redirect URL (e.g., form for lead capture) | `https://form.fapi.cz/?id=4a82141f-d02b-489d-93b0-66f81a8cec6a` |
| `ALLOWED_ORIGIN` | Yes | CORS origin allowed to call Functions. Use `*` during dev, **must be `https://gastroup.cz` in production.** | `*` (dev only) |

## Deployment

GastroUp automatically deploys to Netlify when changes are pushed to the `main` branch:

- **Build command**: `npm run build` (runs optimized build pipeline, defined in `netlify.toml`)
- **Publish directory**: `dist/` (optimized output)
- **Functions directory**: `netlify/functions` (bundled automatically by Netlify)

Netlify handles:
1. Running `npm run build` to generate optimized `dist/` directory
2. Deploying `dist/` contents to CDN (with cache headers)
3. Bundling and deploying TypeScript Functions

For detailed deployment guide, see **[Netlify Deployment](./docs/netlify-deployment.md)**.

## Pre-Launch Checklist

**⚠️ CRITICAL: All items must be completed before going live to production.**

- [ ] **Resend dedicated API key created** — Log in to resend.com dashboard, create a new API key with scope "Sending access" only for domain `notifications.gastroup.cz`. Name it `gastroup-netlify-prod`. **Do not share this key with hypedigitaly-web-2 or other projects** (separate blast radius for security).

- [ ] **Resend domain DNS verified** — Add `notifications.gastroup.cz` as a domain in Resend dashboard, then add the generated SPF, DKIM (3× CNAME), and DMARC TXT records to gastroup.cz DNS at the registrar. Wait for Resend to mark the domain as "Verified" (typically 15 min – 2 h after DNS propagation).

- [x] **Real ebook PDF uploaded** — PDF moved to `ebook/28-nametu.pdf`. Build.js copies to `dist/ebook/`. `EBOOK_PDF_URL` set to `https://gastroup.cz/ebook/28-nametu.pdf` in `.env.example`. **Verify env var set in Netlify UI before deploy.**

- [x] **Ebook cover image optimized** — `Ebook_Image.jpeg` added to build pipeline. Re-encoded mozjpeg q80, WebP/AVIF variants generated. **Verify env var `EBOOK_COVER_URL` set in Netlify UI: `https://gastroup.cz/Ebook_Image.jpeg`.**

- [ ] **`ALLOWED_ORIGIN` switched to production domain** — In Netlify **Site settings > Environment variables**, change `ALLOWED_ORIGIN` from `*` (dev) to `https://gastroup.cz`.

- [x] **Google Analytics + Consent Mode v2 implemented** — GA4 ID `G-VR866S5JF5` added with default-denied consent. Cookie banner ("Přijmout" / "Odmítnout") collects consent. No tracking until user accepts.

- [x] **Legal pages published** — `/obchodni-podminky` (T&C, 10 articles + withdrawal form) and `/ochrana-osobnich-udaju` (privacy, GDPR Art. 13 compliant) live. All placeholders filled (controller: Monanivude s.r.o. IČ 21341486; processors: Resend, Google, Netlify, Cal.com; retention schedule; rights; cookies basis). **Awaiting client A1–A7 attestation before production deploy.**

- [ ] **Manual email test** — Submit both contact form and ebook form via production URL. Verify (1) notification email received at `NOTIFICATION_TO`, and (2) user confirmation email received at user's inbox. Check email formatting and link functionality.

- [ ] **Client A1–A7 attestation** (**BLOCKING**) — Legal team must verify: company details (IČ, address, contact email), pricing/product alignment (T&C vs live), payment chain (FAPI→Stripe), physical goods/logistics, product names correctness, support contacts. See `docs/legal-pages.md` for full checklist. T&C page + privacy page live in code; waiting for client sign-off.

- [ ] **GDPR form consent checkbox** (**RECOMMENDED after attestation**) — Add checkbox to both contact and ebook forms with text: "Souhlasím s [Obchodními podmínkami](/obchodni-podminky) a [Zásadami ochrany osobních údajů](/ochrana-osobnich-udaju)". Server-side validation of `consent=true` must be added to `validateContact` and `validateEbook` functions. Lead-gen forms compliant under Art. 6(1)(f) + (b) without checkbox; checkbox adds audit trail. Marketing emails will require separate Art. 6(1)(a) consent (future deferred task).

- [ ] **Rate limiting / anti-bot protection** (**RECOMMENDED**) — Implement Cloudflare in front of Netlify OR add Cloudflare Turnstile CAPTCHA to forms to prevent Resend quota abuse and DDoS attacks. **Not in scope of initial implementation. Recommended before scaling traffic.**

## Architecture

- **`index.html`** — Static marketing site (root of repository)
- **`netlify/functions/contact.ts`** — Handles contact form submissions (email to team + user confirmation)
- **`netlify/functions/ebook.ts`** — Handles ebook signup (email to team + ebook download link to user)
- **`netlify/functions/shared/`** — Shared utilities: TypeScript types, email template generation, validation helpers
- **`netlify.toml`** — Netlify build and Functions configuration
- **`Assets/`** — PDFs, images, logos

For a detailed technical guide on email flow, validation, security, and testing, see **[Email Integration Guide](./docs/email-integration.md)**.

## Documentation

Complete documentation is available in the `docs/` directory:

- **[Legal Pages Guide](./docs/legal-pages.md)** — T&C and privacy policy structure, sources of truth, corrections applied, pre-deployment attestation checklist (A1–A7), update workflows, test coverage
- **[Email Integration Guide](./docs/email-integration.md)** — Form endpoints, validation, email templates, Resend API, security, testing, ebook asset wiring
- **[Analytics & Consent Mode v2](./docs/analytics-consent.md)** — Google Analytics setup, cookie banner, consent flow, CSP integration, 31-test suite, legal pages integration, troubleshooting, migration to enforcing CSP
- **[Build Pipeline](./docs/build-pipeline.md)** — HTML/image optimization, build process, troubleshooting
- **[Performance Optimizations](./docs/performance-optimizations.md)** — Core Web Vitals, render-blocking elimination, image optimization
- **[Mobile Layout Optimization](./docs/mobile-layout-optimization.md)** — Mobile UX optimization, overflow containment, responsive spacing tokens, touch targets (WCAG 2.5.5)
- **[SEO](./docs/seo.md)** — Metadata, Open Graph, JSON-LD structured data, verification checklist
- **[Netlify Deployment](./docs/netlify-deployment.md)** — Deploy workflow, go-live checklist, production configuration
- **[Deferred Tasks](./docs/deferred-tasks.md)** — Font self-hosting, CSP hardening, **A1–A7 attestation (blocking)**, form consent validation (recommended after attestation), future optimizations

## Email Templates

Email templates are defined in `netlify/functions/shared/email-templates.ts`. All emails use the following brand colors:

- **Navy**: `#06264C`
- **Mustard**: `#CC972D`
- **Cream**: `#EFE3D3`

Tone is casual and friendly (tykání per content team direction). Templates are reviewed by client before production launch.

## Changelog

### 2026-06-04: Ebook 404 fix + Copy updates (navigation, guarantee rewrite, cal.com fallback)

**Fixes & UX:**
- **Ebook 404 redirect** — Added 301 redirect `/ebook/28-tipu.pdf` → `/ebook/28-nametu.pdf` (legacy URL from already-sent emails now works)
- **Email template** — Download button renamed "Stáhnout ebook zdarma"; console warnings corrected with exact production URLs
- **Navigation copy** — "Co to je" → "S čím pomůže" (benefit-focused)
- **Guarantee rewrite** — Removed "měsíc navíc zdarma" promise site-wide (10 locations); rewritten guarantee card with outcome focus
- **Stats grid** — 4 tiles → 3 tiles (removed redundant guarantee); added explanatory paragraph under 70k stat
- **Cal.com embed** — Timeout handler (8s) + fallback toast ("Kalendář se nepodařilo načíst — otevři rezervaci přímo") + queued click replay + no-JS link fallback
- **Footer icons** — LinkedIn removed; Facebook/Instagram commented out (pending profile URLs)

**Reviewed by:** code-reviewer, security-engineer, javascript-pro (all PASS; 0 critical/high/medium; 8 low cosmetic deferred)

**Pending ops:** Update/delete stale `EBOOK_PDF_URL` env var in Netlify UI; verify redirect + test ebook form email in production (see `docs/changes-2026-06-04-ebook-fix-and-copy-updates.md`)

---

### 2026-06-04: Legal pages (T&C + Privacy) + Banner microcopy + Test suite (31 tests)

**Features Added:**
- **Terms of Service page** — `/obchodni-podminky` live; 10 articles + Příloha č. 1 (statutory withdrawal form); Monanivude s.r.o.; effective 2.1.2026; corrected domain refs, EU-ODR link, privacy cross-link
- **Privacy Policy page rewritten** — Controller: Monanivude s.r.o. IČ 21341486; all placeholders filled; cookies section (§ 89 odst. 3 zák. č. 127/2005 Sb. + GDPR); processor list (Resend, Google, Netlify, Cal.com); retention schedule (GA4 14m, forms +3y, tax 10y, newsletter 5y); rights detailed (1m + 2m ext); effective 2.1.2026, updated 4.6.2026
- **Footer wired** — Both legal pages linked; "Obchodní podmínky" href corrected (# → /obchodni-podminky); consent reopen link on 404.html
- **Banner microcopy** — Updated on all 4 pages: "Vaše údaje neprodáváme ani nesdílíme pro marketingové účely třetích stran."
- **Build integration** — build.js copies obchodni-podminky.html; sitemap.xml updated (lastmod 2026-06-04); netlify.toml cache headers added
- **Test suite expanded** — 31 tests (was 26); scenario 6 added (T&C page + accept + reopen behavior); all passing

**Attestation Checklist (A1–A7):**
- Created pre-deployment gate: company details, pricing/product sync, payment chain, physical goods, Facebook community, product names, support contacts
- Status: Code ready; awaiting client sign-off before prod deploy (see `docs/legal-pages.md`)

**Documentation Added:**
- **`docs/legal-pages.md`** — Legal pages content, sources of truth, corrections applied, attestation criteria, update workflows, test coverage, deployment readiness
- **`docs/analytics-consent.md`** updated — Added legal pages to banner list, test count 31, scenario 6, new banner microcopy, controller change (Monanivude s.r.o.), processor/retention details
- **`docs/deferred-tasks.md`** updated — Marked T&C/privacy DONE; added A1–A7 attestation as blocking pre-deploy task; clarified form consent rationale (Art. 6(1)(f) + (b) for lead-gen, (a) for future marketing)

**Manual Follow-ups Required (Before Production):**
- [ ] **CLIENT A1–A7 ATTESTATION** (BLOCKING) — Legal team must verify company details, pricing/product alignment, payment chain, physical goods/logistics, product names, support contacts
- [ ] Monitor CSP violations for 1-2 weeks, promote Report-Only → enforcing when clean
- [ ] Add form-level consent checkbox to contact + ebook forms (recommended after attestation)
- [ ] Post-deploy smoke test: verify T&C, privacy page rendering, consent flow on legal pages, GA4 tracking

**Related Documentation:**
- See `docs/legal-pages.md` for attestation checklist, update workflows, file locations
- See `docs/analytics-consent.md` for banner/GA4 details on legal pages
- See `docs/deferred-tasks.md` for blocking attestation task + form consent rationale

### 2026-06-03: Ebook wiring + Google Analytics (Consent Mode v2) + Privacy page

**Features Added:**
- **Ebook PDF distribution** — Real PDF moved to `ebook/28-nametu.pdf`, served at `https://gastroup.cz/ebook/28-nametu.pdf` via build.js
- **Ebook cover image optimization** — `Ebook_Image.jpeg` added to build pipeline; re-encoded mozjpeg q80; WebP + AVIF variants generated
- **Google Analytics integration** — GA4 ID `G-VR866S5JF5` with Consent Mode v2 (default-denied)
- **Cookie consent banner** — "Přijmout" / "Odmítnout" buttons; localStorage persistence; consent withdrawal link ("Nastavení cookies")
- **Privacy policy page** — GDPR Art. 13 compliant; published at `/ochrana-osobnich-udaju`
- **CSP extended for analytics** — googletagmanager.com, google-analytics.com domains added (Report-Only mode)

**Related Documentation:**
- See `docs/analytics-consent.md` for detailed analytics & consent implementation
- See `docs/email-integration.md` for ebook asset wiring details

---

## Latest Documentation

For the 2026-06-04 ebook fix and copy updates, see **[Ebook 404 Fix & Copy Updates](./docs/changes-2026-06-04-ebook-fix-and-copy-updates.md)** for full implementation details, pending ops tasks, and deployment checklist.

---

**Questions?** Contact the development team or refer to documentation:
- [Email Integration](./docs/email-integration.md) — Forms, Resend API, validation, ebook wiring
- [Analytics & Consent](./docs/analytics-consent.md) — GA4, cookie banner, CSP, privacy
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Resend Email API](https://resend.com/docs)
