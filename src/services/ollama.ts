export async function callOllama(messages: Message[], config: ChatConfig): Promise<LLMResponse> {
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'llama2',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          options: {
            temperature: config.temperature || 0.7,
          },
        }),
      });
  
      const data = await response.json();
      return { content: data.message.content };
    } catch (error: any) {
      return { content: '', error: error.message };
    }
  }