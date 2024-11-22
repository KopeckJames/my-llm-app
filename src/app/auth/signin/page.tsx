"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="w-[200px]"
      >
        Sign in with Google
      </Button>
    </div>
  );
}
