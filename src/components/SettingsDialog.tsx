"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useSettingsStore } from '@/store/settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

export function SettingsDialog() {
  const { config, updateConfig } = useSettingsStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={config.provider}
              onValueChange={(value) => updateConfig({ provider: value as 'openai' | 'anthropic' | 'ollama' })}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="ollama">Ollama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={config.model}
              onValueChange={(value) => updateConfig({ model: value })}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {config.provider === 'openai' && (
                  <>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </>
                )}
                {config.provider === 'anthropic' && (
                  <>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                  </>
                )}
                {config.provider === 'ollama' && (
                  <>
                    <SelectItem value="llama2">Llama 2</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="temperature">
              Temperature: {config.temperature.toFixed(1)}
            </Label>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[config.temperature]}
              onValueChange={([value]) => updateConfig({ temperature: value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Input
              id="systemPrompt"
              value={config.systemPrompt}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}