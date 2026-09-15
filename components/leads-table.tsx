import Link from "next/link";
import { BusinessTypeBadge, LagBadge, StatusBadge } from "@/components/badges";
import type { Lead } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function LeadsTable({ leads }: { leads: Lead[] }) {
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
            <th className="px-3 py-2 font-medium">שם</th>
            <th className="px-3 py-2 font-medium">קטגוריה</th>
            <th className="px-3 py-2 font-medium">סוג</th>
            <th className="px-3 py-2 font-medium">פיגור</th>
            <th className="px-3 py-2 font-medium">סטטוס</th>
            <th className="px-3 py-2 font-medium">מייל</th>
            <th className="px-3 py-2 font-medium">נמצא</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const highLag = (lead.lag_score ?? 0) >= 4;
            return (
              <tr
                key={lead.id}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-background/80",
                  highLag && "bg-orange-50/60",
                  lead.business_type === "B2C" && "border-s-4 border-s-brand",
                )}
              >
                <td className="px-3 py-2.5">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:text-brand">
                    {lead.priority ? "★ " : ""}
                    {lead.name}
                  </Link>
                  <div className="text-xs text-muted">{lead.city}</div>
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
