import OpenAI from 'openai';

export async function callOpenAI(messages: Message[], config: ChatConfig): Promise<LLMResponse> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const response = await openai.chat.completions.create({
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return { content: response.choices[0].message.content || '' };
  } catch (error: any) {
    return { content: '', error: error.message };
  }
}
