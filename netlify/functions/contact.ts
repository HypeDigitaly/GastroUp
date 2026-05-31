import type { Handler, HandlerEvent } from "@netlify/functions";
import {
  buildCorsHeaders,
  parseBody,
  validateHoneypot,
  validateContact,
  sendResendEmail,
  extractMeta,
  safeReplyTo,
} from "./shared/utils";

if ((process.env.ALLOWED_ORIGIN ?? "*") === "*") {
  console.warn("[config] ALLOWED_ORIGIN is wildcard — switch to https://gastroup.cz before production");
}
import {
  contactNotificationHTML,
  contactNotificationText,
  contactNotificationSubject,
  contactConfirmationHTML,
  contactConfirmationText,
  contactConfirmationSubject,
} from "./shared/email-templates";
import type { ResendPayload } from "./shared/types";

const handler: Handler = async (event: HandlerEvent) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "*";
  const headers = buildCorsHeaders(allowedOrigin);

  // 1. CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // 2. Method gate
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
    // 3. Parse body (8KB limit, throws on too-large or invalid JSON)
    let body: Record<string, unknown>;
    try {
      body = parseBody(event);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "Neplatný požadavek." }),
      };
    }

    // 4. Honeypot — FAKE SUCCESS (don't reveal detection)
    if (validateHoneypot(body)) {
      const uaHash = (event.headers["user-agent"] ?? "").slice(0, 8);
      console.log("[honeypot] contact_blocked", { ua_hash: uaHash });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 5. Validate
    const result = validateContact(body);
    if (!result.ok) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: result.error }),
      };
    }
    const data = result.data;

    // 6. Env check
    const apiKey = process.env.RESEND_API_KEY;
    const notifTo = process.env.NOTIFICATION_TO;
    const fromEmail =
      process.env.FROM_EMAIL ?? "GastroUp <noreply@notifications.gastroup.cz>";
    if (!apiKey || !notifTo) {
      console.error("[config] missing RESEND_API_KEY or NOTIFICATION_TO");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Konfigurace e-mailu není dokončena.",
        }),
      };
    }

    const meta = extractMeta(event);

    // 7. Notification (BLOCKING)
    const notifPayload: ResendPayload = {
      from: fromEmail,
      to: notifTo,
      subject: contactNotificationSubject(data),
      html: contactNotificationHTML(data, meta),
      text: contactNotificationText(data, meta),
      tracking: { opens: false, clicks: false },
    };
    const rt = safeReplyTo(data.email);
    if (rt) notifPayload.reply_to = rt;
    const notifResult = await sendResendEmail(apiKey, notifPayload);
    if (!notifResult.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.",
        }),
      };
    }

    // 8. Confirmation (NON-BLOCKING) — only if email provided
    if (data.email) {
      try {
        const confirmPayload: ResendPayload = {
          from: fromEmail,
          to: data.email,
          subject: contactConfirmationSubject(),
          html: contactConfirmationHTML(data),
          text: contactConfirmationText(data),
          tracking: { opens: false, clicks: false },
        };
        await sendResendEmail(apiKey, confirmPayload);
      } catch (err) {
        console.error("[confirmation] non-blocking failure", {
          type: err instanceof Error ? err.name : "unknown",
        });
      }
    }

    // 9. Success
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("[handler] unexpected", {
      type: err instanceof Error ? err.name : "unknown",
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "Došlo k neočekávané chybě." }),
    };
  }
};

export { handler };
