# Deferred Tasks & Future Optimizations

This document tracks improvements deferred from the 2026-05-31 page-speed and SEO optimization to keep them from being lost. All items are optional but recommended for long-term site health.

## Priority 1: Font Self-Hosting

**Status:** Deferred (no subsetting tooling in environment)

**Current state:** Fonts remain Google-hosted via preload + onload swap pattern (non-blocking). This is performant but relies on external CDN.

**What needs to be done:**
1. Generate subsetted WOFF2 fonts for Czech glyphs (Latin + Latin Extended-A: é, ě, š, č, ř, ž, ý, á, í, ú, ů, ó, ť, ď, ň)
2. Add WOFF2 files to `fonts/` directory
3. Create `fonts/font-face.css` with @font-face declarations and metric overrides

**How to implement:**

See `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\fonts\README.md` for detailed Python (fonttools) and Node.js (subset-font) approaches.

**Quick start (Python):**
```bash
pip install fonttools brotli
pyftsubset fraunces.ttf --unicodes="U+0000-U+00FF,U+0100-U+017F" --flavor=woff2 --output-file=fraunces-subset.woff2
pyftsubset geist.ttf --unicodes="U+0000-U+00FF,U+0100-U+017F" --flavor=woff2 --output-file=geist-subset.woff2
pyftsubset geist-mono.ttf --unicodes="U+0000-U+00FF,U+0100-U+017F" --flavor=woff2 --output-file=geist-mono-subset.woff2
```

**Expected impact:**
- Remove Google Fonts CDN dependency
- Reduce font load time by ~200-300ms
- Save ~100-150 KB over first 4 requests
- Improve FCP (First Contentful Paint)

**Fonts to host:**
1. **Fraunces** (display): 40-50 KB WOFF2
2. **Geist** (body): 60-80 KB WOFF2
3. **Geist Mono** (code): 45-60 KB WOFF2

**Total estimated size after subsetting:** 150-200 KB (vs. 400+ KB via CDN download)

**After completing, update:**
- Remove Google Fonts preload link from `index.html`
- Add local font-face.css link
- Test font loading in DevTools (Network tab should show local .woff2 files)

## Priority 2: Dead CSS Cleanup

**Status:** Deferred (already removed unused classes, but one token remains)

**What needs to be done:**
1. Search for `.dark-tile` CSS variable usage across index.html
2. Remove from all shared selectors
3. Verify no visual regression (diff screenshots before/after)

**Why:** The `.dark-tile` token was removed from the color palette but may still be referenced in merged CSS rules, leaving orphaned selectors.

**How to check:**
```bash
grep -n "dark-tile" C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html
```

**Expected impact:**
- Minimal size reduction (< 1 KB)
- Cleaner, maintainable CSS
- No visual changes (token wasn't used anyway)

## Priority 3: CSP Hardening & Google Analytics Integration

**Status:** In Progress (GA4 + Consent Mode v2 deployed, CSP Report-Only, waiting for clean violation reports)

**What has been done:**
1. ✅ Google Analytics v4 (`G-VR866S5JF5`) added with Consent Mode v2 (default-denied)
2. ✅ Cookbanner consent + localStorage persistence implemented
3. ✅ Privacy policy page (GDPR Art. 13 compliant) published
4. ✅ CSP extended to include Google Analytics domains (Report-Only mode)
5. ✅ Consent withdrawal link ("Nastavení cookies") added to footer

**Current CSP (Report-Only — logs violations, doesn't block):**
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://app.cal.com https://form.fapi.cz https://www.googletagmanager.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com
connect-src 'self' https://app.cal.com https://cal.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com
frame-src https://app.cal.com https://cal.com https://form.fapi.cz
form-action 'self' https://form.fapi.cz
base-uri 'self'
object-src 'none'
```

**What still needs to be done:**

1. **MANUAL: Monitor CSP violations for 1-2 weeks**
   - Violations logged to Netlify Functions console
   - Expected violations: inline Fraunces axes, gtag Consent Mode v2 script (both allowed)
   - If unexpected violations found (external scripts, XSS), investigate and fix
   
2. **MANUAL: Fill privacy policy placeholders** [DOPLŇTE]
   - Company IČO (ID number)
   - Sídlo (registered address)
   - Contact email
   - Data retention period (GA4 default: 14 months)
   - Czech DPA complaint link (ÚOOÚ)

3. **MANUAL: Set Netlify env vars** (if not already done)
   - `EBOOK_PDF_URL` = `https://gastroup.cz/ebook/28-nametu.pdf`
   - `EBOOK_COVER_URL` = `https://gastroup.cz/Ebook_Image.jpeg`
   - Redeploy after setting

4. **OPTIONAL: Configure GA4 data retention + Google Signals**
   - GA4 admin → Data settings → Data retention: set to 14 or 26 months (default 14)
   - Marketing → Google Signals: disable (already disabled via `allow_google_signals:false` in gtag config)

5. **FINAL: Promote CSP to enforcing** (after 1-2 weeks of clean reports)
   - Edit `netlify.toml` line 54
   - Rename header: `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
   - Deploy and monitor for CSP blocks

**Why 'unsafe-inline' is needed now:**
- Fraunces display font axes (inline `<style>`)
- gtag Consent Mode v2 init script (inline `<script>`)

**Future improvement (nonce-based CSP):**
```
script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net https://app.cal.com https://form.fapi.cz https://www.googletagmanager.com
```
This requires generating a random nonce on each page load (deferred to future optimization).

**References:**
- Detailed implementation guide: `docs/analytics-consent.md`
- GA4 property ID: `G-VR866S5JF5` (view in Google Analytics admin)
- Privacy policy template filled with placeholders: `ochrana-osobnich-udaju.html`

## Priority 4: Asset Organization

**Status:** Deferred

**What needs to be done:**
1. **Remove `generate-brand-assets.js`** (stray dev utility, no longer used)
   ```bash
   rm C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\generate-brand-assets.js
   git add .
   git commit -m "chore: remove unused generate-brand-assets.js utility"
   ```

2. **Rename on change cache policy documentation** (ready to implement)
   - When updating images, rename files (e.g., logo-v1.png → logo-v2.png)
   - Update references in index.html
   - Old version stays in CDN cache (1-year immutable)
   - New version served immediately (no cache busting delay)

**Example workflow (if logo changes):**
```bash
# Old image cached for 1 year
dist/Logo_GastroUp_2_transparent.png (immutable cache)

# New image with version suffix
dist/Logo_GastroUp_2_transparent_v2.png (new immutable cache)

# Update index.html
<picture>
  <source srcset="/Logo_GastroUp_2_transparent_v2.avif" type="image/avif" />
  ...
</picture>

# Deploy
npm run build
git push origin main

# Result: New image served immediately, old stays cached
```

## Priority 5: GDPR Compliance & Cookie Consent (Legal Pages Complete, Form Consent Pending)

**Status:** LEGAL PAGES COMPLETE (2026-06-04) — T&C page + privacy page published; form consent validation still TODO

**What has been done:**
1. ✅ **Terms of Service page** published at `/obchodni-podminky` (10 articles + Příloha č. 1 withdrawal form; Monanivude s.r.o.; effective 2.1.2026)
2. ✅ **Privacy Policy page** published at `/ochrana-osobnich-udaju` (Czech GDPR Art. 13 template, all placeholders filled; controller: Monanivude s.r.o. IČ 21341486; effective 2.1.2026)
3. ✅ **Google Analytics with Consent Mode v2** (default-denied, requires explicit opt-in via banner)
4. ✅ **Cookie banner** ("Přijmout" / "Odmítnout") implemented on all 4 pages (index, 404, privacy, T&C)
5. ✅ **Consent withdrawal link** ("Nastavení cookies") added to footer; clears localStorage on reopen (2026-06-04)
6. ✅ **localStorage-backed consent persistence** (choice survives page reloads)
7. ✅ **Test suite** (31 tests, all passing, includes T&C page scenarios)

**Pre-deployment attestation:** A1–A7 checklist created; awaiting client sign-off (see `docs/legal-pages.md` for full attestation criteria)

**What still needs to be done:**

1. **CLIENT ATTESTATION (A1–A7)** — BLOCKING TASK
   - A1: Company details verification (IČ, address, contact email)
   - A2: Products/pricing alignment check (T&C Article II/IV vs live site)
   - A3: Payment chain confirmation (FAPI → Stripe)
   - A4: Physical goods & logistics (if applicable)
   - A5: Facebook community validation (if mentioned in T&C II.1)
   - A6: Product name correctness (Gastro Mentor AI, no phantom courses)
   - A7: Support contact details finalization
   
   **Action:** Client (legal team) must complete attestation form before production deploy.

2. **Form-level consent checkbox** (after attestation passes, before launch)
   - Add checkbox to contact form: "Souhlasím s [Zásadami ochrany osobních údajů](/obchodni-podminky)"
   - Add checkbox to ebook form: same wording
   - Send `consent: boolean` to `netlify/functions/contact.ts` and `ebook.ts`
   - Server-side validation: reject if `consent !== true`
   
   **Legal basis:** GDPR Art. 6(1)(f) (legitimate interest) for lead-gen forms; Art. 6(1)(a) (explicit consent) for marketing (future newsletter). Checkbox ensures audit trail of consent.
   
   **Note:** Lead-gen forms (contact, ebook) use Art. 6(1)(b) (contractual) + 6(1)(f) (legitimate interest); marketing sends require Art. 6(1)(a) checkbox (future deferred task).

**Current state (2026-06-04):**
- Analytics consent gated by cookie banner (✅ done)
- Legal pages published & tested (✅ done)
- Form data processing continues without explicit form-level consent checkbox (⚠️ acceptable for lead-gen under Art. 6(1)(f) + (b), but checkbox recommended for audit trail)
- Privacy notice complies with GDPR Art. 13 (✅ done)

**Impact if form checkbox not added before EU launch:**
- **Low risk** for lead-gen (contact, ebook signup) — legitimately processed under Art. 6(1)(b) (contractual) + Art. 6(1)(f) (legitimate business interest)
- **High risk** for marketing (future newsletter) — requires Art. 6(1)(a) explicit consent checkbox before sending promotional emails
- Regulatory fines (Article 83) up to 4% annual revenue if consent missing for marketing

**Implementation example (form level):**
```html
<!-- Add to both contact + ebook forms (after email field) -->
<fieldset>
  <legend>Souhlas se zpracováním</legend>
  <label>
    <input type="checkbox" name="consent" required>
    Souhlasím s <a href="/obchodni-podminky">Obchodními podmínkami</a> a <a href="/ochrana-osobnich-udaju">Zásadami ochrany osobních údajů</a>
  </label>
</fieldset>
```

```typescript
// In validateContact() and validateEbook() Functions:
if (!data.consent) {
  return { valid: false, error: "Musíte souhlasit s podmínkami a zásadami ochrany" };
}
```

**Timeline recommendation:**
- [ ] Client A1–A7 attestation (legal team review + sign-off): 2–5 days
- [ ] Add form consent checkbox UI (1 hour)
- [ ] Add server-side validation in Functions (30 min)
- [ ] Update footer links (already done 2026-06-04)
- [ ] Test form submission with/without checkbox (30 min)
- [ ] Deploy to production

**Resources:**
- [GDPR Regulation](https://gdpr-info.eu/) (official text)
- [Art. 6 - Lawfulness of processing](https://gdpr-info.eu/art-6-gdpr/)
- [Art. 7 - Conditions for consent](https://gdpr-info.eu/art-7-gdpr/)
- [Art. 13 - Information to be provided to data subjects](https://gdpr-info.eu/art-13-gdpr/)
- [Resend GDPR Compliance](https://resend.com/docs/compliance) (email provider docs)
- Legal pages: `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\obchodni-podminky.html`, `ochrana-osobnich-udaju.html`
- Attestation checklist: `docs/legal-pages.md` (A1–A7 section)
- Analytics consent guide: `docs/analytics-consent.md`

## Priority 6: Anti-Bot Protection

**Status:** Recommended (not required for launch)

**Current risk:** Forms have no CAPTCHA or rate limiting. High-traffic bot attacks could:
- Abuse Resend email quota (rate limited by Resend, but costly)
- Generate noise in notification emails
- DDoS via form endpoint

**Options to implement:**

### A. Cloudflare Turnstile (simplest)
- Add client-side widget to forms
- Verify on server (Function makes request to Turnstile API)
- No CAPTCHA image solving required (invisible)
- Free tier: 300,000 challenges/month
- Implementation: ~2 hours

### B. hCaptcha (privacy-focused)
- Similar to Turnstile
- GDPR-friendly (European provider)
- Free tier available
- Implementation: ~2 hours

### C. Cloudflare in front of Netlify (advanced)
- Set up Cloudflare DNS
- Enable Bot Management (advanced tier)
- Auto-block suspicious traffic
- Cost: $200/month (paid tier)
- Implementation: ~4 hours

**Recommendation:** Start with Turnstile (cheapest, fastest).

## Priority 7: Performance Monitoring

**Status:** Partially complete (Google Analytics now available for Web Vitals; error monitoring still deferred)

**What has been done:**
1. ✅ **Web Vitals tracking via Google Analytics**
   - GA4 now collects Core Web Vitals (LCP, INP, CLS)
   - Enabled via Consent Mode v2 (opt-in via cookie banner)
   - Access reports in GA4 admin → Reports → Insights → Page & screens

**What to set up (optional but recommended):**
1. **Error monitoring** (Sentry / Rollbar)
   - Catch Function errors (email delivery failures, validation issues)
   - Alert on recurring errors
   - Track JavaScript errors in production
   - Free tier sufficient for single-page site

2. **Lighthouse CI** (GitHub Actions)
   - Automated Lighthouse audits on every PR
   - Block merge if performance regresses
   - Track trends over time

3. **CSP violation monitoring**
   - Set up CSP report endpoint once Report-Only mode is clean
   - Alert on unexpected security violations

**Cost:** Usually free tier sufficient for single-page site.

## Priority 8: Content Expansion

**Status:** Future (beyond current scope)

**Potential additions:**
1. **Blog section** (SEO-driven content)
   - Articles targeting "restaurace" keywords
   - Case studies from clients
   - Video testimonials

2. **FAQ section** (already has JSON-LD, just expand visible content)
   - Currently 7 Q&As in accordion
   - Add more detailed answers with examples

3. **Testimonials section** (social proof)
   - Client logos
   - Quote snippets
   - Video testimonials

4. **Internationalization** (if expanding beyond CZ)
   - Czech (current)
   - English (restaurant industry international)
   - German (neighboring market)

**Impact:** Improved SEO, better conversion through trust building.

## Task Tracking

To track completion, update this file with dates:

| Task | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| Font self-hosting | To Do | — | — | See fonts/README.md for setup |
| Dead CSS (.dark-tile) | To Do | — | — | Check grep results |
| CSP hardening (GA4 integration) | In Progress | 2026-06-03 | — | GA4 + Consent Mode v2 deployed; monitor violations 1-2 weeks; promote to enforcing when clean |
| Remove generate-brand-assets.js | To Do | — | — | Cleanup only |
| **Legal pages (T&C + Privacy)** | **✅ Done** | 2026-06-04 | 2026-06-04 | T&C page at /obchodni-podminky; privacy updated; footer links wired; 31 tests passing; A1–A7 attestation pending |
| **Client A1–A7 attestation** | ⏳ Blocking | 2026-06-04 | — | Pre-deploy gate: company details, pricing sync, payment chain, products, community, support contacts — awaiting client sign-off |
| **GDPR compliance (form consent)** | Deferred | 2026-06-04 | — | Legal pages done; form checkbox (contact + ebook) deferred until after attestation passes; lead-gen compliant under Art. 6(1)(f) + (b); marketing checkbox (Art. 6(1)(a)) future |
| **Google Analytics (Consent Mode v2)** | **✅ Done** | 2026-06-01 | 2026-06-03 | GA4 ID: G-VR866S5JF5; default-denied; cookie banner on 4 pages; 31 tests; legal pages integrated |
| **Ebook PDF wiring** | **✅ Done** | 2026-06-01 | 2026-06-03 | PDF moved to ebook/28-nametu.pdf; build.js copies to dist/; served at /ebook/28-nametu.pdf |
| **Ebook cover image pipeline** | **✅ Done** | 2026-06-01 | 2026-06-03 | Ebook_Image.jpeg added to build SOURCE_IMAGES; optimized + WebP/AVIF variants generated |
| **Ebook 404 fix + copy updates** | **✅ Done** | 2026-06-04 | 2026-06-04 | 301 redirect 28-tipu.pdf → 28-nametu.pdf; email button label updated; nav copy rewritten; guarantee removed site-wide; cal.com fallback hardened; 134 lines changed; **pending ops:** Update EBOOK_PDF_URL env var in Netlify UI |
| Anti-bot protection | To Do | — | — | Recommend Turnstile; implement after form consent checkbox + attestation |
| Performance monitoring | Partial | 2026-06-03 | — | GA4 Web Vitals now available; Sentry/error monitoring still deferred |
| Blog section | To Do | — | — | Future content expansion |

## File Locations

- **Deferred font setup:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\fonts\README.md`
- **Netlify config (CSP header):** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify.toml` (line 54)
- **Functions (GDPR validation):** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify\functions\*.ts`
- **Index HTML (consent checkbox location):** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html` (search for forms)
- **Stray utility to remove:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\generate-brand-assets.js`

## Questions?

For implementation details, refer to:
- Build pipeline: `docs/build-pipeline.md`
- Performance: `docs/performance-optimizations.md`
- SEO: `docs/seo.md`
- Deployment: `docs/netlify-deployment.md`
