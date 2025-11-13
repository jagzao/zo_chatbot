import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/messages/processor";
import { InstagramGraphClient } from "@/lib/integrations/instagram/graph-client";

/**
 * Instagram Direct webhook
 * POST /api/webhook/instagram
 *
 * Instagram sends webhooks when direct messages are received, story mentions, etc.
 * Documentation: https://developers.facebook.com/docs/messenger-platform/instagram
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

    if (appSecret && signature) {
      const rawBody = JSON.stringify(body);
      const isValid = InstagramGraphClient.verifyWebhookSignature(
        rawBody,
        signature,
        appSecret
      );

      if (!isValid) {
        console.error("Invalid Instagram webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Instagram sends an object with an 'entry' array (same structure as Facebook)
    if (body.object !== "instagram") {
      return NextResponse.json(
        { error: "Webhook not for Instagram" },
        { status: 400 }
      );
    }

    // Process each entry (can contain multiple events)
    for (const entry of body.entry || []) {
      // Get Instagram Business Account ID
      const igBusinessAccountId = entry.id;

      // Process messaging events
      for (const event of entry.messaging || []) {
        // Skip echo messages (messages sent by us)
        if (event.message?.is_echo) {
          continue;
        }

        // Handle message event
        if (event.message) {
          await handleMessage(event, igBusinessAccountId, request);
        }

        // Handle postback event (button clicks, ice breakers)
        if (event.postback) {
          await handlePostback(event, igBusinessAccountId, request);
        }

        // Handle read event (message read by user)
        if (event.read) {
          console.log("Message read by Instagram user:", event.sender.id);
        }

        // Handle delivery event (message delivered)
        if (event.delivery) {
          console.log("Message delivered to Instagram user:", event.sender.id);
        }
      }
    }

    // Always return 200 OK to Instagram
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Instagram webhook:", error);

    // Still return 200 to Instagram to avoid retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle incoming Instagram Direct message
 */
async function handleMessage(
  event: any,
  igBusinessAccountId: string,
  request: NextRequest
) {
  try {
    // Parse Instagram message to our format
    const parsed = InstagramGraphClient.parseMessage(event);

    // Get organization and channel from headers or query
    // In production, you would query the database to find the channel
    // based on igBusinessAccountId
    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in Instagram webhook");
      console.warn("Instagram Business Account ID:", igBusinessAccountId);
      // In a production setup, you would:
      // 1. Query channels table WHERE config->>'igBusinessAccountId' = igBusinessAccountId
      // 2. Get the organization_id and channel_id from that row
      return;
    }

    // Optional: Get user profile for contact name and username
    // const profile = await getInstagramUserProfile(channel, parsed.externalId);
    // parsed.contactName = profile.name || profile.username;

    // Process the message through our system
    const result = await processIncomingMessage({
      channelId,
      organizationId,
      externalId: parsed.externalId,
      content: parsed.content,
      messageType: parsed.messageType,
      metadata: parsed.metadata,
      contactName: parsed.contactName,
      timestamp: new Date(parsed.metadata?.timestamp || Date.now()).toISOString(),
    });

    console.log("Instagram message processed:", result);
  } catch (error) {
    console.error("Error handling Instagram message:", error);
  }
}

/**
 * Handle postback event (button clicks, ice breakers)
 */
async function handlePostback(
  event: any,
  igBusinessAccountId: string,
  request: NextRequest
) {
  try {
    // Treat postback as a text message with the payload
    const parsed = InstagramGraphClient.parseMessage(event);

    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in Instagram postback");
      return;
    }

    // Process postback as a regular message
    const result = await processIncomingMessage({
      channelId,
      organizationId,
      externalId: parsed.externalId,
      content: parsed.content,
      messageType: "text",
      metadata: {
        ...parsed.metadata,
        isPostback: true,
      },
      timestamp: new Date(event.timestamp).toISOString(),
    });

    console.log("Instagram postback processed:", result);
  } catch (error) {
    console.error("Error handling Instagram postback:", error);
  }
}

/**
 * GET handler for webhook verification
 *
 * Instagram (like Facebook) will send a GET request with hub.mode, hub.verify_token, and hub.challenge
 * You must return hub.challenge if verify_token matches
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN ||
                      process.env.FACEBOOK_VERIFY_TOKEN ||
                      "zo-chatbot-verify";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Instagram webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Verification failed" },
    { status: 403 }
  );
}
