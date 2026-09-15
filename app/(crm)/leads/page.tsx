import Link from "next/link";
import { Suspense } from "react";
import { LeadsFilters } from "@/components/leads-filters";
import { LeadsTable } from "@/components/leads-table";
import { requireUser } from "@/lib/auth";
import type { SortValue } from "@/lib/constants";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

function sortLeads(sort: string | undefined) {
  const value = (sort ?? "lag_desc") as SortValue;
  switch (value) {
    case "lag_asc":
      return { column: "lag_score", ascending: true };
    case "name_asc":
      return { column: "name", ascending: true };
    case "found_desc":
      return { column: "found_at", ascending: false };
    case "created_desc":
      return { column: "created_at", ascending: false };
    case "priority_desc":
      return { column: "priority", ascending: false };
    case "lag_desc":
    default:
      return { column: "lag_score", ascending: false };
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    lag?: string;
    sort?: string;
  }>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const { column, ascending } = sortLeads(params.sort);

  let query = supabase.from("leads").select("*").order(column, { ascending, nullsFirst: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.type) query = query.eq("business_type", params.type);
  if (params.lag) {
    const minLag = Number(params.lag);
    if (Number.isInteger(minLag)) query = query.gte("lag_score", minLag);
  }
  if (params.q?.trim()) {
    const q = params.q.trim().replace(/[%(),]/g, "");
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,contact_name.ilike.%${q}%`,
      );
    }
  }

  const { data, error } = await query;
  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">לידים</h1>
          <p className="mt-1 text-sm text-muted">פרדס חנה-כרכור · חיפוש, סינון ומיון</p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          ליד חדש
        </Link>
      </div>

      <Suspense>
        <LeadsFilters />
      </Suspense>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error.message}</p>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
