/**
 * Instagram Graph API Client
 *
 * This client handles all interactions with Meta's Graph API for Instagram Direct Messages.
 * Instagram uses the same Graph API structure as Facebook Messenger, but with different endpoints.
 *
 * Documentation: https://developers.facebook.com/docs/messenger-platform/instagram
 */

export interface InstagramGraphAPIConfig {
  pageAccessToken: string;
  appSecret?: string;
  apiVersion?: string;
}

export interface SendInstagramMessageParams {
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
}

export interface InstagramWebhookMessage {
  sender: {
    id: string; // Instagram-Scoped ID (IGSID)
  };
  recipient: {
    id: string; // Instagram Business Account ID
  };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: "image" | "video" | "audio" | "file" | "story_mention" | "share";
      payload: {
        url?: string;
      };
    }>;
    is_echo?: boolean;
    reply_to?: {
      mid: string;
    };
  };
  postback?: {
    mid: string;
    title: string;
    payload: string;
  };
}

export interface ParsedInstagramMessage {
  externalId: string; // Instagram-Scoped ID
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  metadata?: {
    messageId?: string;
    timestamp?: number;
    mediaUrl?: string;
    attachments?: any[];
    isStoryReply?: boolean;
    replyTo?: string;
  };
  contactName?: string;
}

export class InstagramGraphClient {
  private config: InstagramGraphAPIConfig;
  private baseUrl: string;

  constructor(config: InstagramGraphAPIConfig) {
    this.config = {
      apiVersion: "v18.0",
      ...config,
    };
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}`;
  }

  /**
   * Send a text message via Instagram Direct
   */
  async sendTextMessage(recipientId: string, text: string): Promise<any> {
    return this.sendMessage({
      recipientId,
      message: { text },
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
    });
  }

  /**
   * Send a message via Instagram Graph API
   */
  async sendMessage(params: SendInstagramMessageParams): Promise<any> {
    const url = `${this.baseUrl}/me/messages`;

    const body = {
      recipient: { id: params.recipientId },
      message: params.message,
    };

    return this.request(url, "POST", body);
  }

  /**
   * Get Instagram user profile information
   * Note: Limited information available compared to Facebook
   */
  async getUserProfile(userId: string): Promise<{
    name?: string;
    profile_pic?: string;
    username?: string;
  }> {
    const url = `${this.baseUrl}/${userId}?fields=name,profile_pic,username`;
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
   * Make HTTP request to Instagram Graph API
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
        `Instagram Graph API error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Parse incoming Instagram webhook message to our standard format
   */
  static parseMessage(webhookMessage: InstagramWebhookMessage): ParsedInstagramMessage {
    const senderId = webhookMessage.sender.id;
    let content = "";
    let messageType: "text" | "image" | "video" | "audio" | "file" = "text";
    let mediaUrl: string | undefined;
    const attachments: any[] = [];
    let isStoryReply = false;

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
        case "story_mention":
          content = content || "[Mención en historia]";
          isStoryReply = true;
          break;
        case "share":
          content = content || "[Contenido compartido]";
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
        isStoryReply,
        replyTo: webhookMessage.message?.reply_to?.mid,
      },
    };
  }

  /**
   * Verify webhook signature
   * Instagram uses the same verification as Facebook
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("hex");

    return `sha256=${expectedSignature}` === signature;
  }
}

/**
 * Create an Instagram Graph API client instance
 */
export function createInstagramClient(
  pageAccessToken: string,
  appSecret?: string
): InstagramGraphClient {
  if (!pageAccessToken) {
    throw new Error("Instagram Page Access Token is required");
  }

  return new InstagramGraphClient({
    pageAccessToken,
    appSecret,
  });
}
