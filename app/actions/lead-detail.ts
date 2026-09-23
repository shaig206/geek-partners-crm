"use server";

import { revalidatePath } from "next/cache";
import { authorFromUser, leadNoteRow } from "@/lib/author";
import { requireUser } from "@/lib/auth";
import {
  LEAD_STATUS_LABELS,
  isLeadDraftKind,
  isLeadStatus,
  isNotRelevantReason,
  type BusinessStatus,
  type LeadStatus,
  type NotRelevantReason,
} from "@/lib/constants";
import { isResendConfigured } from "@/lib/env";
import { computeFollowUpAt } from "@/lib/follow-up";
import { formatStatusChangeNote } from "@/lib/lead-status";
import type { ActionResult } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BUSINESS_SYNC: Partial<Record<LeadStatus, BusinessStatus>> = {
  in_conversation: "בפגישה או שיחה",
  not_relevant: "לא רלוונטי",
  converted: "זכייה",
};

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function revalidateLead(leadId: string) {
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function setLeadPipelineStatus(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!UUID_RE.test(leadId)) return { ok: false, error: "מזהה ליד לא תקין" };

  const statusRaw = asString(formData, "status");
  if (!isLeadStatus(statusRaw)) return { ok: false, error: "סטטוס לא תקין" };

  let reason: NotRelevantReason | null = null;
  if (statusRaw === "not_relevant") {
    const reasonRaw = asString(formData, "reason");
    if (!isNotRelevantReason(reasonRaw)) {
      return { ok: false, error: "בחרו סיבה: נסגר, לא מתאים, אזור לא נכון, או אין מענה" };
    }
    reason = reasonRaw;
  }

  const { data: lead, error: loadError } = await supabase
    .from("leads")
    .select("id, status, not_relevant_reason, follow_up_at")
    .eq("id", leadId)
    .maybeSingle();

  if (loadError) return { ok: false, error: loadError.message };
  if (!lead) return { ok: false, error: "הליד לא נמצא" };

  if (lead.status === statusRaw && (lead.not_relevant_reason ?? null) === reason) {
    return { ok: true, message: "הסטטוס כבר מעודכן" };
  }

  const patch: {
    status: LeadStatus;
    not_relevant_reason: NotRelevantReason | null;
    follow_up_at?: string;
    business_status?: BusinessStatus;
  } = {
    status: statusRaw,
    not_relevant_reason: reason,
  };

  if (statusRaw === "follow_up_scheduled" && lead.status !== "follow_up_scheduled") {
    patch.follow_up_at = computeFollowUpAt().toISOString();
  }

  const synced = BUSINESS_SYNC[statusRaw];
  if (synced) patch.business_status = synced;

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  const { error: noteError } = await supabase.from("lead_notes").insert(
    leadNoteRow(
      leadId,
      authorFromUser(user),
      formatStatusChangeNote({
        fromStatus: lead.status,
        toStatus: statusRaw,
        toReason: reason,
      }),
    ),
  );
  if (noteError) {
    return { ok: false, error: `הסטטוס עודכן, אבל ההערה לא נשמרה: ${noteError.message}` };
  }

  revalidateLead(leadId);
  const label = LEAD_STATUS_LABELS[statusRaw];
  return { ok: true, message: `הסטטוס עודכן ל${label}` };
}

export async function addLeadNote(leadId: string, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!UUID_RE.test(leadId)) return { ok: false, error: "מזהה ליד לא תקין" };

  const body = asString(formData, "body");
  if (!body) return { ok: false, error: "ההערה ריקה" };

  const { error } = await supabase.from("lead_notes").insert(leadNoteRow(leadId, authorFromUser(user), body));
  if (error) return { ok: false, error: error.message };

  revalidateLead(leadId);
  return { ok: true, message: "ההערה נשמרה" };
}

export async function saveLeadMessageDraft(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  if (!UUID_RE.test(leadId)) return { ok: false, error: "מזהה ליד לא תקין" };

  const kind = asString(formData, "kind");
  const channel = asString(formData, "channel");
  const body = asString(formData, "body");
  const subject = asString(formData, "subject");

  if (!isLeadDraftKind(kind)) return { ok: false, error: "סוג נוסח לא תקין" };
  if (channel !== "whatsapp" && channel !== "email") return { ok: false, error: "ערוץ לא תקין" };
  if (!body) return { ok: false, error: "הנוסח ריק" };
  if (channel === "email" && !subject) return { ok: false, error: "חסר נושא למייל" };

  const { error } = await supabase.from("lead_message_drafts").upsert(
    {
      lead_id: leadId,
      kind,
      channel,
      subject: channel === "email" ? subject : null,
      body,
    },
    { onConflict: "lead_id,kind,channel" },
  );

  if (error) return { ok: false, error: error.message };

  revalidateLead(leadId);
  return { ok: true, message: "הנוסח נשמר לליד הזה" };
}

/** Save the per-lead email override and open the existing approve-and-send flow. */
export async function queueLeadTemplateEmail(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const saved = await saveLeadMessageDraft(leadId, formData);
  if (!saved.ok) return saved;

  if (!isResendConfigured()) {
    return { ok: true, message: "הנוסח נשמר. שליחה אוטומטית לא מוגדרת — אפשר להעתיק את המייל." };
  }

  const { supabase } = await requireUser();
  const toEmail = asString(formData, "to_email");
  const subject = asString(formData, "subject");
  const body = asString(formData, "body");
  const toName = asString(formData, "to_name");

  if (!toEmail) return { ok: false, error: "אין מייל על הליד. שמרו מייל בכרטיס, או העתיקו את הנוסח." };

  const { error } = await supabase.from("email_drafts").insert({
    lead_id: leadId,
    to_email: toEmail,
    to_name: toName || null,
    subject,
    body,
    status: "pending_approval",
  });

  if (error) return { ok: false, error: error.message };

  revalidateLead(leadId);
  return { ok: true, message: "נשמר לאישור. אישור ושליחה נמצאים בטיוטות למטה." };
}
