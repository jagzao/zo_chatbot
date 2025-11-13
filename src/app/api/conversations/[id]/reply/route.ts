import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMessage } from "@/lib/messages";
import { enqueueJob } from "@/lib/queue";

/**
 * POST /api/conversations/[id]/reply
 * Send a reply as a human agent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const conversationId = params.id;
    const body = await request.json();
    const { content, messageType = "text" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversation with channel info
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, organization_id, channel_id, external_id, is_human_takeover, assigned_agent_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", conversation.organization_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Save message to database
    const message = await createMessage({
      conversationId,
      content,
      messageType,
      direction: "outbound",
      sentBy: user.id,
      isBotResponse: false, // Human message, not bot
    });

    // Enqueue job to send the message via the appropriate channel
    await enqueueJob({
      organizationId: conversation.organization_id,
      payload: {
        action: "send_message",
        conversationId: conversation.id,
        messageId: message.id,
        channelId: conversation.channel_id,
        externalId: conversation.external_id,
        content,
        messageType,
      },
    });

    // Update last_agent_response_at if conversation is under human takeover
    if (conversation.is_human_takeover) {
      await supabase
        .from("conversations")
        .update({
          last_agent_response_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      message_id: message.id,
      conversation_id: conversationId,
    });
  } catch (error) {
    console.error("Error sending reply:", error);

    return NextResponse.json(
      {
        error: "Failed to send reply",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
