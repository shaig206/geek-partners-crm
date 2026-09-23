import { CHANNEL_BUCKETS, channelBucket } from "@/lib/channels";
import {
  BUSINESS_STATUSES,
  BUSINESS_TYPES,
  LEAD_STATUSES,
  SORT_OPTIONS,
  type SortValue,
} from "@/lib/constants";
import type { Lead } from "@/lib/types";

export type SortKey =
  | "lag"
  | "name"
  | "category"
  | "type"
  | "status"
  | "business_status"
  | "channel"
  | "follow_up"
  | "email"
  | "found"
  | "created"
  | "priority";

export type SortDir = "asc" | "desc";

export type ParsedSort = { key: SortKey; dir: SortDir; value: SortValue };

/** Query keys on `/leads` besides `sort`. Preserved when a header changes sort. */
export const LEADS_FILTER_KEYS = [
  "q",
  "status",
  "business_status",
  "channel",
  "type",
  "lag",
  "follow_up",
] as const;

export type LeadsSearchParams = {
  q?: string;
  status?: string;
  business_status?: string;
  channel?: string;
  type?: string;
  lag?: string;
  sort?: string;
  follow_up?: string;
};

export const DEFAULT_SORT: SortValue = "lag_desc";

/** First-click direction when switching to a column. Lag stays high-first. */
export const DEFAULT_SORT_DIR: Record<SortKey, SortDir> = {
  lag: "desc",
  name: "asc",
  category: "asc",
  type: "asc",
  status: "asc",
  business_status: "asc",
  channel: "asc",
  follow_up: "asc",
  email: "asc",
  found: "desc",
  created: "desc",
  priority: "desc",
};

export const LEAD_TABLE_SORT_COLUMNS = [
  { key: "name", label: "שם" },
  { key: "category", label: "קטגוריה" },
  { key: "type", label: "סוג" },
  { key: "lag", label: "פיגור" },
  { key: "status", label: "סטטוס" },
  { key: "business_status", label: "סטטוס עסקי" },
  { key: "channel", label: "ערוץ" },
  { key: "follow_up", label: "מעקב" },
  { key: "email", label: "מייל" },
  { key: "found", label: "נמצא" },
] as const satisfies ReadonlyArray<{ key: SortKey; label: string }>;

const SORT_KEYS = new Set<string>(Object.keys(DEFAULT_SORT_DIR));
const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));
const collator = new Intl.Collator("he", { numeric: true, sensitivity: "base" });

export function isSortValue(value: string): value is SortValue {
  return SORT_VALUES.has(value);
}

export function parseSort(value: string | null | undefined): ParsedSort {
  const raw = value?.trim() ?? "";
  const match = raw.match(/^(.*)_(asc|desc)$/);
  if (match && SORT_KEYS.has(match[1]) && isSortValue(raw)) {
    return { key: match[1] as SortKey, dir: match[2] as SortDir, value: raw };
  }
  return { key: "lag", dir: "desc", value: DEFAULT_SORT };
}

export function nextSortValue(current: string | null | undefined, column: SortKey): SortValue {
  const parsed = parseSort(current);
  const dir =
    parsed.key === column ? (parsed.dir === "asc" ? "desc" : "asc") : DEFAULT_SORT_DIR[column];
  return `${column}_${dir}` as SortValue;
}

export function sortHeaderHref(query: LeadsSearchParams, column: SortKey): string {
  const params = new URLSearchParams();
  for (const key of LEADS_FILTER_KEYS) {
    const value = query[key]?.trim();
    if (value) params.set(key, value);
  }
  params.set("sort", nextSortValue(query.sort, column));
  return `/leads?${params.toString()}`;
}

export function sortLeadsList(leads: Lead[], sort: string | null | undefined): Lead[] {
  const parsed = parseSort(sort);
  return [...leads].sort((a, b) => {
    const cmp = compareLeads(a, b, parsed);
    if (cmp !== 0) return cmp;
    const byName = collator.compare(a.name, b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
}

export function compareLeads(a: Lead, b: Lead, sort: ParsedSort): number {
  return compareValues(sortValue(a, sort.key), sortValue(b, sort.key), sort.dir);
}

function sortValue(lead: Lead, key: SortKey): string | number | null {
  switch (key) {
    case "lag":
      return lead.lag_score;
    case "name":
      return lead.name?.trim() || null;
    case "category":
      return lead.category?.trim() || null;
    case "type":
      return enumIndex(BUSINESS_TYPES, lead.business_type);
    case "status":
      return enumIndex(LEAD_STATUSES, lead.status);
    case "business_status":
      return enumIndex(BUSINESS_STATUSES, lead.business_status);
    case "channel":
      return CHANNEL_BUCKETS.indexOf(channelBucket(lead));
    case "follow_up":
      return dateValue(lead.follow_up_at);
    case "email":
      return lead.email?.trim() || null;
    case "found":
      return dateValue(lead.found_at);
    case "created":
      return dateValue(lead.created_at);
    case "priority":
      return lead.priority ? 1 : 0;
  }
}

function enumIndex(order: readonly string[], value: string | null | undefined): number | null {
  if (!value) return null;
  const index = order.indexOf(value);
  return index === -1 ? null : index;
}

function dateValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function isMissing(value: string | number | null | undefined): boolean {
  return value == null || value === "" || (typeof value === "number" && Number.isNaN(value));
}

/** Nulls / blanks stay last in both directions (matches Supabase `nullsFirst: false`). */
function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  dir: SortDir,
): number {
  const aMissing = isMissing(a);
  const bMissing = isMissing(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  let cmp: number;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b;
  } else {
    cmp = collator.compare(String(a), String(b));
  }
  return dir === "asc" ? cmp : -cmp;
}
