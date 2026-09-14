import { sendMagicLink } from "@/app/actions/auth";
import { APP_NAME, COMPANY, COMPANY_DOMAIN, OWNER_NAME } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";

const ERROR_COPY: Record<string, string> = {
  missing_email: "יש להזין כתובת מייל.",
  missing_env: "חסרים משתני סביבה של Supabase. ראו .env.example.",
  auth_callback: "הקישור לא תקף או שפג תוקפו. נסו שוב.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const errorText = params.error
    ? (ERROR_COPY[params.error] ?? decodeURIComponent(params.error))
    : null;

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-brand">{COMPANY}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-muted">
          {OWNER_NAME} · {COMPANY_DOMAIN}
        </p>
        <p className="mt-6 text-sm leading-6 text-foreground">
          התחברות בקישור קסם למייל. משתמש יחיד מספיק ל־v1.
        </p>

        {params.sent === "1" ? (
          <p className="mt-6 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
            נשלח קישור התחברות למייל. בדקו גם בספאם.
          </p>
        ) : null}

        {errorText ? (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{errorText}</p>
        ) : null}

        {!configured ? (
          <p className="mt-6 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            המערכת עדיין בלי מפתחות Supabase. העתיקו את <code>.env.example</code> ל־
            <code>.env.local</code> והגדירו פרויקט.
          </p>
        ) : null}

        <form action={sendMagicLink} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            מייל
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none ring-brand focus:ring-2"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="shai@geek.partners"
              disabled={!configured}
            />
          </label>
          <button
            type="submit"
            disabled={!configured}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            שלחו קישור התחברות
          </button>
        </form>
      </div>
    </div>
  );
}
