"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, FileText, LogOut } from 'lucide-react';
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button 
            variant={isActive('/') ? "default" : "ghost"}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
        </Link>
        <Link href="/documents">
          <Button 
            variant={isActive('/documents') ? "default" : "ghost"}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Documents
          </Button>
        </Link>
      </div>
      <Button 
        variant="ghost" 
        onClick={() => signOut()}
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </nav>
  );
}