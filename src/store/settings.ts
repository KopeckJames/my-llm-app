import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatConfig } from '@/types/llm';

interface SettingsStore {
  config: ChatConfig;
  updateConfig: (config: Partial<ChatConfig>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      config: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful assistant.',
      },
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
    }),
    {
      name: 'chat-settings',
    }
  )
);