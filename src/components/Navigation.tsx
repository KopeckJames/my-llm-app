"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, FileText, ChartBar, LogOut } from 'lucide-react';
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      path: '/chat',
      label: 'Chat',
      icon: <MessageSquare className="w-4 h-4" />
    },
    {
      path: '/documents',
      label: 'Documents',
      icon: <FileText className="w-4 h-4" />
    },
    {
      path: '/analysis',
      label: 'Analysis',
      icon: <ChartBar className="w-4 h-4" />
    }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <div className="hidden md:flex">
            {navItems.map((item) => (
              <Link href={item.path} key={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
          {/* Mobile Navigation */}
          <div className="flex md:hidden">
            {navItems.map((item) => (
              <Link href={item.path} key={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                >
                  {item.icon}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}