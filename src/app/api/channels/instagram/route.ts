import { NextRequest, NextResponse } from "next/server";
import { sendInstagramMessage, getInstagramUserProfile } from "@/lib/integrations/instagram";
import { getChannel } from "@/lib/messages";

/**
 * POST /api/channels/instagram/send-test
 * Send a test message via Instagram Direct
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, recipientId, message, messageType, mediaUrl } = body;

    if (!channelId || !recipientId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: channelId, recipientId, message" },
        { status: 400 }
      );
    }

    // Get channel
    const channel = await getChannel(channelId);
    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    if (channel.type !== "instagram") {
      return NextResponse.json(
        { error: "Channel is not an Instagram channel" },
        { status: 400 }
      );
    }

    // Send test message
    await sendInstagramMessage(
      channel,
      recipientId,
      message,
      messageType || "text",
      mediaUrl
    );

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully",
    });
  } catch (error) {
    console.error("Error sending Instagram test message:", error);

    return NextResponse.json(
      {
        error: "Failed to send test message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/channels/instagram/profile?channelId=xxx&userId=xxx
 * Get Instagram user profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const userId = searchParams.get("userId");

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: channelId, userId" },
        { status: 400 }
      );
    }

    // Get channel
    const channel = await getChannel(channelId);
    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    if (channel.type !== "instagram") {
      return NextResponse.json(
        { error: "Channel is not an Instagram channel" },
        { status: 400 }
      );
    }

    // Get user profile
    const profile = await getInstagramUserProfile(channel, userId);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error getting Instagram user profile:", error);

    return NextResponse.json(
      {
        error: "Failed to get user profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
