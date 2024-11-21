import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import OpenAI from 'openai';
import { getStorage } from '@/lib/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPTIMIZE_PROMPT = `You are an expert resume writer. Given the original resume and job description, create an optimized version of the resume that:
1. Incorporates relevant keywords from the job description
2. Maintains professional formatting
3. Highlights relevant experience and skills
4. Quantifies achievements where possible
5. Follows ATS-friendly formatting best practices

Original Resume:
{resume}

Job Description:
{jobDescription}

Analysis Results:
{analysis}

Please provide the optimized resume in a clear, ATS-friendly format. Maintain the candidate's truthful experience while optimizing the presentation and keywords.`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId, jobDescriptionId, analysis } = await req.json();

    // Get documents from storage
    const storage = getStorage();
    const resume = await storage.getDocument(resumeId);
    const jobDescription = await storage.getDocument(jobDescriptionId);

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Documents not found' }, { status: 404 });
    }

    // Generate optimized resume
    const prompt = OPTIMIZE_PROMPT
      .replace('{resume}', resume.content)
      .replace('{jobDescription}', jobDescription.content)
      .replace('{analysis}', JSON.stringify(analysis, null, 2));

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert resume writer. Create optimized, ATS-friendly resumes while maintaining truthful content."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
    });

    const optimizedContent = completion.choices[0].message.content || '';

    // Save optimized resume as a new document
    const optimizedResume = await storage.saveDocument({
      id: '',
      userId: session.user.email,
      type: 'resume',
      name: `${resume.name} (Optimized)`,
      content: optimizedContent,
      uploadedAt: new Date(),
      metadata: {
        summary: `Optimized version of ${resume.name} for ${jobDescription.name}. Analysis score: ${analysis.score}%`,
        fileType: 'text/plain',
        size: optimizedContent.length
      }
    });

    return NextResponse.json({ 
      success: true, 
      document: optimizedResume 
    });
  } catch (error: any) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize resume' },
      { status: 500 }
    );
  }
}
