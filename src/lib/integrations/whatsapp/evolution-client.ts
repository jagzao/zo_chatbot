/**
 * Evolution API Client for WhatsApp Integration
 *
 * Evolution API is a free, self-hosted WhatsApp integration
 * Docs: https://doc.evolution-api.com/
 */

import { retryWithBackoff } from "@/lib/utils";

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

interface SendTextMessageParams {
  number: string; // Phone number with country code (e.g., "5511999999999")
  text: string;
}

interface SendMediaMessageParams {
  number: string;
  mediaUrl: string;
  caption?: string;
  mediaType: "image" | "video" | "audio" | "document";
}

interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      url: string;
    };
    videoMessage?: {
      caption?: string;
      url: string;
    };
    audioMessage?: {
      url: string;
    };
    documentMessage?: {
      caption?: string;
      url: string;
      fileName: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

/**
 * Evolution API client
 */
export class EvolutionAPIClient {
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  /**
   * Get base headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      apikey: this.config.apiKey,
    };
  }

  /**
   * Make API request with retry logic
   */
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: any
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;

    const makeRequest = async () => {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Evolution API error: ${response.status} - ${error}`);
      }

      return response.json();
    };

    return retryWithBackoff(makeRequest, 3, 1000);
  }

  /**
   * Send text message
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<any> {
    return this.request(`/message/sendText/${this.config.instanceName}`, "POST", {
      number: params.number,
      text: params.text,
    });
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMediaMessage(params: SendMediaMessageParams): Promise<any> {
    const endpoint = `/message/send${this.capitalizeFirst(params.mediaType)}/${this.config.instanceName}`;

    const body: any = {
      number: params.number,
      [params.mediaType]: params.mediaUrl,
    };

    if (params.caption) {
      body.caption = params.caption;
    }

    return this.request(endpoint, "POST", body);
  }

  /**
   * Check instance connection status
   */
  async getConnectionStatus(): Promise<{
    instance: string;
    state: string;
    statusReason?: string;
  }> {
    return this.request(`/instance/connectionState/${this.config.instanceName}`);
  }

  /**
   * Get instance QR code for connection
   */
  async getQRCode(): Promise<{ code: string; base64: string }> {
    return this.request(`/instance/qrcode/${this.config.instanceName}`);
  }

  /**
   * Logout and disconnect instance
   */
  async logout(): Promise<any> {
    return this.request(`/instance/logout/${this.config.instanceName}`, "DELETE");
  }

  /**
   * Restart instance
   */
  async restart(): Promise<any> {
    return this.request(`/instance/restart/${this.config.instanceName}`, "PUT");
  }

  /**
   * Set webhook URL for this instance
   */
  async setWebhook(webhookUrl: string): Promise<any> {
    return this.request(`/webhook/set/${this.config.instanceName}`, "POST", {
      url: webhookUrl,
      webhook_by_events: true,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE",
      ],
    });
  }

  /**
   * Parse incoming Evolution API message to our format
   */
  static parseMessage(evolutionMsg: EvolutionMessage): {
    externalId: string;
    content: string;
    messageType: "text" | "image" | "video" | "audio" | "file";
    metadata: Record<string, any>;
    contactName?: string;
  } {
    const phoneNumber = evolutionMsg.key.remoteJid.replace("@s.whatsapp.net", "");

    let content = "";
    let messageType: "text" | "image" | "video" | "audio" | "file" = "text";
    const metadata: Record<string, any> = {
      evolutionMessageId: evolutionMsg.key.id,
      timestamp: evolutionMsg.messageTimestamp,
    };

    // Extract content based on message type
    if (evolutionMsg.message.conversation) {
      content = evolutionMsg.message.conversation;
      messageType = "text";
    } else if (evolutionMsg.message.extendedTextMessage) {
      content = evolutionMsg.message.extendedTextMessage.text;
      messageType = "text";
    } else if (evolutionMsg.message.imageMessage) {
      content = evolutionMsg.message.imageMessage.caption || "[Imagen]";
      messageType = "image";
      metadata.mediaUrl = evolutionMsg.message.imageMessage.url;
    } else if (evolutionMsg.message.videoMessage) {
      content = evolutionMsg.message.videoMessage.caption || "[Video]";
      messageType = "video";
      metadata.mediaUrl = evolutionMsg.message.videoMessage.url;
    } else if (evolutionMsg.message.audioMessage) {
      content = "[Audio]";
      messageType = "audio";
      metadata.mediaUrl = evolutionMsg.message.audioMessage.url;
    } else if (evolutionMsg.message.documentMessage) {
      content = evolutionMsg.message.documentMessage.caption || "[Documento]";
      messageType = "file";
      metadata.mediaUrl = evolutionMsg.message.documentMessage.url;
      metadata.fileName = evolutionMsg.message.documentMessage.fileName;
    }

    return {
      externalId: phoneNumber,
      content,
      messageType,
      metadata,
      contactName: evolutionMsg.pushName,
    };
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Create Evolution API client from environment variables
 */
export function createEvolutionClient(instanceName?: string): EvolutionAPIClient {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("EVOLUTION_API_URL and EVOLUTION_API_KEY must be set");
  }

  return new EvolutionAPIClient({
    apiUrl,
    apiKey,
    instanceName: instanceName || "default",
  });
}
