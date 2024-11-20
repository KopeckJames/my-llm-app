export type DocumentType = 'resume' | 'job_description';

export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  name: string;
  content: string;
  uploadedAt: Date;
  metadata?: {
    fileType?: string;
    size?: number;
    summary?: string;
  };
}