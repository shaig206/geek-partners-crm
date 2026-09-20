/**
 * Paths that skip magic-link login in `proxy.ts` / `updateSession`.
 * Keep `/workshop` here so the landing page and its form POST stay public
 * even when `LOCAL_NO_AUTH` is unset.
 */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/webhooks/") ||
    pathname === "/workshop" ||
    pathname.startsWith("/workshop/")
  );
}
