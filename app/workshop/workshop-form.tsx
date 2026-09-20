"use client";

import { useActionState, useState } from "react";
import { registerWorkshop } from "@/app/actions/workshop";
import { WORKSHOP_THANKS_BODY, WORKSHOP_THANKS_TITLE } from "@/lib/workshop";
import type { ActionResult } from "@/lib/types";

const initial: ActionResult | null = null;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-inset px-3.5 py-2.5 text-sm text-foreground outline-none ring-brand transition-shadow placeholder:text-muted/80 focus:border-brand focus:ring-2";

export function WorkshopForm() {
  const [state, action, pending] = useActionState(registerWorkshop, initial);
  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (state?.ok === true) {
    return (
      <div
        className="rounded-xl border border-brand/20 bg-brand-soft px-4 py-5 text-brand-dark"
        role="status"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-foreground">{WORKSHOP_THANKS_TITLE}</p>
        <p className="mt-2 text-sm leading-6 text-secondary">{WORKSHOP_THANKS_BODY}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        שם מלא
        <input
          name="contact_name"
          type="text"
          required
          autoComplete="name"
          value={contactName}
          onChange={(event) => setContactName(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-foreground">
        שם העסק
        <input
          name="business_name"
          type="text"
          autoComplete="organization"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          מייל
          <input
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="name@business.com"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          וואטסאפ / טלפון
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
            placeholder="050-0000000"
          />
        </label>
      </div>
      <p className="text-xs leading-5 text-muted">
        מספיק אחד משני אמצעי הקשר — מייל או וואטסאפ/טלפון.
      </p>
      {state?.ok === false ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="workshop-cta-glow w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {pending ? "שולחים…" : "הרשמה לסדנה"}
      </button>
    </form>
  );
}
