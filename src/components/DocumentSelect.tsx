import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
}

interface DocumentSelectProps {
  type: "resume" | "jobDescription";
  onSelect: (value: string) => void;
}

export function DocumentSelect({ type, onSelect }: DocumentSelectProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        if (data.documents) {
          const filteredDocuments = data.documents.filter((doc: Document) => 
            (type === 'resume' && doc.type === 'resume') || 
            (type === 'jobDescription' && doc.type === 'job_description')
          );
          setDocuments(filteredDocuments);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [type]);

  const label = type === "resume" ? "Resume" : "Job Description";

  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor={type}>{label}</Label>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={type}>{label}</Label>
      <Select onValueChange={onSelect} disabled={isLoading}>
        <SelectTrigger id={type} className="w-full">
          <SelectValue placeholder={
            isLoading 
              ? "Loading..." 
              : documents.length === 0 
                ? `No ${label}s found` 
                : `Select ${label}`
          } />
        </SelectTrigger>
        <SelectContent>
          {documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              {doc.name}
            </SelectItem>
          ))}
          {documents.length === 0 && !isLoading && (
            <div className="p-2 text-sm text-muted-foreground">
              No documents found. Please upload some in the Documents section.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
