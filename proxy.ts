import { updateSession } from "@/lib/supabase/update-session";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets and the public workshop landing (GET + unauthenticated form POST).
    "/((?!_next/static|_next/image|favicon.ico|workshop|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
