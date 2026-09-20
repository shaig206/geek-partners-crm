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
import { cn } from "@/lib/utils";
import { WorkshopForm } from "./workshop-form";

export const metadata: Metadata = {
  title: "סדנת טכנולוגיה ו-AI",
  description: WORKSHOP_LEDE,
};

const EVENT_CHIPS = [
  { label: "תאריך", value: WORKSHOP_DATE, tone: "brand" },
  { label: "שעה", value: WORKSHOP_TIME, tone: "brand" },
  { label: "מקום", value: WORKSHOP_ADDRESS, tone: "accent" },
] as const;

const AGENDA_WASHES = ["bg-brand-soft", "bg-brand-wash", "bg-accent-soft"] as const;
const AGENDA_MARKS = ["text-brand", "text-brand-dark", "text-accent-dark"] as const;

export default function WorkshopPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <p className="flex min-w-0 items-center gap-2.5">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white"
              aria-hidden="true"
            >
              GP
            </span>
            <span dir="ltr" className="truncate text-[17px] font-bold tracking-tight text-foreground">
              Geek <span className="font-medium text-muted">Partners</span>
            </span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{COMPANY_DOMAIN}</span>
            <a
              href="#workshop-register"
              className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              להרשמה
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="workshop-aurora pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-start lg:gap-12 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-card/80 px-3 py-1 text-sm font-medium text-brand-dark shadow-sm">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              סדנה לעסקים בינוניים
            </p>
            <h1 className="mt-5 text-[clamp(1.85rem,1.2rem+2.4vw,3.15rem)] font-extrabold leading-[1.18] tracking-tight text-foreground text-balance">
              {WORKSHOP_HEADLINE}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-secondary sm:text-lg sm:leading-8">
              {WORKSHOP_LEDE}
            </p>

            <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="מועד ומקום">
              {EVENT_CHIPS.map((chip) => (
                <li key={chip.label}>
                  <EventChip label={chip.label} value={chip.value} tone={chip.tone} />
                </li>
              ))}
            </ul>
          </div>

          <div
            id="workshop-register"
            className="scroll-mt-24 rounded-2xl border border-brand/15 bg-card p-5 shadow-lg shadow-brand/10 ring-1 ring-brand/10 sm:p-7 lg:sticky lg:top-24"
          >
            <p className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
              הרשמה
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
              שמרו מקום בסדנה
            </h2>
            <p className="mt-1.5 mb-5 text-sm leading-6 text-muted">
              מלאו פרטים קצרים. נשמור אותם אצלנו ונחזור אליכם לקראת המפגש.
            </p>
            <WorkshopForm />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="workshop-agenda"
        className="border-b border-border bg-card"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold text-brand">סדר המפגש</p>
          <h2
            id="workshop-agenda"
            className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            מה בפנים
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {WORKSHOP_AGENDA.map((item, index) => (
              <li key={item}>
                <AgendaCard index={index} item={item} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-background">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">
          {OWNER_NAME} · {COMPANY} · {COMPANY_DOMAIN}
        </p>
      </footer>
    </div>
  );
}

function EventChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-col rounded-2xl border px-3.5 py-2.5 shadow-sm sm:flex-row sm:items-baseline sm:gap-2",
        tone === "accent"
          ? "border-accent/25 bg-accent-soft text-accent-dark"
          : "border-brand/20 bg-brand-soft text-brand-dark",
      )}
    >
      <span className="text-[11px] font-semibold tracking-wide opacity-80">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </span>
  );
}

function AgendaCard({ index, item }: { index: number; item: string }) {
  const wash = AGENDA_WASHES[index % AGENDA_WASHES.length];
  const mark = AGENDA_MARKS[index % AGENDA_MARKS.length];

  return (
    <article className={cn("flex h-full flex-col gap-4 rounded-2xl border border-border p-5 shadow-sm", wash)}>
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-xl bg-card text-sm font-extrabold tabular-nums shadow-sm",
          mark,
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="text-sm leading-6 text-foreground sm:text-[15px] sm:leading-7">{item}</p>
    </article>
  );
}
