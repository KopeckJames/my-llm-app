"use client";

import React from "react";
import { JobApplication } from "../types/jobApplication";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

interface JobApplicationListProps {
  applications: JobApplication[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "applied":
      return "bg-blue-100 text-blue-800";
    case "screening":
      return "bg-purple-100 text-purple-800";
    case "technical":
      return "bg-indigo-100 text-indigo-800";
    case "behavioral":
      return "bg-pink-100 text-pink-800";
    case "final":
      return "bg-orange-100 text-orange-800";
    case "offer":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "accepted":
      return "bg-emerald-100 text-emerald-800";
    case "withdrawn":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const JobApplicationList: React.FC<JobApplicationListProps> = ({ applications }) => {
  if (applications.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No job applications to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Job Description</TableHead>
            <TableHead>Resume Used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reference/Referral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app, index) => (
            <TableRow key={app.id || index}>
              <TableCell>{format(new Date(app.dateOfApplication), "MMM d, yyyy")}</TableCell>
              <TableCell className="font-medium">{app.company}</TableCell>
              <TableCell className="max-w-xs truncate">{app.jobDescription}</TableCell>
              <TableCell>{app.resumeUsed}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(app.status)} variant="secondary">
                  {app.status}
                </Badge>
              </TableCell>
              <TableCell>{app.referenceOrReferral}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobApplicationList;
