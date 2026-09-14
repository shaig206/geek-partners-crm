"use client";

import { useActionState } from "react";
import { approveAndSendDraft, rejectDraft, submitDraftForApproval } from "@/app/actions/drafts";
import { DRAFT_STATUS_LABELS } from "@/lib/constants";
import type { ActionResult, EmailDraft } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const initial: ActionResult | null = null;

export function DraftList({ drafts }: { drafts: EmailDraft[] }) {
  if (drafts.length === 0) {
    return <p className="text-sm text-muted">אין טיוטות עדיין.</p>;
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <article key={draft.id} className="rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <strong>{draft.subject}</strong>
            <span className="text-muted">
              {DRAFT_STATUS_LABELS[draft.status]} · {formatDateTime(draft.created_at)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            אל: {draft.to_name ? `${draft.to_name} ` : ""}
            {draft.to_email}
          </p>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-sm leading-6">
            {draft.body}
          </pre>
          {draft.reject_reason ? (
            <p className="mt-2 text-sm text-red-800">נדחה: {draft.reject_reason}</p>
          ) : null}
          <DraftActions draft={draft} />
        </article>
      ))}
    </div>
  );
}

function DraftActions({ draft }: { draft: EmailDraft }) {
  if (draft.status === "pending_approval") {
    return (
      <div className="mt-4 space-y-3">
        <ApproveButton draftId={draft.id} />
        <RejectForm draftId={draft.id} />
      </div>
    );
  }

  if (draft.status === "draft" || draft.status === "rejected") {
    return <SubmitButton draftId={draft.id} />;
  }

  return null;
}

function ApproveButton({ draftId }: { draftId: string }) {
  const [state, action, pending] = useActionState(async () => {
    const confirmed = window.confirm("לאשר ולשלוח את המייל דרך Resend? אין חזרה אחרי שליחה.");
    if (!confirmed) return { ok: false, error: "בוטל" } satisfies ActionResult;
    return approveAndSendDraft(draftId);
  }, initial);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "שולח…" : "אישור ושליחה"}
      </button>
      <Result state={state} />
    </form>
  );
}

function SubmitButton({ draftId }: { draftId: string }) {
  const [state, action, pending] = useActionState(
    async () => submitDraftForApproval(draftId),
    initial,
  );

  return (
    <form action={action} className="mt-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-card disabled:opacity-60"
      >
        {pending ? "שולח…" : "שלח לאישור"}
      </button>
      <Result state={state} />
    </form>
  );
}

function RejectForm({ draftId }: { draftId: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => rejectDraft(draftId, formData),
    initial,
  );

  return (
    <form action={action} className="space-y-2">
      <label className="block text-sm">
        סיבת דחייה
        <input name="reject_reason" required className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-800 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "דוחה…" : "דחייה"}
      </button>
      <Result state={state} />
    </form>
  );
}

function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) return <p className="mt-2 text-sm text-brand-dark">{state.message ?? "בוצע"}</p>;
  return <p className="mt-2 text-sm text-red-700">{state.error}</p>;
}
