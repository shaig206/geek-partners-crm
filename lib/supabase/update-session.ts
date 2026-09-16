import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, isLocalNoAuth, isSupabaseConfigured } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (isLocalNoAuth()) {
    return supabaseResponse;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const pathname = request.nextUrl.pathname;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/webhooks/");

  const missingEnvRedirect = () => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "missing_env");
    return NextResponse.redirect(loginUrl);
  };

  if (!isSupabaseConfigured() || !url || !anonKey) {
    return isPublic ? supabaseResponse : missingEnvRedirect();
  }

  let user: { id: string } | null = null;
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    });

    // Do not run code between createServerClient and getUser().
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return isPublic ? supabaseResponse : missingEnvRedirect();
  }

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname.startsWith("/login")) {
    const home = request.nextUrl.clone();
    home.pathname = "/leads";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return supabaseResponse;
}
