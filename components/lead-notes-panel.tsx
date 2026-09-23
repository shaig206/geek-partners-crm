"use client";

import { useActionState } from "react";
import { addLeadNote } from "@/app/actions/lead-detail";
import type { ActionResult, LeadNote } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const initial: ActionResult | null = null;

export function LeadNotesPanel({
  leadId,
  notes,
  loadError,
}: {
  leadId: string;
  notes: LeadNote[];
  loadError: string | null;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => addLeadNote(leadId, formData),
    initial,
  );

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">הערות</h2>
        <p className="mt-1 text-xs text-muted">
          כל הערה נשמרת עם השם והזמן של מי שכתב, כדי שמסירה בין סשנים תהיה ברורה.
        </p>
      </div>
      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      <form action={action} key={notes[0]?.id ?? "empty"} className="space-y-2">
        <label className="block text-sm">
          הערה חדשה
          <textarea
            name="body"
            required
            rows={3}
            placeholder="מה נאמר בשיחה, מה לחזור אליו, למי להעביר"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "שומר…" : "הוספת הערה"}
        </button>
        {state?.ok === true ? <p className="text-sm text-brand-dark">{state.message}</p> : null}
        {state?.ok === false ? <p className="text-sm text-red-700">{state.error}</p> : null}
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-muted">עדיין אין הערות לליד הזה.</p>
      ) : (
        <ol className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border bg-background p-3">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
                <span className="font-medium text-foreground">{note.author_name}</span>
                <span dir="ltr">{note.author_email}</span>
                <time dateTime={note.created_at}>{formatDateTime(note.created_at)}</time>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
