import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConversations } from "@/lib/messages";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Get conversations for an organization
 * GET /api/conversations?organizationId=uuid&limit=50
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
    const organizationId = searchParams.get("organizationId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 }
      );
    }

    // Verify user is member of organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get conversations
    const conversations = await getActiveConversations(organizationId, limit);

    return NextResponse.json({
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
