"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/components/SignOutButton";
import { Toaster } from "@/components/ui/toaster";

export function RootLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <ThemeProvider>
      <AuthProvider session={session}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
              <Navigation />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}