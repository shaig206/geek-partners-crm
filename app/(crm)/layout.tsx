import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COMPANY, OWNER_NAME } from "@/lib/constants";
import { SignOutButton } from "@/components/sign-out-button";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/leads" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-brand">{COMPANY}</span>
            <span className="text-sm text-muted">CRM</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{OWNER_NAME}</span>
            <span className="max-w-[14rem] truncate text-muted" title={user.email ?? undefined}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
