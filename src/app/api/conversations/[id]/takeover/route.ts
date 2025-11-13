import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/conversations/[id]/takeover
 * Take over a conversation (human agent takes control)
 * Bot will stop responding automatically
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const conversationId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversation to verify it exists and user has access
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, organization_id, is_human_takeover, assigned_agent_id")
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

    // Check if already taken over by another agent
    if (conversation.is_human_takeover && conversation.assigned_agent_id !== user.id) {
      const { data: otherAgent } = await supabase
        .from("users")
        .select("email")
        .eq("id", conversation.assigned_agent_id!)
        .single();

      return NextResponse.json(
        {
          error: "Conversation already assigned to another agent",
          assigned_to: otherAgent?.email,
        },
        { status: 409 }
      );
    }

    // Take over the conversation
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_human_takeover: true,
        assigned_agent_id: user.id,
        takeover_at: new Date().toISOString(),
        last_agent_response_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Conversation taken over successfully",
      conversation_id: conversationId,
      assigned_agent_id: user.id,
    });
  } catch (error) {
    console.error("Error taking over conversation:", error);

    return NextResponse.json(
      {
        error: "Failed to take over conversation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]/takeover
 * Release a conversation (return to bot control)
 * Bot will resume responding automatically
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const conversationId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, organization_id, is_human_takeover, assigned_agent_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user has access
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

    // Only the assigned agent or an admin can release
    const isAssignedAgent = conversation.assigned_agent_id === user.id;
    const isAdmin = membership.role === "admin" || membership.role === "owner";

    if (!isAssignedAgent && !isAdmin) {
      return NextResponse.json(
        { error: "Only the assigned agent or an admin can release this conversation" },
        { status: 403 }
      );
    }

    // Release the conversation
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        is_human_takeover: false,
        assigned_agent_id: null,
      })
      .eq("id", conversationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Conversation released successfully. Bot will resume responding.",
      conversation_id: conversationId,
    });
  } catch (error) {
    console.error("Error releasing conversation:", error);

    return NextResponse.json(
      {
        error: "Failed to release conversation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/conversations/[id]/takeover
 * Get takeover status of a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const conversationId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get conversation with agent info
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select(`
        id,
        organization_id,
        is_human_takeover,
        assigned_agent_id,
        takeover_at,
        last_agent_response_at,
        users:assigned_agent_id (
          id,
          email
        )
      `)
      .eq("id", conversationId)
      .single();

    if (error || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user has access
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

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      is_human_takeover: conversation.is_human_takeover,
      assigned_agent: conversation.assigned_agent_id
        ? {
            id: conversation.assigned_agent_id,
            email: (conversation as any).users?.email,
          }
        : null,
      takeover_at: conversation.takeover_at,
      last_agent_response_at: conversation.last_agent_response_at,
    });
  } catch (error) {
    console.error("Error getting takeover status:", error);

    return NextResponse.json(
      {
        error: "Failed to get takeover status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
