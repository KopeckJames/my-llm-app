import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropic(messages: Message[], config: ChatConfig): Promise<LLMResponse> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const response = await anthropic.messages.create({
      model: config.model || 'claude-3-opus-20240229',
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return { content: response.content[0].text };
  } catch (error: any) {
    return { content: '', error: error.message };
  }
}