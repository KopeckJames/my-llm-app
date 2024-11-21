"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { FileText, AlertCircle, CheckCircle, Download, Wand2 } from 'lucide-react';
import type { Document } from '@/types/document';

interface Analysis {
  score: number;
  criteriaScores: {
    keywordMatch: number;
    formatting: number;
    skillsAlignment: number;
    experienceRelevance: number;
  };
  analysis: {
    keywordsFound: string[];
    missingKeywords: string[];
    formattingIssues: string[];
    strengths: string[];
    weaknesses: string[];
  };
  recommendations: string[];
  summary: string;
}

export function ResumeAnalysis() {
  const [resumes, setResumes] = React.useState<Document[]>([]);
  const [jobDescriptions, setJobDescriptions] = React.useState<Document[]>([]);
  const [selectedResume, setSelectedResume] = React.useState<string>('');
  const [selectedJob, setSelectedJob] = React.useState<string>('');
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      if (data.documents) {
        setResumes(data.documents.filter((doc: Document) => doc.type === 'resume'));
        setJobDescriptions(data.documents.filter((doc: Document) => doc.type === 'job_description'));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    }
  };

  const analyzeResume = async () => {
    if (!selectedResume || !selectedJob) {
      toast({
        title: "Error",
        description: "Please select both a resume and a job description",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analysis/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: selectedResume,
          jobDescriptionId: selectedJob,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze resume');
      }

      const data = await response.json();
      setAnalysis(data);
      setOptimizedResumeId(null); // Reset optimized resume when new analysis is done
      toast({
        title: "Analysis Complete",
        description: `Resume score: ${data.score}%`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze resume",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateOptimizedResume = async () => {
    if (!analysis || !selectedResume || !selectedJob) return;

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/analysis/resume/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: selectedResume,
          jobDescriptionId: selectedJob,
          analysis,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate optimized resume');
      }

      const data = await response.json();
      setOptimizedResumeId(data.document.id);
      toast({
        title: "Success",
        description: "Optimized resume has been created",
      });

      // Refresh the documents list to show the new optimized resume
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate optimized resume",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const downloadOptimizedResume = async () => {
    if (!optimizedResumeId) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/documents/${optimizedResumeId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download resume');
      }

      const data = await response.json();
      if (!data.document || !data.document.content) {
        throw new Error('Invalid document data received');
      }

      // Create a blob from the resume content
      const blob = new Blob([data.document.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.document.name}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Resume downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download resume",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Resume Analysis</CardTitle>
          <CardDescription>
            Compare your resume against a job description for ATS optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Resume</label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Job Description</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job description" />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={analyzeResume} 
            disabled={isAnalyzing || !selectedResume || !selectedJob}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {analysis.score >= 90 ? (
                  <CheckCircle className="text-green-500" />
                ) : (
                  <AlertCircle className="text-yellow-500" />
                )}
                <CardTitle>Analysis Results</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={generateOptimizedResume}
                  disabled={isOptimizing}
                  variant="outline"
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  {isOptimizing ? 'Generating...' : 'Generate Optimized Resume'}
                </Button>
                {optimizedResumeId && (
                  <Button
                    onClick={downloadOptimizedResume}
                    disabled={isDownloading}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download Optimized Resume'}
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              Overall ATS Score: {analysis.score}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Score Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(analysis.criteriaScores).map(([key, score]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Keywords Found</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.analysis.keywordsFound.map((keyword, i) => (
                    <li key={i} className="text-sm text-green-600">{keyword}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Missing Keywords</h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.analysis.missingKeywords.map((keyword, i) => (
                    <li key={i} className="text-sm text-red-600">{keyword}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Summary</h3>
              <p className="text-sm">{analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
