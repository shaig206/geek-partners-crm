import { TemplatesManager } from "@/components/templates-manager";
import { requireUser } from "@/lib/auth";
import type { OutreachTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "תבניות",
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string }>;
}) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const { data, error } = await supabase
    .from("outreach_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const templates = (data ?? []) as OutreachTemplate[];
  const isNew = params.new === "1";
  const selectedId = params.id?.trim() || null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">תבניות</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          איך זה עובד: כרטיס ליד מרכיב טיוטת וואטסאפ ומייל מתבנית ברירת המחדל לאותו ערוץ, וממלא
          מצייני מקום לפי שם, עיר, קטגוריה ונקודות מהשטח (למה מפגר / פער מול מתחרים). אם אין תבנית
          ברירת מחדל — נעשה שימוש בנוסח המובנה במערכת.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error.message.includes("outreach_templates")
            ? "טבלת התבניות עדיין לא קיימת. אחרי המיזוג הריצו supabase db push (או הדביקו את קובץ המיגרציה ב-SQL editor)."
            : error.message}
        </p>
      ) : (
        <TemplatesManager templates={templates} selectedId={selectedId} isNew={isNew} />
      )}
    </div>
  );
}
