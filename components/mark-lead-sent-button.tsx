"use client";

import { useActionState } from "react";
import { markLeadSent } from "@/app/actions/leads";
import type { OutreachChannel } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const initial: ActionResult | null = null;

export function MarkLeadSentButton({
  leadId,
  channel,
  label,
}: {
  leadId: string;
  channel: OutreachChannel;
  label: string;
}) {
  const [state, action, pending] = useActionState(async () => markLeadSent(leadId, channel), initial);

  return (
    <form action={action} className="space-y-2">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand hover:text-white disabled:opacity-60"
      >
        {pending ? "מסמן…" : label}
      </button>
      {state?.ok === true ? <p className="text-sm text-brand-dark">{state.message}</p> : null}
      {state?.ok === false ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
