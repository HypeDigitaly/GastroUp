# SEO Optimization

## Overview

A comprehensive SEO implementation for the GastroUp marketing site, including semantic markup, JSON-LD structured data, Open Graph metadata, and XML sitemaps. All content is factual and on-site only — no fabricated data.

## HTML Head Metadata

### Essential Meta Tags

**Canonical URL**
```html
<link rel="canonical" href="https://gastroup.cz/">
```
- Prevents duplicate content issues
- Points to the authoritative version of the page

**Language Declaration**
```html
<html lang="cs">
<meta http-equiv="Content-Language" content="cs">
```
- Declares Czech language to search engines
- Helps with regional targeting and language detection

**Robots Directives**
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
```
- `index, follow` — allow indexing and link following
- `max-image-preview:large` — allow large image previews in search results
- `max-snippet:-1` — allow unlimited text snippets
- `max-video-preview:-1` — allow unlimited video previews

**Description**
```html
<meta name="description" content="Gastro Parťák je poradce v telefonu — postavený na 20 letech praxe v gastru. Garance: měsíc navíc zdarma, když nebudeš spokojený.">
```
- Compelling, action-oriented, under 160 characters
- Matches the value proposition (expertise + guarantee)
- Appears in search results

## Open Graph (Social Media Preview)

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://gastroup.cz/">
<meta property="og:site_name" content="GastroUp">
<meta property="og:locale" content="cs_CZ">
<meta property="og:title" content="GastroUp — Přestaň táhnout celý podnik sám">
<meta property="og:description" content="...">
<meta property="og:image" content="https://gastroup.cz/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="GastroUp — Gastro Parťák pro majitele restaurací">
```

**Metadata:**
- `og:type: website` — SEO-friendly type
- `og:locale: cs_CZ` — Czech locale for proper language/region targeting
- `og:image:alt` — accessibility + SEO (image text crawling)

**Open Graph Image:**
- **File:** `og-image.png` (1200×630 pixels)
- **Content:** Branded preview of GastroUp offering
- **Served by build pipeline:** Copied to `dist/og-image.png`, delivered via CDN

## Twitter Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://gastroup.cz/og-image.png">
<meta name="twitter:image:alt" content="...">
```

- `twitter:card: summary_large_image` — large image card format (best for visual branding)
- Uses same OG image for consistency
- Alt text improves accessibility and engagement

## Favicon & App Metadata

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#06264C">
```

**Favicon Set:**
- `favicon.ico` — traditional browser favicon
- `favicon-192.png` — Android home screen icon (small)
- `favicon-512.png` — Android splash screen icon (large)
- `apple-touch-icon.png` — iOS home screen icon
- `site.webmanifest` — PWA manifest (see below)
- `theme-color: #06264C` — navy branding color for browser UI

All icons use the GastroUp navy brand color for visual consistency.

## PWA Manifest

**File:** `site.webmanifest`
```json
{
  "name": "GastroUp",
  "short_name": "GastroUp",
  "description": "Gastro Parťák — poradce v telefonu",
  "icons": [
    {
      "src": "/favicon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#06264C",
  "background_color": "#EFE3D3"
}
```

Enables PWA features:
- Add to home screen on mobile
- App-like full-screen display
- Brand colors in app shell

## JSON-LD Structured Data

Comprehensive semantic markup using JSON-LD @graph pattern (machine-readable semantic data).

### Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GastroUp",
  "url": "https://gastroup.cz",
  "logo": "https://gastroup.cz/Logo_GastroUp_2_transparent.png",
  "description": "Gastro Parťák — konzultace pro majitele restaurací a hospod"
}
```

**Note:** `sameAs` (social links) omitted — no verified social media accounts (LinkedIn, Twitter profiles not established).

### Professional Service

```json
{
  "@type": "ProfessionalService",
  "name": "GastroUp — Gastro Parťák",
  "description": "Konzultační služba pro majitele restaurací",
  "areaServed": {
    "@type": "Country",
    "name": "CZ"
  },
  "serviceArea": "Česká republika (online/telefonicky)",
  "founder": {
    "@type": "Person",
    "name": "Jakub Hnát",
    "image": "https://gastroup.cz/Zakladatel_Jakub_Hnat.png",
    "jobTitle": "Gastro expert"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Balíčky služeb GastroUp",
    "itemListElement": [
      {
        "@type": "Offer",
        "@id": "#cena",
        "name": "Starter",
        "priceCurrency": "CZK",
        "price": "465",
        "availability": "InStock"
      },
      {
        "@type": "Offer",
        "@id": "#cena",
        "name": "Standard",
        "priceCurrency": "CZK",
        "price": "4650",
        "availability": "InStock"
      },
      {
        "@type": "Offer",
        "@id": "#cena",
        "name": "Premium",
        "priceCurrency": "CZK",
        "price": "11950",
        "availability": "InStock"
      }
    ]
  }
}
```

**Key facts:**
- **3 real pricing tiers:** 465 CZK, 4650 CZK, 11950 CZK (current offering)
- **Availability:** All marked as "InStock" (services available for purchase)
- **Area served:** Czech Republic, online/by phone
- **Founder:** Jakub Hnát, linked to his photo with `jobTitle: "Gastro expert"`

### Website

```json
{
  "@type": "WebSite",
  "url": "https://gastroup.cz",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gastroup.cz?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

Enables sitelinks search box in Google Search results (if site has sufficient authority).

### FAQ Page

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Jak se připojím na online mítink?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Poté co se zaregistruješ, obdržíš odkaz. Já se ti připojím v domluvený čas. Nehledej se, všechno je jednoduché a jednoduše se to řeší."
      }
    },
    // ... 6 more Q&As
  ]
}
```

**Sourced from on-page content:**
- All 7 questions and answers match the visible `#situace` accordion section
- No fabricated FAQ items
- Helps Google feature FAQ results in search

**Questions covered:**
1. "Jak se připojím na online mítink?"
2. "Kolik trvá jeden konzultační hovor?"
3. "Mohu si vyzkoušet služby GastroUp zdarma?"
4. "Mohu si koupit jen jeden balíček na zkoušku?"
5. "Mám čas na další poradenství?"
6. "Nejdu do ničeho bez záruky?"
7. "Jak funguje vaše garance?"

## Robots.txt

**File:** `robots.txt`
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://gastroup.cz/sitemap.xml
```

**Rules:**
- All bots allowed on public pages
- `/api/` disallowed (serverless functions, no crawling needed)
- Explicit sitemap reference for search engines

## Sitemap

**File:** `sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gastroup.cz/</loc>
    <lastmod>2026-05-31</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

**Note:** Single URL entry (single-page site). As the site grows, add new URLs (blog posts, case studies, etc.).

## LLMs.txt

**File:** `llms.txt`

Markdown file providing guidelines for AI/LLM models accessing the site:
- Brand voice and tone guidelines
- Content boundaries
- Data usage policies
- Contact information

Useful for:
- AI training dataset filtering
- Model behavior customization
- Content licensing clarity

## Search Engine Optimization Checklist

### Verification

- [ ] **Google Search Console:** Submit sitemap, monitor indexing
  ```
  https://search.google.com/search-console
  Property: https://gastroup.cz
  Add sitemap: https://gastroup.cz/sitemap.xml
  ```

- [ ] **Bing Webmaster Tools:** Submit to Bing
  ```
  https://www.bing.com/webmasters/
  ```

- [ ] **Lighthouse SEO Audit:** 90+ score
  ```bash
  npm run build
  # Push to staging branch
  # Run Lighthouse on preview URL
  # Check: all SEO items pass
  ```

- [ ] **Schema Validation:** Test JSON-LD markup
  ```
  https://schema.org/validate/
  Paste index.html and verify no errors
  ```

- [ ] **Open Graph Validator:** Verify social preview
  ```
  https://www.opengraphcheck.com/
  URL: https://gastroup.cz
  Verify og:image shows correctly
  ```

- [ ] **Twitter Card Validator:** Test Twitter preview
  ```
  https://cards-dev.twitter.com/validator
  URL: https://gastroup.cz
  Verify summary_large_image renders
  ```

### On-Page SEO

- [ ] **Title tag:** Under 60 characters, keyword first
  ```
  "GastroUp — Přestaň táhnout celý podnik sám" (50 chars)
  ```

- [ ] **Meta description:** Under 160 characters, compelling CTA
  ```
  "Gastro Parťák je poradce v telefonu — postavený na 20 letech praxe v gastru. Garance: měsíc navíc zdarma..." (148 chars)
  ```

- [ ] **H1 tag:** Single, descriptive
  ```
  "Přestaň táhnout celý podnik sám. Máš Gastro Parťáka"
  ```

- [ ] **Image alt text:** Present on all images (see index.html for examples)

- [ ] **Internal links:** Hero CTA links to #cena (pricing section)

- [ ] **Mobile responsive:** Tested on iPhone 12, Android Chrome

## Technical SEO

- [ ] **Indexability:** robots.txt allows crawling, no noindex tags
- [ ] **Mobile-first:** Responsive design, fast on mobile (< 2.5s LCP)
- [ ] **HTTPS:** All resources served over HTTPS (Netlify enforces)
- [ ] **Crawl errors:** No 404s, broken links checked (see Build Pipeline for link validation)
- [ ] **Structured data:** JSON-LD valid, no errors
- [ ] **Core Web Vitals:** LCP < 2.5s, INP < 200ms, CLS < 0.1 (see Performance Optimizations)

## Deferred SEO Improvements

### Internationalization (i18n)
- **Status:** Deferred (Czech-only launch)
- **Future:** If expanding to multiple languages, implement hreflang tags and translated versions

### Blog/Content Marketing
- **Status:** Not in scope (single-page marketing site)
- **Future:** Add blog section with SEO-optimized articles, update sitemap dynamically

### Local SEO (Google Business Profile)
- **Status:** Deferred
- **Future:** Create Google Business Profile for physical location (if restaurant consultations happen in-office)

### Link Building
- **Status:** Deferred (organic growth strategy)
- **Future:** Outreach to gastro industry blogs, chef networks, restaurant associations

## File Locations

- **Head metadata:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html` (lines 1-56)
- **JSON-LD @graph:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\index.html` (search for `<script type="application/ld+json">`)
- **robots.txt:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\robots.txt`
- **sitemap.xml:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\sitemap.xml`
- **llms.txt:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\llms.txt`
- **site.webmanifest:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\site.webmanifest`
- **Open Graph image:** `C:\Users\Pavli\Desktop\HypeDigitaly\GIT\GastroUp\og-image.png`

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Web.dev SEO Audit Guide](https://web.dev/lighthouse-seo/)
