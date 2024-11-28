export type InterviewStatus = 
  | 'applied'
  | 'screening'
  | 'technical'
  | 'behavioral'
  | 'final'
  | 'offer'
  | 'rejected'
  | 'accepted'
  | 'withdrawn';

export interface Interview {
  id?: string;
  date: Date;
  type: 'screening' | 'technical' | 'behavioral' | 'final';
  interviewers: string[];
  questions: string[];
  notes: string;
  recordingUrl?: string;
  summary?: string;
}

export interface JobApplication {
  id?: string;
  userId?: string;
  dateOfApplication: Date;
  company: string;
  jobDescription: string;
  resumeUsed: string;
  referenceOrReferral: string;
  status: InterviewStatus;
  interviews: Interview[];
  nextInterviewDate?: Date;
  salary?: {
    min?: number;
    max?: number;
    offered?: number;
    currency?: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
  notes: string;
  created
  updatedAt?: Date;
}