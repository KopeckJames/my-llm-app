import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RootLayoutClient } from "@/components/RootLayoutClient";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cogntools",
  description: "AI-powered interview practice and feedback",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayoutClient session={session}>{children}</RootLayoutClient>
      </body>
    </html>
  );
}