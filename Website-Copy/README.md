# Gastro Parťák — Website Copy

Kompletní copy pro landing page **gastroup.cz** ve spisovné češtině pro netechnické majitele restaurací.

> **Hlavní cíl stránky:** Návštěvník spustí měsíc zdarma (bez platební karty, bez závazku).
> **Struktura:** Zrcadlí referenční landing page Sense (9 sekcí).

---

## 📁 Struktura souborů

```
Website-Copy/
├── README.md                          ← jste zde
├── website-copy-full.md               ← celý copy v jednom souboru
├── meta.md                            ← SEO titulky, popisy, Open Graph
├── slovnik-a-tonalita.md              ← pravidla psaní (spisovná čeština, vykání)
└── sections/                          ← jednotlivé sekce po jednom souboru
    ├── 01-nav.md                      ← top navigace
    ├── 02-hero.md                     ← hero (headline + 2 CTAs + vizuál)
    ├── 03-tri-okruhy.md               ← 3 karty s hlavními oblastmi
    ├── 04-statistiky.md               ← 4 čísla v řadě
    ├── 05-sedm-situaci.md             ← levá karta + accordion s 7 pain pointy
    ├── 06-cena.md                     ← 3 tarify (Systém zvýrazněný)
    ├── 07-co-resi.md                  ← dark showcase se 4 dlaždicemi
    ├── 08-formular-a-o-zakladateli.md ← contact form + about Jakub
    └── 09-footer.md                   ← patička webu
```

---

## 📐 Pořadí sekcí podle reference (Sense layout)

| # | Sekce | Sense ekvivalent | Cíl |
|---|---|---|---|
| 01 | **Top navigace** | Sticky header | Logo, menu, hlavní CTA stále viditelné |
| 02 | **HERO** | „Sense for a brighter future" | Hlavní hodnota + 2 CTAs + vizuál |
| 03 | **3 okruhy** | „Join our Impact Training Program" | Tři karty s hlavními oblastmi pomoci |
| 04 | **Statistiky** | „12 / 500+ / 50+ / Free" | 4 čísla v řadě s krátkými popisky |
| 05 | **7 situací** | „Master impactful giving" | Levá karta (zdarma trial) + accordion |
| 06 | **Cena** | „Choose Your Impact Level" | 3 tarify, prostřední zvýrazněný |
| 07 | **Co řeší (dark)** | „Transforming communities" | Tmavá sekce, 4 případy |
| 08 | **Form + About** | „Ready to create impact?" | Formulář + představení zakladatele |
| 09 | **Footer** | Patička | Logo, newsletter, odkazy, social |

---

## 🎯 Jak copy použít

### 1. Pro rychlý přehled a předání designerovi / vývojářovi
Použijte **`website-copy-full.md`** — obsahuje celou landing page v pořadí, ve kterém se má objevit na webu.

### 2. Pro stavbu webu (sekce po sekci)
Použijte soubory v **`sections/`** — každá sekce v samostatném souboru, snadné kopírování do CMS / komponent.

### 3. Pro SEO a sdílení
Použijte **`meta.md`** — titulek stránky, meta description, Open Graph tagy, schema.org.

### 4. Pro budoucí texty (blog, e-maily, kampaně)
Použijte **`slovnik-a-tonalita.md`** — pravidla, která zajistí konzistentní spisovný jazyk napříč veškerou komunikací.

---

## 🎨 Vizuální identita

### Barvy
- **Krémová (pozadí):** `#EFE3D3`
- **Hořčicová (zvýraznění, primární tlačítka, čísla):** `#CC972D`
- **Tmavě modrá (text, dark sekce):** `#06264C`

(Originální assety: `../3 barvy pro web.png`)

### Použitelné obrazové assety
- `../Assets/Gastro Parťák portrét.png` — hlavní portrét
- `../Assets/gastro parťák portrét - kruh.png` — kruhová varianta
- `../Assets/gastrupvideo-final.mp4` — video pro hero nebo „jak to funguje"
- `../Assets/porovnání GP vs. Slevomat vs. katalog - Jakub H..png` — tabulkové porovnání (volitelně do dlaždice v dark sekci)

---

## ✅ Klíčové principy copy

1. **Spisovná čeština, vykání.** Bez slangu, bez nespisovných koncovek (-ej, -ýho). Pouze citace v uvozovkách mohou být mírně hovorovější.
2. **Měsíc zdarma je všude.** Hlavní CTA opakované 5+ krát, vždy stejnými slovy.
3. **Žádná technická slova bez vysvětlení.** AI → chytrý poradce. Telegram → aplikace jako WhatsApp.
4. **Příklady místo konceptů.** Místo *„personalizované koučování"* → *„napíšete mu: utekl mi kuchař, co teď?"*.
5. **Empatie před prodejem.** Sekce 5 (sedm situací) nejde rovnou na „kup", ale ukazuje, že rozumíme.

---

## 🚦 Co před spuštěním ověřit

- [ ] Všechna CTA vedou na funkční registraci na měsíc zdarma
- [ ] Telegram odkaz / instrukce funguje a vede přímo k Parťákovi
- [ ] Mobilní zobrazení — cílovka prohlíží z mobilu mezi směnami
- [ ] Accordion v sekci 5 funguje a defaultně je sbalený (otevřená pouze první položka)
- [ ] Obrázky optimalizované (rychlé načítání)
- [ ] Pixel / analytika pro měření konverze měsíce zdarma
- [ ] GDPR / cookie lišta v češtině
- [ ] Schema.org strukturovaná data (viz `meta.md`)

---

## 📝 Historie verzí

- **v4 (aktuální)** — Spisovná čeština + vykání + struktura podle Sense reference (9 sekcí)
- v3 — Hovorová čeština, srozumitelné netechnickému majiteli (10 sekcí)
- v2 — Pain-first restrukturalizace, marketingový jazyk
- v1 — První návrh, positioning-first, formálnější

---

## 📞 Kontakt pro úpravy
Pavel Černý, HypeDigitaly — `pavelcermak@hypedigitaly.ai`
