# Legal Pages Documentation

GastroUp maintains two Czech legal compliance pages: **Obchodní podmínky** (Terms of Service) and **Ochrana osobních údajů** (Privacy Policy). Both pages are implemented as static HTML with Consent Mode v2 banner integration, published 2026-06-04.

## Overview

| Page | URL | File | Status | Effective | Last Updated |
|------|-----|------|--------|-----------|--------------|
| **Obchodní podmínky** (T&C) | `https://gastroup.cz/obchodni-podminky` | `obchodni-podminky.html` | Live | 2026-01-02 | 2026-06-04 |
| **Ochrana osobních údajů** (Privacy) | `https://gastroup.cz/ochrana-osobnich-udaju` | `ochrana-osobnich-udaju.html` | Live | 2026-01-02 | 2026-06-04 |

**Data Controller:** Monanivude s.r.o. (IČ: 21341486)

## Obchodní podmínky (Terms of Service)

### Content Structure

File: `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\obchodni-podminky.html`

**Legislation Source:** Client-provided PDF (Monanivude s.r.o. T&C template, dated 2026-01-02)

**Contains:**
- 10 main articles (I–X):
  - I. Vymezení účastníků (parties)
  - II. Vymezení služeb (services)
  - III. Řád nákupu a prodeje (purchase terms)
  - IV. Cena a platební podmínky (pricing)
  - V. Doručení a podání (delivery)
  - VI. Odpovědnost za vady (liability)
  - VII. Práva spotřebitele (consumer rights)
  - VIII. Ochrana osobních údajů (privacy notice)
  - IX. Řešení sporů a reklamací (dispute resolution)
  - X. Závěrečná a přechodná ustanovení (misc)
- **Příloha č. 1:** Vzorový formulář pro odstoupení (model withdrawal form per nařízení vlády č. 363/2013 Sb. — statutory requirement)

### Source of Truth

1. **Primary source:** Client-provided `vop-extracted.md` (extracted from PDF on 2026-06-04)
2. **Backup:** `docs/legal-source/vop-extracted.md` (build-excluded, for reference)

### Corrections & Amendments vs Source PDF

| Issue | Found In | Correction | Reason |
|-------|----------|-----------|--------|
| Domain reference | Article II, footer | `podnikanizplaze.cz` → `gastroup.cz` | Client product domain; source PDF had wrong domain |
| EU-ODR link | Article IX (dispute resolution) | Removed dead link to platform.ec.europa.eu | EU ODR platform discontinued 2025; replaced with ČOI reference + statutory Czech ADR contacts |
| Privacy cross-link | Article VIII | Added link to full `/ochrana-osobnich-udaju` page | Article VIII originally placeholder; now links to live privacy policy |
| Withdrawal form | Příloha č. 1 | Authored from statutory model (nař. vl. 363/2013 Sb.) | PDF did not include annex; created compliant model form per Czech law |

### Technical Implementation

**HTML Template Elements:**
- `<h1>Obchodní podmínky</h1>` — page title
- `<article>` tags wrapping each section
- `<h2>` for each article heading (I–X)
- Responsive table for withdrawal form (`<table>` with `<thead>`/`<tbody>`)
- GA4 banner + consent flow (same as privacy page)
- Footer with "Nastavení cookies" link (aria-current pattern)

**Analytics & Consent:**
- GA4 `G-VR866S5JF5` configured (default-denied)
- Banner microcopy: "Vaše údaje neprodáváme ani nesdílíme pro marketingové účely třetích stran." (updated 2026-06-04)
- `<meta name="robots" content="noindex,follow">` — indexed in search, but not sitemapped as priority page

**Build Integration:**
- `build.js` COPY_FILES: `obchodni-podminky.html` copied to `dist/obchodni-podminky.html`
- `sitemap.xml`: URL entry with lastmod `2026-06-04`
- `netlify.toml`: Cache-Control header (max-age: 3600, must-revalidate)

### Update Workflow (Future Changes)

To update T&C text in the future:

1. **Get updated PDF from client**
2. **Extract text** to `docs/legal-source/vop-extracted.md` (new version, marked with date)
3. **Compare changes** against current `obchodni-podminky.html` using diff tool
4. **Identify client updates:** Articles, pricing, company details, effective date
5. **Apply corrections** to domain refs, statutory links, privacy cross-links (as per table above)
6. **Update effective date** in HTML: `<p class="legal-header">Účinné od: <time>YYYY-MM-DD</time></p>`
7. **Update last modified date:** `<p>Poslední aktualizace: <time>YYYY-MM-DD</time></p>`
8. **Rebuild & deploy:** `npm run build && git push origin main` (Netlify auto-deploys)
9. **Verify deployment:** Visit `https://gastroup.cz/obchodni-podminky` and spot-check sections

## Ochrana osobních údajů (Privacy Policy)

### Content Structure

File: `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\ochrana-osobnich-udaju.html`

**Legislation Source:** GDPR Article 13 compliant template, filled with client data (Monanivude s.r.o.)

**Key Sections:**
- **Správce dat (Controller):** Monanivude s.r.o., IČ: 21341486, registered address, contact email
- **Právní základ:** Article 6(1)(a) GDPR (user consent via cookie banner)
- **Účel zpracování:** Analytics (page views, user engagement, conversion tracking), email delivery (transactional), lead capture
- **Kategorie dat:** Name, email, phone, page views, device/browser info, IP address
- **Zpracovatelé (Processors):** Resend (email), Google LLC (Analytics), Netlify (hosting), Cal.com (calendar)
- **Mezinárodní přenosy:** Data Protection Framework (DPF) for US transfers; Standard Contractual Clauses (SCCs) where applicable
- **Retenční lhůty:** GA4 14 měsíců, e-book sign-up +3 roky, formuláře +3 roky, daňové doklady 10 let, budoucí newsletter 5 let
- **Práva subjektu:** Access (Art. 15), correction (Art. 16), erasure (Art. 17), portability (Art. 20); processing right (Art. 21); complaints to Czech DPA (ÚOOÚ)
- **Cookies:** Consent-based per § 89 odst. 3 zák. č. 127/2005 Sb. (ePrivacy Act) + Article 6(1)(a) GDPR

### Changes from Source Template (2026-06-04)

| Placeholder | Original | Filled Value | Source |
|-------------|----------|--------------|--------|
| [SPRÁVCE] | empty | Monanivude s.r.o., IČ: 21341486 | Client attestation A1 |
| [IČO] | empty | 21341486 | Client registration docs |
| [SÍDLO] | empty | Registered address (per client) | Client attestation A1 |
| [EMAIL_CONTROLLER] | empty | contact@gastroup.cz (TBD in attestation) | Attestation A7 |
| [EMAIL_DPA] | empty | mailto: (Czech DPA ÚOOÚ links) | Statutory reference |
| [PROCESORY] | placeholder list | Resend, Google LLC, Netlify, Cal.com | Actual integrations |
| [TRANSFER_BASIS] | generic | DPF/SCC per processor (Google: US transfers under DPF) | Google privacy policy cross-ref |
| [RETENCE] | generic | GA4 14 měsíců, e-book +3r, forms +3r, tax 10y, newsletter 5y | Business + legal requirements |
| [COOKIES_BASIS] | generic | § 89 odst. 3 zák. č. 127/2005 Sb. + Art. 6(1)(a) GDPR | Czech/EU law |
| Data Controller CHANGED | HypeDigitaly s.r.o. | Monanivude s.r.o. | Client directive 2026-06-04 |

### Technical Implementation

**HTML Template Elements:**
- Full GDPR Article 13 structure per Czech template
- Sections marked with timestamps: "Účinné od: 2.1.2026" and "Poslední aktualizace: 4.6.2026"
- Expandable sections (HTML `<details>` tags) for processors, retention, rights
- Cross-links to `/obchodni-podminky` (Article VIII notice)
- GA4 banner + consent flow
- Footer with "Nastavení cookies" link

**Analytics & Consent:**
- Same GA4 config as T&C page
- Banner microcopy matches T&C
- `noindex,follow` robots meta (indexed but not priority)

**Build Integration:**
- No build.js copy (static file in root)
- `sitemap.xml`: URL entry with lastmod `2026-06-04`
- `netlify.toml`: Cache-Control header (max-age: 3600, must-revalidate)

### Update Workflow (Future Changes)

To update privacy policy text:

1. **Identify trigger:** Data processor change, retention policy update, legal basis change, regulatory requirement
2. **Update relevant section** in `ochrana-osobnich-udaju.html` (keep Czech terms)
3. **Update "Poslední aktualizace"** timestamp to current date
4. **Cross-reference changes** in corresponding T&C sections (if applicable, e.g., processor changes)
5. **Review with legal counsel** (mandatory for GDPR compliance changes)
6. **Rebuild & deploy:** `npm run build && git push origin main`
7. **Monitor GA4** for consent metric changes

## Pre-Deployment Attestation Checklist (A1–A7)

**Status:** PENDING — All items must be verified by client before production deploy.

### A1: Company Registration & Controller Details
- [ ] Company name: Monanivude s.r.o. (verify matches business registration)
- [ ] IČ (ID): 21341486 (cross-check with ÚS.cz public register)
- [ ] Registered address: [CONFIRM] (used in privacy policy)
- [ ] Contact email for GDPR requests: [CONFIRM] (Article 13 disclosure)

**Files affected:** `ochrana-osobnich-udaju.html` (lines with controller details)

### A2: Products & Pricing in T&C
- [ ] Article II (Vymezení služeb): All products/services match live offer
- [ ] Article IV (Cena): Pricing section aligns with current pricing page (#cena section)
- [ ] No phantom products listed (e.g., "Život v hojnosti" course if not sold)

**Verification:** Compare T&C Article II/IV text against index.html `#cena` section; ensure product names match exactly.

**Files affected:** `obchodni-podminky.html` (Articles II, IV)

### A3: Payment Chain (FAPI → Stripe)
- [x] FAPI form.fapi.cz integration confirmed live
- [x] Stripe backend verified as payment processor
- [ ] T&C Article IV mentions payment security/PCI compliance
- [x] Privacy policy discloses Stripe as processor (if collecting payment data) — **FAPI + Stripe now disclosed in processor list (2026-06-04)**

**Verification:** Submit test order via FAPI form; confirm Stripe webhook logs; verify payment chain is FAPI form (form.fapi.cz) → FAPI backend (fapi.cz) → Stripe (stripe.com).

**Attestation Status:** Client confirms FAPI→Stripe routing is the actual payment chain; both services now disclosed in privacy processor list.

**Files affected:** `obchodni-podminky.html` (Article IV), `ochrana-osobnich-udaju.html` (processor section — updated 2026-06-04)

### A4: Physical Goods & Delivery (Zásilkovna)
- [ ] If selling physical products: Zásilkovna integration mentioned in T&C Article V
- [ ] Tracking & returns policy documented
- [ ] Privacy policy discloses delivery partner data processing

**Verification:** Check if index.html mentions "fyzické zboží" or "doručení"; if yes, confirm T&C Article V and privacy policy address logistics.

**Files affected:** `obchodni-podminky.html` (Article V), `ochrana-osobnich-udaju.html` (processor list)

### A5: Facebook Community & Article II.1
- [ ] "Součástí služby je ... přístup do Facebook podpůrné skupiny" (Article II.1) — verify community exists
- [ ] Community moderation & member privacy rules documented (in T&C or separate)
- [ ] Privacy policy discloses Facebook data sharing (if applicable)

**Verification:** Confirm Facebook group exists and is active; clarify if data collected in group is processed by Monanivude or Facebook only.

**Files affected:** `obchodni-podminky.html` (Article II.1)

### A6: Product Names & Course Correctness
- [ ] "Gastro Mentor AI" — verify live product name matches T&C usage
- [ ] No references to phantom courses (e.g., "Život v hojnosti" if not sold)
- [ ] All service names in Article II match marketing site terminology

**Verification:** Search `obchodni-podminky.html` for exact product names; cross-check against index.html main copy.

**Files affected:** `obchodni-podminky.html` (Article II)

### A7: Contact & Support Details
- [ ] Customer support email confirmed (for complaints, Article IX)
- [ ] GDPR data subject requests email confirmed (Article 15–17 rights)
- [ ] Both emails filled in privacy policy

**Verification:** Contact email should be reachable for test data requests.

**Files affected:** `ochrana-osobnich-udaju.html` (controller contact section, GDPR rights section)

## Test Coverage

**Consent Flow Tests:** `test-consent.cjs` (31 tests total, passing)

Tests include:
- Scenario 1: First visit + Accept (7 tests: banner visibility, gtag load, consent storage, GA cookies, data persistence)
- Scenario 2: First visit + Decline (4 tests: banner visibility, localStorage, GA cookies, persistence)
- Scenario 3: 404, privacy, T&C pages (9 tests: 3 pages × 3 tests each: banner visibility, gtag load, consent acceptance)
- Scenario 6: T&C page + accept + reopen via footer (2 tests: accept flow, footer link reopens banner)
- Additional tests: localStorage clear on reopen, banner persistence, client_id generation, CSP checks

**Pages covered:** `index.html`, `404.html`, `ochrana-osobnich-udaju.html`, `obchodni-podminky.html`

## Footer Navigation

All legal pages are wired to footer "Nastavení cookies" link and T&C link:

**Current footer links:**
- `index.html`: "Obchodní podmínky" href updated from `#` to `/obchodni-podminky` (2026-06-04)
- `404.html`: Added "Nastavení cookies" reopen link (class `.gp-cookie-settings`)
- `ochrana-osobnich-udaju.html`: Footer wired to T&C (aria-current pattern preserved)
- `obchodni-podminky.html`: Footer wired to privacy page

**aria-current pattern:** Links preserve accessibility semantics; current page link uses `aria-current="page"`.

## File Locations & Build Integration

| File | Path | Purpose | Build Step |
|------|------|---------|-----------|
| T&C source | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\obchodni-podminky.html` | Live page | Copied by build.js to dist/ |
| Privacy source | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\ochrana-osobnich-udaju.html` | Live page | Static (root) |
| VOP extraction | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\docs\legal-source\vop-extracted.md` | Reference (build-excluded) | None (docs only) |
| Privacy extraction | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\docs\legal-source\privacy-extracted.md` | Reference (build-excluded) | None (docs only) |
| sitemap.xml | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\sitemap.xml` | SEO | Updated with lastmod 2026-06-04 |
| netlify.toml | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\netlify.toml` | Cache headers | Cache-Control added for legal pages |
| test-consent.cjs | `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\test-consent.cjs` | Functional tests | 31 tests, including T&C scenarios |

## Related Documentation

- **Analytics & Consent:** `docs/analytics-consent.md` — GA4 setup, banner implementation, CSP, testing
- **Deferred Tasks:** `docs/deferred-tasks.md` — A1–A7 attestation tracking, form consent checkbox rationale
- **Email Integration:** `docs/email-integration.md` — GDPR & email compliance, processor details
- **Legal source extractions:** `docs/legal-source/` (build-excluded)

## Deployment Readiness

**Current Status:** Code ready; **waiting for client A1–A7 attestation before prod deploy**

**Manual verification required:**
1. A1–A7 attestation signed off by client (legal team or authorized business contact)
2. Product/pricing sync check (T&C vs live site)
3. Processor list verification (Resend, Google, Netlify, Cal.com status)
4. FAPI payment chain confirmation
5. Physical goods & logistics policy (if applicable)
6. Social media community & data processing (if applicable)
7. Support contact details finalized

**Post-attestation steps:**
1. Final legal review (optional, recommended for CZ/EU compliance)
2. Deploy to production
3. Monitor GA4 consent metrics (should stabilize after 1 week)
4. Archive attestation document for audit trail (retain 7+ years per GDPR Art. 31)

---

**Last updated:** 2026-06-04 | **Status:** Code complete, awaiting client attestation | **Next action:** Collect A1–A7 verification from client
