# Meta obsah pro web (SEO + sdílení)

## Titulek stránky (Google search results)
**Doporučeno (≤60 znaků):**
`Gastro Parťák — chytrý poradce pro restaurace v mobilu | Měsíc zdarma`

**Alternativy:**
- `Gastro Parťák — AI rádce pro majitele restaurací | gastroup.cz`
- `Gastro Parťák — pomocník pro vaši restauraci | Měsíc zdarma`

---

## Meta description (Google search results)
**Doporučeno (≤155 znaků):**
`Personál odchází, Slevomat ujídá, peníze utíkají. Gastro Parťák je rádce v mobilu, kterému kdykoliv napíšete. Postavil ho člověk z gastronomie. Měsíc zdarma.`

**Alternativy:**
- `Chytrý poradce v mobilu, který pomůže vaší restauraci ušetřit přes 70 000 Kč měsíčně. Bez kreditní karty, bez závazku — první měsíc zdarma.`
- `Vařit umíte. S personálem, Slevomatem a papíry si nikdo neporadí sám. Vyzkoušejte Gastro Parťáka měsíc zdarma.`

---

## Open Graph (sdílení na Facebook, LinkedIn)

### og:title
`Vařit umíte. Ale s personálem, papíry a Slevomatem si nikdo neporadí sám.`

### og:description
`Gastro Parťák je chytrý poradce pro majitele restaurací, kterému napíšete z mobilu. Vyzkoušejte ho měsíc zdarma — bez platební karty.`

### og:image
`Assets/gastro parťák portrét - kruh.png` (případně lepší 1200×630 verze)

### og:url
`https://gastroup.cz`

### og:type
`website`

### og:locale
`cs_CZ`

---

## Twitter Card

### twitter:card
`summary_large_image`

### twitter:title
`Vařit umíte. Ale s personálem a Slevomatem si nikdo neporadí sám.`

### twitter:description
`Chytrý poradce pro majitele restaurací. Měsíc zdarma, bez platební karty.`

### twitter:image
`Assets/gastro parťák portrét - kruh.png`

---

## Klíčová slova (pro orientaci — Google už keywords meta tag nepoužívá)
- gastro parťák
- gastro up
- gastroup
- AI pro restaurace
- pomocník pro majitele restaurace
- jak řídit restauraci
- jak ušetřit v restauraci
- alternativa Slevomatu
- náklady na suroviny v restauraci
- školení personálu restaurace
- koučink pro restauratéry
- chytrý poradce restaurace

---

## Schema.org / strukturovaná data (doporučení pro vývoj)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Gastro Parťák",
  "operatingSystem": "Telegram (iOS, Android, Web)",
  "applicationCategory": "BusinessApplication",
  "offers": [
    {
      "@type": "Offer",
      "name": "Začátek",
      "price": "465",
      "priceCurrency": "CZK"
    },
    {
      "@type": "Offer",
      "name": "Systém",
      "price": "4650",
      "priceCurrency": "CZK"
    },
    {
      "@type": "Offer",
      "name": "Růst",
      "price": "11950",
      "priceCurrency": "CZK"
    }
  ],
  "description": "Chytrý poradce v mobilu pro majitele českých restaurací. Pomáhá s personálem, náklady na suroviny, marketingem a strategickým rozvojem podniku."
}
```
