"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="text-foreground/60 transition-colors hover:text-foreground/80"
    >
      Sign Out
    </button>
  );
}
