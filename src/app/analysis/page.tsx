"use client";

import React from 'react';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ResumeAnalysis } from '@/components/ResumeAnalysis';

export default function AnalysisPage() {
  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Resume Analysis</h1>
      <ResumeAnalysis />
    </div>
  );
}