import type { Message, LLMConfig } from '@/types/llm';

export async function callLLM(messages: Message[], config: LLMConfig): Promise<Message> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
        ...messages,
      ],
      config,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get response from LLM');
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return {
    role: 'assistant',
    content: data.content,
  };
}
