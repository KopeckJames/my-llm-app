import './globals.css';
import { Inter } from 'next/font/google';
import { getServerSession } from "next-auth/next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";
import { authOptions } from "./api/auth/[...nextauth]/route";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LLM Tools Platform',
  description: 'A platform for LLM-powered tools',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico'
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <AuthProvider session={session}>
          {session && <Navigation />}
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
