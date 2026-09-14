"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  BUSINESS_TYPES,
  DEFAULT_CITY,
  LEAD_STATUSES,
  type BusinessType,
  type LeadStatus,
} from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

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
  return (LEAD_STATUSES as readonly string[]).includes(value)
    ? (value as LeadStatus)
    : null;
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
  if (!status) return { ok: false, error: "סטטוס לא תקין" };

  const { error } = await supabase
    .from("leads")
    .update({
      phone: emptyToNull(asString(formData, "phone")),
      email: emptyToNull(asString(formData, "email")),
      warming_notes: emptyToNull(asString(formData, "warming_notes")),
      contact_name: emptyToNull(asString(formData, "contact_name")),
      status,
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
  if (!parsed) return { ok: false, error: "סטטוס לא תקין" };

  const { error } = await supabase.from("leads").update({ status: parsed }).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}
