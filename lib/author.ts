import type { User } from "@supabase/supabase-js";
import { LOCAL_USER_EMAIL } from "@/lib/auth";
import { OWNER_NAME } from "@/lib/constants";
import { isLocalNoAuth } from "@/lib/env";

export type NoteAuthor = {
  email: string;
  name: string;
};

/** Who to stamp on a note. LOCAL_NO_AUTH is always שי גלבוע / local@localhost. */
export function authorFromUser(user: User): NoteAuthor {
  if (isLocalNoAuth() || user.email === LOCAL_USER_EMAIL) {
    return { email: LOCAL_USER_EMAIL, name: OWNER_NAME };
  }

  const meta = user.user_metadata ?? {};
  const fullName = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  const email = user.email?.trim() || "unknown@localhost";

  return {
    email,
    name: fullName || name || email,
  };
}

export function leadNoteRow(leadId: string, author: NoteAuthor, body: string) {
  return {
    lead_id: leadId,
    body,
    author_email: author.email,
    author_name: author.name,
  };
}

export function sentActivityNote(channel: "whatsapp" | "email" | "other"): string {
  if (channel === "whatsapp") return "סומן כנשלח בוואטסאפ. הסטטוס עודכן לנוצר קשר.";
  if (channel === "email") return "סומן כנשלח במייל. הסטטוס עודכן לנוצר קשר.";
  return "סומן כנשלח. הסטטוס עודכן לנוצר קשר.";
}
