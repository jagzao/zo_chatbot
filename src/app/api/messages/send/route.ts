import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOutgoingMessage } from "@/lib/messages/processor";

/**
 * Send a message from an agent/user
 * POST /api/messages/send
 *
 * Body:
 * {
 *   "conversationId": "uuid",
 *   "content": "message text",
 *   "messageType": "text" | "image" | "video" | "audio" | "file"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    if (!body.conversationId || !body.content) {
      return NextResponse.json(
        { error: "Missing conversationId or content" },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("organization_id")
      .eq("id", body.conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Send the message
    const messageId = await sendOutgoingMessage(
      body.conversationId,
      body.content,
      user.id,
      body.messageType || "text"
    );

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error("Error sending message:", error);

    return NextResponse.json(
      {
        error: "Failed to send message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
