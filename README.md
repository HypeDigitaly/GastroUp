# GastroUp

GastroUp is a marketing website for restaurant/hospitality industry clients. It combines a static HTML/CSS/JS frontend with Netlify Functions for serverless email delivery via Resend API, enabling transactional emails (contact form, ebook delivery, lead notifications) without managing servers.

## Tech Stack

- **Frontend**: Static HTML/CSS/JavaScript (no build step required)
- **Serverless**: TypeScript Netlify Functions (Node.js 20 runtime)
- **Email**: Resend REST API for transactional emails
- **Hosting**: Netlify (static site + Functions)

## Local Development

Install Netlify CLI and dependencies:

```bash
npm install -g netlify-cli
npm install
netlify link            # Link to Netlify site (one-time setup)
netlify env:pull        # Pull environment variables from Netlify into .env
netlify dev             # Start local dev server at http://localhost:8888
```

The `netlify dev` command starts a local server simulating the Netlify environment, including Functions. Submit forms to test locally.

## Environment Variables

All variables are **runtime-only** (set in Netlify UI under **Site settings > Environment variables**, scope: **Functions only**). They are not available at build time.

| Name | Required | Description | Default |
|------|----------|-------------|---------|
| `RESEND_API_KEY` | Yes | Resend API key for GastroUp (scope: "Sending access" only, domain: `notifications.gastroup.cz`). **Dedicated key, not shared with other projects.** | — |
| `NOTIFICATION_TO` | Yes | Email address for team notifications (received when users submit forms) | `pavelcermak@hypedigitaly.ai` |
| `FROM_EMAIL` | Yes | Sender email address used in all outbound emails | `GastroUp <noreply@notifications.gastroup.cz>` |
| `EBOOK_PDF_URL` | Yes | Public URL to ebook PDF for download. Use dummy URL during development. | `https://gastroup.cz/ebook/28-tipu.pdf` |
| `CTA_URL` | Yes | Call-to-action redirect URL (e.g., form for lead capture) | `https://form.fapi.cz/?id=4a82141f-d02b-489d-93b0-66f81a8cec6a` |
| `ALLOWED_ORIGIN` | Yes | CORS origin allowed to call Functions. Use `*` during dev, **must be `https://gastroup.cz` in production.** | `*` (dev only) |

## Deployment

GastroUp automatically deploys to Netlify when changes are pushed to the `main` branch:

- **Build command**: `npm install` (defined in `netlify.toml`)
- **Publish directory**: `.` (repository root)
- **Functions directory**: `netlify/functions`

No manual build step is required for the frontend. Netlify bundles and deploys TypeScript Functions automatically.

## Pre-Launch Checklist

**⚠️ CRITICAL: All items must be completed before going live to production.**

- [ ] **Resend dedicated API key created** — Log in to resend.com dashboard, create a new API key with scope "Sending access" only for domain `notifications.gastroup.cz`. Name it `gastroup-netlify-prod`. **Do not share this key with hypedigitaly-web-2 or other projects** (separate blast radius for security).

- [ ] **Resend domain DNS verified** — Add `notifications.gastroup.cz` as a domain in Resend dashboard, then add the generated SPF, DKIM (3× CNAME), and DMARC TXT records to gastroup.cz DNS at the registrar. Wait for Resend to mark the domain as "Verified" (typically 15 min – 2 h after DNS propagation).

- [ ] **Real ebook PDF uploaded** — Upload the ebook PDF from `Assets/28 námětů na tématické akce - inspirace pro celý rok - Jakub H..pdf` to production hosting. **Rename to remove diacritics and spaces** (e.g., `28-nametů.pdf`). Update `EBOOK_PDF_URL` environment variable in Netlify.

- [ ] **GastroUp logo URL accessible** — Ensure `Logo_GastroUp_2_transparent.png` is publicly accessible via URL. Update email template URLs if needed.

- [ ] **`ALLOWED_ORIGIN` switched to production domain** — In Netlify **Site settings > Environment variables**, change `ALLOWED_ORIGIN` from `*` (dev) to `https://gastroup.cz`.

- [ ] **Manual email test** — Submit both contact form and ebook form via production URL. Verify (1) notification email received at `NOTIFICATION_TO`, and (2) user confirmation email received at user's inbox. Check email formatting and link functionality.

- [ ] **GDPR consent checkbox + privacy policy** (**LEGAL BLOCKER**) — Add checkbox to both contact and ebook forms with text: "I consent to my data being processed per [Privacy Policy](link)". Server-side validation of `consent=true` must be added to `validateContact` and `validateEbook` functions. **Not in scope of initial implementation. Must complete before launch for CZ/EU traffic.**

- [ ] **Rate limiting / anti-bot protection** (**RECOMMENDED**) — Implement Cloudflare in front of Netlify OR add Cloudflare Turnstile CAPTCHA to forms to prevent Resend quota abuse and DDoS attacks. **Not in scope of initial implementation. Recommended before scaling traffic.**

## Architecture

- **`index.html`** — Static marketing site (root of repository)
- **`netlify/functions/contact.ts`** — Handles contact form submissions (email to team + user confirmation)
- **`netlify/functions/ebook.ts`** — Handles ebook signup (email to team + ebook download link to user)
- **`netlify/functions/shared/`** — Shared utilities: TypeScript types, email template generation, validation helpers
- **`netlify.toml`** — Netlify build and Functions configuration
- **`Assets/`** — PDFs, images, logos

For a detailed technical guide on email flow, validation, security, and testing, see **[Email Integration Guide](./docs/email-integration.md)**.

## Email Templates

Email templates are defined in `netlify/functions/shared/email-templates.ts`. All emails use the following brand colors:

- **Navy**: `#06264C`
- **Mustard**: `#CC972D`
- **Cream**: `#EFE3D3`

Tone is casual and friendly (tykání per content team direction). Templates are reviewed by client before production launch.

---

**Questions?** Contact the development team or refer to Netlify and Resend documentation:
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Resend Email API](https://resend.com/docs)
