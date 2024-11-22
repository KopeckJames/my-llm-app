import { NextRequest, NextResponse } from 'next/server';

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

    if (!transcription) {
      return NextResponse.json(
        { error: 'No transcription provided' },
        { status: 400 }
      );
    }

    // Process the transcription with GPT-4
    console.log('Processing transcription:', transcription);

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Using GPT-3.5 for faster responses
        messages: [
          {
            role: 'system',
            content: `You are a concise interview coach. Provide brief, actionable feedback for interview responses. For questions, give a short answer outline. Keep responses under 100 words. If input isn't a question or doesn't need feedback, respond with an empty string.`
          },
          {
            role: 'user',
            content: transcription.trim()
          }
        ],
        temperature: 0.5, // Lower temperature for more focused responses
        max_tokens: 150,  // Reduced token limit
        presence_penalty: 0.0,
        frequency_penalty: 0.0,
        stream: true // Enable streaming
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
