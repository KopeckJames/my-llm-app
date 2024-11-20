import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import ChatInterface from '../components/ChatInterface';

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <ChatInterface />
    </div>
  );
}