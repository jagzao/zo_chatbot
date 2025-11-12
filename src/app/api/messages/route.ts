import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversationMessages } from "@/lib/messages";

/**
 * Get messages for a conversation
 * GET /api/messages?conversationId=uuid&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("organization_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await getConversationMessages(conversationId, limit, offset);

    return NextResponse.json({
      messages,
      count: messages.length,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
