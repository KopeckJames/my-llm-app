import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';

export default async function DocumentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Document Management</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <DocumentUpload />
        <DocumentList />
      </div>
    </div>
  );
}