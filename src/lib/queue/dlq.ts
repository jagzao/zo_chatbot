/**
 * Dead Letter Queue (DLQ) for permanently failed jobs
 * Jobs that exceed max retries are moved here for manual review
 */

import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface DLQJob {
  id: string;
  organization_id: string;
  original_job_id: string;
  payload: any;
  error: string;
  retry_count: number;
  failed_at: string;
  created_at: string;
}

/**
 * Move a failed job to the Dead Letter Queue
 */
export async function moveToDLQ(
  jobId: string,
  payload: any,
  organizationId: string,
  error: string,
  retryCount: number
): Promise<void> {
  const supabase: any = createAdminClient();

  try {
    // Insert into DLQ
    const { error: insertError } = await supabase.from("message_queue_dlq").insert({
      original_job_id: jobId,
      organization_id: organizationId,
      payload,
      error,
      retry_count: retryCount,
      failed_at: new Date().toISOString(),
    });

    if (insertError) {
      logger.error("Failed to insert job into DLQ", {
        jobId,
        organizationId,
        error: insertError.message,
      });
      throw insertError;
    }

    logger.info("Job moved to DLQ", {
      jobId,
      organizationId,
      retryCount,
    });
  } catch (error) {
    logger.error("Error moving job to DLQ", {
      jobId,
      organizationId,
    }, error as Error);
    throw error;
  }
}

/**
 * Get DLQ jobs for review
 */
export async function getDLQJobs(
  organizationId: string,
  limit: number = 50
): Promise<DLQJob[]> {
  const supabase: any = createAdminClient();

  const { data, error } = await supabase
    .from("message_queue_dlq")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Error fetching DLQ jobs", { organizationId }, error);
    throw error;
  }

  return (data as DLQJob[]) || [];
}

/**
 * Retry a job from DLQ
 */
export async function retryFromDLQ(dlqJobId: string): Promise<void> {
  const supabase: any = createAdminClient();

  // Get DLQ job
  const { data: dlqJob, error: fetchError } = await supabase
    .from("message_queue_dlq")
    .select("*")
    .eq("id", dlqJobId)
    .single();

  if (fetchError || !dlqJob) {
    throw new Error(`DLQ job not found: ${dlqJobId}`);
  }

  // Re-enqueue the job
  const { error: insertError } = await supabase.from("message_queue").insert({
    organization_id: dlqJob.organization_id,
    payload: dlqJob.payload,
    status: "pending",
    retry_count: 0,
    max_retries: 3,
    scheduled_for: new Date().toISOString(),
  });

  if (insertError) {
    throw insertError;
  }

  // Delete from DLQ
  await supabase.from("message_queue_dlq").delete().eq("id", dlqJobId);

  logger.info("Job retried from DLQ", {
    dlqJobId,
    organizationId: dlqJob.organization_id,
  });
}

/**
 * Clean up old DLQ jobs
 */
export async function cleanupDLQ(daysOld: number = 30): Promise<number> {
  const supabase: any = createAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from("message_queue_dlq")
    .delete()
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) {
    logger.error("Error cleaning up DLQ", {}, error);
    throw error;
  }

  const deletedCount = data?.length || 0;
  logger.info("DLQ cleanup completed", { deletedCount, daysOld });

  return deletedCount;
}
