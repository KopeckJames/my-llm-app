"use client";

import React from 'react';
import { Upload, FileText, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentType } from '@/types/document';

export function DocumentUpload() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [docType, setDocType] = React.useState<DocumentType>('resume');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resume" onValueChange={(value) => setDocType(value as DocumentType)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resume" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="job_description" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Description
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="resume">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload your resume in PDF, DOC, DOCX, or TXT format.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="job_description">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a job description to compare with your resume.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-sm text-muted-foreground">
          Supported formats: PDF, DOC, DOCX, TXT
        </div>
      </CardContent>
    </Card>
  );
}