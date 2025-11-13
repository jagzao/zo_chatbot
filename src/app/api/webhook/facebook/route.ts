import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/messages/processor";
import { FacebookGraphClient } from "@/lib/integrations/facebook/graph-client";
import { markFacebookMessageAsSeen } from "@/lib/integrations/facebook";

/**
 * Facebook Messenger webhook
 * POST /api/webhook/facebook
 *
 * Facebook sends webhooks when messages are received, postbacks occur, etc.
 * Documentation: https://developers.facebook.com/docs/messenger-platform/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (appSecret && signature) {
      const rawBody = JSON.stringify(body);
      const isValid = FacebookGraphClient.verifyWebhookSignature(
        rawBody,
        signature,
        appSecret
      );

      if (!isValid) {
        console.error("Invalid Facebook webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Facebook sends an object with an 'entry' array
    if (body.object !== "page") {
      return NextResponse.json(
        { error: "Webhook not for a page" },
        { status: 400 }
      );
    }

    // Process each entry (can contain multiple events)
    for (const entry of body.entry || []) {
      // Get page ID (needed to find the right channel)
      const pageId = entry.id;

      // Process messaging events
      for (const event of entry.messaging || []) {
        // Handle message event
        if (event.message && !event.message.is_echo) {
          await handleMessage(event, pageId, request);
        }

        // Handle postback event (button clicks)
        if (event.postback) {
          await handlePostback(event, pageId, request);
        }

        // Handle read event (message read by user)
        if (event.read) {
          // Optional: Track message read status
          console.log("Message read by user:", event.sender.id);
        }

        // Handle delivery event (message delivered)
        if (event.delivery) {
          // Optional: Track message delivery
          console.log("Message delivered to:", event.sender.id);
        }
      }
    }

    // Always return 200 OK to Facebook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Facebook webhook:", error);

    // Still return 200 to Facebook to avoid retries
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle incoming message from Facebook
 */
async function handleMessage(
  event: any,
  pageId: string,
  request: NextRequest
) {
  try {
    // Parse Facebook message to our format
    const parsed = FacebookGraphClient.parseMessage(event);

    // Get organization and channel from headers or query
    // In production, you would query the database to find the channel
    // based on pageId
    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in Facebook webhook");
      console.warn("Page ID:", pageId);
      // In a production setup, you would:
      // 1. Query channels table WHERE config->>'pageId' = pageId
      // 2. Get the organization_id and channel_id from that row
      return;
    }

    // Optional: Get user profile for contact name
    // const profile = await getFacebookUserProfile(channel, parsed.externalId);
    // parsed.contactName = `${profile.first_name} ${profile.last_name}`;

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

    console.log("Facebook message processed:", result);
  } catch (error) {
    console.error("Error handling Facebook message:", error);
  }
}

/**
 * Handle postback event (button clicks)
 */
async function handlePostback(
  event: any,
  pageId: string,
  request: NextRequest
) {
  try {
    // Treat postback as a text message with the payload
    const parsed = FacebookGraphClient.parseMessage(event);

    const organizationId = request.headers.get("X-Organization-ID");
    const channelId = request.headers.get("X-Channel-ID");

    if (!organizationId || !channelId) {
      console.warn("Missing organization or channel ID in Facebook postback");
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

    console.log("Facebook postback processed:", result);
  } catch (error) {
    console.error("Error handling Facebook postback:", error);
  }
}

/**
 * GET handler for webhook verification
 *
 * Facebook will send a GET request with hub.mode, hub.verify_token, and hub.challenge
 * You must return hub.challenge if verify_token matches
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || "zo-chatbot-verify";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Facebook webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Verification failed" },
    { status: 403 }
  );
}
