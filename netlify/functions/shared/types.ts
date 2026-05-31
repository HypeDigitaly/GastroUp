export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  preference: "Telefon" | "Telegram" | "E-mail";
}

export interface EbookFormData {
  email: string;
  phone?: string;
}

export interface ResendPayload {
  from: string;
  to: string | string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
  tracking?: { opens: boolean; clicks: boolean };
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface RequestMeta {
  timestamp: string; // cs-CZ locale
  sourceUrl: string;
  userAgent: string;
}
