import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/messages/processor";
import type { IncomingMessage } from "@/lib/messages/processor";

/**
 * Generic webhook receiver for all channels
 * POST /api/webhook/receive
 *
 * Expected body format:
 * {
 *   "channel": "whatsapp" | "facebook" | "instagram" | "tiktok",
 *   "organizationId": "uuid",
 *   "channelId": "uuid",
 *   "externalId": "sender_id",
 *   "content": "message text",
 *   "messageType": "text" | "image" | "video" | "audio" | "file",
 *   "metadata": {},
 *   "contactName": "optional",
 *   "contactMetadata": {},
 *   "timestamp": "ISO 8601"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (
      !body.channelId ||
      !body.organizationId ||
      !body.externalId ||
      !body.content
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Construct incoming message
    const incomingMessage: IncomingMessage = {
      channelId: body.channelId,
      organizationId: body.organizationId,
      externalId: body.externalId,
      content: body.content,
      messageType: body.messageType || "text",
      metadata: body.metadata || {},
      contactName: body.contactName,
      contactMetadata: body.contactMetadata || {},
      timestamp: body.timestamp || new Date().toISOString(),
    };

    // Process the message
    const result = await processIncomingMessage(incomingMessage);

    // Return success response
    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      messageId: result.messageId,
      responded: result.shouldRespond,
      response: result.response,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);

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
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "webhook/receive",
    timestamp: new Date().toISOString(),
  });
}
