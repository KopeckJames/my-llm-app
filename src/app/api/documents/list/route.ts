import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch resumes and job descriptions from the database
    const [resumes, jobDescriptions] = await Promise.all([
      prisma.document.findMany({
        where: {
          type: "RESUME",
        },
        select: {
          id: true,
          name: true,
          content: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.document.findMany({
        where: {
          type: "JOB_DESCRIPTION",
        },
        select: {
          id: true,
          name: true,
          content: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    return NextResponse.json({
      resumes,
      jobDescriptions
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
