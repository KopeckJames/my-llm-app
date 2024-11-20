import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Types
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatConfig {
  provider: 'anthropic' | 'openai' | 'ollama';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function POST(req: Request) {
  try {
    const { messages, config } = await req.json();

    switch (config.provider) {
      case 'anthropic':
        return handleAnthropic(messages, config);
      case 'openai':
        return handleOpenAI(messages, config);
      case 'ollama':
        return handleOllama(messages, config);
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleAnthropic(messages: Message[], config: ChatConfig) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const systemMessage = messages.find(m => m.role === 'system');
    const response = await anthropic.messages.create({
      model: config.model || 'claude-3-opus-20240229',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      system: systemMessage?.content,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content,
        })),
    });

    return NextResponse.json({ content: response.content[0].text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleOpenAI(messages: Message[], config: ChatConfig) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 400 });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.model || 'gpt-4',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000,
    });

    return NextResponse.json({ content: response.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleOllama(messages: Message[], config: ChatConfig) {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'llama2',
        messages: messages.map(m => ({
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