# GastroUp Documentation

Complete documentation for the GastroUp marketing site and its build/optimization infrastructure.

## Quick Start

**New to the project?** Start here:

1. **[Build Pipeline](./build-pipeline.md)** — How to build and deploy
   ```bash
   npm run build      # Optimize for production
   npm run dev        # Local development
   ```

2. **[Netlify Deployment](./netlify-deployment.md)** — How to go live
   - Deployment workflow
   - Go-live checklist (critical items)
   - Production configuration

3. **[Performance Optimizations](./performance-optimizations.md)** — What was optimized
   - Core Web Vitals improvements
   - Image optimization results
   - Verification checklist

## Documentation Structure

### By Role

**Frontend Developers**
- [Build Pipeline](./build-pipeline.md) — Build process, image optimization, troubleshooting
- [Performance Optimizations](./performance-optimizations.md) — What changed in HTML/CSS/JS

**DevOps / Site Reliability**
- [Netlify Deployment](./netlify-deployment.md) — Production setup, go-live checklist, monitoring

**SEO / Content Team**
- [SEO](./seo.md) — Metadata, structured data, verification

**Product Managers**
- [Deferred Tasks](./deferred-tasks.md) — Future improvements, prioritization

### By Topic

| Document | Purpose |
|----------|---------|
| [changes-2026-06-04-ebook-fix-and-copy-updates.md](./changes-2026-06-04-ebook-fix-and-copy-updates.md) | Ebook 404 redirect, email template updates, navigation/copy rewrite, cal.com fallback hardening, pending ops |
| [build-pipeline.md](./build-pipeline.md) | How the automated build works, image optimization, troubleshooting |
| [performance-optimizations.md](./performance-optimizations.md) | Core Web Vitals, render-blocking elimination, results |
| [seo.md](./seo.md) | Open Graph, JSON-LD structured data, robots.txt, sitemap |
| [netlify-deployment.md](./netlify-deployment.md) | Deploy workflow, go-live checklist, production config |
| [deferred-tasks.md](./deferred-tasks.md) | Font self-hosting, CSP hardening, GDPR, future work |
| [email-integration.md](./email-integration.md) | Netlify Functions, Resend API, email validation |

## Key Improvements (2026-05-31)

### Build & Performance
- **HTML:** Minified to 31 KB (22% reduction)
- **Images:** AVIF/WebP variants reduce transfer size by 94-97%
- **Core Web Vitals:** LCP < 1.2s, INP < 200ms, CLS < 0.1
- **Lighthouse Score:** 90+ (Performance)

### SEO
- Comprehensive Open Graph metadata
- JSON-LD structured data (@graph pattern)
- Full favicon + PWA manifest
- FAQPage schema with 7 questions
- robots.txt + sitemap.xml

### Deployment
- Automated build pipeline (`npm run build`)
- Optimized dist/ directory with curated files
- Cache headers (immutable assets, revalidating HTML)
- Production CORS pinning

## Common Tasks

### Build for Production
```bash
npm run build
# Generates dist/ with minified HTML, optimized images, curated files
```

### Local Development
```bash
netlify dev
# Starts local server simulating Netlify environment (Functions + static site)
```

### Deploy to Production
```bash
git commit -am "feat: ..."
git push origin main
# Netlify webhook triggers, runs npm run build, deploys dist/
```

### Check Performance
```bash
# Deploy to preview branch
git checkout -b feature/test
git push origin feature/test

# Netlify creates preview URL
# Run Lighthouse on preview URL
# Check: LCP, INP, CLS, Performance Score
```

### Monitor Production
```
Netlify Dashboard → Site → Deploys tab
Netlify Dashboard → Functions → [Function name] → Logs
Google Search Console → Core Web Vitals
```

## Critical Checklist Items

Before going live to production, complete these (see [netlify-deployment.md](./netlify-deployment.md) for details):

- [ ] Primary domain set to apex (gastroup.cz)
- [ ] HTTPS + Force HTTPS enabled
- [ ] Disable legacy asset optimization (Netlify dashboard)
- [ ] Resend domain verified (notifications.gastroup.cz)
- [ ] Environment variables set (RESEND_API_KEY, etc.)
- [ ] Manual email test (contact form + ebook form)
- [ ] GDPR consent + privacy policy (LEGAL BLOCKER)

## Deferred / Future Work

See [deferred-tasks.md](./deferred-tasks.md) for:
- Font self-hosting (100-150 KB savings)
- CSP hardening (security improvement)
- Anti-bot protection (scale protection)
- GDPR compliance (legal requirement for EU)

## FAQ

**Q: Where do I edit the website?**
A: In `src/` — pages are assembled from partials at build time (see [src/README.md](../src/README.md)). Landing sections live in `src/sections/index/`, reusable buttons/banners in `src/components/`, CSS in `src/styles/`, JS in `src/js/`. After changes, run `npm run build` locally to test, then `git push origin main` to deploy.

**Q: How do I test locally?**
A: Run `npm run dev`, which builds `dist/` from `src/` and starts a local server at http://localhost:8888 simulating Netlify (including Functions). There is no watch mode — re-run `npm run build` after `src/` edits.

**Q: Why is my image not optimized?**
A: Run `npm run build` — WebP/AVIF variants are only created during build, not in source repo.

**Q: How do I change cache behavior?**
A: Edit netlify.toml headers section. Use rename-on-change policy for images (rename file when updating).

**Q: Can I use Google Fonts?**
A: Yes, they're currently loaded non-blocking via preload + onload swap. For self-hosting, see fonts/README.md.

**Q: What's the go-live checklist?**
A: See [netlify-deployment.md](./netlify-deployment.md) — 8 critical items (domain, HTTPS, Resend, environment vars, legal).

**Q: Why is CSP in Report-Only mode?**
A: To monitor violations in production before enforcing. After 1-2 weeks with no violations, promote to enforcing (rename header in netlify.toml).

## File Locations

**Documentation:**
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\docs\` — All documentation

**Configuration:**
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify.toml` — Netlify build, deploy, cache, headers
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\build.js` — Build script (minify, optimize images, copy files)
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\package.json` — Build scripts and dependencies

**Source:**
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\src\` — Modular page sources (pages, components, sections, styles, js)
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\scripts\assemble.js` — Build-time include engine
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify\functions\*.ts` — Email Functions

**Output (generated):**
- `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\dist\` — Production-ready files (created by `npm run build`)

## Get Help

**Build issues?**
- See [build-pipeline.md](./build-pipeline.md#troubleshooting)

**Deployment issues?**
- See [netlify-deployment.md](./netlify-deployment.md#troubleshooting)

**Performance questions?**
- See [performance-optimizations.md](./performance-optimizations.md#verification-checklist)

**SEO questions?**
- See [seo.md](./seo.md#search-engine-optimization-checklist)

**Email function issues?**
- See [email-integration.md](./email-integration.md)

## Last Updated

2026-06-04 — Ebook 404 fix, copy updates, cal.com fallback hardening

---

**Questions?** Check the relevant doc above, or contact the development team.
