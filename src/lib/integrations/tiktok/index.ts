import { createTikTokClient } from "@/lib/integrations/tiktok/api-client";
import type { Database } from "@/types/database";

type Channel = Database["public"]["Tables"]["channels"]["Row"];

/**
 * Reply to a TikTok comment
 *
 * Note: TikTok does NOT support direct messages. All interactions are public comments.
 * This function replies to a comment on a video.
 */
export async function sendTikTokComment(
  channel: Channel,
  videoId: string,
  content: string,
  parentCommentId?: string
): Promise<void> {
  // Get access token from channel config
  const config = channel.config as any;
  const accessToken = config.accessToken || config.access_token;

  if (!accessToken) {
    throw new Error("TikTok Access Token not configured for this channel");
  }

  // Create TikTok API client
  const client = createTikTokClient(accessToken);

  // Reply to comment
  await client.replyToComment({
    videoId,
    text: content,
    parentCommentId,
  });
}

/**
 * Get comments on a TikTok video
 */
export async function getTikTokVideoComments(
  channel: Channel,
  videoId: string,
  cursor?: string,
  count: number = 20
): Promise<{
  comments: any[];
  cursor?: string;
  has_more: boolean;
}> {
  const config = channel.config as any;
  const accessToken = config.accessToken || config.access_token;

  if (!accessToken) {
    throw new Error("TikTok Access Token not configured");
  }

  const client = createTikTokClient(accessToken);
  return client.getVideoComments(videoId, cursor, count);
}

/**
 * Get TikTok user information
 */
export async function getTikTokUserInfo(
  channel: Channel,
  openId?: string
): Promise<{
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
}> {
  const config = channel.config as any;
  const accessToken = config.accessToken || config.access_token;

  if (!accessToken) {
    throw new Error("TikTok Access Token not configured");
  }

  const client = createTikTokClient(accessToken);
  return client.getUserInfo(openId);
}

/**
 * Get TikTok video information
 */
export async function getTikTokVideoInfo(
  channel: Channel,
  videoId: string
): Promise<{
  id: string;
  title?: string;
  create_time?: number;
  share_url?: string;
}> {
  const config = channel.config as any;
  const accessToken = config.accessToken || config.access_token;

  if (!accessToken) {
    throw new Error("TikTok Access Token not configured");
  }

  const client = createTikTokClient(accessToken);
  return client.getVideoInfo(videoId);
}
