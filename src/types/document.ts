export interface Document {
  id: string;
  name: string;
  type: 'resume' | 'job_description';
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}
