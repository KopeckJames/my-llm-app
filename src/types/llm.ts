export type LLMProvider = 'ollama' | 'anthropic' | 'openai' | 'openauth';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatConfig {
  provider: LLMProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  error?: string;
}