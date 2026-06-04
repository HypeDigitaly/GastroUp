# Google Analytics & Consent Mode v2 Guide

## Overview

GastroUp implements Google Analytics 4 (GA4) with **Consent Mode v2**, allowing users to opt-in to analytics tracking via a cookie consent banner. All tracking is **default-denied** (no analytics until user consents), complying with GDPR Article 7 (freely given consent) and ePrivacy Directive requirements for Czech and EU users.

## Architecture

### Consent Mode v2 Flow

```
┌─ User loads page ──────────────────────┐
│ 1. Consent Mode v2 set to default-denied
│    (analytics_storage: 'denied')
│ 2. gtag.js loads with GA4 ID            │
│    (events queued but NOT sent)
│ 3. Cookie banner displays                │
└─────────┬──────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
[Accept]    [Reject]
    │           │
    │           └─ User rejects
    │              (localStorage: 'denied')
    │              (no tracking)
    │
    └─ User accepts
       (gtag consent update)
       (analytics_storage: 'granted')
       (localStorage: 'granted')
       (queued events sent to GA4)
```

**Key Properties (Consent Mode v2):**
- `analytics_storage`: 'denied' → 'granted' (tracks page views, events, user properties)
- `allow_google_signals`: false (disables Google Ads remarketing lists)
- `allow_ad_personalization_signals`: false (no ad personalization, even if analytics_storage='granted')

### Cookie Consent Banner

**HTML Element:**
```html
<section id="gp-cookie-banner" role="region" aria-label="Consent banner" ...>
  <p>Používáme analytiku ke zlepšení webu...</p>
  <button id="gp-cookie-accept">Přijmout</button>
  <button id="gp-cookie-reject">Odmítnout</button>
</section>
```

**Styling:** Hidden by default (display: none). Shown on first visit or when "Nastavení cookies" link is clicked.

**localStorage Key:** `gp_cookie_consent` — stores `'granted'` or `'denied'` to persist choice.

### Consent Withdrawal Link

**HTML Element:**
```html
<a href="#gp-cookie-banner" class="gp-cookie-settings">Nastavení cookies</a>
```

**Behavior:** Clicking this link (typically in footer) scrolls to and shows the banner, allowing users to re-open consent settings and withdraw analytics consent. **Note (2026-06-04):** When reopening the banner via the settings link, localStorage is cleared, resetting the user's choice and showing the banner again on next page load.

## Implementation Details

### Step 1: Consent Mode v2 Initialization (Before gtag.js)

In `index.html` `<head>` (before `<script async src="https://www.googletagmanager.com/gtag/js?id=G-VR866S5JF5"></script>`):

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  // Step 1: Set default-denied
  gtag('consent','default',{
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    analytics_storage:'denied',
    wait_for_update:500
  });
  // Step 2: Check localStorage for previous choice
  try {
    if(localStorage.getItem('gp_cookie_consent')==='granted'){
      gtag('consent','update',{analytics_storage:'granted'});
    }
  } catch(e) {}
</script>
```

**Why this placement:**
- Must run BEFORE gtag.js loads (async script tag)
- `wait_for_update:500` gives 500ms to update consent before sending events
- localStorage check restores user's previous choice on revisit

### Step 2: Google Tag Manager Script

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VR866S5JF5"></script>
<script>
  gtag('js', new Date());
  gtag('config','G-VR866S5JF5',{
    allow_google_signals:false,
    allow_ad_personalization_signals:false
  });
</script>
```

**GA4 Property ID:** `G-VR866S5JF5` (configured in Google Analytics admin)

**Flags:**
- `allow_google_signals:false` — No Google Ads remarketing lists (privacy-friendly)
- `allow_ad_personalization_signals:false` — No ad personalization

### Step 3: Cookie Banner JavaScript (Vanilla JS)

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const banner = document.getElementById('gp-cookie-banner');
  const acceptBtn = document.getElementById('gp-cookie-accept');
  const rejectBtn = document.getElementById('gp-cookie-reject');
  const settingsLinks = document.querySelectorAll('.gp-cookie-settings');

  function showBanner() {
    banner.style.display = 'block';
    banner.scrollIntoView({ behavior: 'smooth' });
  }

  function hideBanner() {
    banner.style.display = 'none';
  }

  function grantConsent() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    localStorage.setItem('gp_cookie_consent', 'granted');
    hideBanner();
  }

  function denyConsent() {
    localStorage.setItem('gp_cookie_consent', 'denied');
    hideBanner();
  }

  // Show banner on first visit (no consent stored)
  if (!localStorage.getItem('gp_cookie_consent')) {
    showBanner();
  }

  // Button handlers
  acceptBtn.addEventListener('click', grantConsent);
  rejectBtn.addEventListener('click', denyConsent);

  // Settings links reopen banner
  settingsLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      showBanner();
    });
  });
});
```

### Step 4: Content Security Policy (CSP)

In `netlify.toml`, CSP is extended for Google Analytics:

```toml
script-src 'self' 'unsafe-inline' ... https://www.googletagmanager.com
connect-src 'self' ... https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com
img-src 'self' data: ... https://www.google-analytics.com
```

**Note:** CSP is currently **Report-Only** (header: `Content-Security-Policy-Report-Only`). It logs violations without blocking. Once violations are clean, promote to enforcing:

```toml
Content-Security-Policy = "..." # Remove "-Report-Only"
```

**Why 'unsafe-inline':** Required for inline Fraunces axes and gtag Consent Mode v2 scripts. Plan to migrate to nonce-based CSP in future.

### Step 5: Privacy Policy

Privacy page (`ochrana-osobnich-udaju.html`) documents:
- **Data Controller:** Monanivude s.r.o. (IČ: 21341486) — changed from HypeDigitaly s.r.o. on 2026-06-04
- **Data Processing Purposes:** Analytics (page views, user engagement, conversion tracking), email delivery (transactional), lead capture
- **Legal Basis:** Article 6(1)(a) GDPR (user consent via cookie banner); Article 6(1)(b) GDPR (contractual necessity for forms)
- **Data Processors:** Google Analytics, Resend (email), Netlify (hosting), Cal.com (calendar)
- **Data Retention:** GA4 14 months, e-book sign-up +3 years, form submissions +3 years, tax documents 10 years, future newsletter 5 years
- **User Rights:** Access (Art. 15), correction (Art. 16), erasure (Art. 17), portability (Art. 20), processing withdrawal (Art. 21); 1-month response time + 2-month extension available; GDPR complaint to Czech DPA (ÚOOÚ)
- **International Transfers:** Google transfers data to US under Data Protection Framework (DPF); Netlify/Resend under Standard Contractual Clauses (SCCs)
- **Cookies & ePrivacy:** Consent-based per § 89 odst. 3 zák. č. 127/2005 Sb. (Czech ePrivacy Act) + Article 6(1)(a) GDPR

**Status (2026-06-04):** All [DOPLŇTE]/[OVĚŘTE] placeholders filled. Effective date: 2.1.2026; Last updated: 4.6.2026. Awaiting client A1–A7 attestation before production deploy (see `docs/legal-pages.md`).

## Usage & Configuration

### Environment Variables

All URLs configured via `.env` (Netlify UI > Site settings > Environment variables > Functions):

| Variable | Purpose | Default |
|----------|---------|---------|
| `EBOOK_COVER_URL` | Ebook cover image in delivery emails | `https://gastroup.cz/Ebook_Image.jpeg` |

**Note:** GA4 ID (`G-VR866S5JF5`) is hardcoded in `index.html` (no env var). If changing GA4 property, update script tag and Consent Mode config.

### Adding Consent Banner to New Pages

To add the cookie banner to additional pages (currently on `index.html`, `404.html`, `ochrana-osobnich-udaju.html`, `obchodni-podminky.html`):

1. **Copy Consent Mode v2 initialization script** (before gtag.js, see Step 1 above)
2. **Copy gtag.js script tags** (Step 2)
3. **Copy banner HTML** (the `<section id="gp-cookie-banner">` element)
4. **Copy banner JavaScript** (Steps 3, in `<script>` tag)
5. **Ensure footer has "Nastavení cookies" link** with `class="gp-cookie-settings"` and `href="#gp-cookie-banner"`

Pages currently WITH banner:
- `index.html` (marketing site)
- `404.html` (error page)
- `ochrana-osobnich-udaju.html` (privacy policy)
- `obchodni-podminky.html` (terms of service)

**Banner Microcopy (updated 2026-06-04):**
All pages now use: "Vaše údaje neprodáváme ani nesdílíme pro marketingové účely třetích stran." (replaces earlier "Vaše údaje nikdy nesdílíme s třetími stranami.")

### Monitoring Consent in GA4

**View consent data in Google Analytics:**
1. GA4 admin → Data streams → Web → View stream details
2. **Consent mode overview** shows opt-in rate, event count pre/post-consent
3. Reports → User insights → Can segment by consent status

**CSP violation reporting:**
CSP violations are logged to Netlify Functions console (Report-Only mode). Once confident, promote to enforcing. Monitor browser console for CSP warnings during testing.

### Testing Consent Flow

**Automated test suite:** `test-consent.cjs` (31 tests, all passing as of 2026-06-04)

Scenarios covered:
1. First visit + Accept (consent storage, GA hit, persistence on reload)
2. First visit + Decline (consent denial, no GA tracking, persistence on reload)
3. Legal pages (404, privacy, T&C) — all have banner + GA integration
4. Scenario 6: T&C page → Accept → Reopen via footer link (localStorage reset behavior)

Run tests locally:
```bash
npm run build                 # Generate dist/obchodni-podminky.html first
node test-consent.cjs         # Requires playwright; launches Chromium, drives banner flow
```

**Local testing (with `netlify dev`):**

```bash
# 1. Start local server
netlify dev

# 2. Visit http://localhost:8888
# 3. Open DevTools > Application > Cookies
# 4. Click "Přijmout" → localStorage should show: gp_cookie_consent = 'granted'
# 5. Open DevTools > Network > filter by "google-analytics"
#    - Analytics requests should appear (200 status)
# 6. Clear localStorage and revisit → banner reappears
```

**Production testing (post-deploy):**

1. Visit `https://gastroup.cz` (incognito/private window to clear localStorage)
2. Banner should appear on first load
3. Click "Odmítnout" → analytics_storage remains 'denied'
4. DevTools > Network > should see NO google-analytics requests
5. Revisit → banner should NOT appear (consent choice persisted)
6. Footer > "Nastavení cookies" → banner reopens (localStorage cleared, banner shows again)
7. Click "Přijmout" → localStorage updated, analytics requests resume
8. Test legal pages: `/obchodni-podminky`, `/ochrana-osobnich-udaju` — banner should appear and function identically

## Promoting CSP to Enforcing

**Current state:** CSP is Report-Only (logs violations, doesn't block).

**When to promote:**
1. Deploy analytics + consent changes
2. Monitor CSP violations in Netlify Functions logs for 1-2 weeks
3. If violations are only internal (banner/gtag scripts), safe to enforce
4. Update `netlify.toml`:
   ```toml
   # OLD (Report-Only):
   Content-Security-Policy-Report-Only = "..."
   
   # NEW (Enforcing):
   Content-Security-Policy = "..."
   ```
5. Deploy and monitor browser console for CSP blocks

**Why 'unsafe-inline' is needed now:**
- Fraunces axes declaration (inline `<style>`)
- gtag Consent Mode v2 init script (inline `<script>`)

**Future nonce-based CSP approach:**
Generate random nonce on each page load, add to inline scripts (`<script nonce="{random}">`), update CSP to:
```
script-src 'self' 'nonce-{random}' https://www.googletagmanager.com ...
```
This allows specific inline scripts while blocking XSS injections. Deferred to future optimization.

## Common Issues & Troubleshooting

### Problem: Banner appears every page load even after accepting

**Cause:** localStorage not persisted (private browsing, browser settings, cleared data)

**Solution:** 
- Check browser privacy mode (localStorage disabled)
- Check browser storage permissions for gastroup.cz
- Check localStorage quota (rare, ~5-10 MB per domain)

### Problem: Analytics events not appearing in GA4 despite accepting

**Cause:**
1. GA4 property not receiving data (event queue timeout exceeded)
2. GA4 ID incorrect in script tag
3. Browser extension blocking analytics

**Solution:**
- Verify GA4 ID: `G-VR866S5JF5` (in index.html script tag)
- Check GA4 admin > Data streams > Web > "Measurement ID" matches
- Check browser console: `gtag('get','G-VR866S5JF5','client_id')` should return a UUID
- Disable ad blockers (often block analytics)
- Wait 24-48h for GA4 to process events

### Problem: CSP violations in Report-Only mode

**Common violations:**
- `style-src` — inline `<style>` tags (expected, Fraunces axes)
- `script-src` — inline gtag init script (expected, Consent Mode v2)
- `img-src` — Unsplash images or external images without CSP allow

**Solution:**
- If from known internal source (banner, gtag), safe to ignore during Report-Only
- If from malicious source (ad injection, XSS attempt), investigate and fix
- Once confident, promote to enforcing

### Problem: Privacy page shows [DOPLŇTE] placeholders

**Cause:** Legal/business team hasn't filled in required fields

**Action items:**
- [ ] Fill company IČO, sídlo (address), contact email
- [ ] Verify data retention policy (default: GA4 14 months)
- [ ] Verify DPA contact (Czech DPA: ÚOOÚ)
- [ ] Review privacy policy with legal counsel
- [ ] Test links to GDPR complaint procedures

## File Locations

- **Consent Mode init + banner HTML/JS:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html` (search for `#gp-cookie-banner`)
- **GA4 script tags:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html` (head section, before closing `</head>`)
- **CSP header:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify.toml` (line 54)
- **Privacy policy:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\ochrana-osobnich-udaju.html`
- **Terms of Service:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\obchodni-podminky.html`
- **404 page (also has banner):** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\404.html`
- **Consent test suite:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\test-consent.cjs` (31 tests)

## References

- [Google Consent Mode v2 Guide](https://support.google.com/analytics/answer/9976101)
- [GA4 Event Tracking](https://support.google.com/analytics/answer/11091582)
- [GDPR Art. 7 - Conditions for Consent](https://gdpr-info.eu/art-7-gdpr/)
- [ePrivacy Directive (2009/136/EC)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009L0136)
- [Czech DPA (ÚOOÚ)](https://www.uoou.cz/)

---

**Last updated:** 2026-06-04 | **Status:** Implemented (legal pages + 31 test suite live; A1–A7 attestation pending)
