/**
 * AI Service
 *
 * High-level service for AI-powered responses.
 * Handles multiple providers (Groq, Cloudflare AI) with automatic fallback.
 * Manages conversation context and personalization.
 */

import { createGroqClient, GroqClient, GroqMessage } from "./groq-client";
import { createCloudflareClient, CloudflareAIClient, CloudflareMessage } from "./cloudflare-client";

export interface AIProvider {
  name: "groq" | "cloudflare";
  client: GroqClient | CloudflareAIClient;
}

export interface ConversationContext {
  contactName?: string;
  channelType?: string;
  organizationName?: string;
  previousMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  metadata?: Record<string, any>;
}

export interface GenerateResponseOptions {
  context?: ConversationContext;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  preferredProvider?: "groq" | "cloudflare";
}

export class AIService {
  private providers: AIProvider[] = [];
  private defaultSystemPrompt = `Eres un asistente virtual amable y servicial.
Respondes de manera concisa, clara y profesional.
Si no sabes algo, lo admites honestamente.
Siempre intentas ser útil y resolver las dudas del usuario.`;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize AI providers (Groq and Cloudflare)
   */
  private initializeProviders() {
    // Try to initialize Groq (primary)
    try {
      if (process.env.GROQ_API_KEY) {
        const groqClient = createGroqClient();
        this.providers.push({
          name: "groq",
          client: groqClient,
        });
      }
    } catch (error) {
      console.warn("Failed to initialize Groq client:", error);
    }

    // Try to initialize Cloudflare AI (fallback)
    try {
      if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) {
        const cloudflareClient = createCloudflareClient();
        this.providers.push({
          name: "cloudflare",
          client: cloudflareClient,
        });
      }
    } catch (error) {
      console.warn("Failed to initialize Cloudflare client:", error);
    }

    if (this.providers.length === 0) {
      console.warn("No AI providers initialized. AI responses will not be available.");
    }
  }

  /**
   * Generate an AI response
   */
  async generateResponse(
    userMessage: string,
    options: GenerateResponseOptions = {}
  ): Promise<{
    response: string;
    provider: "groq" | "cloudflare";
  }> {
    if (this.providers.length === 0) {
      throw new Error("No AI providers available");
    }

    // Build conversation messages
    const messages = this.buildMessages(userMessage, options);

    // Try providers in order (with preference if specified)
    const orderedProviders = this.getOrderedProviders(options.preferredProvider);

    for (const provider of orderedProviders) {
      try {
        const response = await this.callProvider(provider, messages, options);
        return {
          response,
          provider: provider.name,
        };
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
        // Try next provider
        continue;
      }
    }

    throw new Error("All AI providers failed");
  }

  /**
   * Build messages array with context
   */
  private buildMessages(
    userMessage: string,
    options: GenerateResponseOptions
  ): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    // System prompt
    const systemPrompt = this.buildSystemPrompt(options);
    messages.push({
      role: "system",
      content: systemPrompt,
    });

    // Previous messages (context)
    if (options.context?.previousMessages) {
      for (const msg of options.context.previousMessages) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(options: GenerateResponseOptions): string {
    let prompt = options.systemPrompt || this.defaultSystemPrompt;

    // Add context information
    if (options.context) {
      const { contactName, channelType, organizationName } = options.context;

      if (organizationName) {
        prompt += `\n\nEstás respondiendo en nombre de: ${organizationName}`;
      }

      if (contactName) {
        prompt += `\n\nEstás hablando con: ${contactName}`;
      }

      if (channelType) {
        const channelNames: Record<string, string> = {
          whatsapp: "WhatsApp",
          facebook: "Facebook Messenger",
          instagram: "Instagram Direct",
          tiktok: "TikTok (comentario público)",
        };
        prompt += `\n\nCanal de comunicación: ${channelNames[channelType] || channelType}`;

        // Special note for TikTok (public comments)
        if (channelType === "tiktok") {
          prompt += `\n\n⚠️ IMPORTANTE: Este es un comentario PÚBLICO en TikTok. Mantén la respuesta breve (máximo 150 caracteres) y apropiada para audiencia pública. No compartas información sensible.`;
        }
      }
    }

    return prompt;
  }

  /**
   * Call a specific provider
   */
  private async callProvider(
    provider: AIProvider,
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options: GenerateResponseOptions
  ): Promise<string> {
    if (provider.name === "groq") {
      const client = provider.client as GroqClient;
      return client.createChatCompletion({
        messages: messages as GroqMessage[],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      });
    } else if (provider.name === "cloudflare") {
      const client = provider.client as CloudflareAIClient;
      return client.createChatCompletion({
        messages: messages as CloudflareMessage[],
      });
    }

    throw new Error(`Unknown provider: ${provider.name}`);
  }

  /**
   * Get providers in order of preference
   */
  private getOrderedProviders(preferred?: "groq" | "cloudflare"): AIProvider[] {
    if (!preferred) {
      return [...this.providers]; // Default order
    }

    // Put preferred provider first
    return [
      ...this.providers.filter((p) => p.name === preferred),
      ...this.providers.filter((p) => p.name !== preferred),
    ];
  }

  /**
   * Check if AI is available
   */
  isAvailable(): boolean {
    return this.providers.length > 0;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Array<"groq" | "cloudflare"> {
    return this.providers.map((p) => p.name);
  }
}

/**
 * Singleton instance
 */
let aiServiceInstance: AIService | null = null;

/**
 * Get AI service instance
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
