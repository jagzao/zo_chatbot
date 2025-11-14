import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { logger } from "@/lib/logger";
import { moveToDLQ } from "./dlq";

type QueueJob = Database["public"]["Tables"]["message_queue"]["Row"];

interface EnqueueJobParams {
  organizationId: string;
  payload: Record<string, any>;
  maxRetries?: number;
  scheduledFor?: Date;
}

/**
 * Add a job to the message queue
 */
export async function enqueueJob(params: EnqueueJobParams): Promise<QueueJob> {
  const supabase = createAdminClient();

  logger.debug("Enqueuing job", {
    organizationId: params.organizationId,
    action: params.payload.action,
  });

  const { data, error } = await supabase
    .from("message_queue")
    .insert({
      organization_id: params.organizationId,
      payload: params.payload as any,
      status: "pending",
      retry_count: 0,
      max_retries: params.maxRetries || 3,
      scheduled_for: params.scheduledFor?.toISOString() || new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error || !data) {
    logger.error("Failed to enqueue job", {
      organizationId: params.organizationId,
    }, error);
    throw error || new Error("No data returned");
  }

  const job = data as QueueJob;

  logger.info("Job enqueued successfully", {
    organizationId: params.organizationId,
    jobId: job.id,
  });

  return job;
}

/**
 * Get pending jobs from queue
 */
export async function getPendingJobs(limit: number = 10): Promise<QueueJob[]> {
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("message_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as QueueJob[]) || [];
}

/**
 * Mark job as processing
 */
export async function markJobAsProcessing(jobId: string): Promise<void> {
  const supabase: any = createAdminClient();

  const { error } = await supabase
    .from("message_queue")
    .update({ status: "processing" })
    .eq("id", jobId);

  if (error) throw error;
}

/**
 * Mark job as completed
 */
export async function markJobAsCompleted(jobId: string): Promise<void> {
  const supabase: any = createAdminClient();

  const { error } = await supabase
    .from("message_queue")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) throw error;
}

/**
 * Mark job as failed and handle retry logic with jitter
 */
export async function markJobAsFailed(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const supabase: any = createAdminClient();

  // Get current job
  const { data: job } = await supabase
    .from("message_queue")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) {
    logger.warn("Job not found for marking as failed", { jobId });
    return;
  }

  const jobData = job as any;
  const retryCount = jobData.retry_count + 1;

  logger.info("Job failed", {
    jobId,
    organizationId: jobData.organization_id,
    retryCount,
    maxRetries: jobData.max_retries,
    error: errorMessage,
  });

  if (retryCount >= jobData.max_retries) {
    // Max retries reached, move to DLQ
    logger.warn("Job exceeded max retries, moving to DLQ", {
      jobId,
      organizationId: jobData.organization_id,
      retryCount,
    });

    try {
      // Move to Dead Letter Queue
      await moveToDLQ(
        jobId,
        jobData.payload,
        jobData.organization_id,
        errorMessage,
        retryCount
      );

      // Mark as failed permanently
      await supabase
        .from("message_queue")
        .update({
          status: "failed",
          error: errorMessage,
          retry_count: retryCount,
          processed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (dlqError) {
      logger.error("Failed to move job to DLQ", {
        jobId,
        organizationId: jobData.organization_id,
      }, dlqError as Error);
    }
  } else {
    // Schedule for retry with exponential backoff + jitter
    const baseDelaySeconds = Math.pow(2, retryCount) * 60; // 2^n minutes
    const jitter = Math.random() * 30; // 0-30 seconds of jitter
    const totalDelaySeconds = baseDelaySeconds + jitter;
    const scheduledFor = new Date(Date.now() + totalDelaySeconds * 1000);

    logger.info("Scheduling job for retry", {
      jobId,
      organizationId: jobData.organization_id,
      retryCount,
      delaySeconds: Math.round(totalDelaySeconds),
      scheduledFor: scheduledFor.toISOString(),
    });

    await supabase
      .from("message_queue")
      .update({
        status: "pending",
        error: errorMessage,
        retry_count: retryCount,
        scheduled_for: scheduledFor.toISOString(),
      })
      .eq("id", jobId);
  }
}

/**
 * Clean up old completed/failed jobs
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
  const supabase = createAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from("message_queue")
    .delete()
    .in("status", ["completed", "failed"])
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) throw error;
  return data?.length || 0;
}

/**
 * Get failed jobs for monitoring
 */
export async function getFailedJobs(limit: number = 50): Promise<QueueJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("message_queue")
    .select("*")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as QueueJob[]) || [];
}
