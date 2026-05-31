import type { HandlerEvent } from "@netlify/functions";
import type {
  ContactFormData,
  EbookFormData,
  ResendPayload,
  ValidationResult,
  RequestMeta,
} from "./types";

const BODY_SIZE_LIMIT = 8192;
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
const EMAIL_CRLF_RE = /[\r\n\0,;<>]/;
const PHONE_RE = /^[\d\s+()/-]{6,30}$/;
const TITLE_RE = /^[A-Za-zÀ-ÿ]{2,4}\.$/;
const VALID_PREFERENCES = ["Telefon", "Telegram", "E-mail"] as const;

// ── escapeHtml ──────────────────────────────────────────────────────────────
// Ported verbatim from hypedigitaly-web-2/email-templates.ts:123-133
export function escapeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

// ── sanitizeHeader ──────────────────────────────────────────────────────────
export function sanitizeHeader(s: string, max = 80): string {
  return s.replace(/[\r\n\0"<>\x00-\x1F]/g, "").slice(0, max);
}

// ── safeReplyTo ──────────────────────────────────────────────────────────────
export function safeReplyTo(email: string | undefined): string | undefined {
  if (!email) return undefined;
  if (/[\r\n\0,;<>]/.test(email)) return undefined;
  return email;
}

// ── safeUrl ─────────────────────────────────────────────────────────────────
export function safeUrl(url: string): string {
  return url.startsWith("https://") ? url : "";
}

// ── validateHoneypot ────────────────────────────────────────────────────────
export function validateHoneypot(body: Record<string, unknown>): boolean {
  const val = body["company_website"];
  return typeof val === "string" && val.trim().length > 0;
}

// ── parseBody ───────────────────────────────────────────────────────────────
export function parseBody(event: HandlerEvent): Record<string, unknown> {
  if (event.isBase64Encoded === true) {
    throw new Error("Body encoding not supported");
  }
  const raw = event.body ?? "";
  if (event.body && Buffer.byteLength(event.body, "utf8") > BODY_SIZE_LIMIT) {
    throw new Error("Body too large");
  }
  const ct = (event.headers["content-type"] ?? "").toLowerCase();
  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    const result: Record<string, unknown> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
  }
  // Default: JSON
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON");
  }
}

// ── validateContact ─────────────────────────────────────────────────────────
export function validateContact(
  body: Record<string, unknown>
): ValidationResult<ContactFormData> {
  const rawName = typeof body["name"] === "string" ? body["name"].trim() : "";
  if (!rawName) return { ok: false, error: "Jméno je povinné" };
  if (/[\r\n]/.test(rawName)) return { ok: false, error: "Jméno obsahuje neplatné znaky" };
  if (rawName.length > 100) return { ok: false, error: "Jméno je příliš dlouhé (max 100 znaků)" };

  const rawPhone = typeof body["phone"] === "string" ? body["phone"].trim() : "";
  if (!rawPhone) return { ok: false, error: "Telefon je povinný" };
  if (!PHONE_RE.test(rawPhone)) return { ok: false, error: "Neplatný formát telefonu" };

  let email: string | undefined;
  if (body["email"] !== undefined && body["email"] !== "") {
    const rawEmail = typeof body["email"] === "string" ? body["email"].trim() : "";
    if (/\.\./.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
    if (!EMAIL_RE.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
    if (EMAIL_CRLF_RE.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
    if (rawEmail.length > 100) return { ok: false, error: "E-mail je příliš dlouhý (max 100 znaků)" };
    email = rawEmail;
  }

  let message: string | undefined;
  if (body["message"] !== undefined && body["message"] !== "") {
    const rawMsg = typeof body["message"] === "string" ? body["message"].trim() : "";
    if (rawMsg.length > 2000) return { ok: false, error: "Zpráva je příliš dlouhá (max 2000 znaků)" };
    message = rawMsg;
  }

  let preference: ContactFormData["preference"] = "Telefon";
  if (body["preference"] !== undefined && body["preference"] !== "") {
    const rawPref = body["preference"];
    if (typeof rawPref !== "string" || !(VALID_PREFERENCES as readonly string[]).includes(rawPref)) {
      return { ok: false, error: "Neplatná hodnota preference" };
    }
    preference = rawPref as ContactFormData["preference"];
  }

  return {
    ok: true,
    data: { name: rawName, phone: rawPhone, email, message, preference },
  };
}

// ── validateEbook ────────────────────────────────────────────────────────────
export function validateEbook(
  body: Record<string, unknown>
): ValidationResult<EbookFormData> {
  const rawEmail = typeof body["email"] === "string" ? body["email"].trim() : "";
  if (!rawEmail) return { ok: false, error: "E-mail je povinný" };
  if (/\.\./.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
  if (!EMAIL_RE.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
  if (EMAIL_CRLF_RE.test(rawEmail)) return { ok: false, error: "Neplatný formát e-mailu" };
  if (rawEmail.length > 100) return { ok: false, error: "E-mail je příliš dlouhý (max 100 znaků)" };

  let phone: string | undefined;
  if (body["phone"] !== undefined && body["phone"] !== "") {
    const rawPhone = typeof body["phone"] === "string" ? body["phone"].trim() : "";
    if (!PHONE_RE.test(rawPhone)) return { ok: false, error: "Neplatný formát telefonu" };
    phone = rawPhone;
  }

  return { ok: true, data: { email: rawEmail, phone } };
}

// ── sendResendEmail ──────────────────────────────────────────────────────────
export async function sendResendEmail(
  apiKey: string,
  payload: ResendPayload
): Promise<{ ok: boolean; status: number }> {
  const body: ResendPayload = {
    ...payload,
    tracking: payload.tracking ?? { opens: false, clicks: false },
  };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let bodyText = "";
    try { bodyText = (await res.text()).slice(0, 500); } catch {}
    console.error("Resend error", { status: res.status, body: bodyText });
  }
  return { ok: res.ok, status: res.status };
}

// ── buildCorsHeaders ─────────────────────────────────────────────────────────
export function buildCorsHeaders(
  allowedOrigin: string
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// ── extractMeta ──────────────────────────────────────────────────────────────
export function extractMeta(event: HandlerEvent): RequestMeta {
  return {
    timestamp: new Date().toLocaleString("cs-CZ", { timeZone: "Europe/Prague" }),
    sourceUrl: event.headers["referer"] ?? "neznámý",
    userAgent: (event.headers["user-agent"] ?? "").slice(0, 150),
  };
}

// ── extractFirstName ─────────────────────────────────────────────────────────
export function extractFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  const filtered = parts.filter((p) => !TITLE_RE.test(p));
  return filtered[0] ?? "";
}
