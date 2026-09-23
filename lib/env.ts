export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  return { url, anonKey };
}

/** Local-only login bypass. Never set this on Vercel / production. */
export function isLocalNoAuth() {
  return process.env.LOCAL_NO_AUTH?.trim() === "true";
}

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** True when approve-and-send can call Resend. Keys stay server-side. */
export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(isHttpUrl(url) && anonKey);
}
