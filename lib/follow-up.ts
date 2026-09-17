import {
  CRM_TIMEZONE,
  FOLLOW_UP_DAYS_AFTER_SEND,
  FOLLOW_UP_WAITING_STATUSES,
  type OutreachChannel,
} from "@/lib/constants";
import type { Lead } from "@/lib/types";

/**
 * Advance `from` by `days` calendar days, keeping the UTC clock time.
 * Example: Thursday 14:30 UTC + 3 days → Sunday 14:30 UTC.
 * This is not business-day skipping and does not use a local civil calendar.
 */
export function addCalendarDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function computeFollowUpAt(
  from = new Date(),
  days = FOLLOW_UP_DAYS_AFTER_SEND,
): Date {
  return addCalendarDays(from, days);
}

export function civilDateInTimeZone(date: Date, timeZone = CRM_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const asUtc = Date.UTC(
    num("year"),
    num("month") - 1,
    num("day"),
    num("hour"),
    num("minute"),
    num("second"),
  );
  return asUtc - date.getTime();
}

function addDaysToYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

/** Local midnight for a YYYY-MM-DD civil date in `timeZone`. */
export function startOfZonedDay(ymd: string, timeZone = CRM_TIMEZONE): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0);
  const first = utcMidnight - timeZoneOffsetMs(new Date(utcMidnight), timeZone);
  const adjusted =
    Date.UTC(year, month - 1, day, 0, 0, 0) - timeZoneOffsetMs(new Date(first), timeZone);
  return new Date(adjusted);
}

/** Exclusive upper bound for "today or overdue" in the CRM timezone. */
export function startOfTomorrow(now = new Date(), timeZone = CRM_TIMEZONE): Date {
  const today = civilDateInTimeZone(now, timeZone);
  return startOfZonedDay(addDaysToYmd(today, 1), timeZone);
}

export function isWaitingFollowUpStatus(status: string): boolean {
  return (FOLLOW_UP_WAITING_STATUSES as readonly string[]).includes(status);
}

/**
 * True when follow_up_at falls on today or earlier (Asia/Jerusalem civil date)
 * and the lead is still waiting (status נשלח).
 */
export function needsFollowUp(
  lead: Pick<Lead, "follow_up_at" | "status">,
  now = new Date(),
  timeZone = CRM_TIMEZONE,
): boolean {
  if (!lead.follow_up_at || !isWaitingFollowUpStatus(lead.status)) return false;
  const due = new Date(lead.follow_up_at);
  if (Number.isNaN(due.getTime())) return false;
  return civilDateInTimeZone(due, timeZone) <= civilDateInTimeZone(now, timeZone);
}

function channelPhrase(channel: OutreachChannel): string {
  if (channel === "whatsapp") return "בוואטסאפ";
  if (channel === "email") return "במייל";
  return "";
}

export function formatFollowUpNoteDate(at: Date, timeZone = CRM_TIMEZONE): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(at);
}

export function appendSentNote(
  existing: string | null | undefined,
  channel: OutreachChannel,
  at = new Date(),
): string {
  const via = channelPhrase(channel);
  const line = via
    ? `סומן כנשלח ${via} (${formatFollowUpNoteDate(at)})`
    : `סומן כנשלח (${formatFollowUpNoteDate(at)})`;
  const base = existing?.trim();
  return base ? `${base}\n${line}` : line;
}

export function markSentPayload(options: {
  now?: Date;
  channel: OutreachChannel;
  warmingNotes: string | null | undefined;
}) {
  const now = options.now ?? new Date();
  return {
    status: "נשלח" as const,
    last_contacted_at: now.toISOString(),
    follow_up_at: computeFollowUpAt(now).toISOString(),
    warming_notes: appendSentNote(options.warmingNotes, options.channel, now),
  };
}
