"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "@/app/actions/templates";
import { TEMPLATE_CHANNEL_LABELS, TEMPLATE_CHANNELS, type TemplateChannel } from "@/lib/constants";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates";
import type { ActionResult, OutreachTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

const initial: ActionResult | null = null;

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";

export function TemplatesManager({
  templates,
  selectedId,
  isNew,
}: {
  templates: OutreachTemplate[];
  selectedId: string | null;
  isNew: boolean;
}) {
  const selected = isNew ? null : templates.find((template) => template.id === selectedId) ?? templates[0] ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
      <aside className="space-y-3">
        <Link
          href="/templates?new=1"
          className="block rounded-lg border border-dashed border-border bg-card px-3 py-2 text-center text-sm font-medium hover:bg-background"
        >
          תבנית חדשה
        </Link>
        {templates.length === 0 ? (
          <p className="text-sm text-muted">אין תבניות עדיין.</p>
        ) : (
          <ul className="space-y-1">
            {templates.map((template) => {
              const active = !isNew && selected?.id === template.id;
              return (
                <li key={template.id}>
                  <Link
                    href={`/templates?id=${template.id}`}
                    className={cn(
                      "block rounded-lg border px-3 py-2 text-sm",
                      active
                        ? "border-brand bg-brand-soft"
                        : "border-border bg-card hover:bg-background",
                    )}
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      <ChannelBadge channel={template.channel} />
                      {template.is_default ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
                          ברירת מחדל
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {isNew ? (
        <TemplateForm key="new" mode="create" />
      ) : selected ? (
        <TemplateForm key={selected.id} mode="edit" template={selected} />
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted">
          צרו תבנית ראשונה כדי לשמור נוסחי פנייה.
        </p>
      )}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: TemplateChannel }) {
  const styles: Record<TemplateChannel, string> = {
    whatsapp: "bg-emerald-50 text-emerald-800",
    email: "bg-sky-50 text-sky-800",
    both: "bg-violet-50 text-violet-800",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", styles[channel])}>
      {TEMPLATE_CHANNEL_LABELS[channel]}
    </span>
  );
}

function TemplateForm({
  mode,
  template,
}: {
  mode: "create" | "edit";
  template?: OutreachTemplate;
}) {
  const [channel, setChannel] = useState<TemplateChannel>(template?.channel ?? "whatsapp");
  const showSubject = channel === "email" || channel === "both";
  const [saveState, saveAction, saving] = useActionState(
    mode === "create"
      ? createTemplate
      : (prev: ActionResult | null, formData: FormData) => updateTemplate(template!.id, prev, formData),
    initial,
  );

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold">{mode === "create" ? "תבנית חדשה" : "עריכת תבנית"}</h2>
        {mode === "edit" && template ? <TemplateActions template={template} /> : null}
      </div>

      <form action={saveAction} className="space-y-3">
        <label className="block text-sm">
          שם
          <input name="name" required defaultValue={template?.name ?? ""} className={inputClass} />
        </label>
        <label className="block text-sm">
          ערוץ
          <select
            name="channel"
            value={channel}
            onChange={(event) => setChannel(event.target.value as TemplateChannel)}
            className={inputClass}
          >
            {TEMPLATE_CHANNELS.map((value) => (
              <option key={value} value={value}>
                {TEMPLATE_CHANNEL_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {showSubject ? (
          <label className="block text-sm">
            נושא (מייל)
            <input
              name="subject"
              required
              defaultValue={template?.subject ?? ""}
              className={inputClass}
            />
          </label>
        ) : null}
        <label className="block text-sm">
          גוף
          <textarea
            name="body"
            required
            rows={16}
            defaultValue={template?.body ?? ""}
            className={inputClass}
          />
        </label>
        <PlaceholdersHelp />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "שומר…" : mode === "create" ? "יצירת תבנית" : "שמירת תבנית"}
        </button>
        <Result state={saveState} />
      </form>
    </section>
  );
}

function TemplateActions({ template }: { template: OutreachTemplate }) {
  const [dupState, dupAction, duplicating] = useActionState(async () => duplicateTemplate(template.id), initial);
  const [defaultState, defaultAction, settingDefault] = useActionState(
    async () => setDefaultTemplate(template.id),
    initial,
  );
  const [deleteState, deleteAction, deleting] = useActionState(async () => {
    const confirmed = window.confirm("למחוק את התבנית? הפעולה אינה הפיכה.");
    if (!confirmed) return { ok: false, error: "בוטל" } satisfies ActionResult;
    return deleteTemplate(template.id);
  }, initial);

  return (
    <div className="flex flex-wrap gap-2">
      <form action={dupAction}>
        <button
          type="submit"
          disabled={duplicating}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-card disabled:opacity-60"
        >
          {duplicating ? "משכפל…" : "שכפול"}
        </button>
      </form>
      {template.is_default ? (
        <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-900">ברירת מחדל</span>
      ) : (
        <form action={defaultAction}>
          <button
            type="submit"
            disabled={settingDefault}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-card disabled:opacity-60"
          >
            {settingDefault ? "מגדיר…" : "הגדר כברירת מחדל"}
          </button>
        </form>
      )}
      <form action={deleteAction}>
        <button
          type="submit"
          disabled={deleting}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? "מוחק…" : "מחיקה"}
        </button>
      </form>
      <div className="basis-full">
        <Result state={dupState} />
        <Result state={defaultState} />
        <Result state={deleteState} />
      </div>
    </div>
  );
}

function PlaceholdersHelp() {
  return (
    <details className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium">מצייני מקום</summary>
      <p className="mt-2 text-xs text-muted">
        בכרטיס ליד המערכת ממלאת את אלה מנתוני הליד. {`{{greeting}}`} כבר כולל ״שלום״ ושם פרטי.
      </p>
      <ul className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
        {TEMPLATE_PLACEHOLDERS.map((name) => (
          <li key={name} dir="ltr" className="font-mono">
            {`{{${name}}}`}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) return <p className="text-sm text-brand-dark">{state.message ?? "בוצע"}</p>;
  return <p className="text-sm text-red-700">{state.error}</p>;
}
