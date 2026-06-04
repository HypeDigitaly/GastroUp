# Email Integration Guide

## Overview

GastroUp uses Netlify Functions paired with the Resend REST API to send transactional emails from contact and ebook signup forms. This design follows the pattern established in `hypedigitaly-web-2`, routing all form submissions through serverless endpoints that validate input, send blocking and non-blocking emails, and return results to the frontend. No npm `resend` package is used; all communication with Resend uses direct HTTP calls.

## Architecture

```
┌─ Browser ──────────────────────────────────────────────┐
│  Form submission via fetch()                           │
│  15s timeout, AbortController, error display           │
└────────────────┬────────────────────────────────────────┘
                 │ POST /.netlify/functions/contact or /ebook
                 │ JSON body: name, email, phone, message, preference
                 │
        ┌────────▼─────────┐
        │ Netlify Function │
        │ - parseBody      │
        │ - validateInput  │
        │ - honeypot check │
        └────────┬─────────┘
                 │
        ┌────────▼──────────────────────────────┐
        │ 1. Blocking Email (must succeed)      │
        │    - Notification OR Delivery         │
        │    If fails → 500 error to browser    │
        └────────┬───────────────────────────────┘
                 │
        ┌────────▼──────────────────────────────┐
        │ 2. Non-blocking Email (try, no impact)│
        │    - Confirmation OR Notification     │
        │    If fails → log only, still return 200
        └────────┬───────────────────────────────┘
                 │
                 │ HTTPS POST to api.resend.com/emails
                 │
        ┌────────▼──────────────────────────────────────┐
        │ Resend REST API                               │
        │ Processes both emails, queues for delivery     │
        └────────┬──────────────────────────────────────┘
                 │
        ┌────────▴──────────────┬──────────────────────┐
        │                       │                      │
    ┌───▼──────┐         ┌─────▼──────┐     ┌────────▴────┐
    │ Team     │         │ User inbox │     │ Spam folder │
    │(notified)│         │(confirmed) │     │(if flagged)  │
    └──────────┘         └────────────┘     └─────────────┘
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/.netlify/functions/contact` | POST | Contact form: name, phone, email, message, preference |
| `/.netlify/functions/ebook` | POST | Ebook signup: email, phone (optional) |

### Request / Response Schema

#### Contact Form Request

```json
{
  "name": "Jakub Nováčke",
  "phone": "+420 777 555 123",
  "email": "jakub@restaurace.cz",
  "message": "Máte něco na restaurace bez zaměstnanců?",
  "preference": "E-mail",
  "company_website": ""
}
```

#### Ebook Form Request

```json
{
  "email": "jana@gastro.cz",
  "phone": "+420 603 777 888",
  "company_website": ""
}
```

#### Success Response (200)

```json
{
  "success": true
}
```

#### Validation Error (400)

```json
{
  "success": false,
  "error": "Jméno je povinné"
}
```

#### Server / Config Error (500)

```json
{
  "success": false,
  "error": "Konfigurace e-mailu není dokončena."
}
```

#### Honeypot Detection

If `company_website` field contains any non-empty value, the function returns a **fake 200 success** without processing:

```json
{
  "success": true
}
```

This prevents bot detection while maintaining form submission appearance.

## Email Flow per Endpoint

### `/contact` Endpoint

1. **Notification (BLOCKING)**
   - **To**: Team email (`NOTIFICATION_TO`)
   - **Content**: User name, phone, email, message, preference, timestamp, source URL, user agent
   - **Failure behavior**: Returns 500 error to user
   - **Impact**: If this fails, user sees error message; form not marked as sent

2. **Confirmation (NON-BLOCKING)**
   - **To**: User email (if provided in form)
   - **Content**: Greeting with first name extracted, thank-you message, CTA to start trial
   - **Failure behavior**: Logged as non-blocking error; user still sees success
   - **Impact**: User sees form success even if confirmation email fails to send

### `/ebook` Endpoint

1. **Delivery (BLOCKING)**
   - **To**: User email
   - **Content**: Ebook download link (PDF URL), how to use tips, CTA for trial
   - **Failure behavior**: Returns 500 error to user
   - **Impact**: User must receive ebook; if Resend fails, error shown and form not marked sent

2. **Notification (NON-BLOCKING)**
   - **To**: Team email (`NOTIFICATION_TO`)
   - **Content**: User email, phone, timestamp, source URL, user agent
   - **Failure behavior**: Logged as non-blocking error; user still sees success
   - **Impact**: Team notification delivery does not affect user experience

## Code Structure

```
netlify/
├── functions/
│   ├── contact.ts              (140 LOC) — Contact form handler
│   ├── ebook.ts                (135 LOC) — Ebook signup handler
│   └── shared/
│       ├── types.ts            (30 LOC)  — TypeScript interfaces
│       ├── utils.ts            (200 LOC) — Validation, sanitization, HTTP helpers
│       └── email-templates.ts  (310 LOC) — HTML/text email generators + subjects
├── netlify.toml                — Build config, environment setup, security headers
├── package.json                — Dependencies (none; vanilla fetch)
├── tsconfig.json               — TypeScript compilation config
└── .env.example                — Template for local environment variables
```

**Module roles:**
- **contact.ts / ebook.ts**: Request parsing, honeypot detection, validation routing, email payload assembly, Resend API calls, response formatting
- **types.ts**: `ContactFormData`, `EbookFormData`, `ResendPayload`, `ValidationResult<T>`, `RequestMeta`
- **utils.ts**: `parseBody()`, `validateContact()`, `validateEbook()`, `validateHoneypot()`, `sendResendEmail()`, `escapeHtml()`, `sanitizeHeader()`, `safeReplyTo()`, `safeUrl()`, `extractMeta()`, `buildCorsHeaders()`
- **email-templates.ts**: 8 template generators (4 HTML, 4 plain text, 4 subject lines), brand color constants, reusable helper functions (`htmlShell`, `navyHeader`, `kvRow`, `ctaButton`)

## Validation & Security

### Input Validation (Server-Side)

- **Name**: Required, max 100 characters, no CRLF injection
- **Phone**: Required (contact form), optional (ebook), regex pattern `/^[\d\s+()/-]{6,30}$/`
- **Email**: Optional (contact form), required (ebook)
  - Regex validation: `/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/`
  - CRLF guard: Rejects `\r`, `\n`, `\0`, comma, semicolon, angle brackets
  - No double dots (`..`) allowed
  - Max 100 characters
- **Message** (contact only): Optional, max 2000 characters
- **Preference** (contact only): Must be one of `["Telefon", "Telegram", "E-mail"]`

### Honeypot Protection

- **Field name**: `company_website`
- **Display**: Off-screen (`position: absolute; left: -9999px; opacity: 0`), `tabindex="-1"`, `aria-hidden="true"`
- **Detection**: Any non-empty value triggers honeypot
- **Response**: Fake 200 success (no processing, no logs revealing detection)

### Body Size Limits

- **Maximum**: 8192 bytes (8 KB) UTF-8
- **Enforcement**: `Buffer.byteLength(event.body, "utf8") > 8192` throws error before parsing
- **Content-Type support**: `application/json` (default), `application/x-www-form-urlencoded`

### Header Sanitization

- **Subject line**: `sanitizeHeader()` removes CRLF, null, quotes, angle brackets, control characters (`\x00-\x1F`), limited to 80 characters
- **Reply-To**: `safeReplyTo()` validates email against CRLF/injection patterns; returns `undefined` if unsafe
- **User-Agent**: Truncated to 150 characters in logs (never full UA stored)

### HTML & URL Safety

- **HTML escaping**: All user data in HTML email bodies passed through `escapeHtml()` to prevent injection
  - Maps: `&`, `<`, `>`, `"`, `'` to HTML entities
- **URL safety**: `safeUrl()` only allows HTTPS URLs starting with `https://`, otherwise returns empty string
- **Dynamic URLs**: PDF and CTA URLs read from environment variables, validated before injection into templates

### Privacy & Logging

- **Tracking disabled**: All emails sent with `tracking: { opens: false, clicks: false }`
- **No PII in logs**: Logs contain only status codes, error type names (e.g., "TypeError"), truncated user-agent hash (first 8 chars)
- **Example**: `[honeypot] contact_blocked { ua_hash: "Mozilla/" }`

### Security Headers (netlify.toml)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Frontend Integration

Forms in `index.html` call the endpoints using a shared `submitForm()` utility:

```javascript
function submitForm(endpoint, data) {
  var ctrl = new AbortController();
  var timeoutId = setTimeout(function(){ ctrl.abort(); }, 15000);
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: ctrl.signal
  })
    .then(...)
    .finally(function(){ clearTimeout(timeoutId); });
}
```

**Form integration details:**
- **Three forms**: Lead popup (`#leadForm`), Ebook section (`#ebookForm`), Contact section (`#contactForm`)
- **Honeypot field**: `<input name="company_website" ... aria-hidden="true">`
- **Error display**: Form-specific error `<div class="form-error" id="*Error" role="alert">`
- **Timeout**: 15 seconds AbortController; if exceeded, fetch aborts
- **Loading state**: `btn.disabled = true` during submission
- **Success state**: Form element gets `hidden` or `class="sent"` after success
- **Race safety**: Forms check `form._aborted` flag to prevent race conditions when user navigates

## Local Testing

### Setup

Install Netlify CLI and dependencies:

```bash
npm install -g netlify-cli
npm install
netlify link            # Link to Netlify site (one-time setup)
netlify env:pull        # Pull environment variables from Netlify into .env
```

### Run Local Server

```bash
netlify dev
```

The `netlify dev` command starts a local server at `http://localhost:8888` that simulates the Netlify environment, including Functions. All forms will POST to the local endpoints.

### Test via Browser Form

1. Navigate to `http://localhost:8888`
2. Scroll to contact or ebook form
3. Fill in required fields (use your test email)
4. Submit form
5. Check terminal for Netlify dev logs
6. Check your email inbox for notification (team) and confirmation/delivery (user)

### Test via curl

```bash
# Contact form
curl -X POST http://localhost:8888/.netlify/functions/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "phone": "+420 777 555 123",
    "email": "test@example.com",
    "message": "Test message",
    "preference": "E-mail"
  }'

# Ebook form
curl -X POST http://localhost:8888/.netlify/functions/ebook \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "phone": "+420 777 555 123"
  }'
```

## Out of Scope / Risk Register

The following items are **explicitly NOT implemented** in the current release. They must be addressed before scaling to production traffic or high volumes.

| Item | Reason Not Implemented | Impact | Recommendation |
|------|------------------------|--------|-----------------|
| **Rate limiting** | No quota enforced per IP/email | Bot can spam forms, exhaust Resend quota ($1/1000 emails) | Implement Cloudflare rate limiting or Netlify rate-limit middleware before going live |
| **Cloudflare Turnstile CAPTCHA** | Requires frontend JS integration + backend verification | Honeypot alone insufficient against automated attacks | Add CAPTCHA to both contact and ebook forms; verify token server-side |
| **GDPR consent checkbox** | Requires legal review, checkbox UI, server-side validation | CZ/EU law requires explicit consent; current forms lack checkbox | **BLOCKER**: Add consent checkbox before any CZ/EU traffic; update `validateContact()` and `validateEbook()` to check `consent=true` |
| **CSP (Content Security Policy) header** | May break inline email template styles | Stricter security, but requires thorough testing | Add CSP header to Functions responses once GDPR checkbox deployed |
| **Email deliverability monitoring** | No webhook endpoint to track bounces, complaints | Resend sends emails but we don't know if they bounced | Set up Resend webhook endpoint (next phase) to log delivery issues and auto-remove bounced addresses |
| **Signup form validation (team side)** | Team can manually edit CRM; no duplicate prevention | Duplicate leads if same email submits twice | Consider CRM integration or MongoDB collection to deduplicate within 24-hour window |
| **SMS backup delivery** | Ebook delivery only via email; no SMS fallback | If email delivery fails, user has no way to get ebook | Optional enhancement: add SMS delivery via Twilio if email fails |
| **A/B testing variants** | All users see same email templates | Cannot optimize confirmation email CTR or ebook pitch | Add template variant selection (e.g., via A/B flag in function) once baseline metrics established |

## Ebook Asset Wiring

### Overview

The ebook PDF (`28-nametu.pdf`) and cover image (`Ebook_Image.jpeg`) are public assets served via the static site. They are referenced in the ebook delivery email template, allowing users to download the PDF and view the cover image immediately after signup.

### Ebook PDF Distribution

**Storage & Build:**
- **Source:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\ebook\28-nametu.pdf`
- **Build step:** `build.js` copies `ebook/` folder to `dist/ebook/` (lines 151–165)
- **Public URL:** `https://gastroup.cz/ebook/28-nametu.pdf` (served by Netlify CDN)

**How to update the PDF:**
1. Replace the file: `ebook/28-nametu.pdf` → save new PDF with same name
2. Commit and push: `git add ebook/28-nametu.pdf && git commit -m "feat(ebook): update 28 nametu PDF"`
3. Deploy automatically via GitHub → Netlify
4. No need to update any code or env vars (URL already correct)

**Cache policy:** 1-day max-age (24 hours), with 7-day stale-while-revalidate. This allows quick updates while reducing redundant CDN requests.

```toml
# netlify.toml cache header:
[[headers]]
  for = "/*.pdf"
  [headers.values]
    Cache-Control = "public, max-age=86400, stale-while-revalidate=604800"
    Content-Disposition = "inline"
```

### Ebook Cover Image Pipeline

**Source image:** `Ebook_Image.jpeg` (original JPEG at project root)

**Build processing:**
1. `build.js` SOURCE_IMAGES includes `'Ebook_Image.jpeg'` (line 11)
2. On build:
   - Re-encode JPEG with mozjpeg quality 80 (optimization) → `dist/Ebook_Image.jpeg`
   - Generate WebP variant → `dist/Ebook_Image.webp`
   - Generate AVIF variant → `dist/Ebook_Image.avif`

**Output files:**
- `dist/Ebook_Image.jpeg` (optimized original)
- `dist/Ebook_Image.webp` (modern format, ~30% smaller)
- `dist/Ebook_Image.avif` (next-gen format, ~50% smaller)

**Cache policy:** 1-year immutable (rename-on-change pattern)

```toml
# netlify.toml cache headers (lines 88–90):
[[headers]]
  for = "/*.jpeg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Email Delivery: PDF + Cover Image

**Ebook delivery email template** (`netlify/functions/shared/email-templates.ts`, lines 269–324):

1. **Greeting:** "Ahoj,"
2. **Cover image (if URL valid):** 
   - Calls `safeUrl(EBOOK_COVER_URL)` to validate HTTPS
   - Renders `<img src="{coverUrl}" alt="28 námětů na tematické akce" width="240">`
   - If URL invalid, row is omitted (graceful degradation)
3. **Intro text:** "tady je pro Tebe 28 námětů..."
4. **Primary CTA button:** "Stáhnout ebook zdarma" — links to `PDF_URL` (updated 2026-06-04; previously "Stáhnout 28 námětů (PDF)")
5. **Body text:** How to use the ebook + Gastro Parťák trial pitch
6. **Secondary CTA buttons:** "Vyzkoušet Gastro Parťáka za 465 Kč", "Rezervovat demo zdarma"
7. **Signoff:** "Využij naše náměty na maximum, Tým GastroUP"

**Environment variables:**

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `EBOOK_PDF_URL` | Public HTTPS URL to PDF download | `https://gastroup.cz/ebook/28-nametu.pdf` | Yes (before prod) |
| `EBOOK_COVER_URL` | Public HTTPS URL to cover image (email display) | `https://gastroup.cz/Ebook_Image.jpeg` | Yes (before prod) |

**Example configuration (Netlify UI):**
- Site settings → Environment variables → Functions
- Add `EBOOK_PDF_URL` = `https://gastroup.cz/ebook/28-nametu.pdf`
- Add `EBOOK_COVER_URL` = `https://gastroup.cz/Ebook_Image.jpeg`
- Deploy

**URL validation:** Both URLs validated via `safeUrl()` function (utils.ts) — rejects non-HTTPS URLs and invalid characters.

### Updating Ebook Assets

**Workflow: Update PDF**
```bash
# 1. Replace the PDF
cp /path/to/new/28-nametu.pdf ebook/28-nametu.pdf

# 2. Commit
git add ebook/28-nametu.pdf
git commit -m "feat(ebook): update 28 nametu PDF"
git push origin main

# 3. Netlify auto-deploys, build.js copies to dist/ebook/
# 4. Users receive ebook at: https://gastroup.cz/ebook/28-nametu.pdf
```

**Workflow: Update cover image**
```bash
# 1. Replace the JPEG
cp /path/to/new/Ebook_Image.jpeg ./Ebook_Image.jpeg

# 2. Commit
git add Ebook_Image.jpeg
git commit -m "design(ebook): update cover image (mozjpeg q80 re-encode)"

# 3. Build process:
#    - Re-encodes JPEG (mozjpeg q80)
#    - Generates WebP + AVIF variants
#    - Copies to dist/
#    - Email template displays via <img src="/Ebook_Image.jpeg" alt="...">

# 4. Deploy — users see new image immediately (1-year immutable cache)
```

**If changing PDF filename (e.g., from 28-nametu.pdf → 28-nametu-v2.pdf):**
1. Add new PDF to `ebook/` folder
2. Update `EBOOK_PDF_URL` env var in Netlify UI to point to new filename
3. Redeploy
4. Old PDF remains cached for 1 year; new PDF served immediately

### Email Tracking & Privacy

**Tracking disabled in ebook delivery email:**
```javascript
// netlify/functions/ebook.ts (approx. line 40):
tracking: { opens: false, clicks: false }
```

This ensures:
- No pixel tracking of email opens
- No click tracking on links (including PDF download link)
- No user behavior analysis via email
- Compliant with privacy-first approach

### Troubleshooting

**Problem: Cover image not showing in delivered email**

**Cause 1:** `EBOOK_COVER_URL` env var not set or URL incorrect
- Check Netlify UI > Site settings > Environment variables > Functions
- Verify `EBOOK_COVER_URL` = `https://gastroup.cz/Ebook_Image.jpeg`
- Check that file exists: `ls dist/Ebook_Image.jpeg` after build

**Cause 2:** Email client doesn't load remote images
- Most email clients load images by default, but some (Gmail, Outlook) require user opt-in
- Email includes alt text: "28 námětů na tematické akce"
- Fallback text will display if image doesn't load

**Solution:**
1. Verify env var set correctly in Netlify
2. Redeploy (via git push or Netlify UI)
3. Send test email to verify
4. Check email HTML source for `<img src="https://gastroup.cz/Ebook_Image.jpeg">`

**Problem: PDF download link 404 after updating**

**Cause:** `EBOOK_PDF_URL` env var still points to old PDF filename
- Built PDF is at: `dist/ebook/28-nametu.pdf`
- But env var still points to old URL

**Solution:**
1. Verify new PDF is in `ebook/` folder
2. Update `EBOOK_PDF_URL` env var in Netlify UI
3. Redeploy
4. Test download link by visiting URL in browser

**Problem: Users clicking links in old emails receive 404 (legacy filename)**

**Cause:** Ebook filename changed (e.g., `28-tipu.pdf` → `28-nametu.pdf`) but emails already sent with old URL don't have redirect

**Solution:**
1. Add redirect in `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/ebook/28-tipu.pdf"
     to = "/ebook/28-nametu.pdf"
     status = 200
   ```
2. Update `EBOOK_PDF_URL` env var in Netlify UI to new filename
3. Redeploy
4. Test old URL: `curl -L https://gastroup.cz/ebook/28-tipu.pdf -I` (should return 200, not 404)
5. Test new URL: `curl -L https://gastroup.cz/ebook/28-nametu.pdf -I` (should return 200)

**Pre-launch Checklist: Ebook Assets**

- [ ] PDF file uploaded to `ebook/28-nametu.pdf` (no spaces, ASCII-safe filename)
- [ ] Cover image at project root: `Ebook_Image.jpeg` (re-encoded mozjpeg q80)
- [ ] `EBOOK_PDF_URL` set in Netlify env vars: `https://gastroup.cz/ebook/28-nametu.pdf`
- [ ] `EBOOK_COVER_URL` set in Netlify env vars: `https://gastroup.cz/Ebook_Image.jpeg`
- [ ] Build runs successfully: `npm run build` → `dist/ebook/28-nametu.pdf` exists
- [ ] Manual smoke test: Visit `https://gastroup.cz/ebook/28-nametu.pdf` → file downloads
- [ ] Submit ebook form with test email → verify delivery email received with cover image + download link

---

**Pre-launch checklist items from README:**
- GDPR consent checkbox + privacy policy validation
- Rate limiting / Cloudflare Turnstile CAPTCHA
- Verify `ALLOWED_ORIGIN` switched from `*` to `https://gastroup.cz`
- Manual email test of both forms
- DNS verification for Resend domain (`notifications.gastroup.cz`)

See `README.md` "Pre-Launch Checklist" section for detailed steps.
