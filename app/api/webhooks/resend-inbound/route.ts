import { NextResponse } from "next/server";
import { FOLLOW_UP_WAITING_STATUSES } from "@/lib/constants";
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

function shouldNudgeBusiness(
  businessStatus: string | null | undefined,
  communicationStatus: string | null | undefined,
) {
  if (businessStatus !== "חדש") return false;
  return (FOLLOW_UP_WAITING_STATUSES as readonly string[]).includes(communicationStatus ?? "");
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
 * nudges business_status toward רלוונטי when we already reached out, and logs the event.
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
        .select("id, status, business_status, email")
        .ilike("email", fromEmail)
        .maybeSingle();

      if (lead) {
        matchedLeadId = lead.id;
        previousStatus = lead.business_status ?? lead.status;
        if (shouldNudgeBusiness(lead.business_status, lead.status)) {
          const { error } = await admin
            .from("leads")
            .update({ business_status: "רלוונטי" })
            .eq("id", lead.id);
          if (!error) {
            newStatus = "רלוונטי";
            note = "matched_and_nudged_business";
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
