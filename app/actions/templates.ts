"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isTemplateChannel, type TemplateChannel } from "@/lib/constants";
import { overlappingTemplateChannels } from "@/lib/templates";
import type { ActionResult, OutreachTemplate } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function emptyToNull(value: string) {
  return value.length === 0 ? null : value;
}

function revalidateTemplates() {
  revalidatePath("/templates");
  revalidatePath("/leads");
  revalidatePath("/leads", "layout");
}

function parseChannel(value: string): TemplateChannel | null {
  return isTemplateChannel(value) ? value : null;
}

function parseTemplateFields(formData: FormData) {
  const name = asString(formData, "name");
  const channel = parseChannel(asString(formData, "channel"));
  const body = asString(formData, "body");
  const subject = emptyToNull(asString(formData, "subject"));

  if (!name) return { error: "שם התבנית חובה" } as const;
  if (!channel) return { error: "ערוץ לא תקין" } as const;
  if (!body) return { error: "גוף התבנית חובה" } as const;
  if ((channel === "email" || channel === "both") && !subject) {
    return { error: "נושא חובה לתבנית מייל" } as const;
  }

  return {
    error: null,
    payload: {
      name,
      channel,
      body,
      subject: channel === "whatsapp" ? null : subject,
    },
  } as const;
}

async function clearOverlappingDefaults(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  channel: TemplateChannel,
  exceptId?: string,
) {
  const overlapping = overlappingTemplateChannels(channel);
  let query = supabase
    .from("outreach_templates")
    .update({ is_default: false })
    .in("channel", overlapping)
    .eq("is_default", true);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  return { error };
}

export async function createTemplate(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseTemplateFields(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  const { supabase } = await requireUser();
  const { data: last } = await supabase
    .from("outreach_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("outreach_templates")
    .insert({
      ...parsed.payload,
      is_default: false,
      sort_order: (last?.sort_order ?? 0) + 10,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "שמירה נכשלה" };

  revalidateTemplates();
  redirect(`/templates?id=${data.id}`);
}

export async function updateTemplate(
  templateId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!UUID_RE.test(templateId)) return { ok: false, error: "מזהה תבנית לא תקין" };
  const parsed = parseTemplateFields(formData);
  if (parsed.error) return { ok: false, error: parsed.error };

  const { supabase } = await requireUser();
  const { data: existing, error: loadError } = await supabase
    .from("outreach_templates")
    .select("id, is_default, channel")
    .eq("id", templateId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!existing) return { ok: false, error: "התבנית לא נמצאה" };

  if (existing.is_default && existing.channel !== parsed.payload.channel) {
    const cleared = await clearOverlappingDefaults(supabase, parsed.payload.channel, templateId);
    if (cleared.error) return { ok: false, error: cleared.error.message };
  }

  const { error } = await supabase
    .from("outreach_templates")
    .update(parsed.payload)
    .eq("id", templateId);

  if (error) return { ok: false, error: error.message };

  revalidateTemplates();
  return { ok: true, message: "התבנית נשמרה" };
}

export async function duplicateTemplate(templateId: string): Promise<ActionResult> {
  if (!UUID_RE.test(templateId)) return { ok: false, error: "מזהה תבנית לא תקין" };
  const { supabase } = await requireUser();
  const { data: source, error: loadError } = await supabase
    .from("outreach_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!source) return { ok: false, error: "התבנית לא נמצאה" };

  const typed = source as OutreachTemplate;
  const { data, error } = await supabase
    .from("outreach_templates")
    .insert({
      name: `${typed.name} (עותק)`,
      channel: typed.channel,
      body: typed.body,
      subject: typed.subject,
      is_default: false,
      sort_order: typed.sort_order + 1,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "שכפול נכשל" };

  revalidateTemplates();
  redirect(`/templates?id=${data.id}`);
}

export async function setDefaultTemplate(templateId: string): Promise<ActionResult> {
  if (!UUID_RE.test(templateId)) return { ok: false, error: "מזהה תבנית לא תקין" };
  const { supabase } = await requireUser();
  const { data: row, error: loadError } = await supabase
    .from("outreach_templates")
    .select("id, channel, is_default")
    .eq("id", templateId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!row) return { ok: false, error: "התבנית לא נמצאה" };
  if (row.is_default) return { ok: true, message: "כבר ברירת מחדל" };

  const cleared = await clearOverlappingDefaults(supabase, row.channel as TemplateChannel, templateId);
  if (cleared.error) return { ok: false, error: cleared.error.message };

  const { error } = await supabase
    .from("outreach_templates")
    .update({ is_default: true })
    .eq("id", templateId);

  if (error) return { ok: false, error: error.message };

  revalidateTemplates();
  return { ok: true, message: "הוגדרה כברירת מחדל" };
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  if (!UUID_RE.test(templateId)) return { ok: false, error: "מזהה תבנית לא תקין" };
  const { supabase } = await requireUser();
  const { data: row, error: loadError } = await supabase
    .from("outreach_templates")
    .select("id, is_default")
    .eq("id", templateId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!row) return { ok: false, error: "התבנית לא נמצאה" };

  if (row.is_default) {
    const { count, error: countError } = await supabase
      .from("outreach_templates")
      .select("id", { count: "exact", head: true })
      .eq("is_default", true);

    if (countError) return { ok: false, error: countError.message };
    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error: "אי אפשר למחוק את תבנית ברירת המחדל האחרונה. הגדירו תבנית אחרת כברירת מחדל קודם.",
      };
    }
  }

  const { error } = await supabase.from("outreach_templates").delete().eq("id", templateId);
  if (error) return { ok: false, error: error.message };

  revalidateTemplates();
  redirect("/templates");
}
