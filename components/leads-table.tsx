import Link from "next/link";
import {
  BusinessStatusBadge,
  BusinessTypeBadge,
  ChannelBadges,
  LagBadge,
  NeedsFollowUpBadge,
  StatusBadge,
} from "@/components/badges";
import { WhatsAppListLink } from "@/components/whatsapp-list-link";
import { needsFollowUp } from "@/lib/follow-up";
import {
  LEAD_TABLE_SORT_COLUMNS,
  nextSortValue,
  parseSort,
  sortHeaderHref,
  type LeadsSearchParams,
  type SortKey,
} from "@/lib/sort";
import type { Lead } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

function SortHeader({
  column,
  label,
  query,
}: {
  column: SortKey;
  label: string;
  query: LeadsSearchParams;
}) {
  const current = parseSort(query.sort);
  const active = current.key === column;
  const href = sortHeaderHref(query, column);
  const ariaSort = active ? (current.dir === "asc" ? "ascending" : "descending") : "none";
  const nextDir = parseSort(nextSortValue(query.sort, column)).dir;
  const nextHint = nextDir === "asc" ? "סדר עולה" : "סדר יורד";
  const currentHint = current.dir === "asc" ? "סדר עולה" : "סדר יורד";

  return (
    <th className="p-0 font-medium" scope="col" aria-sort={ariaSort}>
      <Link
        href={href}
        scroll={false}
        className={cn(
          "inline-flex w-full items-center gap-1 whitespace-nowrap px-3 py-2 hover:text-foreground",
          active && "text-foreground",
        )}
        title={`${label} — ${nextHint}`}
        aria-label={
          active ? `מיון לפי ${label}, ${currentHint}. לחצו ל${nextHint}` : `מיון לפי ${label}`
        }
      >
        <span>{label}</span>
        {active ? (
          <span className="text-[0.65rem] leading-none text-foreground" aria-hidden="true">
            {current.dir === "asc" ? "▲" : "▼"}
          </span>
        ) : null}
      </Link>
    </th>
  );
}

export function LeadsTable({
  leads,
  query,
  whatsappTemplateBody,
}: {
  leads: Lead[];
  query: LeadsSearchParams;
  whatsappTemplateBody?: string | null;
}) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-medium">אין לידים מתאימים</p>
        <p className="mt-1 text-sm text-muted">שנו את הסינון או הוסיפו ליד חדש.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full text-right text-sm">
        <thead className="border-b border-border bg-background/70 text-muted">
          <tr>
            {LEAD_TABLE_SORT_COLUMNS.map((column) => (
              <SortHeader key={column.key} column={column.key} label={column.label} query={query} />
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const highLag = (lead.lag_score ?? 0) >= 4;
            const dueFollowUp = needsFollowUp(lead);
            return (
              <tr
                key={lead.id}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-background/80",
                  dueFollowUp && "bg-amber-50/80",
                  highLag && !dueFollowUp && "bg-orange-50/60",
                  lead.business_type === "B2C" && "border-s-4 border-s-brand",
                )}
              >
                <td className="px-3 py-2.5">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:text-brand">
                    {lead.priority ? "★ " : ""}
                    {lead.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{lead.city}</span>
                    <WhatsAppListLink lead={lead} templateBody={whatsappTemplateBody} />
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted">{lead.category ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <BusinessTypeBadge type={lead.business_type} />
                </td>
                <td className="px-3 py-2.5">
                  <LagBadge score={lead.lag_score} />
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-3 py-2.5">
                  <BusinessStatusBadge status={lead.business_status} />
                </td>
                <td className="px-3 py-2.5">
                  <ChannelBadges phone={lead.phone} email={lead.email} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="space-y-1">
                    {needsFollowUp(lead) ? <NeedsFollowUpBadge /> : null}
                    <span className="text-muted">{formatDate(lead.follow_up_at)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted">{lead.email ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted">{formatDate(lead.found_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
