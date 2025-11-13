import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/messages/processor";
import { TikTokAPIClient } from "@/lib/integrations/tiktok/api-client";

/**
 * TikTok webhook
 * POST /api/webhook/tiktok
 *
 * TikTok sends webhooks when:
 * - New comment is posted on your video
 * - Your account is mentioned in a video
 *
 * Documentation: https://developers.tiktok.com/doc/webhooks-overview
 *
 * IMPORTANT: TikTok does NOT support direct messaging.
 * All interactions are public comments on videos.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get("x-tiktok-signature");
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (clientSecret && signature) {
      const rawBody = JSON.stringify(body);
      const isValid = TikTokAPIClient.verifyWebhookSignature(
        rawBody,
        signature,
        clientSecret
      );

      if (!isValid) {
        console.error("Invalid TikTok webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // TikTok webhook events
    const event = body.event;

    switch (event) {
      case "comment.created":
        await handleCommentCreated(body, request);
        break;

      case "video.mention":
        await handleVideoMention(body, request);
        break;

      default:
        console.warn("Unknown TikTok event:", event);
    }

    // Always return 200 OK to TikTok
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing TikTok webhook:", error);

    // Still return 200 to TikTok to avoid retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle new comment on a video
 */
async function handleCommentCreated(event: any, request: NextRequest) {
  try {
    // Parse TikTok comment to our format
    const parsed = TikTokAPIClient.parseComment(event);

    // Get organization and channel from headers
    // In production, you would query the database to find the channel
    // based on TikTok account ID
    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in TikTok webhook");
      // In production: query channels table WHERE config->>'tiktokUserId' = ...
      return;
    }

    // Process the comment through our system
    // Note: For TikTok, we store the videoId and commentId in metadata
    // so we can reply to the specific comment later
    const result = await processIncomingMessage({
      channelId,
      organizationId,
      externalId: parsed.externalId,
      content: parsed.content,
      messageType: parsed.messageType,
      metadata: {
        ...parsed.metadata,
        // Store video ID for context
        videoId: parsed.metadata?.videoId,
        // Store comment ID for replying
        commentId: parsed.metadata?.commentId,
      },
      contactName: parsed.contactName,
      timestamp: new Date(
        (parsed.metadata?.timestamp || Date.now()) * 1000
      ).toISOString(),
    });

    console.log("TikTok comment processed:", result);
  } catch (error) {
    console.error("Error handling TikTok comment:", error);
  }
}

/**
 * Handle mention in a video
 */
async function handleVideoMention(event: any, request: NextRequest) {
  try {
    // Parse mention event
    const parsed = TikTokAPIClient.parseComment(event);

    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in TikTok mention");
      return;
    }

    // Process mention as a special type of message
    const result = await processIncomingMessage({
      channelId,
      organizationId,
      externalId: parsed.externalId,
      content: `[Mención] ${parsed.content}`,
      messageType: "text",
      metadata: {
        ...parsed.metadata,
        isMention: true,
      },
      contactName: parsed.contactName,
      timestamp: new Date(
        (parsed.metadata?.timestamp || Date.now()) * 1000
      ).toISOString(),
    });

    console.log("TikTok mention processed:", result);
  } catch (error) {
    console.error("Error handling TikTok mention:", error);
  }
}

/**
 * GET handler for webhook verification
 *
 * TikTok may send a GET request to verify your webhook endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // TikTok webhook verification
  const challenge = searchParams.get("challenge");

  if (challenge) {
    console.log("TikTok webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Verification failed" },
    { status: 403 }
  );
}
