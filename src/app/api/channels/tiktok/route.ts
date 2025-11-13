import { NextRequest, NextResponse } from "next/server";
import {
  sendTikTokComment,
  getTikTokVideoComments,
  getTikTokUserInfo,
  getTikTokVideoInfo,
} from "@/lib/integrations/tiktok";
import { getChannel } from "@/lib/messages";

/**
 * POST /api/channels/tiktok/comment
 * Reply to a comment on a TikTok video
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, videoId, message, parentCommentId } = body;

    if (!channelId || !videoId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: channelId, videoId, message" },
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

    if (channel.type !== "tiktok") {
      return NextResponse.json(
        { error: "Channel is not a TikTok channel" },
        { status: 400 }
      );
    }

    // Reply to comment
    await sendTikTokComment(channel, videoId, message, parentCommentId);

    return NextResponse.json({
      success: true,
      message: "Comment posted successfully",
    });
  } catch (error) {
    console.error("Error posting TikTok comment:", error);

    return NextResponse.json(
      {
        error: "Failed to post comment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/channels/tiktok/comments?channelId=xxx&videoId=xxx
 * Get comments on a TikTok video
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const videoId = searchParams.get("videoId");
    const userId = searchParams.get("userId");
    const cursor = searchParams.get("cursor") || undefined;

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing required parameter: channelId" },
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

    if (channel.type !== "tiktok") {
      return NextResponse.json(
        { error: "Channel is not a TikTok channel" },
        { status: 400 }
      );
    }

    // Get video comments
    if (videoId) {
      const result = await getTikTokVideoComments(channel, videoId, cursor);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Get user info
    if (userId) {
      const user = await getTikTokUserInfo(channel, userId);
      return NextResponse.json({
        success: true,
        user,
      });
    }

    return NextResponse.json(
      { error: "Provide either videoId or userId parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching TikTok data:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
