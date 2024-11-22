export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type LLMConfig = {
  provider: 'openai' | 'anthropic' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
};
