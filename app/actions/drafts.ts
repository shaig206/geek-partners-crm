"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { requireUser } from "@/lib/auth";
import { markSentPayload } from "@/lib/follow-up";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function createOutreachDraft(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const toEmail = asString(formData, "to_email");
  const subject = asString(formData, "subject");
  const body = asString(formData, "body");
  const toName = asString(formData, "to_name");
  const submitForApproval = formData.get("submit_for_approval") === "on";

  if (!toEmail || !subject || !body) {
    return { ok: false, error: "נדרשים נמען, נושא וגוף ההודעה" };
  }

  const status = submitForApproval ? "pending_approval" : "draft";
  const { error } = await supabase.from("email_drafts").insert({
    lead_id: leadId,
    to_email: toEmail,
    to_name: toName || null,
    subject,
    body,
    status,
  });

  if (error) return { ok: false, error: error.message };

  if (submitForApproval) {
    await supabase.from("leads").update({ status: "טיוטה ממתינה" }).eq("id", leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return {
    ok: true,
    message: submitForApproval ? "נשלח לאישור" : "הטיוטה נשמרה",
  };
}

export async function submitDraftForApproval(draftId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { data: draft, error } = await supabase
    .from("email_drafts")
    .select("id, lead_id, status")
    .eq("id", draftId)
    .maybeSingle();

  if (error || !draft) return { ok: false, error: "הטיוטה לא נמצאה" };
  if (draft.status !== "draft" && draft.status !== "rejected") {
    return { ok: false, error: "רק טיוטה או טיוטה שנדחתה ניתן לשלוח לאישור" };
  }

  const { error: updateError } = await supabase
    .from("email_drafts")
    .update({ status: "pending_approval", reject_reason: null })
    .eq("id", draftId)
    .in("status", ["draft", "rejected"]);

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("leads").update({ status: "טיוטה ממתינה" }).eq("id", draft.lead_id);
  revalidatePath(`/leads/${draft.lead_id}`);
  revalidatePath("/leads");
  return { ok: true, message: "ממתין לאישור" };
}

export async function rejectDraft(draftId: string, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const reason = asString(formData, "reject_reason");
  if (!reason) return { ok: false, error: "יש לציין סיבת דחייה" };

  const { data: draft, error } = await supabase
    .from("email_drafts")
    .select("id, lead_id, status")
    .eq("id", draftId)
    .maybeSingle();

  if (error || !draft) return { ok: false, error: "הטיוטה לא נמצאה" };
  if (draft.status !== "pending_approval") {
    return { ok: false, error: "אפשר לדחות רק טיוטה שממתינה לאישור" };
  }

  const { error: updateError } = await supabase
    .from("email_drafts")
    .update({ status: "rejected", reject_reason: reason })
    .eq("id", draftId)
    .eq("status", "pending_approval");

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/leads/${draft.lead_id}`);
  return { ok: true, message: "הטיוטה נדחתה" };
}

/**
 * Approve + send. Mail never goes out unless the row is still pending_approval
 * in the database at claim time. Uses the service role only on the server.
 */
export async function approveAndSendDraft(draftId: string): Promise<ActionResult> {
  await requireUser();

  const admin = createAdminClient();
  const { data: draft, error: loadError } = await admin
    .from("email_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (loadError || !draft) return { ok: false, error: "הטיוטה לא נמצאה" };
  if (draft.status !== "pending_approval") {
    return { ok: false, error: `לא ניתן לאשר: הסטטוס הוא ${draft.status}` };
  }
  if (!draft.to_email || !draft.subject || !draft.body) {
    return { ok: false, error: "חסרים נמען, נושא או גוף" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return { ok: false, error: "חסרים RESEND_API_KEY או RESEND_FROM_EMAIL בשרת" };
  }

  const approvedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("email_drafts")
    .update({ status: "approved", approved_at: approvedAt })
    .eq("id", draftId)
    .eq("status", "pending_approval")
    .select("id")
    .maybeSingle();

  if (claimError || !claimed) {
    return { ok: false, error: "הטיוטה כבר טופלה או שאינה ממתינה לאישור" };
  }

  const resend = new Resend(apiKey);
  const { data: sent, error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: draft.to_email,
    subject: draft.subject,
    text: draft.body,
  });

  const now = new Date().toISOString();

  if (sendError) {
    await admin.from("sends").insert({
      lead_id: draft.lead_id,
      draft_id: draft.id,
      from_email: fromEmail,
      to_email: draft.to_email,
      subject: draft.subject,
      body: draft.body,
      provider: "resend",
      status: "failed",
      error: sendError.message,
    });
    await admin
      .from("email_drafts")
      .update({ status: "failed" })
      .eq("id", draft.id);
    revalidatePath(`/leads/${draft.lead_id}`);
    return { ok: false, error: `שליחה נכשלה: ${sendError.message}` };
  }

  await admin.from("sends").insert({
    lead_id: draft.lead_id,
    draft_id: draft.id,
    from_email: fromEmail,
    to_email: draft.to_email,
    subject: draft.subject,
    body: draft.body,
    provider: "resend",
    provider_message_id: sent?.id ?? null,
    status: "sent",
    sent_at: now,
  });

  await admin.from("email_drafts").update({ status: "sent" }).eq("id", draft.id);

  const { data: leadRow } = await admin
    .from("leads")
    .select("warming_notes")
    .eq("id", draft.lead_id)
    .maybeSingle();

  await admin
    .from("leads")
    .update(
      markSentPayload({
        now: new Date(now),
        channel: "email",
        warmingNotes: leadRow?.warming_notes ?? null,
      }),
    )
    .eq("id", draft.lead_id);

  revalidatePath(`/leads/${draft.lead_id}`);
  revalidatePath("/leads");
  return { ok: true, message: "המייל נשלח" };
}
