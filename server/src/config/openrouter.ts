// server/src/config/openrouter.ts
import axios from 'axios';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Call OpenRouter API for LLM completions
 * @param messages Array of messages for the chat completion
 * @param maxTokens Maximum number of tokens to generate
 * @param temperature Temperature for randomness (0-1)
 * @returns Generated content string
 */
export async function callOpenRouter(
  messages: Message[],
  maxTokens: number = 4000,
  temperature: number = 0.7
): Promise<string> {
  // Get environment variables at runtime, not at module load time
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  try {
    const response = await axios.post(
      OPENROUTER_BASE_URL,
      {
        model: MODEL,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Content Creation App'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenRouter API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.response?.status === 401) {
      throw new Error('Invalid OpenRouter API key');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The script generation took too long.');
    }
    
    throw new Error('Failed to generate content with LLM');
  }
}
