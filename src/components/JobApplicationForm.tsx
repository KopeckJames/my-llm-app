"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from './ui/use-toast';

const JobApplicationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dateOfApplication: new Date().toISOString().split('T')[0],
    company: '',
    jobDescription: '',
    resumeUsed: '',
    status: 'applied',
    notes: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      toast({
        title: 'Success',
        description: 'Job application saved successfully',
      });

      setFormData({
        dateOfApplication: new Date().toISOString().split('T')[0],
        company: '',
        jobDescription: '',
        resumeUsed: '',
        status: 'applied',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting job application:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job application',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dateOfApplication">Date of Application</Label>
        <Input
          type="date"
          id="dateOfApplication"
          name="dateOfApplication"
          value={formData.dateOfApplication}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea
          id="jobDescription"
          name="jobDescription"
          value={formData.jobDescription}
          onChange={handleChange}
          required
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumeUsed">Resume Used</Label>
        <Input
          type="text"
          id="resumeUsed"
          name="resumeUsed"
          value={formData.resumeUsed}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          value={formData.status}
          onValueChange={(value) => handleChange({ name: 'status', value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="behavioral">Behavioral</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Application"}
      </Button>
    </form>
  );
};

export default JobApplicationForm;