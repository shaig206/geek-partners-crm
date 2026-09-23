"use client";

import { useActionState, useState } from "react";
import { setLeadPipelineStatus } from "@/app/actions/lead-detail";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  NOT_RELEVANT_REASONS,
  NOT_RELEVANT_REASON_LABELS,
  type LeadStatus,
  type NotRelevantReason,
} from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const initial: ActionResult | null = null;

export function LeadStatusRow({
  leadId,
  status,
  reason,
  followUpAt,
}: {
  leadId: string;
  status: string;
  reason: string | null;
  followUpAt: string | null;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => setLeadPipelineStatus(leadId, formData),
    initial,
  );
  const [reasonOpen, setReasonOpen] = useState(status === "not_relevant");
  const active = (LEAD_STATUSES as readonly string[]).includes(status) ? (status as LeadStatus) : null;

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">סטטוס</h2>
        {followUpAt ? (
          <p className="text-xs text-muted">מעקב מתוזמן {formatDateTime(followUpAt)}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="סטטוס הליד">
        {LEAD_STATUSES.filter((value) => value !== "not_relevant").map((value) => (
          <form key={value} action={action}>
            <button
              type="submit"
              name="status"
              value={value}
              disabled={pending}
              aria-pressed={active === value}
              className={pillClass(active === value)}
            >
              {LEAD_STATUS_LABELS[value]}
            </button>
          </form>
        ))}
        <button
          type="button"
          disabled={pending}
          aria-pressed={active === "not_relevant" || reasonOpen}
          aria-expanded={reasonOpen}
          onClick={() => setReasonOpen(true)}
          className={pillClass(active === "not_relevant")}
        >
          {LEAD_STATUS_LABELS.not_relevant}
        </button>
      </div>
      {reasonOpen ? (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            סיבה
            <select
              name="reason"
              required
              defaultValue={reason ?? ""}
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                בחרו סיבה
              </option>
              {NOT_RELEVANT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {NOT_RELEVANT_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            name="status"
            value="not_relevant"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "שומר…" : "שמירת לא רלוונטי"}
          </button>
        </form>
      ) : null}
      {active === "not_relevant" && reason ? (
        <p className="text-xs text-muted">
          סיבה נוכחית: {NOT_RELEVANT_REASON_LABELS[reason as NotRelevantReason] ?? reason}
        </p>
      ) : null}
      {state?.ok === true ? <p className="text-sm text-brand-dark">{state.message}</p> : null}
      {state?.ok === false ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </section>
  );
}

function pillClass(active: boolean) {
  return cn(
    "rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-60",
    active
      ? "border-brand bg-brand text-white"
      : "border-border bg-background text-foreground hover:bg-brand-soft",
  );
}
