/** Communication-channel helpers. Pure functions — safe to unit-test. */

export const CHANNEL_BUCKETS = ["whatsapp", "email", "both", "none"] as const;
export type ChannelBucket = (typeof CHANNEL_BUCKETS)[number];

export const CHANNEL_BUCKET_LABELS: Record<ChannelBucket, string> = {
  whatsapp: "וואטסאפ",
  email: "מייל",
  both: "שניהם",
  none: "כלום",
};

/**
 * Strip spaces, dashes, and an Israeli +972 / 972 prefix.
 * Local numbers keep/regain a leading 0 (05… mobiles, 0[2-9]… landlines).
 */
export function normalizeIsraeliPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let digits = phone.trim().replace(/[\s\-().]/g, "");
  if (!digits) return null;

  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("972")) {
    digits = digits.slice(3);
  }
  if (!digits) return null;

  if (digits.startsWith("0")) {
    return digits;
  }
  return `0${digits}`;
}

/** True iff the phone is an Israeli mobile: 05 + 8 digits after normalization. */
export function hasWhatsApp(phone: string | null | undefined): boolean {
  const normalized = normalizeIsraeliPhone(phone);
  return normalized != null && /^05\d{8}$/.test(normalized);
}

/** True iff email is non-empty after trim. */
export function hasEmail(email: string | null | undefined): boolean {
  return Boolean(email?.trim());
}

export function channelBucket(input: {
  phone?: string | null;
  email?: string | null;
}): ChannelBucket {
  const wa = hasWhatsApp(input.phone);
  const em = hasEmail(input.email);
  if (wa && em) return "both";
  if (wa) return "whatsapp";
  if (em) return "email";
  return "none";
}

export function isChannelBucket(value: string): value is ChannelBucket {
  return (CHANNEL_BUCKETS as readonly string[]).includes(value);
}
