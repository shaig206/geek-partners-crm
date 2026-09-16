import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isLocalNoAuth } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const LOCAL_USER_ID = "00000000-0000-4000-8000-000000000001";
export const LOCAL_USER_EMAIL = "local@localhost";

function localUser(): User {
  return {
    id: LOCAL_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: LOCAL_USER_EMAIL,
    app_metadata: { provider: "local", providers: ["local"] },
    user_metadata: { local_no_auth: true },
    created_at: "2020-01-01T00:00:00.000Z",
  };
}

async function localDataClient() {
  // RLS only allows the `authenticated` role. With no magic-link session,
  // use the existing server-only service-role client so DB reads/writes work.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return createClient();
}

export async function requireUser() {
  if (isLocalNoAuth()) {
    return { supabase: await localDataClient(), user: localUser() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}
