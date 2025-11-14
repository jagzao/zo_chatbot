import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runQueueWorker } from "@/lib/queue/worker";
import { logger } from "@/lib/logger";

/**
 * POST /api/queue/trigger
 * Manually trigger queue worker (for testing/admin use)
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

    // Get user's organization and role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    // Only admins and owners can trigger queue worker
    if (membership.role !== "admin" && membership.role !== "owner") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    logger.info("Queue worker manually triggered", {
      userId: user.id,
      organizationId: membership.organization_id,
    });

    // Run worker (don't await, return immediately)
    runQueueWorker({ batchSize: 20, concurrency: 5 }).catch((error) => {
      logger.error("Error in manually triggered queue worker", {
        userId: user.id,
        organizationId: membership.organization_id,
      }, error);
    });

    return NextResponse.json({
      success: true,
      message: "Queue worker triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering queue worker:", error);
    return NextResponse.json(
      { error: "Failed to trigger queue worker" },
      { status: 500 }
    );
  }
}
