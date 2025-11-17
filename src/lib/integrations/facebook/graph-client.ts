/**
 * Facebook Graph API Client
 *
 * This client handles all interactions with Meta's Graph API for Facebook Messenger.
 *
 * Documentation: https://developers.facebook.com/docs/messenger-platform
 */

import crypto from "crypto";

export interface GraphAPIConfig {
  pageAccessToken: string;
  appSecret?: string;
  apiVersion?: string;
}

export interface SendMessageParams {
  recipientId: string;
  message: {
    text?: string;
    attachment?: {
      type: "image" | "video" | "audio" | "file";
      payload: {
        url: string;
        is_reusable?: boolean;
      };
    };
  };
  messagingType?: "RESPONSE" | "UPDATE" | "MESSAGE_TAG";
  tag?: string;
}

export interface FacebookWebhookMessage {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: "image" | "video" | "audio" | "file" | "location";
      payload: {
        url?: string;
        coordinates?: {
          lat: number;
          long: number;
        };
      };
    }>;
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface ParsedMessage {
  externalId: string; // Sender PSID (Page-Scoped ID)
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  metadata?: {
    messageId?: string;
    timestamp?: number;
    mediaUrl?: string;
    attachments?: any[];
  };
  contactName?: string;
}

export class FacebookGraphClient {
  private config: GraphAPIConfig;
  private baseUrl: string;

  constructor(config: GraphAPIConfig) {
    this.config = {
      apiVersion: "v18.0",
      ...config,
    };
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}`;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(recipientId: string, text: string): Promise<any> {
    return this.sendMessage({
      recipientId,
      message: { text },
      messagingType: "RESPONSE",
    });
  }

  /**
   * Send a message with attachment (image, video, audio, file)
   */
  async sendMediaMessage(
    recipientId: string,
    mediaType: "image" | "video" | "audio" | "file",
    mediaUrl: string,
    text?: string
  ): Promise<any> {
    // If there's text, send it separately
    if (text) {
      await this.sendTextMessage(recipientId, text);
    }

    return this.sendMessage({
      recipientId,
      message: {
        attachment: {
          type: mediaType,
          payload: {
            url: mediaUrl,
            is_reusable: true,
          },
        },
      },
      messagingType: "RESPONSE",
    });
  }

  /**
   * Send a message via Graph API
   */
  async sendMessage(params: SendMessageParams): Promise<any> {
    const url = `${this.baseUrl}/me/messages`;

    const body = {
      recipient: { id: params.recipientId },
      message: params.message,
      messaging_type: params.messagingType || "RESPONSE",
    };

    if (params.tag) {
      (body as any).tag = params.tag;
    }

    return this.request(url, "POST", body);
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
    locale?: string;
    timezone?: number;
    gender?: string;
  }> {
    const url = `${this.baseUrl}/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender`;
    return this.request(url, "GET");
  }

  /**
   * Mark message as seen
   */
  async markSeen(senderId: string): Promise<any> {
    const url = `${this.baseUrl}/me/messages`;

    return this.request(url, "POST", {
      recipient: { id: senderId },
      sender_action: "mark_seen",
    });
  }

  /**
   * Show typing indicator
   */
  async sendTypingIndicator(recipientId: string, on: boolean = true): Promise<any> {
    const url = `${this.baseUrl}/me/messages`;

    return this.request(url, "POST", {
      recipient: { id: recipientId },
      sender_action: on ? "typing_on" : "typing_off",
    });
  }

  /**
   * Make HTTP request to Graph API
   */
  private async request(url: string, method: string, body?: any): Promise<any> {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.pageAccessToken}`,
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Facebook Graph API error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Parse incoming webhook message to our standard format
   */
  static parseMessage(webhookMessage: FacebookWebhookMessage): ParsedMessage {
    const senderId = webhookMessage.sender.id;
    let content = "";
    let messageType: "text" | "image" | "video" | "audio" | "file" = "text";
    let mediaUrl: string | undefined;
    const attachments: any[] = [];

    // Handle text message
    if (webhookMessage.message?.text) {
      content = webhookMessage.message.text;
    }

    // Handle attachments
    if (webhookMessage.message?.attachments && webhookMessage.message.attachments.length > 0) {
      const firstAttachment = webhookMessage.message.attachments[0];

      switch (firstAttachment.type) {
        case "image":
          content = content || "[Imagen]";
          messageType = "image";
          mediaUrl = firstAttachment.payload.url;
          break;
        case "video":
          content = content || "[Video]";
          messageType = "video";
          mediaUrl = firstAttachment.payload.url;
          break;
        case "audio":
          content = content || "[Audio]";
          messageType = "audio";
          mediaUrl = firstAttachment.payload.url;
          break;
        case "file":
          content = content || "[Archivo]";
          messageType = "file";
          mediaUrl = firstAttachment.payload.url;
          break;
        case "location":
          const coords = firstAttachment.payload.coordinates;
          content = `Ubicación: ${coords?.lat}, ${coords?.long}`;
          messageType = "text";
          break;
      }

      attachments.push(...webhookMessage.message.attachments);
    }

    // Handle postback (button click)
    if (webhookMessage.postback) {
      content = webhookMessage.postback.title;
    }

    return {
      externalId: senderId,
      content,
      messageType,
      metadata: {
        messageId: webhookMessage.message?.mid,
        timestamp: webhookMessage.timestamp,
        mediaUrl,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
    };
  }

  /**
   * Verify webhook signature
   *
   * Facebook signs all webhook requests with your app secret.
   * You should verify this signature to ensure requests are authentic.
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("hex");

    return `sha256=${expectedSignature}` === signature;
  }
}

/**
 * Create a Facebook Graph API client instance
 */
export function createFacebookClient(pageAccessToken: string, appSecret?: string): FacebookGraphClient {
  if (!pageAccessToken) {
    throw new Error("Facebook Page Access Token is required");
  }

  return new FacebookGraphClient({
    pageAccessToken,
    appSecret,
  });
}
