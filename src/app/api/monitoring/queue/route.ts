import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPendingJobs, getFailedJobs } from "@/lib/queue";
import { getDLQJobs } from "@/lib/queue/dlq";
import { metricsCollector } from "@/lib/queue/metrics";

/**
 * GET /api/monitoring/queue
 * Get queue statistics and health status
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

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    // Only admins and owners can view monitoring data
    if (membership.role !== "admin" && membership.role !== "owner") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const organizationId = membership.organization_id;

    // Get queue statistics from database
    const [
      { count: pendingCount },
      { count: processingCount },
      { count: completedCount },
      { count: failedCount },
    ] = await Promise.all([
      supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
      supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "processing"),
      supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "completed"),
      supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "failed"),
    ]);

    // Get DLQ count
    const { count: dlqCount } = await supabase
      .from("message_queue_dlq")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    // Get metrics from memory
    const metrics = metricsCollector.getMetrics(organizationId);

    // Get recent failed jobs
    const failedJobs = await getFailedJobs(5);
    const orgFailedJobs = failedJobs.filter(
      (job) => job.organization_id === organizationId
    );

    // Get recent DLQ jobs
    const dlqJobs = await getDLQJobs(organizationId, 5);

    // Calculate health status
    const totalJobs = (pendingCount || 0) + (processingCount || 0);
    const failureRate =
      metrics.totalProcessed > 0
        ? (metrics.totalFailed / metrics.totalProcessed) * 100
        : 0;

    let healthStatus = "healthy";
    if (failureRate > 50 || (dlqCount || 0) > 100) {
      healthStatus = "unhealthy";
    } else if (failureRate > 20 || (dlqCount || 0) > 50 || totalJobs > 100) {
      healthStatus = "degraded";
    }

    return NextResponse.json({
      status: healthStatus,
      queue: {
        pending: pendingCount || 0,
        processing: processingCount || 0,
        completed: completedCount || 0,
        failed: failedCount || 0,
        dlq: dlqCount || 0,
      },
      metrics: {
        totalProcessed: metrics.totalProcessed,
        totalSucceeded: metrics.totalSucceeded,
        totalFailed: metrics.totalFailed,
        totalRetried: metrics.totalRetried,
        averageProcessingTime: Math.round(metrics.averageProcessingTime),
        failureRate: Math.round(failureRate * 10) / 10,
        lastProcessedAt: metrics.lastProcessedAt,
      },
      recentFailures: orgFailedJobs.map((job) => ({
        id: job.id,
        payload: job.payload,
        error: job.error,
        retryCount: job.retry_count,
        createdAt: job.created_at,
      })),
      recentDLQ: dlqJobs.map((job) => ({
        id: job.id,
        originalJobId: job.original_job_id,
        payload: job.payload,
        error: job.error,
        retryCount: job.retry_count,
        failedAt: job.failed_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching queue monitoring data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 }
    );
  }
}
