# Netlify Deployment

## Overview

GastroUp is deployed on Netlify with a static site (`dist/` from build pipeline) + serverless Functions for email delivery. This guide covers the build workflow, deployment process, and production go-live checklist.

## Build & Deploy Workflow

### Local Development to Production

```
┌─────────────────────────────────────┐
│ 1. Development (main branch)         │
│    - Edit src/ partials, build.js    │
│    - Test locally: netlify dev       │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Commit & Push to main             │
│    git commit -am "..."              │
│    git push origin main              │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 3. Netlify Automatic Deploy          │
│    - Webhook triggered               │
│    - npm run build executed          │
│    - dist/ contents uploaded to CDN  │
│    - Functions bundled & deployed    │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 4. Live on gastroup.cz               │
│    - HTML served from cache (must-   │
│      revalidate, so CDN checks head) │
│    - Images served (immutable cache) │
│    - Functions available at /api/*   │
└─────────────────────────────────────┘
```

### Build Command

**netlify.toml:**
```toml
[build]
  publish = "dist"           # Deploy this directory
  command = "npm run build"  # Run this command
```

**package.json:**
```json
{
  "scripts": {
    "build": "node build.js"
  }
}
```

**What happens:**
1. Netlify runs `npm run build`
2. build.js:
   - Minifies index.html (40KB → 31KB)
   - Generates image variants (PNG → WebP → AVIF)
   - Copies curated files to dist/
3. Netlify deploys dist/ to CDN

**Deploy time:** ~2-3 minutes (including image optimization)

## Netlify Configuration (netlify.toml)

### Publish & Build

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
```

### Functions

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

**Important:** Functions are bundled from **repo root** (`netlify/functions/`), NOT from `dist/`. Netlify automatically handles Function bundling and deployment.

### Redirects

```toml
[[redirects]]
  from = "https://www.gastroup.cz/*"
  to = "https://gastroup.cz/:splat"
  status = 301
  force = true
```
Canonicalizes www to apex domain (www.gastroup.cz → gastroup.cz).

```toml
[[redirects]]
  from = "/index.html"
  to = "/"
  status = 301
```
Redirects /index.html to / (canonical URL).

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```
Maps /api/contact → /.netlify/functions/contact (proxies to Functions without 3xx redirect).

### Security Headers

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    X-XSS-Protection = "0"
    Content-Security-Policy-Report-Only = "default-src 'self'; ..."
```

**Key points:**
- **HSTS:** 1-year max-age with subdomains
- **CSP:** Currently Report-Only (non-enforcing) — logs violations but doesn't block
- **X-XSS-Protection: 0** — disables legacy XSS filter (modern CSP is sufficient)

### Cache Control

**Images (immutable, 1-year cache):**
```toml
[[headers]]
  for = "/*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.webp"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.avif"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Fonts (immutable, 1-year cache):**
```toml
[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**HTML (always revalidate):**
```toml
[[headers]]
  for = "/"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

**API (no cache):**
```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store"
```

**Cache strategy:**
- **Immutable assets:** Use rename-on-change policy (if logo changes, rename to `logo-v2.png`, update HTML, old version stays cached)
- **HTML:** Revalidates on every request (users always get latest)
- **Functions:** Never cached (fresh data on every call)

### Production Environment Variables

```toml
[context.production.environment]
  ALLOWED_ORIGIN = "https://gastroup.cz"
```

**Note:** Other variables (`RESEND_API_KEY`, `NOTIFICATION_TO`, `FROM_EMAIL`, `EBOOK_PDF_URL`, `CTA_URL`) are set in **Netlify UI** under **Site settings > Environment variables** (Functions scope only).

## Deployment Process

### Automatic Deployment (Main Branch)

Every push to `main` triggers a deploy:

```bash
git add .
git commit -m "feat: add performance optimizations"
git push origin main
```

**Netlify automatically:**
1. Detects push via GitHub webhook
2. Clones repo
3. Runs `npm install` (install dependencies)
4. Runs `npm run build` (optimize assets)
5. Deploys `dist/` to CDN
6. Bundles + deploys Functions
7. Updates DNS (already pointed to Netlify)

**Check status:**
- Netlify Dashboard → Deploys tab
- Recent deploy shows build log, deploy log
- Status badge: Publishing, Building, Verifying, or Live

### Preview Deployments (Non-Main Branches)

Push to feature branch to create a preview:

```bash
git checkout -b feature/add-blog
# Make changes
git push origin feature/add-blog
```

**Netlify creates:**
- Unique preview URL: `https://feature-add-blog--gastroup.netlify.app`
- Separate `dist/` built from your branch
- Full Function testing available
- ALLOWED_ORIGIN falls back to "*" (allows CORS from any origin for testing)

**Use for:**
- Testing before main branch
- Getting feedback from stakeholders
- Performance testing before production merge

## Go-Live Checklist

**WARNING: All items must be completed before going live to production.**

This checklist is partially configured in netlify.toml (marked below) and partially requires manual Netlify dashboard actions.

### 1. Domain Management

**Netlify Dashboard → Site settings → Domain management**

- [ ] **Primary domain set to apex (gastroup.cz)**
  - NOT www.gastroup.cz (avoid redirect loop with www→apex rule)
  - DNS records point to Netlify nameservers or CNAME
  - Verify HTTPS certificate auto-issued

**Status:** Assumed configured; double-check dashboard.

### 2. HTTPS & Security

**Netlify Dashboard → Site settings → HTTPS**

- [ ] **Force HTTPS enabled**
  - Redirects all HTTP traffic to HTTPS
  - Automatic certificate renewal (Let's Encrypt)

**Status:** configured in netlify.toml (Strict-Transport-Security header).

**Verify:**
```bash
curl -I https://gastroup.cz
# Should show 200 OK, not 301 redirect
```

### 3. Disable Legacy Asset Optimization

**Netlify Dashboard → Site settings → Build & deploy > Post processing**

- [ ] **Turn OFF "Asset optimization / post-processing"**
  - Netlify would double-process already-minified HTML
  - Would interfere with image variants (duplicate work)

**Status:** Must do manually on dashboard. Critical for performance.

### 4. Resend Email Configuration

**External: Resend.com & DNS registrar**

- [ ] **Resend API key created** with scope "Sending access" only
  - Name: `gastroup-netlify-prod`
  - Set as environment variable in Netlify (`RESEND_API_KEY`)

- [ ] **Resend domain verified** (notifications.gastroup.cz)
  - Add domain in Resend dashboard
  - Copy SPF, DKIM (3× CNAME), DMARC records
  - Add to DNS registrar (gastroup.cz zone)
  - Wait for Resend to mark "Verified" (typically 15 min – 2 hours)

**Status:** Separate from Netlify; requires Resend + registrar access.

### 5. Environment Variables Set

**Netlify Dashboard → Site settings > Environment variables**

- [ ] `RESEND_API_KEY` — Production Resend key (Functions scope only)
- [ ] `NOTIFICATION_TO` — Team email (jakub.hnat@gastroup.cz)
- [ ] `FROM_EMAIL` — Sender email (GastroUp <noreply@notifications.gastroup.cz>)
- [ ] `EBOOK_PDF_URL` — Public ebook URL
- [ ] `CTA_URL` — CTA redirect URL
- [ ] `ALLOWED_ORIGIN` — "https://gastroup.cz" (production context)

**Status:** Partially configured; `ALLOWED_ORIGIN` must be set in netlify.toml production context (✓ done).

### 6. Email Testing

**Manual: Submit forms via production URL**

- [ ] **Contact form submission**
  - Form data reaches Function via /api/contact
  - Notification email sent to `NOTIFICATION_TO`
  - Confirmation email sent to user
  - Verify email formatting, links work

- [ ] **Ebook form submission**
  - Form data reaches Function via /api/ebook
  - Notification email sent to team
  - Download link sent to user (or EBOOK_PDF_URL)
  - Verify PDF accessible

**Status:** Execute after Resend domain verified.

### 7. GDPR Consent & Legal

**Code change required**

- [ ] **GDPR checkbox added to both forms**
  - Text: "I consent to my data being processed per [Privacy Policy](link)"
  - Server-side validation: `consent === true` in Functions

- [ ] **Privacy Policy page published**
  - URL provided in checkbox link
  - Covers data processing, retention, user rights

**Status:** NOT IN CURRENT SCOPE — must complete before EU traffic launch (legal blocker).

**Impact:** Without GDPR compliance, fine risk up to 4% of annual revenue (GDPR Article 83).

### 8. Monitoring & Analytics (Optional)

**Recommended:**

- [ ] **Error tracking enabled** (Netlify Logs or external service)
  - Monitor Function errors
  - Alert on email delivery failures

- [ ] **Performance monitoring**
  - Use Lighthouse CI or similar
  - Monitor LCP, INP, CLS over time

- [ ] **Analytics**
  - Google Analytics / Plausible
  - Track form submissions, user behavior

**Status:** Not required for launch, but recommended for post-launch optimization.

## Production Context Variables

The netlify.toml includes production-specific overrides:

```toml
[context.production.environment]
  ALLOWED_ORIGIN = "https://gastroup.cz"
```

This ensures:
- **Production (gastroup.cz):** ALLOWED_ORIGIN pinned to apex (CORS only from own domain)
- **Preview branches:** ALLOWED_ORIGIN defaults to "*" (CORS from any origin for testing)
- **Deploy previews:** ALLOWED_ORIGIN defaults to "*"

For other variables (RESEND_API_KEY, etc.), use Netlify Dashboard UI to set per-context:
- **Production context:** Real Resend key
- **Deploy preview context:** Test key (optional)

## Monitoring Deployments

### Netlify Dashboard

**Deploys tab:**
- Recent deploy status (Live, Published, Building, Failed)
- Build time, total size
- Logs for debugging

**Functions tab:**
- Invocation count, error rate
- Latency metrics
- Logs for troubleshooting

### Log Monitoring

**Check build output:**
```
Netlify Dashboard → Deploys → [Latest deploy] → Deploy log
```

Look for:
- `npm run build` output (minification stats, image sizes)
- Warnings (missing files, slow operations)
- Errors (build failure reason)

**Check Function logs:**
```
Netlify Dashboard → Functions → [Function name] → Logs
```

Look for:
- Email send failures
- Validation errors
- CORS rejections

## Rollback

If a deploy breaks production:

1. **Netlify Dashboard → Deploys tab**
2. **Find previous working deploy**
3. **Click "Publish deploy"** (one-click rollback)
4. **Verify:** Test forms, check Lighthouse score

**Alternative (manual):**
1. Revert commit: `git revert HEAD`
2. Push to main: `git push origin main`
3. New deploy triggers automatically

## Performance Monitoring

After launch, monitor Core Web Vitals:

```
Google Search Console → Experience → Core Web Vitals
```

Target metrics:
- **LCP:** < 2.5s
- **INP:** < 200ms
- **CLS:** < 0.1

If metrics degrade, check:
- Image file sizes (run `npm run build`, verify dist/)
- Function latency (Netlify Functions tab)
- CDN cache hit rate (Netlify Analytics or headers)

## Troubleshooting

### Deploy fails with "dist/ not found"

**Problem:** build.js didn't complete, dist/ never created.

**Solution:**
1. Check build log for errors
2. Verify build.js syntax: `node build.js` locally
3. Verify sharp installation: `npm list sharp`

### HTML not minified

**Problem:** HTML size didn't decrease after deploy.

**Solution:**
1. Check netlify.toml: `publish = "dist"` (correct)
2. Verify build.js runs: Check build log for minification output
3. Clear Netlify cache: **Site settings → Cache → Purge all**

### Images not optimized (WebP/AVIF not served)

**Problem:** Users see PNG even though .webp/.avif exist.

**Solution:**
1. Verify images in dist/: `ls -la dist/*.webp dist/*.avif`
2. Check browser support (use DevTools Network tab)
3. Verify picture element HTML syntax (see performance-optimizations.md)

### Functions return 502 errors

**Problem:** /api/contact returns "Bad Gateway".

**Solution:**
1. Check Function logs: Netlify Dashboard → Functions → [Function name] → Logs
2. Verify environment variables set: **Site settings > Environment variables**
3. Check ALLOWED_ORIGIN: Should be `https://gastroup.cz` in production
4. Test locally: `netlify dev`, submit form, check console

### CORS errors (form submission fails)

**Problem:** Console: "Access to XMLHttpRequest blocked by CORS policy".

**Solution:**
1. Verify ALLOWED_ORIGIN in netlify.toml/UI
2. Check Function origin validation: `netlify/functions/contact.ts` (line ~50)
3. Test with `curl`:
   ```bash
   curl -X POST https://gastroup.cz/api/contact \
     -H "Content-Type: application/json" \
     -H "Origin: https://gastroup.cz" \
     -d '{"email":"test@example.com",...}'
   ```

## File Locations

- **Build config:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify.toml`
- **Build script:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\build.js`
- **Functions:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify\functions\*.ts`
- **Output directory:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\dist\` (created by build)

## Resources

- [Netlify Deploy Docs](https://docs.netlify.com/site-configuration/overview/)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Resend Email API](https://resend.com/docs)
