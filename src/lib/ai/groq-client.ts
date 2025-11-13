/**
 * Groq AI Client
 *
 * Client for Groq Cloud API with LLaMA 3 models.
 * Groq provides ultra-fast inference with generous free tier.
 *
 * Free tier: 30 requests/minute, 14,400 requests/day
 * Documentation: https://console.groq.com/docs
 */

export interface GroqConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatCompletionParams {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqClient {
  private config: GroqConfig;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(config: GroqConfig) {
    this.config = {
      model: "llama-3.1-70b-versatile", // Default to LLaMA 3.1 70B
      temperature: 0.7,
      maxTokens: 500,
      ...config,
    };
  }

  /**
   * Generate a chat completion
   */
  async createChatCompletion(
    params: GroqChatCompletionParams
  ): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: params.model || this.config.model,
      messages: params.messages,
      temperature: params.temperature ?? this.config.temperature,
      max_tokens: params.max_tokens || this.config.maxTokens,
      top_p: params.top_p || 1,
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Groq API error: ${error.error?.message || response.statusText}`
      );
    }

    const data: GroqResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Groq API");
    }

    return data.choices[0].message.content;
  }

  /**
   * Generate a simple text completion
   * Convenience method for single-turn conversations
   */
  async complete(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: GroqMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    return this.createChatCompletion({
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
    });
  }

  /**
   * Available models on Groq
   */
  static readonly MODELS = {
    LLAMA_3_1_70B: "llama-3.1-70b-versatile", // Best balance (default)
    LLAMA_3_1_8B: "llama-3.1-8b-instant", // Fastest
    LLAMA_3_70B: "llama3-70b-8192", // Good for longer contexts
    LLAMA_3_8B: "llama3-8b-8192", // Fast and efficient
    MIXTRAL_8X7B: "mixtral-8x7b-32768", // Great for structured tasks
    GEMMA_7B: "gemma-7b-it", // Lightweight alternative
  } as const;
}

/**
 * Create a Groq client instance
 */
export function createGroqClient(apiKey?: string, config?: Partial<GroqConfig>): GroqClient {
  const key = apiKey || process.env.GROQ_API_KEY;

  if (!key) {
    throw new Error("Groq API key is required");
  }

  return new GroqClient({
    apiKey: key,
    ...config,
  });
}
