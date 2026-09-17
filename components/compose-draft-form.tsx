"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createOutreachDraft } from "@/app/actions/drafts";
import type { ActionResult, Lead } from "@/lib/types";

const initial: ActionResult | null = null;

export function ComposeDraftForm({
  lead,
  subject,
  body,
}: {
  lead: Lead;
  subject: string;
  body: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => createOutreachDraft(lead.id, formData),
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <h2 className="text-sm font-semibold">טיוטת פנייה בעברית</h2>
      <p className="text-xs text-muted">
        הנוסח מגיע מ
        <Link href="/templates" className="text-brand hover:underline">
          תבנית ברירת המחדל
        </Link>
        {" "}
        + פרטי הליד. נשלח רק אחרי אישור. שמירה רגילה משאירה טיוטה; סימון ״שלח לאישור״ מעביר ל־pending_approval.
      </p>
      <label className="block text-sm">
        אל (מייל)
        <input
          name="to_email"
          type="email"
          required
          defaultValue={lead.email ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        שם הנמען
        <input name="to_name" defaultValue={lead.contact_name ?? lead.name} className={inputClass} />
      </label>
      <label className="block text-sm">
        נושא
        <input name="subject" required defaultValue={subject} className={inputClass} />
      </label>
      <label className="block text-sm">
        גוף
        <textarea name="body" required rows={16} defaultValue={body} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="submit_for_approval" className="size-4 accent-brand" defaultChecked />
        שלח לאישור (לא שולח מייל עדיין)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "שומר…" : "שמירת טיוטה"}
      </button>
      {state?.ok === true ? <p className="text-sm text-brand-dark">{state.message}</p> : null}
      {state?.ok === false ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";
