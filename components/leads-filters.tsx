"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BUSINESS_STATUSES,
  BUSINESS_TYPES,
  LAG_SCORES,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  SORT_OPTIONS,
} from "@/lib/constants";
import { CHANNEL_BUCKETS, CHANNEL_BUCKET_LABELS } from "@/lib/channels";

export function LeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      key={searchParams.toString()}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        update({
          q: String(form.get("q") ?? "").trim(),
          status: String(form.get("status") ?? ""),
          business_status: String(form.get("business_status") ?? ""),
          channel: String(form.get("channel") ?? ""),
          type: String(form.get("type") ?? ""),
          lag: String(form.get("lag") ?? ""),
          sort: String(form.get("sort") ?? ""),
          follow_up: form.get("follow_up") === "1" ? "1" : "",
        });
      }}
    >
      <label className="text-sm lg:col-span-2">
        חיפוש
        <input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="שם, מייל, טלפון, קטגוריה"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm">
        סטטוס
        <select
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">הכול</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        סטטוס עסקי
        <select
          name="business_status"
          defaultValue={searchParams.get("business_status") ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">הכול</option>
          {BUSINESS_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        ערוץ
        <select
          name="channel"
          defaultValue={searchParams.get("channel") ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">הכול</option>
          {CHANNEL_BUCKETS.map((bucket) => (
            <option key={bucket} value={bucket}>
              {CHANNEL_BUCKET_LABELS[bucket]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        סוג
        <select
          name="type"
          defaultValue={searchParams.get("type") ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">B2C / B2B</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        ציון פיגור
        <select
          name="lag"
          defaultValue={searchParams.get("lag") ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">הכול</option>
          {LAG_SCORES.map((score) => (
            <option key={score} value={String(score)}>
              {score}+
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        מעקב
        <span className="mt-1 flex min-h-[38px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm">
          <input
            type="checkbox"
            name="follow_up"
            value="1"
            defaultChecked={searchParams.get("follow_up") === "1"}
            className="size-4 accent-brand"
          />
          צריך מעקב
        </span>
      </label>
      <label className="text-sm lg:col-span-2">
        מיון
        <select
          name="sort"
          defaultValue={searchParams.get("sort") ?? "lag_desc"}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          סינון
        </button>
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-background"
          onClick={() => router.push(pathname)}
        >
          איפוס
        </button>
      </div>
    </form>
  );
}
