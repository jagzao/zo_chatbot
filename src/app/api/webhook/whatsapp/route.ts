import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/messages/processor";
import { EvolutionAPIClient } from "@/lib/integrations/whatsapp/evolution-client";
import { getChannel } from "@/lib/messages";

/**
 * WhatsApp webhook via Evolution API
 * POST /api/webhook/whatsapp
 *
 * Evolution API sends webhooks when messages are received
 * Event types: MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate Evolution API key
    const apiKey = request.headers.get("apikey");
    if (!apiKey || apiKey !== process.env.EVOLUTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check event type
    const event = body.event;

    if (event === "messages.upsert") {
      // New message received
      return await handleMessageUpsert(body, request);
    } else if (event === "connection.update") {
      // Connection status changed
      return await handleConnectionUpdate(body);
    }

    // Other events - acknowledge but don't process
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming message from WhatsApp
 */
async function handleMessageUpsert(body: any, request: NextRequest) {
  const data = body.data;

  // Skip messages sent by us (fromMe === true)
  if (data.key?.fromMe) {
    return NextResponse.json({ success: true, skipped: "fromMe" });
  }

  // Get instance name from webhook data
  const instanceName = body.instance;

  // Find channel configuration for this instance
  // Note: In a real implementation, you'd query the database
  // to find the channel_id based on instanceName
  // For now, we'll expect the instanceName to match a channel's config

  // Parse Evolution message to our format
  const parsed = EvolutionAPIClient.parseMessage(data);

  // Get channel from config
  // In production, you would:
  // 1. Query channels table where config.instanceName = instanceName
  // 2. Get the organization_id and channel_id
  // For now, we need these as query params or in headers

  const organizationId = request.headers.get("X-Organization-ID");
  const channelId = request.headers.get("X-Channel-ID");

  if (!organizationId || !channelId) {
    console.warn("Missing organization or channel ID in WhatsApp webhook");
    return NextResponse.json(
      { error: "Missing organization or channel configuration" },
      { status: 400 }
    );
  }

  // Process the message through our system
  const result = await processIncomingMessage({
    channelId,
    organizationId,
    externalId: parsed.externalId,
    content: parsed.content,
    messageType: parsed.messageType,
    metadata: parsed.metadata,
    contactName: parsed.contactName,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    conversationId: result.conversationId,
    messageId: result.messageId,
    responded: result.shouldRespond,
  });
}

/**
 * Handle connection status update
 */
async function handleConnectionUpdate(body: any) {
  const instanceName = body.instance;
  const state = body.data?.state;

  console.log(`WhatsApp instance ${instanceName} connection state: ${state}`);

  // You could update channel status in database here
  // For example, mark channel as inactive if state === "close"

  return NextResponse.json({
    success: true,
    event: "connection.update",
    state,
  });
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "webhook/whatsapp",
    timestamp: new Date().toISOString(),
  });
}
