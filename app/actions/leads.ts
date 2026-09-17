"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  BUSINESS_TYPES,
  DEFAULT_CITY,
  FOLLOW_UP_DAYS_AFTER_SEND,
  MARK_SENT_STATUS,
  isBusinessStatus,
  isLeadStatus,
  OUTREACH_CHANNELS,
  type BusinessStatus,
  type BusinessType,
  type LeadStatus,
  type OutreachChannel,
} from "@/lib/constants";
import { markSentPayload } from "@/lib/follow-up";
import type { ActionResult } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function emptyToNull(value: string) {
  return value.length === 0 ? null : value;
}

function parseLag(value: string) {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

function parseStatus(value: string): LeadStatus | null {
  return isLeadStatus(value) ? value : null;
}

function parseBusinessStatus(value: string): BusinessStatus | null {
  return isBusinessStatus(value) ? value : null;
}

function parseBusinessType(value: string): BusinessType | null {
  return (BUSINESS_TYPES as readonly string[]).includes(value)
    ? (value as BusinessType)
    : null;
}

export async function createLead(formData: FormData) {
  const { supabase } = await requireUser();
  const name = asString(formData, "name");
  if (!name) {
    redirect("/leads/new?error=missing_name");
  }

  const status = parseStatus(asString(formData, "status")) ?? "חדש";
  const businessStatus = parseBusinessStatus(asString(formData, "business_status")) ?? "חדש";
  const payload = {
    name,
    website: emptyToNull(asString(formData, "website")),
    category: emptyToNull(asString(formData, "category")),
    city: asString(formData, "city") || DEFAULT_CITY,
    business_type: parseBusinessType(asString(formData, "business_type")),
    size_signal: emptyToNull(asString(formData, "size_signal")),
    lag_score: parseLag(asString(formData, "lag_score")),
    why_lagging: emptyToNull(asString(formData, "why_lagging")),
    peer_gap: emptyToNull(asString(formData, "peer_gap")),
    phone: emptyToNull(asString(formData, "phone")),
    email: emptyToNull(asString(formData, "email")),
    contact_name: emptyToNull(asString(formData, "contact_name")),
    status,
    business_status: businessStatus,
    warming_notes: emptyToNull(asString(formData, "warming_notes")),
    source_url: emptyToNull(asString(formData, "source_url")),
    priority: formData.get("priority") === "on",
    found_at: emptyToNull(asString(formData, "found_at")),
  };

  const { data, error } = await supabase.from("leads").insert(payload).select("id").single();
  if (error || !data) {
    redirect(`/leads/new?error=${encodeURIComponent(error?.message ?? "insert_failed")}`);
  }

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadContact(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const status = parseStatus(asString(formData, "status"));
  const businessStatus = parseBusinessStatus(asString(formData, "business_status"));
  if (!status) return { ok: false, error: "סטטוס תקשורת לא תקין" };
  if (!businessStatus) return { ok: false, error: "סטטוס עסקי לא תקין" };

  const { error } = await supabase
    .from("leads")
    .update({
      phone: emptyToNull(asString(formData, "phone")),
      email: emptyToNull(asString(formData, "email")),
      warming_notes: emptyToNull(asString(formData, "warming_notes")),
      contact_name: emptyToNull(asString(formData, "contact_name")),
      status,
      business_status: businessStatus,
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true, message: "נשמר" };
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const parsed = parseStatus(status);
  if (!parsed) return { ok: false, error: "סטטוס תקשורת לא תקין" };

  const { error } = await supabase.from("leads").update({ status: parsed }).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

function parseChannel(channel: string | undefined): OutreachChannel {
  if (channel && (OUTREACH_CHANNELS as readonly string[]).includes(channel)) {
    return channel as OutreachChannel;
  }
  return "other";
}

/**
 * After manual WhatsApp / email send: communication status נשלחה הודעה,
 * stamp last contact, schedule first follow-up in FOLLOW_UP_DAYS_AFTER_SEND
 * calendar days (UTC date + N days, same clock time), and append a short Hebrew note.
 */
export async function markLeadSent(
  leadId: string,
  channel?: OutreachChannel,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!UUID_RE.test(leadId)) return { ok: false, error: "מזהה ליד לא תקין" };

  const parsedChannel = parseChannel(channel);
  const { data: lead, error: loadError } = await supabase
    .from("leads")
    .select("id, warming_notes")
    .eq("id", leadId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!lead) return { ok: false, error: "הליד לא נמצא" };

  const { error } = await supabase
    .from("leads")
    .update(markSentPayload({ channel: parsedChannel, warmingNotes: lead.warming_notes }))
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return {
    ok: true,
    message: `סומן כ${MARK_SENT_STATUS}. מעקב ראשון בעוד ${FOLLOW_UP_DAYS_AFTER_SEND} ימים.`,
  };
}
