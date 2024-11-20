import { callAnthropic } from './anthropic';
import { callOpenAI } from './openai';
import { callOllama } from './ollama';
import type { Message, ChatConfig, LLMResponse } from '@/types/llm';

export async function callLLM(messages: Message[], config: ChatConfig): Promise<LLMResponse> {
  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(messages, config);
    case 'openai':
      return callOpenAI(messages, config);
    case 'ollama':
      return callOllama(messages, config);
    default:
      return { content: '', error: 'Invalid provider' };
  }
}