# Code Review — Componentization Refactor + Full Codebase Audit (2026-06-04)

**Scope:** Complete refactor of the monolithic `index.html` (3,727 lines / 184 KB) into a modular
`src/` architecture, plus a 4-specialist review of the entire codebase (build pipeline, frontend
HTML/CSS/JS, Netlify functions security, architecture coherence).

**Review panel:** code-reviewer, frontend-developer, security-engineer, architect-reviewer
(parallel agents), findings cross-verified against the actual code before inclusion — several
agent findings were rejected as false positives (documented below).

---

## 1. What was built

### Architecture: build-time partials (no framework)

- **`scripts/assemble.js`** — include engine: `<!-- @include path key="value" -->` directives +
  `{{param}}` substitution, recursive (max depth 10), fail-fast on: missing partial, missing
  param, malformed directive, circular include, path escaping `src/`.
- **`src/`** layout (every file ≤ 500 lines; largest is `pages/obchodni-podminky.html` at ~366):
  - `pages/` — 4 entry templates: index, obchodni-podminky, ochrana-osobnich-udaju, 404
  - `components/` — reusable parametrized blocks:
    - `cal-button.html` / `cal-link.html` — Cal.com demo triggers (6 usages)
    - `checkout-button.html` / `checkout-cta.html` / `checkout-promo-cta.html` — FAPI checkout (8 usages)
    - `analytics.html` — GA4 + Consent Mode v2 snippet (shared by all 4 pages)
    - `cookie-banner.html` — consent banner HTML+JS (shared by all 4 pages)
    - `legal/` — `nav`, `footer` (param: `privacy-current`/`terms-current` → `aria-current`),
      `head-meta`, `mobile-menu` (shared by both legal pages)
  - `sections/index/` — 14 landing sections in page order
  - `styles/` — 15 CSS modules + `legal/` (shared top/bottom + per-page)
  - `js/` — 5 JS modules concatenated into the same script scopes as before
- **`build.js`** — assembles all 4 pages, minifies, runs integrity gates, optimizes images.
- ~450 duplicated lines per legal page eliminated; legal pages are now minified (were verbatim copies).

### Verification performed

| Gate | Result |
|---|---|
| `dist/index.html` vs pre-refactor baseline | **Byte-identical** (before review fixes were applied) |
| Legal pages source-level assembly check | Byte-identical modulo cookie-banner normalization (formatting-only variants unified into one component) |
| Consent E2E suite (`test-consent.cjs`) | **31/31 PASS** (run twice: after refactor, after fixes) |
| New browser smoke suite (`test-smoke.cjs`) | **38/38 PASS** (JS errors, section visibility, accordion, checkout modal, mobile drawer, lead popup, legal pages, 404) |
| `tsc --noEmit` | PASS |
| Dead-selector sweep of `dist/` | CLEAN |

---

## 2. Findings — FIXED in this pass

### 🔴→✅ F1. Cookie banner: decline did not push `denied` to gtag
`src/components/cookie-banner.html` — the accept path called
`gtag('consent','update',{analytics_storage:'granted'})` but decline only wrote localStorage.
**Impact:** accept → reopen banner → decline left GA collecting for the rest of the session
(a real consent-withdrawal violation window). **Fix:** decline now also fires
`gtag('consent','update',{analytics_storage:'denied'})`. Because the banner is now one shared
component, the fix applies to all 4 pages at once.

### 🟠→✅ F2. Malformed `@include` directives failed silently
`scripts/assemble.js` — a directive with a typo (missing space, unquoted value, trailing junk)
didn't match the regex, survived as an HTML comment, and was deleted by the minifier →
**a page could ship with a silently missing section (e.g. no cookie banner) and exit code 0.**
**Fix:** post-substitution sentinel scan throws on any remaining `<!-- @include`; plus
`build.js` integrity gates per page: no unresolved directive, no `{{param}}` leak, `</html>`
present, cookie banner present, GA snippet present.

### 🟠→✅ F3. Cal.com queue replay opened multiple modals
`src/js/cal-embed.js:77-86` — if several demo buttons were clicked while embed.js was still
loading, `onload` replayed **every** queued click as a `modal()` call back-to-back.
**Fix:** restore all buttons, open only the most recent click.
*(Note: the companion agent claim that the second click is "silently dropped" was a
**false positive** — clicks are pushed to `pendingQueue` before `initAndOpen()` is called.)*

### 🟠→✅ F4. ~90 lines of dead CSS shipped on every page load
Verified zero usages in any `src/` HTML/JS (including JS-created classes) for:
`.dark-tile` (6 files; the "shared selector usage" comment was wrong), `.logo-dot`, `.logo-text`,
`.logo-mark` (index + legal), `.logo-bubbles`/`.bubble.b1–b6` + `bubbleFloat` keyframes,
`.founder-pill`, `.price-foot`. **Fix:** all removed; `legacy-dark.css` deleted;
`popup-logomark.css` renamed → `lead-popup.css` (only live rules kept). `dist/index.html`
shrank 146,158 → 141,890 bytes (−4.3 KB). Grouped selectors were edited surgically
(only the dead member removed); browser smoke test confirms rendering intact.

### 🟡→✅ F5. `#nav` scroll handler not null-guarded
`src/js/ui-core.js:2-5` — `onScroll()` ran immediately and would throw on any page without
`#nav`. Latent (index always has `#nav`) but now guarded.

### 🟡→✅ F6. `netlify dev` could serve stale/absent `dist/`
No `[dev]` config; `dist/` is gitignored → fresh clone + `netlify dev` = blank site; `src/`
edits invisible until manual rebuild. **Fix:** `npm run dev` now runs `node build.js` first;
documented "no watch mode" in `src/README.md`. Added `npm run test:consent` / `test:smoke`.

### 🟡→✅ F7. Dead `EXCLUDE_DIRS` constant in build.js
Defined, never referenced. Removed.

### 🟡→✅ F8. Docs drift (actively wrong statements)
Fixed: `README.md` Architecture section (still said "index.html — root of repository"),
`docs/README.md` FAQ ("edit index.html in repo root") + file locations,
`docs/build-pipeline.md` (architecture-update banner + assembly step),
`docs/netlify-deployment.md` workflow diagram, `docs/legal-pages.md` (claimed legal pages are
*copied* via COPY_FILES — they are now assembled+minified). Added `CHANGELOG.md` 1.1.0 entry.
**Remaining (cosmetic, not fixed):** stale `index.html` line references in `docs/seo.md`,
`docs/performance-optimizations.md`, `docs/mobile-layout-optimization.md`,
`docs/analytics-consent.md`, `docs/deferred-tasks.md` — these describe history/verification
steps and are not actionable instructions; update opportunistically.

### 🟡→✅ F9. Missing build smoke test
Added `test-smoke.cjs` (38 checks, Playwright): zero JS page errors on all 4 routes, key
sections visible, pricing/vision/accordion counts, accordion open animation, checkout modal
open/close, lead popup 50%-scroll trigger + dismiss, mobile drawer open/Escape-close,
`aria-current` on legal footers, cookie banner presence everywhere.

---

## 3. Findings — REPORTED ONLY (need your decision)

### 🟠 R1. CORS wildcard fallback on deploy-preview/branch contexts — *security*
`netlify/functions/shared/utils.ts` falls back to `Access-Control-Allow-Origin: *` whenever
`ALLOWED_ORIGIN` is unset; `netlify.toml` pins it **only** for production. Deploy previews are
publicly reachable and share the production Resend key + notification inbox → any site can
POST to a preview function URL. **Recommended:** set `ALLOWED_ORIGIN` for deploy-preview /
branch-deploy contexts too (note: pinning it to the prod origin breaks form testing on
previews — decide between a preview allowlist or rejecting when env is missing). Not auto-fixed
because it changes preview-environment behavior.

### 🟠 R2. No GDPR consent/notice at the lead forms — *legal* (known deferred task)
Contact form is defensible under Art. 6(1)(b), but the **ebook form** (email+phone for a
marketing PDF, stored for follow-up) leans on consent. Minimum viable: privacy-notice line +
link to `/ochrana-osobnich-udaju` under each submit button; explicit consent checkbox on the
ebook form, validated server-side, with timestamp stored. This is the most realistic
real-world compliance exposure (ÚOOÚ complaints).

### 🟠 R3. No rate limiting on `contact` / `ebook` functions — *security/cost*
Honeypot stops naive bots only. A targeted client can burn Resend quota / flood the inbox /
get the sending domain blocklisted. Recommended: Netlify rate limiting or a counter on
`x-nf-client-connection-ip` (e.g. 5/min/IP).

### 🟡 R4. CSP is Report-Only **with no report destination**
`netlify.toml` CSP-Report-Only has no `report-uri`/`report-to` → violations are computed but
never sent anywhere; Report-Only currently buys nothing. Policy content itself was analyzed:
sources match actual page resources; `X-Frame-Options: DENY` is **correct** (does not affect
embedding cal.com/FAPI *into* the page); consider adding `frame-ancestors 'none'`. Plan:
add a report endpoint → watch a real session (Cal modal + FAPI + GA granted) → promote to
enforcing.

### 🟡 R5. gtag.js loads pre-consent (cookieless pings) — *legal gray area*
Consent Mode v2 is correctly default-denied, but gtag.js itself is fetched before consent and
sends cookieless pings. Mainstream-acceptable; maximally conservative option is to inject the
script only after acceptance.

### 🟡 R6. Footer links `Blog` and `Mediální zmínky` point to `href="/"`
`src/components/legal/footer.html` + `src/sections/index/footer.html` — placeholders in
production. Remove or point at real URLs (product decision).

### 🟡 R7. `#vize` section is never linked
No `href="#vize"` anywhere (nav skips it). Dead anchor — either add a nav item or ignore.

### ⚪ R8. Nitpicks (no action urged)
- `styles/components-misc.css` is a grab-bag (modal + contact + a11y + utilities) — split when
  it grows; concatenation order must be preserved if you do.
- Index nav vs legal nav use relative vs absolute asset URLs — copy-paste trap between contexts.
- Lead popup `role="dialog"` + `aria-modal="false"` without focus trap — acceptable for a
  non-blocking slide-in; WCAG-marginal.
- `.btn-label` span has no CSS rule (semantic grouping only).
- Inline SVG `id="g1"` in okruhy — unique today, fragile if future SVGs add ids.
- Popup `onBottomScroll` listener lingers ≤350 ms after ebook-form success before
  self-cleaning (harmless; agent's desync claim was overstated).
- Honeypot client-path sets `gp_lead_submitted` without POSTing (intentional defense-in-depth;
  the server honeypot sees only JS-bypassing bots).
- Token values duplicated between `styles/base.css` and `styles/legal/common-top.css`
  (pre-existing divergence; full unification would change legal-page rendering — extract a
  shared `tokens.css` in a follow-up if brand colors will change).
- Adopt Eleventy only when the site needs collections/blog or >8-10 pages; current 62-line
  engine is the right size. Port *before* hacking iteration into `assemble.js`.

### Rejected agent findings (verified false positives)
1. "Unresolved `{{privacy-current}}` tokens produce malformed HTML" — the build substitutes
   them; `dist/` verified (`aria-current="page"` present on the correct page).
2. "Cal.com second click silently dropped" — clicks queue before `initAndOpen()`.
3. "`form._aborted` reset can discard in-flight abort" — `catch` implies the request settled;
   `btn.disabled` covers the window.
4. "12 accordion items" — there are 7 (first opens by default).

---

## 4. Functions security audit — clean bill (verified non-issues)

- Every user-controlled field in email HTML is `escapeHtml`-wrapped (incl. Referer/User-Agent).
- Subjects via `sanitizeHeader`; `reply_to` CRLF/`,;<>`-guarded; recipient validated against
  CRLF regex. No injection vector found.
- All `innerHTML` sinks in frontend JS use static/hardcoded strings; server messages rendered
  with `textContent`. No DOM XSS. No `postMessage` listeners.
- 8 KB body limit enforced pre-parse; base64 bodies rejected; generic error responses; Resend
  key never logged/echoed. No secrets in repo or git history.

---

## 5. File inventory (src/, all ≤500 lines)

```
pages/           index 56 · obchodni-podminky 366 · ochrana-osobnich-udaju 351 · 404 92
components/      analytics 13 · cookie-banner 84 · cal-button 1 · cal-link 1 ·
                 checkout-button 1 · checkout-cta 1 · checkout-promo-cta 1
components/legal head-meta 13 · nav 36 · footer 63 · mobile-menu 40
sections/index/  nav 33 · hero 108 · vision 42 · okruhy 120 · founder 35 · situace 85 ·
                 pricing 81 · ebook 49 · contact 71 · footer 64 · lead-popup 23 ·
                 checkout-modal 18 · head-meta 37 · schema-jsonld 127
styles/          base 104 · nav-hero 61 · sections-core 124 · situace-pricing 179 ·
                 form-founder-footer 46 · motion-drawer 106 · responsive 296 ·
                 lead-popup 18 · phone-mockup 91 · typography ~250 · motion-buttons ~260 ·
                 forms-inputs 84 · founder-portrait 94 · components-misc 227 · cookie-banner 47
styles/legal/    common-top ~130 · common-bottom 47 · terms-page 6 · privacy-page 15
js/              cal-embed 117 · ui-core 97 · accordion 101 · lead-forms 232 · checkout-modal 117
```

---

## 6. State at handoff

- All changes **staged** in git (root HTML deletions + new `src/`/`scripts/` tree staged
  together — committing the current index is deploy-safe). **Not committed** — awaiting go-ahead.
- `dist/` rebuilt from `src/`; gates green: build integrity ✅, consent 31/31 ✅, smoke 38/38 ✅, tsc ✅.
- Scratch artifacts removed (`.baseline/`, one-off migration splitter scripts).
