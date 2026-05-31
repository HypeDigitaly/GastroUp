import type { Handler, HandlerEvent } from "@netlify/functions";
import {
  buildCorsHeaders,
  parseBody,
  validateHoneypot,
  validateEbook,
  sendResendEmail,
  extractMeta,
  safeReplyTo,
} from "./shared/utils";

if ((process.env.ALLOWED_ORIGIN ?? "*") === "*") {
  console.warn("[config] ALLOWED_ORIGIN is wildcard — switch to https://gastroup.cz before production");
}
import {
  ebookNotificationHTML,
  ebookNotificationText,
  ebookNotificationSubject,
  ebookDeliveryHTML,
  ebookDeliveryText,
  ebookDeliverySubject,
} from "./shared/email-templates";
import type { ResendPayload } from "./shared/types";

const handler: Handler = async (event: HandlerEvent) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "*";
  const headers = buildCorsHeaders(allowedOrigin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method not allowed" }),
    };
  }

  try {
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

    if (validateHoneypot(body)) {
      const uaHash = (event.headers["user-agent"] ?? "").slice(0, 8);
      console.log("[honeypot] ebook_blocked", { ua_hash: uaHash });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    const result = validateEbook(body);
    if (!result.ok) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: result.error }),
      };
    }
    const data = result.data;

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

    // 1. Delivery to user (BLOCKING — user must receive ebook)
    const deliveryPayload: ResendPayload = {
      from: fromEmail,
      to: data.email,
      subject: ebookDeliverySubject(),
      html: ebookDeliveryHTML(),
      text: ebookDeliveryText(),
      tracking: { opens: false, clicks: false },
    };
    const deliveryResult = await sendResendEmail(apiKey, deliveryPayload);
    if (!deliveryResult.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "E-book se nepodařilo doručit. Zkuste to prosím znovu.",
        }),
      };
    }

    // 2. Notification to team (NON-BLOCKING)
    try {
      const notifPayload: ResendPayload = {
        from: fromEmail,
        to: notifTo,
        subject: ebookNotificationSubject(data),
        html: ebookNotificationHTML(data, meta),
        text: ebookNotificationText(data, meta),
        tracking: { opens: false, clicks: false },
      };
      const rt = safeReplyTo(data.email);
      if (rt) notifPayload.reply_to = rt;
      await sendResendEmail(apiKey, notifPayload);
    } catch (err) {
      console.error("[notification] non-blocking failure", {
        type: err instanceof Error ? err.name : "unknown",
      });
    }

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
