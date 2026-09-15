import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractEmail } from "@/lib/utils";

export const runtime = "nodejs";

type InboundPayload = {
  type?: string;
  data?: {
    from?: string;
    to?: string[] | string;
    subject?: string;
    email_id?: string;
  };
  from?: string;
};

function collectFromCandidates(payload: InboundPayload) {
  const values = [payload.data?.from, payload.from];
  return values.map(extractEmail).filter((value): value is string => Boolean(value));
}

function shouldNudge(status: string | null | undefined) {
  return status === "נשלח" || status === "אין מענה" || status === "טיוטה ממתינה";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    method: "POST",
    path: "/api/webhooks/resend-inbound",
    note: "Resend inbound stub. Chat notify is external.",
  });
}

/**
 * Resend inbound stub.
 * Accepts email.received (and generic) payloads, matches a lead by from-email,
 * nudges status toward נענה when it makes sense, and logs the event.
 *
 * Chat / Slack / WhatsApp notification is intentionally NOT done here —
 * wire that in an external automation on `inbound_events`.
 */
export async function POST(request: Request) {
  let payload: InboundPayload;
  try {
    payload = (await request.json()) as InboundPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const fromEmail = collectFromCandidates(payload)[0] ?? null;
  let matchedLeadId: string | null = null;
  let previousStatus: string | null = null;
  let newStatus: string | null = null;
  let note = "logged";

  try {
    const admin = createAdminClient();

    if (fromEmail) {
      const { data: lead } = await admin
        .from("leads")
        .select("id, status, email")
        .ilike("email", fromEmail)
        .maybeSingle();

      if (lead) {
        matchedLeadId = lead.id;
        previousStatus = lead.status;
        if (shouldNudge(lead.status)) {
          const { error } = await admin
            .from("leads")
            .update({ status: "נענה" })
            .eq("id", lead.id);
          if (!error) {
            newStatus = "נענה";
            note = "matched_and_nudged";
          } else {
            note = `matched_nudge_failed:${error.message}`;
          }
        } else {
          note = "matched_no_nudge";
        }
      } else {
        note = "no_matching_lead";
      }
    } else {
      note = "no_from_email";
    }

    await admin.from("inbound_events").insert({
      payload,
      from_email: fromEmail,
      matched_lead_id: matchedLeadId,
      previous_status: previousStatus,
      new_status: newStatus,
      note,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[resend-inbound]", message, payload);
    return NextResponse.json(
      {
        ok: true,
        logged: false,
        warning: message,
        matchedLeadId,
        fromEmail,
        note,
        chatNotify: "external",
      },
      { status: 200 },
    );
  }

  console.info("[resend-inbound]", {
    fromEmail,
    matchedLeadId,
    previousStatus,
    newStatus,
    note,
  });

  return NextResponse.json({
    ok: true,
    type: payload.type ?? null,
    fromEmail,
    matchedLeadId,
    previousStatus,
    newStatus,
    note,
    chatNotify: "external",
  });
}
