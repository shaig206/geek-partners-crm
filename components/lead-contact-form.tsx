"use client";

import { useActionState } from "react";
import { updateLeadContact } from "@/app/actions/leads";
import { BUSINESS_STATUSES } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import type { Lead } from "@/lib/types";

const initial: ActionResult | null = null;

export function LeadContactForm({ lead }: { lead: Lead }) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => updateLeadContact(lead.id, formData),
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <h2 className="text-sm font-semibold">עריכת פרטי קשר</h2>
      <p className="text-xs text-muted">סטטוס העבודה מתעדכן בלחיצה בשורה למעלה.</p>
      <label className="block text-sm">
        סטטוס עסקי
        <select
          name="business_status"
          defaultValue={lead.business_status}
          className={inputClass}
        >
          {BUSINESS_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        איש קשר
        <input name="contact_name" defaultValue={lead.contact_name ?? ""} className={inputClass} />
      </label>
      <label className="block text-sm">
        טלפון
        <input name="phone" defaultValue={lead.phone ?? ""} className={inputClass} />
      </label>
      <label className="block text-sm">
        מייל
        <input name="email" type="email" defaultValue={lead.email ?? ""} className={inputClass} />
      </label>
      <label className="block text-sm">
        הערות חימום
        <textarea
          name="warming_notes"
          rows={4}
          defaultValue={lead.warming_notes ?? ""}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "שומר…" : "שמירת שינויים"}
      </button>
      {state?.ok === true ? <p className="text-sm text-brand-dark">{state.message ?? "נשמר"}</p> : null}
      {state?.ok === false ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";
