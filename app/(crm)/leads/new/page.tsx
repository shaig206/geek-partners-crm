import { createLead } from "@/app/actions/leads";
import { BUSINESS_TYPES, DEFAULT_CITY, LAG_SCORES, LEAD_STATUSES } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/leads" className="text-sm text-muted hover:text-foreground">
          ← חזרה לרשימה
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">ליד חדש</h1>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error === "missing_name" ? "שם העסק חובה." : decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={createLead} className="space-y-4 rounded-xl border border-border bg-card p-5">
        <Field name="name" label="שם העסק" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="contact_name" label="איש קשר" />
          <Field name="phone" label="טלפון" />
          <Field name="email" label="מייל" type="email" />
          <Field name="website" label="אתר" />
          <Field name="category" label="קטגוריה" />
          <Field name="city" label="עיר" defaultValue={DEFAULT_CITY} />
          <label className="text-sm">
            סוג
            <select name="business_type" className={inputClass}>
              <option value="">—</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            ציון פיגור
            <select name="lag_score" className={inputClass}>
              <option value="">—</option>
              {LAG_SCORES.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            סטטוס
            <select name="status" defaultValue="חדש" className={inputClass}>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <Field name="found_at" label="נמצא בתאריך" type="date" />
        </div>
        <Field name="size_signal" label="גודל / אות" />
        <label className="text-sm">
          למה מפגר
          <textarea name="why_lagging" rows={3} className={inputClass} />
        </label>
        <label className="text-sm">
          פער מול מתחרים
          <textarea name="peer_gap" rows={3} className={inputClass} />
        </label>
        <label className="text-sm">
          הערות חימום
          <textarea name="warming_notes" rows={3} className={inputClass} />
        </label>
        <Field name="source_url" label="מקור" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="priority" className="size-4 accent-brand" />
          עדיפות
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          שמירה
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}
