"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ChatInterface />
    </div>
  );
}