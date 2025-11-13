import { createFacebookClient } from "@/lib/integrations/facebook/graph-client";
import type { Database } from "@/types/database";

type Channel = Database["public"]["Tables"]["channels"]["Row"];

/**
 * Send Facebook Messenger message via Graph API
 */
export async function sendFacebookMessage(
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
    throw new Error("Facebook Page Access Token not configured for this channel");
  }

  // Create Facebook Graph API client
  const client = createFacebookClient(pageAccessToken);

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
 * Get Facebook user profile
 */
export async function getFacebookUserProfile(
  channel: Channel,
  userId: string
): Promise<{
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
}> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Facebook Page Access Token not configured");
  }

  const client = createFacebookClient(pageAccessToken);
  return client.getUserProfile(userId);
}

/**
 * Mark Facebook message as seen
 */
export async function markFacebookMessageAsSeen(
  channel: Channel,
  senderId: string
): Promise<void> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Facebook Page Access Token not configured");
  }

  const client = createFacebookClient(pageAccessToken);
  await client.markSeen(senderId);
}

/**
 * Send typing indicator to Facebook user
 */
export async function sendFacebookTypingIndicator(
  channel: Channel,
  recipientId: string,
  on: boolean = true
): Promise<void> {
  const config = channel.config as any;
  const pageAccessToken = config.pageAccessToken || config.page_access_token;

  if (!pageAccessToken) {
    throw new Error("Facebook Page Access Token not configured");
  }

  const client = createFacebookClient(pageAccessToken);
  await client.sendTypingIndicator(recipientId, on);
}
