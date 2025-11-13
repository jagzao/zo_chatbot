/**
 * TikTok API Client
 *
 * This client handles interactions with TikTok's API for comment management.
 * Note: TikTok does NOT support direct messaging like WhatsApp/Facebook/Instagram.
 * This integration only handles public comments on videos.
 *
 * Documentation: https://developers.tiktok.com/doc/
 */

export interface TikTokAPIConfig {
  accessToken: string;
  clientKey?: string;
  clientSecret?: string;
  apiVersion?: string;
}

export interface CreateCommentParams {
  videoId: string;
  text: string;
  parentCommentId?: string; // For replying to a specific comment
}

export interface TikTokComment {
  id: string;
  video_id: string;
  text: string;
  create_time: number;
  like_count: number;
  reply_count?: number;
  parent_comment_id?: string;
  creator: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar_url?: string;
  };
}

export interface TikTokWebhookEvent {
  event: "comment.created" | "video.mention";
  timestamp: number;
  data: {
    comment?: TikTokComment;
    video?: {
      id: string;
      title: string;
      create_time: number;
    };
  };
}

export interface ParsedTikTokComment {
  externalId: string; // Creator unique_id
  content: string;
  messageType: "text";
  metadata?: {
    commentId: string;
    videoId: string;
    timestamp: number;
    parentCommentId?: string;
    isReply: boolean;
    isMention: boolean;
    likeCount?: number;
    creatorNickname?: string;
    creatorAvatar?: string;
  };
  contactName?: string;
}

export class TikTokAPIClient {
  private config: TikTokAPIConfig;
  private baseUrl: string;

  constructor(config: TikTokAPIConfig) {
    this.config = {
      apiVersion: "v2",
      ...config,
    };
    this.baseUrl = `https://open.tiktokapis.com/${this.config.apiVersion}`;
  }

  /**
   * Reply to a comment on a video
   * This is the primary way to "message" users on TikTok
   */
  async replyToComment(params: CreateCommentParams): Promise<any> {
    const url = `${this.baseUrl}/comment/create/`;

    const body: any = {
      video_id: params.videoId,
      text: params.text,
    };

    if (params.parentCommentId) {
      body.parent_comment_id = params.parentCommentId;
    }

    return this.request(url, "POST", body);
  }

  /**
   * Get comments on a video
   * Useful for monitoring conversations
   */
  async getVideoComments(
    videoId: string,
    cursor?: string,
    count: number = 20
  ): Promise<{
    comments: TikTokComment[];
    cursor?: string;
    has_more: boolean;
  }> {
    const url = `${this.baseUrl}/comment/list/`;

    const params: any = {
      video_id: videoId,
      count,
    };

    if (cursor) {
      params.cursor = cursor;
    }

    const response = await this.request(url, "GET", null, params);

    return {
      comments: response.data?.comments || [],
      cursor: response.data?.cursor,
      has_more: response.data?.has_more || false,
    };
  }

  /**
   * Get user information
   */
  async getUserInfo(openId?: string): Promise<{
    open_id: string;
    union_id?: string;
    avatar_url?: string;
    display_name?: string;
  }> {
    const url = `${this.baseUrl}/user/info/`;

    const params: any = {
      fields: "open_id,union_id,avatar_url,display_name",
    };

    if (openId) {
      params.open_id = openId;
    }

    const response = await this.request(url, "GET", null, params);
    return response.data?.user || {};
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoId: string): Promise<{
    id: string;
    title?: string;
    create_time?: number;
    share_url?: string;
  }> {
    const url = `${this.baseUrl}/video/query/`;

    const params = {
      fields: "id,title,create_time,share_url",
      filters: {
        video_ids: [videoId],
      },
    };

    const response = await this.request(url, "POST", params);
    const videos = response.data?.videos || [];
    return videos[0] || {};
  }

  /**
   * Make HTTP request to TikTok API
   */
  private async request(
    url: string,
    method: string,
    body?: any,
    queryParams?: any
  ): Promise<any> {
    // Build URL with query parameters
    if (queryParams && method === "GET") {
      const searchParams = new URLSearchParams(queryParams);
      url = `${url}?${searchParams.toString()}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `TikTok API error: ${error.error?.message || error.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Parse incoming webhook comment to our standard format
   */
  static parseComment(webhookEvent: TikTokWebhookEvent): ParsedTikTokComment {
    const comment = webhookEvent.data.comment;

    if (!comment) {
      throw new Error("No comment data in webhook event");
    }

    const creatorId = comment.creator.unique_id || comment.creator.id;
    const content = comment.text || "";
    const isReply = !!comment.parent_comment_id;
    const isMention = webhookEvent.event === "video.mention";

    return {
      externalId: creatorId,
      content,
      messageType: "text",
      metadata: {
        commentId: comment.id,
        videoId: comment.video_id,
        timestamp: comment.create_time,
        parentCommentId: comment.parent_comment_id,
        isReply,
        isMention,
        likeCount: comment.like_count,
        creatorNickname: comment.creator.nickname,
        creatorAvatar: comment.creator.avatar_url,
      },
      contactName: comment.creator.nickname,
    };
  }

  /**
   * Verify webhook signature
   * TikTok signs webhook requests for security
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    clientSecret: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", clientSecret)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  }
}

/**
 * Create a TikTok API client instance
 */
export function createTikTokClient(
  accessToken: string,
  clientKey?: string,
  clientSecret?: string
): TikTokAPIClient {
  if (!accessToken) {
    throw new Error("TikTok Access Token is required");
  }

  return new TikTokAPIClient({
    accessToken,
    clientKey,
    clientSecret,
  });
}
