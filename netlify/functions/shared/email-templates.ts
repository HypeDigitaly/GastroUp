// =============================================================================
// EMAIL TEMPLATES — GastroUP
// 4 HTML generators + 4 plain-text generators + 4 subject generators
// =============================================================================

import type { ContactFormData, EbookFormData, RequestMeta } from "./types";
import { escapeHtml, sanitizeHeader, safeUrl } from "./utils";

// ── URL constants ─────────────────────────────────────────────────────────────
const PDF_URL = process.env.EBOOK_PDF_URL ?? "https://gastroup.cz/ebook/28-tipu.pdf";
const CTA_URL = process.env.CTA_URL ?? "https://form.fapi.cz/?id=4a82141f-d02b-489d-93b0-66f81a8cec6a";
const LOGO_URL = process.env.LOGO_URL ?? "https://gastroup.cz/Logo_GastroUp_2_transparent.png";
const DEMO_URL = process.env.DEMO_URL ?? "https://cal.com/jakub-h-a2wrvi/30min";

// ── Module-init env-var warnings ──────────────────────────────────────────────
if (!process.env.EBOOK_PDF_URL) {
  console.warn("[config] EBOOK_PDF_URL not set — using default placeholder URL");
}
if (!process.env.CTA_URL) {
  console.warn("[config] CTA_URL not set — using default placeholder URL");
}
if (!process.env.LOGO_URL) {
  console.warn("[config] LOGO_URL not set — using default; verify asset exists at production URL");
}
if (!process.env.DEMO_URL) {
  console.warn("[config] DEMO_URL not set — using default cal.com booking URL");
}

// ── Brand colors ──────────────────────────────────────────────────────────────
const COLORS = {
  navy: "#06264C",
  mustard: "#CC972D",
  cream: "#EFE3D3",
  white: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#6B6B6B",
};

// ── Shared HTML helpers ───────────────────────────────────────────────────────
function htmlShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:8px;overflow:hidden;">
${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function navyHeader(text: string): string {
  // The logo image already shows the "GastroUP" wordmark, so only render a
  // separate heading line when a meaningful (non-empty) title is passed in
  // (e.g. internal admin notifications). User-facing emails pass "".
  const heading = text
    ? `\n              <p style="margin:12px 0 0 0;font-size:18px;font-weight:700;color:${COLORS.navy};">${escapeHtml(text)}</p>`
    : "";
  return `          <tr>
            <td style="background-color:${COLORS.cream};padding:24px 32px;border-bottom:3px solid ${COLORS.mustard};">
              <img src="${LOGO_URL}" alt="GastroUP" width="140" height="auto" style="display:block;">${heading}
            </td>
          </tr>`;
}

function kvRow(label: string, value: string): string {
  return `                <tr>
                  <td width="130" style="padding:8px 12px;font-size:13px;color:${COLORS.textMuted};font-weight:600;vertical-align:top;white-space:nowrap;">${label}</td>
                  <td style="padding:8px 12px;font-size:14px;color:${COLORS.text};vertical-align:top;word-break:break-word;">${value}</td>
                </tr>`;
}

function ctaButton(label: string, url: string, outline = false): string {
  const safe = safeUrl(url);
  const style = outline
    ? `border:2px solid ${COLORS.mustard};color:${COLORS.mustard};background:transparent;padding:14px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:15px;`
    : `background:${COLORS.mustard};color:${COLORS.white};padding:14px 28px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600;font-size:15px;`;
  return `          <tr>
            <td align="center" style="padding:8px 32px;">
              <a href="${safe}" style="${style}">${escapeHtml(label)}</a>
            </td>
          </tr>`;
}

function htmlFooter(): string {
  return `          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${COLORS.cream};text-align:center;">
              <p style="margin:0;font-size:12px;color:${COLORS.textMuted};">GastroUP &bull; <a href="https://gastroup.cz" style="color:${COLORS.mustard};text-decoration:none;">gastroup.cz</a></p>
            </td>
          </tr>`;
}

function notificationTable(rows: string): string {
  return `          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #E0D6CA;border-radius:6px;">
${rows}
              </table>
            </td>
          </tr>`;
}

// =============================================================================
// 1. contactNotificationHTML
// =============================================================================
export function contactNotificationHTML(data: ContactFormData, meta: RequestMeta): string {
  const rows = [
    kvRow("Jméno", escapeHtml(data.name)),
    kvRow("Telefon", escapeHtml(data.phone)),
    kvRow("E-mail", data.email ? escapeHtml(data.email) : "—"),
    kvRow("Zpráva", data.message ? escapeHtml(data.message) : "—"),
    kvRow("Preference", escapeHtml(data.preference)),
    kvRow("Čas", escapeHtml(meta.timestamp)),
    kvRow("Source", escapeHtml(meta.sourceUrl)),
    kvRow("UA", escapeHtml(meta.userAgent)),
  ].join("\n");

  const body = [
    navyHeader("Nová poptávka GastroUP"),
    notificationTable(rows),
    htmlFooter(),
  ].join("\n");

  return htmlShell("Nová poptávka GastroUP", body);
}

// =============================================================================
// 2. contactNotificationText
// =============================================================================
export function contactNotificationText(data: ContactFormData, meta: RequestMeta): string {
  return [
    "NOVÁ POPTÁVKA GASTROUP",
    "=====================",
    `Jméno: ${data.name}`,
    `Telefon: ${data.phone}`,
    `E-mail: ${data.email ?? "—"}`,
    `Zpráva: ${data.message ?? "—"}`,
    `Preference: ${data.preference}`,
    `Čas: ${meta.timestamp}`,
    `Source: ${meta.sourceUrl}`,
    `UA: ${meta.userAgent}`,
  ].join("\n");
}

// =============================================================================
// 3. contactConfirmationHTML
// =============================================================================
export function contactConfirmationHTML(_data: ContactFormData): string {
  const greeting = "Ahoj,";

  const bodyContent = `          <tr>
            <td style="padding:32px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:17px;font-weight:600;color:${COLORS.text};">${greeting}</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">díky, že jsi nám napsal. Obdrželi jsme Tvoji zprávu a zpravidla do 24 hodin (během pracovních dní) se Ti ozve někdo z týmu GastroUP po telefonu — projdeme spolu co Tě trápí a domluvíme se na dalším kroku.</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">Pokud chceš začít hned a nečekat, můžeš si Parťáka vyzkoušet teď:</p>
            </td>
          </tr>`;

  const demoContent = `          <tr>
            <td style="padding:4px 32px 0 32px;text-align:center;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${COLORS.textMuted};">Co Tě čeká po kliknutí: zaplatíš 465 Kč, obratem dostaneš odkaz do Telegramu. Bez závazku, s garancí — když po prvním měsíci nebudeš spokojený, dostaneš měsíc navíc zdarma.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 4px 32px;text-align:center;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.textMuted};">Nebo si rovnou domluv nezávazné demo zdarma:</p>
            </td>
          </tr>`;

  const infoContent = `          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <p style="margin:0 0 4px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">Brzy na slyšenou,</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.text};font-weight:600;">Tým GastroUP</p>
            </td>
          </tr>`;

  const body = [
    navyHeader(""),
    bodyContent,
    ctaButton("Vyzkoušet Gastro Parťáka za 465 Kč", CTA_URL),
    demoContent,
    ctaButton("Rezervovat demo zdarma", DEMO_URL, true),
    infoContent,
    htmlFooter(),
  ].join("\n");

  return htmlShell("Tvoje poptávka je u nás", body);
}

// =============================================================================
// 4. contactConfirmationText
// =============================================================================
export function contactConfirmationText(_data: ContactFormData): string {
  const greeting = "Ahoj,";

  return [
    greeting,
    "",
    "díky, že jsi nám napsal. Obdrželi jsme Tvoji zprávu a zpravidla do 24 hodin (během pracovních dní) se Ti ozve někdo z týmu GastroUP po telefonu — projdeme spolu co Tě trápí a domluvíme se na dalším kroku.",
    "",
    "Pokud chceš začít hned a nečekat, můžeš si Parťáka vyzkoušet teď:",
    "",
    "Vyzkoušet Gastro Parťáka za 465 Kč:",
    safeUrl(CTA_URL),
    "",
    "Co Tě čeká po kliknutí: zaplatíš 465 Kč, obratem dostaneš odkaz do Telegramu. Bez závazku, s garancí — když po prvním měsíci nebudeš spokojený, dostaneš měsíc navíc zdarma.",
    "",
    "Nebo si rovnou domluv nezávazné demo zdarma:",
    safeUrl(DEMO_URL),
    "",
    "Brzy na slyšenou,",
    "Tým GastroUP",
  ].join("\n");
}

// =============================================================================
// 5. ebookNotificationHTML
// =============================================================================
export function ebookNotificationHTML(data: EbookFormData, meta: RequestMeta): string {
  const rows = [
    kvRow("E-mail", escapeHtml(data.email)),
    kvRow("Telefon", data.phone ? escapeHtml(data.phone) : "—"),
    kvRow("Čas", escapeHtml(meta.timestamp)),
    kvRow("Source", escapeHtml(meta.sourceUrl)),
    kvRow("UA", escapeHtml(meta.userAgent)),
  ].join("\n");

  const body = [
    navyHeader("Nový ebook lead GastroUP"),
    notificationTable(rows),
    htmlFooter(),
  ].join("\n");

  return htmlShell("Nový ebook lead GastroUP", body);
}

// =============================================================================
// 6. ebookNotificationText
// =============================================================================
export function ebookNotificationText(data: EbookFormData, meta: RequestMeta): string {
  return [
    "NOVÝ EBOOK LEAD GASTROUP",
    "========================",
    `E-mail: ${data.email}`,
    `Telefon: ${data.phone ?? "—"}`,
    `Čas: ${meta.timestamp}`,
    `Source: ${meta.sourceUrl}`,
    `UA: ${meta.userAgent}`,
  ].join("\n");
}

// =============================================================================
// 7. ebookDeliveryHTML
// =============================================================================
export function ebookDeliveryHTML(): string {
  const bodyContent = `          <tr>
            <td style="padding:32px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:17px;font-weight:600;color:${COLORS.text};">Ahoj,</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">tady je pro Tebe 28 tipů na tematické akce — stáhni si je tady:</p>
            </td>
          </tr>`;

  const middleContent = `          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">Tipy jsou navržené tak, aby šly rovnou použít — vyber si jeden, naplánuj ho na nejbližší možný termín, dej o tom vědět svým zákazníkům i sledujícím online a uvidíš rozdíl.</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">Pokud Tě zajímá jak z podobných akcí udělat systém, který Ti plní restauraci i mimo sezónu a buduje vlastní základnu stálých hostů, Gastro Parťák Ti s tím pomůže — první měsíc vyjde na 465 Kč.</p>
            </td>
          </tr>`;

  const ebookDemoIntro = `          <tr>
            <td style="padding:20px 32px 4px 32px;text-align:center;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.textMuted};">Nebo si nejdřív domluv nezávazné demo zdarma:</p>
            </td>
          </tr>`;

  const signoffContent = `          <tr>
            <td style="padding:16px 32px 24px 32px;">
              <p style="margin:0 0 4px 0;font-size:15px;line-height:1.6;color:${COLORS.text};">Využij naše tipy na maximum,</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:${COLORS.text};font-weight:600;">Tým GastroUP</p>
            </td>
          </tr>`;

  const body = [
    navyHeader(""),
    bodyContent,
    ctaButton("Stáhnout 28 tipů (PDF)", PDF_URL),
    middleContent,
    ctaButton("Vyzkoušet Gastro Parťáka za 465 Kč", CTA_URL, true),
    ebookDemoIntro,
    ctaButton("Rezervovat demo zdarma", DEMO_URL, true),
    signoffContent,
    htmlFooter(),
  ].join("\n");

  return htmlShell("Tvých 28 tipů na tematické akce", body);
}

// =============================================================================
// 8. ebookDeliveryText
// =============================================================================
export function ebookDeliveryText(): string {
  return [
    "Ahoj,",
    "",
    "tady je pro Tebe 28 tipů na tematické akce — stáhni si je tady:",
    "",
    "Stáhnout 28 tipů (PDF):",
    safeUrl(PDF_URL),
    "",
    "Tipy jsou navržené tak, aby šly rovnou použít — vyber si jeden, naplánuj ho na nejbližší možný termín, dej o tom vědět svým zákazníkům i sledujícím online a uvidíš rozdíl.",
    "",
    "Pokud Tě zajímá jak z podobných akcí udělat systém, který Ti plní restauraci i mimo sezónu a buduje vlastní základnu stálých hostů, Gastro Parťák Ti s tím pomůže — první měsíc vyjde na 465 Kč.",
    "",
    "Vyzkoušet Gastro Parťáka za 465 Kč:",
    safeUrl(CTA_URL),
    "",
    "Nebo si nejdřív domluv nezávazné demo zdarma:",
    safeUrl(DEMO_URL),
    "",
    "Využij naše tipy na maximum,",
    "Tým GastroUP",
  ].join("\n");
}

// =============================================================================
// Subject generators
// =============================================================================
export function contactNotificationSubject(data: ContactFormData): string {
  return `Nová poptávka GastroUp — ${sanitizeHeader(data.name, 60)}`;
}

export function contactConfirmationSubject(): string {
  return "Tvoje poptávka je u nás a brzy se Ti ozveme";
}

export function ebookNotificationSubject(data: EbookFormData): string {
  return `Nový ebook lead GastroUp — ${sanitizeHeader(data.email, 60)}`;
}

export function ebookDeliverySubject(): string {
  return "Posíláme Ti tipy na celý rok";
}
