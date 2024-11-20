import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import OpenAI from 'openai';
import { getStorage } from '@/lib/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are an expert ATS (Applicant Tracking System) analyzer and professional resume writer. 
Analyze the provided resume against the job description using the following criteria:
1. Keyword matching and relevance (30% of score)
2. Resume formatting and ATS compatibility (20% of score)
3. Skills alignment with job requirements (25% of score)
4. Experience relevance and impact (25% of score)

Return your analysis in the following format:
SCORE: [overall score 0-100]
KEYWORD_MATCH: [score 0-100]
FORMATTING: [score 0-100]
SKILLS_ALIGNMENT: [score 0-100]
EXPERIENCE_RELEVANCE: [score 0-100]
KEYWORDS_FOUND: [comma-separated list]
MISSING_KEYWORDS: [comma-separated list]
FORMATTING_ISSUES: [comma-separated list]
STRENGTHS: [comma-separated list]
WEAKNESSES: [comma-separated list]
RECOMMENDATIONS: [numbered list]
SUMMARY: [brief summary]

Resume:
{resume}

Job Description:
{jobDescription}`;

function parseAnalysisResponse(content: string) {
  const lines = content.split('\n');
  const result: any = {
    score: 0,
    criteriaScores: {
      keywordMatch: 0,
      formatting: 0,
      skillsAlignment: 0,
      experienceRelevance: 0
    },
    analysis: {
      keywordsFound: [],
      missingKeywords: [],
      formattingIssues: [],
      strengths: [],
      weaknesses: []
    },
    recommendations: [],
    summary: ''
  };

  lines.forEach(line => {
    if (line.startsWith('SCORE:')) result.score = parseInt(line.split(':')[1]);
    if (line.startsWith('KEYWORD_MATCH:')) result.criteriaScores.keywordMatch = parseInt(line.split(':')[1]);
    if (line.startsWith('FORMATTING:')) result.criteriaScores.formatting = parseInt(line.split(':')[1]);
    if (line.startsWith('SKILLS_ALIGNMENT:')) result.criteriaScores.skillsAlignment = parseInt(line.split(':')[1]);
    if (line.startsWith('EXPERIENCE_RELEVANCE:')) result.criteriaScores.experienceRelevance = parseInt(line.split(':')[1]);
    if (line.startsWith('KEYWORDS_FOUND:')) result.analysis.keywordsFound = line.split(':')[1].split(',').map((k: string) => k.trim());
    if (line.startsWith('MISSING_KEYWORDS:')) result.analysis.missingKeywords = line.split(':')[1].split(',').map((k: string) => k.trim());
    if (line.startsWith('FORMATTING_ISSUES:')) result.analysis.formattingIssues = line.split(':')[1].split(',').map((k: string) => k.trim());
    if (line.startsWith('STRENGTHS:')) result.analysis.strengths = line.split(':')[1].split(',').map((k: string) => k.trim());
    if (line.startsWith('WEAKNESSES:')) result.analysis.weaknesses = line.split(':')[1].split(',').map((k: string) => k.trim());
    if (line.startsWith('RECOMMENDATIONS:')) {
      const recommendations = content.split('RECOMMENDATIONS:')[1].split('SUMMARY:')[0];
      result.recommendations = recommendations.split('\n').filter(r => r.trim()).map((r: string) => r.trim());
    }
    if (line.startsWith('SUMMARY:')) result.summary = line.split(':').slice(1).join(':').trim();
  });

  return result;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId, jobDescriptionId } = await req.json();

    // Get documents from storage
    const storage = getStorage();
    const resume = await storage.getDocument(resumeId);
    const jobDescription = await storage.getDocument(jobDescriptionId);

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Documents not found' }, { status: 404 });
    }

    // Analyze resume
    const prompt = ANALYSIS_PROMPT
      .replace('{resume}', resume.content)
      .replace('{jobDescription}', jobDescription.content);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert ATS analyzer and resume writer. Provide detailed, actionable analysis and recommendations."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
    });

    const analysis = parseAnalysisResponse(completion.choices[0].message.content || '');

    // Save analysis result
    await storage.saveDocument({
      id: '',
      userId: session.user.email,
      type: 'analysis',
      name: `Analysis - ${resume.name}`,
      content: JSON.stringify(analysis),
      uploadedAt: new Date(),
      metadata: {
        resumeId,
        jobDescriptionId,
        score: analysis.score
      }
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}