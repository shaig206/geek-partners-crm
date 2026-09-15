"use client";

import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
      >
        יציאה
      </button>
    </form>
  );
}
