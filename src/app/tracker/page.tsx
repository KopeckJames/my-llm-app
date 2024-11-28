"use client";

import React, { useEffect, useState } from 'react';
import JobApplicationForm from '../../components/JobApplicationForm';
import JobApplicationList from '../../components/JobApplicationList';
import { JobApplication } from '../../types/jobApplication';
import { toast } from '@/components/ui/use-toast';

const TrackerPage = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/job-applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job applications',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const addApplication = (application: JobApplication) => {
    setApplications(prev => [...prev, application]);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Job Application Tracker</h1>
        <div className="mt-4">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Job Application Tracker</h1>
      <JobApplicationForm onSubmit={addApplication} />
      <JobApplicationList applications={applications} />
    </div>
  );
};

export default TrackerPage;