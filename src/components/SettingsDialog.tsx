"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/settings';
import { OllamaStatus } from './OllamaStatus';
import { checkModelAvailability, getInstalledModels } from '@/utils/ollama';

export function SettingsDialog() {
  const { config, updateConfig } = useSettingsStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    if (localConfig.provider === 'ollama') {
      loadInstalledModels();
    }
  }, [localConfig.provider]);

  const loadInstalledModels = async () => {
    const models = await getInstalledModels();
    setInstalledModels(models.map(m => m.name));
  };

  const handleProviderChange = async (provider: string) => {
    setLocalConfig({ ...localConfig, provider });
    updateConfig({ provider });
    setModelError(null);
    
    if (provider === 'ollama') {
      setIsCheckingModel(true);
      const isAvailable = await checkModelAvailability(localConfig.model);
      if (!isAvailable) {
        setModelError(`Model ${localConfig.model} is not installed. Please install it using 'ollama pull ${localConfig.model}'`);
      }
      setIsCheckingModel(false);
    }
  };

  const handleModelChange = async (model: string) => {
    setLocalConfig({ ...localConfig, model });
    updateConfig({ model });
    
    if (localConfig.provider === 'ollama') {
      setIsCheckingModel(true);
      setModelError(null);
      const isAvailable = await checkModelAvailability(model);
      if (!isAvailable) {
        setModelError(`Model ${model} is not installed. Please install it using 'ollama pull ${model}'`);
      }
      setIsCheckingModel(false);
    }
  };

  function getModelOptions(provider: string) {
    switch (provider) {
      case 'ollama':
        return installedModels.length > 0 ? installedModels : [
          'llama2',
          'mistral',
          'codellama',
          'neural-chat',
          'starling-lm'
        ];
      case 'anthropic':
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-2.1'
        ];
      case 'openai':
        return [
          'gpt-4-turbo-preview',
          'gpt-4',
          'gpt-3.5-turbo'
        ];
      default:
        return [];
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {localConfig.provider === 'ollama' && (
            <OllamaStatus />
          )}
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              value={localConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">
              Model
              {isCheckingModel && (
                <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
              )}
            </Label>
            <select
              id="model"
              value={localConfig.model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {getModelOptions(localConfig.provider).map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            {modelError && (
              <p className="text-sm text-red-500">{modelError}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={localConfig.temperature}
              onChange={(e) => {
                setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) });
                updateConfig({ temperature: parseFloat(e.target.value) });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Input
              id="systemPrompt"
              value={localConfig.systemPrompt}
              onChange={(e) => {
                setLocalConfig({ ...localConfig, systemPrompt: e.target.value });
                updateConfig({ systemPrompt: e.target.value });
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}