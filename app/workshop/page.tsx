import type { Metadata } from "next";
import {
  COMPANY,
  COMPANY_DOMAIN,
  OWNER_NAME,
} from "@/lib/constants";
import {
  WORKSHOP_ADDRESS,
  WORKSHOP_AGENDA,
  WORKSHOP_DATE,
  WORKSHOP_HEADLINE,
  WORKSHOP_LEDE,
  WORKSHOP_TIME,
} from "@/lib/workshop";
import { WorkshopForm } from "./workshop-form";

export const metadata: Metadata = {
  title: "סדנת טכנולוגיה ו-AI",
  description: WORKSHOP_LEDE,
};

export default function WorkshopPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-2xl items-baseline justify-between gap-4 px-4 py-4">
          <p className="text-lg font-semibold tracking-tight text-brand">{COMPANY}</p>
          <p className="text-sm text-muted">{COMPANY_DOMAIN}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
        <p className="text-sm font-medium text-brand">סדנה לעסקים בינוניים</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight leading-snug sm:text-4xl">
          {WORKSHOP_HEADLINE}
        </h1>
        <p className="mt-4 text-base leading-7 text-foreground sm:text-lg sm:leading-8">
          {WORKSHOP_LEDE}
        </p>

        <section
          aria-labelledby="workshop-when"
          className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <h2 id="workshop-when" className="text-sm font-semibold">
            מתי ואיפה
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">תאריך</dt>
              <dd className="mt-1 font-medium">{WORKSHOP_DATE}</dd>
            </div>
            <div>
              <dt className="text-muted">שעה</dt>
              <dd className="mt-1 font-medium">{WORKSHOP_TIME}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-muted">כתובת</dt>
              <dd className="mt-1 font-medium">{WORKSHOP_ADDRESS}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="workshop-agenda" className="mt-8">
          <h2 id="workshop-agenda" className="text-sm font-semibold">
            מה בפנים
          </h2>
          <ol className="mt-4 space-y-3">
            {WORKSHOP_AGENDA.map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 shadow-sm"
              >
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="workshop-register"
          className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <h2 id="workshop-register" className="text-lg font-semibold tracking-tight">
            הרשמה
          </h2>
          <p className="mt-1 mb-5 text-sm leading-6 text-muted">
            מלאו פרטים קצרים. נשמור אותם אצלנו ונחזור אליכם לקראת המפגש.
          </p>
          <WorkshopForm />
        </section>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-2xl px-4 py-5 text-sm text-muted">
          {OWNER_NAME} · {COMPANY} · {COMPANY_DOMAIN}
        </p>
      </footer>
    </div>
  );
}
