"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";
import { buildWorkshopLead, workshopFieldsFromForm } from "@/lib/workshop";

/**
 * Public workshop registration. Uses the service-role client so the insert
 * works without a logged-in session (RLS is authenticated-only).
 */
export async function registerWorkshop(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const built = buildWorkshopLead(workshopFieldsFromForm(formData));
  if (!built.ok) return built;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "missing_env";
    console.error("[workshop-register]", message);
    return { ok: false, error: "ההרשמה אינה זמינה כרגע. נסו שוב מאוחר יותר." };
  }

  const { error } = await admin.from("leads").insert(built.payload);
  if (error) {
    console.error("[workshop-register]", error.message);
    return { ok: false, error: "לא הצלחנו לשמור את ההרשמה. נסו שוב." };
  }

  revalidatePath("/leads");
  return { ok: true, message: "נרשמתם" };
}
