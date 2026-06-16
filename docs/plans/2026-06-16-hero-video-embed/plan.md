# Plán: YouTube video sekce pod hero

**Datum:** 2026-06-16
**Cíl:** Vložit YouTube video (`https://youtu.be/3WdbP9qiSRc`, ID `3WdbP9qiSRc`) jako samostatnou sekci hned pod hero — centrované, v kontejneru, s eyebrow + nadpisem. Hero pill „Podívat se na video" přesměrovat na novou sekci.

## Rozhodnutí uživatele
- **Načítání:** Standardní YouTube iframe (youtube.com). *Pozn.: drop Google cookies při načtení → vyžaduje doplnění do výčtu zpracovatelů v zásadách ochrany os. údajů (compliance safeguard).*
- **Šířka:** V kontejneru (`.wrap`), centrované, zaoblené rohy + stín.
- **Nadpis:** Krátký eyebrow + nadpis (brand styl, jako ostatní sekce).
- **Hero odkaz:** Pill `.float-video` přesměrovat z `#situace` na `#video` (plynulý scroll je už globálně přes CSS).

## Architektura (zjištěno)
- Statický web skládaný z partials přes `scripts/assemble.js` → `dist/` (`node build.js`).
- Pořadí sekcí v `src/pages/index.html`: nav → hero → **vision** → …
- CSS se injectuje fixním seznamem `@include` v `<style>` bloku `index.html`.
- Smooth scroll + offset: `base.css` `html{scroll-behavior:smooth;scroll-padding-top:90px}` — funguje automaticky.
- Reveal animace: `.reveal` → `.visible` přes IntersectionObserver v `ui-core.js`; `.no-js .reveal{opacity:1}` fallback.
- Build integrity gates: žádné neresolvované `@include`/`{{param}}`, přítomnost cookie banneru a GA snippetu.

## Změny (soubory)

### 1. Nový partial — `src/sections/index/video.html`
Sekce `<section class="section-video reveal" id="video">` s `.wrap`, `.section-head` (eyebrow + h2) a responzivním 16:9 wrapperem obsahujícím YouTube `<iframe>`.
- `<iframe>` atributy: `src="https://www.youtube.com/embed/3WdbP9qiSRc"`, **explicitní `title`** (např. `title="GastroUp — Gastro Parťák (video)"`, WCAG 1.1.1), `loading="lazy"`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`, `referrerpolicy="strict-origin-when-cross-origin"`, `allowfullscreen`.
- Aspect ratio přes `aspect-ratio:16/9` wrapper (bez padding-hacku).

### 2. Styly — do `src/styles/sections-core.css` (NE nový soubor)
Review potvrdil: `sections-core.css` je catch-all pro section-level CSS (`.section`, `.section-head`, `.eyebrow`, `.vision-card`…). Pravidla připojit na konec — žádný nový soubor, žádná změna `@include` pořadí.
- `<section class="section section-video reveal" id="video">` → dědí responzivní padding cascade (120px → 80px → 64px) z `responsive.css` zadarmo.
- **Bez `background`** na sekci — dědí `--cream` (vizuálně oddělí border+stín samotného rámu, stejně jako hero↔vision přechod).
- `.video-frame{max-width:920px;margin:0 auto;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow-card);border:1px solid var(--line)}`
- `.video-frame iframe{width:100%;height:100%;border:0;display:block}`
- Tokeny potvrzeny: `--radius:22px`, `--shadow-card`, `--line:rgba(6,38,76,.12)`. `aspect-ratio:16/9` je bezpečné (žádný padding-hack).

### 3. `src/pages/index.html`
- Přidat `<!-- @include sections/index/video.html -->` mezi hero a vision (řádek 30). (CSS bez zásahu — viz bod 2.)

### 4. `src/sections/index/hero.html`
- Změnit `<a href="#situace" class="float-video">` → `href="#video"`.

### 5. `src/pages/ochrana-osobnich-udaju.html` (compliance — POVINNÉ, ne volitelné)
Standardní youtube.com iframe nastaví Google cookies (_ga, NID, CONSENT…) už při načtení, mimo cookie lištu. Právní základ: čl. 6(1)(f) oprávněný zájem + plná transparentnost. Nutno:
- **Výčet zpracovatelů:** doplnit „Google (YouTube)" s účelem (vložené video) + odkazy na YouTube/Google Privacy Policy (analogicky k FAPI+Stripe).
- **Tabulka cookies:** přidat řádek pro YouTube/Google cookies (3rd-party, na youtube.com doméně).
- *(Volitelné UX)* drobná poznámka pod videem: „Vložené YouTube video používá cookies — viz zásady".

### 6. Build + ověření
- `node build.js` → musí projít integrity gates.
- Ověřit, že `dist/index.html` obsahuje iframe a `#video` sekci, a že hero pill míří na `#video`.

## Responzivita & a11y
- Mobile: `.video-frame` plná šířka kontejneru, zachované 16:9.
- `iframe title` pro screen readery.
- `prefers-reduced-motion`: reveal už respektováno globálně; iframe autoplay se nespouští (žádný `autoplay=1`).
