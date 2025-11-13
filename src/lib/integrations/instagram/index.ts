import { createInstagramClient } from "@/lib/integrations/instagram/graph-client";
import type { Database } from "@/types/database";

type Channel = Database["public"]["Tables"]["channels"]["Row"];

/**
 * Send Instagram Direct message via Graph API
 */
export async function sendInstagramMessage(
  channel: Channel,
  recipientId: string,
  content: string,
  messageType: "text" | "image" | "video" | "audio" | "file" = "text",
  mediaUrl?: string
): Promise<void> {
  // Get page access token from channel config
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Instagram Page Access Token not configured for this channel");
  }

  // Create Instagram Graph API client
  const client = createInstagramClient(pageAccessToken);

  if (messageType === "text") {
    // Send text message
    await client.sendTextMessage(recipientId, content);
  } else if (mediaUrl) {
    // Send media message
    await client.sendMediaMessage(recipientId, messageType, mediaUrl, content);
  } else {
    throw new Error("Media URL required for non-text messages");
  }
}

/**
 * Get Instagram user profile
 */
export async function getInstagramUserProfile(
  channel: Channel,
  userId: string
): Promise<{
  name?: string;
  profile_pic?: string;
  username?: string;
}> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Instagram Page Access Token not configured");
  }

  const client = createInstagramClient(pageAccessToken);
  return client.getUserProfile(userId);
}

/**
 * Mark Instagram message as seen
 */
export async function markInstagramMessageAsSeen(
  channel: Channel,
  senderId: string
): Promise<void> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Instagram Page Access Token not configured");
  }

  const client = createInstagramClient(pageAccessToken);
  await client.markSeen(senderId);
}

/**
 * Send typing indicator to Instagram user
 */
export async function sendInstagramTypingIndicator(
  channel: Channel,
  recipientId: string,
  on: boolean = true
): Promise<void> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Instagram Page Access Token not configured");
  }

  const client = createInstagramClient(pageAccessToken);
  await client.sendTypingIndicator(recipientId, on);
}
