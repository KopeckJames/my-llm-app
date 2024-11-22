import { create } from 'zustand';
import type { LLMConfig } from '@/types/llm';

interface SettingsState {
  config: LLMConfig;
  updateConfig: (config: Partial<LLMConfig>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  config: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'You are a helpful assistant.',
  },
  updateConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),
}));
