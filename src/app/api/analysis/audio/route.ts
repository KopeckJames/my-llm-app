import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const transcription = formData.get('lastTranscription') as string;
    const resumeId = formData.get('resumeId') as string;
    const jobId = formData.get('jobId') as string;

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    // Fetch resume and job description from database
    const [resume, job] = await Promise.all([
      prisma.document.findUnique({
        where: { id: resumeId },
        select: { content: true }
      }),
      prisma.document.findUnique({
        where: { id: jobId },
        select: { content: true }
      })
    ]);

    if (!resume?.content || !job?.content) {
      return NextResponse.json(
        { error: 'Could not find selected documents' },
        { status: 400 }
      );
    }

    // Process the transcription with GPT-3.5
    console.log('Processing transcription:', {
      transcription,
      resumeId,
      jobId
    });

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an interviewee applying for the job listed in the job description. Answer all of the interviewers questions. 
            You have access to the resume and job description

            Resume:
            ${resume.content}

            Job Description:
            ${job.content}

            Your role is to:
            1. Analyze interview questions in the context of the resume and job description
            2. Provide concise, tailored responses that:
               - Address the question directly
               - Highlight relevant experience from the resume
               - Connect skills to job requirements
               - Use STAR method when appropriate
            3. Keep responses focused and under 100 words
            
            If the input isn't a question or doesn't need feedback, respond with an empty string.`
          },
          {
            role: 'user',
            content: transcription.trim()
          }
        ],
        temperature: 0.5,
        max_tokens: 150,
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
        stream: true
      })
    });

    // Set up streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!llmResponse.body) {
          controller.close();
          return;
        }

        const reader = llmResponse.body.getReader();
        let responseText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const json = JSON.parse(data);
                  const token = json.choices[0]?.delta?.content || '';
                  responseText += token;
                  
                  // Send the accumulated text
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: responseText })}\n\n`));
                } catch (e) {
                  console.error('Error parsing JSON:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({
      error: 'Internal server error during processing'
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
