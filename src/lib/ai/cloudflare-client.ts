/**
 * Cloudflare AI Client
 *
 * Client for Cloudflare Workers AI.
 * Used as fallback when Groq is unavailable or rate limited.
 *
 * Free tier: 10,000 neurons/day (generous for chatbots)
 * Documentation: https://developers.cloudflare.com/workers-ai/
 */

export interface CloudflareAIConfig {
  accountId: string;
  apiToken: string;
  model?: string;
}

export interface CloudflareMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CloudflareAIParams {
  messages: CloudflareMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CloudflareAIResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

export class CloudflareAIClient {
  private config: CloudflareAIConfig;
  private baseUrl: string;

  constructor(config: CloudflareAIConfig) {
    this.config = {
      model: "@cf/meta/llama-3-8b-instruct", // Default model
      ...config,
    };
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/ai/run`;
  }

  /**
   * Generate a chat completion
   */
  async createChatCompletion(
    params: CloudflareAIParams
  ): Promise<string> {
    const model = params.model || this.config.model;
    const url = `${this.baseUrl}/${model}`;

    const body = {
      messages: params.messages,
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Cloudflare AI error: ${error.errors?.[0]?.message || response.statusText}`
      );
    }

    const data: CloudflareAIResponse = await response.json();

    if (!data.success || !data.result?.response) {
      throw new Error("No response from Cloudflare AI");
    }

    return data.result.response;
  }

  /**
   * Generate a simple text completion
   * Convenience method for single-turn conversations
   */
  async complete(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const messages: CloudflareMessage[] = [];

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
    });
  }

  /**
   * Available models on Cloudflare Workers AI
   */
  static readonly MODELS = {
    LLAMA_3_8B: "@cf/meta/llama-3-8b-instruct", // Fast and efficient (default)
    LLAMA_2_7B: "@cf/meta/llama-2-7b-chat-int8", // Smaller alternative
    MISTRAL_7B: "@cf/mistral/mistral-7b-instruct-v0.1", // Good for structured tasks
    OPENCHAT: "@cf/openchat/openchat-3.5-0106", // Lightweight
  } as const;
}

/**
 * Create a Cloudflare AI client instance
 */
export function createCloudflareClient(
  accountId?: string,
  apiToken?: string,
  config?: Partial<CloudflareAIConfig>
): CloudflareAIClient {
  const id = accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = apiToken || process.env.CLOUDFLARE_API_TOKEN;

  if (!id || !token) {
    throw new Error("Cloudflare account ID and API token are required");
  }

  return new CloudflareAIClient({
    accountId: id,
    apiToken: token,
    ...config,
  });
}
