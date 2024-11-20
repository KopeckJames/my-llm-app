import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentList } from '@/components/DocumentList';

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Document Management</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <DocumentUpload />
        <DocumentList />
      </div>
    </div>
  );
}