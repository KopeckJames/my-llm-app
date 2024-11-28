import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { callAnthropic } from '@/services/anthropic';
import { callOpenAI } from '@/services/openai';
import type { Message, LLMConfig } from '@/types/llm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, config } = await req.json();

    switch (config.provider) {
      case 'anthropic': {
        const result = await callAnthropic(messages, config);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ content: result.content });
      }
      case 'openai': {
        const result = await callOpenAI(messages, config);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ content: result.content });
      }
      case 'ollama': {
        try {
          const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: config.model || 'llama2',
              messages: messages.map((m: Message) => ({
                role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
              })),
              stream: false,
              options: {
                temperature: config.temperature || 0.7,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
          }

          const data = await response.text();
          const jsonResponse = JSON.parse(data);
          return NextResponse.json({ content: jsonResponse.message?.content || 'No response content' });
        } catch (error: any) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}