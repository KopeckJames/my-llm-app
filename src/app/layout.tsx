import './globals.css';
import { Inter } from 'next/font/google';
import { getServerSession } from "next-auth/next";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LLM Tools Platform',
  description: 'A platform for LLM-powered tools',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}