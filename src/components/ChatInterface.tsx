"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { signOut } from "next-auth/react";
import { SettingsDialog } from './SettingsDialog';
import { useSettingsStore } from '@/store/settings';
import { callLLM } from '@/services/llm';
import type { Message } from '@/types/llm';

const ChatInterface = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { config } = useSettingsStore();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
  
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
            ...messages,
            userMessage
          ],
          config: {
            provider: config.provider,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
          }
        }),
      });
  
      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
        }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <Card className="flex-grow flex flex-col h-full">
        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
          <MessageCircle className="w-8 h-8" />
          <div className="flex-1">
            <CardTitle>Chat Interface</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMessages([])}
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <SettingsDialog />
          <Button
            variant="ghost"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col space-y-4 overflow-hidden">
          <div className="flex-grow overflow-y-auto space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2 pt-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;