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

## Priority 3: CSP Hardening

**Status:** Report-Only mode (non-enforcing)

**Current state:** CSP is in Report-Only mode (`Content-Security-Policy-Report-Only` header in netlify.toml). This logs violations but doesn't block resources.

**What needs to be done:**
1. Monitor CSP violations in production (set up CSP report endpoint or service)
2. Address any unexpected violations
3. Promote from Report-Only to enforcing:
   - Rename header in netlify.toml: `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
   - This will BLOCK non-compliant resources

**Current CSP (Report-Only):**
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://app.cal.com https://form.fapi.cz
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https://images.unsplash.com
connect-src 'self' https://app.cal.com https://cal.com
frame-src https://app.cal.com https://cal.com https://form.fapi.cz
form-action 'self' https://form.fapi.cz
base-uri 'self'
object-src 'none'
```

**Violations to watch for:**
- Inline scripts (detected if any external <script> tag runs)
- External stylesheets (detected if any non-Google Fonts CSS loads)
- Form submissions to unauthorized endpoints

**How to set up reporting:**
1. Create a CSP report endpoint (e.g., Netlify Function `/api/csp-report`)
2. Add `report-uri https://gastroup.cz/api/csp-report` to CSP header
3. Monitor violations for 1-2 weeks
4. Fix any issues, then promote to enforcing

**Why this matters:**
- Enforcing CSP blocks malicious inline scripts (XSS protection)
- Currently, 'unsafe-inline' is allowed in script-src (necessary for inline Fraunces axes, but should be replaced with nonces if possible)
- Moving to nonce-based CSP would eliminate 'unsafe-inline' need

**Future improvement (nonce-based CSP):**
```
script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net https://app.cal.com https://form.fapi.cz
```
This requires generating a random nonce on each page load (deferred to future optimization).

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

## Priority 5: GDPR Compliance (Legal Blocker)

**Status:** NOT IN SCOPE — must complete before EU launch

**What needs to be done:**
1. **GDPR consent checkbox** on both forms (contact + ebook)
   - Text: "I consent to my data being processed per [Privacy Policy](link)"
   - Checkbox state sent to Functions

2. **Server-side validation** in Functions:
   - `netlify/functions/contact.ts`: Check `consent === true`
   - `netlify/functions/ebook.ts`: Check `consent === true`
   - Reject form if unconsented

3. **Privacy Policy page** published at public URL (e.g., /privacy-policy)
   - Cover data processing, storage, user rights
   - Include Resend data handling (email provider)
   - Include GDPR rights (access, deletion, portability)
   - Link in footer + form consent text

**Impact if missing:**
- GDPR fine: up to 4% of annual revenue (Article 83(4))
- Cannot legally process EU users' data without consent
- Data controller (HypeDigitaly) liable

**Suggested implementation timeline:**
- Week 1-2: Draft privacy policy (legal team review)
- Week 2-3: Add consent checkbox to forms
- Week 3-4: Update Functions validation
- Week 4+: Deploy + test

**Resources:**
- [GDPR Regulation](https://gdpr-info.eu/) (official text)
- [Art. 7 - Conditions for consent](https://gdpr-info.eu/art-7-gdpr/)
- [Resend GDPR Compliance](https://resend.com/docs/compliance) (email provider docs)

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

**Status:** Optional (recommended for ongoing optimization)

**What to set up:**
1. **Web Vitals tracking** (Google Analytics / Plausible)
   - Monitor LCP, INP, CLS over time
   - Alert if metrics degrade
   - Set baseline for A/B testing

2. **Error monitoring** (Sentry / Rollbar)
   - Catch Function errors
   - Alert on email delivery failures
   - Track JavaScript errors

3. **Lighthouse CI** (GitHub Actions)
   - Automated Lighthouse audits on every PR
   - Block merge if performance regresses
   - Track trends over time

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
| CSP hardening | To Do | — | — | Monitor violations for 1-2 weeks first |
| Remove generate-brand-assets.js | To Do | — | — | Cleanup only |
| GDPR compliance | Blocked | — | — | Legal blocker, coordinate with legal team |
| Anti-bot protection | To Do | — | — | Recommend Turnstile |
| Performance monitoring | To Do | — | — | Set up Google Analytics + Sentry |
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
