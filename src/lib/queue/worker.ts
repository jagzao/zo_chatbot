/**
 * Queue worker that processes pending jobs
 * This should be run as a background process or cron job
 */

import { getPendingJobs, markJobAsProcessing, markJobAsCompleted, markJobAsFailed } from "@/lib/queue";
import { getChannel } from "@/lib/messages";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp";
import { sendFacebookMessage } from "@/lib/integrations/facebook";
import { sendInstagramMessage } from "@/lib/integrations/instagram";
import { sendTikTokComment } from "@/lib/integrations/tiktok";
import { logger, createLogger } from "@/lib/logger";
import { metricsCollector } from "./metrics";

/**
 * Process a single job from the queue
 */
async function processJob(job: any): Promise<void> {
  const payload = job.payload;
  const jobLogger = createLogger({
    jobId: job.id,
    organizationId: job.organization_id,
    action: payload.action,
  });

  jobLogger.debug("Processing job", { payload });

  switch (payload.action) {
    case "send_message":
      await processSendMessage(payload, jobLogger);
      break;

    default:
      jobLogger.warn("Unknown job action");
      throw new Error(`Unknown job action: ${payload.action}`);
  }
}

/**
 * Process send_message job
 */
async function processSendMessage(payload: any, jobLogger: any): Promise<void> {
  const { channelId, externalId, content, messageType } = payload;

  jobLogger.info("Processing send_message", {
    channelId,
    externalId,
    messageType,
  });

  // Get channel configuration
  const channel = await getChannel(channelId);
  if (!channel) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  jobLogger.info("Sending message via channel", {
    channelType: channel.type,
    channelName: channel.name,
  });

  // Route to appropriate channel integration
  switch (channel.type) {
    case "whatsapp":
      await sendWhatsAppMessage(
        channel,
        externalId,
        content,
        messageType || "text",
        payload.metadata?.mediaUrl
      );
      break;

    case "facebook":
      await sendFacebookMessage(
        channel,
        externalId,
        content,
        messageType || "text",
        payload.metadata?.mediaUrl
      );
      break;

    case "instagram":
      await sendInstagramMessage(
        channel,
        externalId,
        content,
        messageType || "text",
        payload.metadata?.mediaUrl
      );
      break;

    case "tiktok":
      // TikTok requires videoId to reply to a comment
      const videoId = payload.metadata?.videoId;
      const parentCommentId = payload.metadata?.commentId;

      if (!videoId) {
        throw new Error("TikTok requires videoId to reply to comment");
      }

      await sendTikTokComment(
        channel,
        videoId,
        content,
        parentCommentId
      );
      break;

    default:
      throw new Error(`Unknown channel type: ${channel.type}`);
  }

  jobLogger.info("Message sent successfully");
}

/**
 * Main worker function
 * This should be called periodically (e.g., every minute via cron)
 */
export async function runQueueWorker(options?: {
  batchSize?: number;
  concurrency?: number;
}): Promise<void> {
  const batchSize = options?.batchSize || 10;
  const concurrency = options?.concurrency || 5;

  logger.info("Queue worker starting", { batchSize, concurrency });

  const workerStartTime = Date.now();

  try {
    // Get pending jobs
    const jobs = await getPendingJobs(batchSize);

    logger.info("Fetched pending jobs", { count: jobs.length });

    if (jobs.length === 0) {
      logger.debug("No pending jobs to process");
      return;
    }

    // Process jobs with limited concurrency
    const results = await processJobsWithConcurrency(jobs, concurrency);

    // Log summary
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const duration = Date.now() - workerStartTime;

    logger.info("Queue worker finished", {
      total: jobs.length,
      succeeded,
      failed,
      durationMs: duration,
      avgTimePerJob: Math.round(duration / jobs.length),
    });
  } catch (error) {
    logger.error("Queue worker error", {}, error as Error);
  }
}

/**
 * Process multiple jobs with limited concurrency
 */
async function processJobsWithConcurrency(
  jobs: any[],
  concurrency: number
): Promise<{ jobId: string; success: boolean }[]> {
  const results: { jobId: string; success: boolean }[] = [];
  const executing: Promise<void>[] = [];

  for (const job of jobs) {
    const promise = processJobWithMetrics(job).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  // Wait for remaining jobs
  await Promise.all(executing);

  return results;
}

/**
 * Process a single job with metrics tracking
 */
async function processJobWithMetrics(
  job: any
): Promise<{ jobId: string; success: boolean }> {
  const startTime = Date.now();

  try {
    // Mark as processing
    await markJobAsProcessing(job.id);

    // Process the job
    await processJob(job);

    // Mark as completed
    await markJobAsCompleted(job.id);

    // Record metrics
    const processingTime = Date.now() - startTime;
    metricsCollector.recordSuccess(job.organization_id, processingTime);

    logger.info("Job completed successfully", {
      jobId: job.id,
      organizationId: job.organization_id,
      processingTimeMs: processingTime,
    });

    return { jobId: job.id, success: true };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("Job failed", {
      jobId: job.id,
      organizationId: job.organization_id,
      processingTimeMs: processingTime,
      error: errorMessage,
    }, error as Error);

    // Mark as failed (will auto-retry with backoff or move to DLQ)
    await markJobAsFailed(job.id, errorMessage);

    // Record metrics
    const isRetry = job.retry_count > 0;
    metricsCollector.recordFailure(job.organization_id, isRetry);

    return { jobId: job.id, success: false };
  }
}

/**
 * Run worker in continuous mode (for development/testing)
 */
export async function runQueueWorkerContinuous(intervalMs: number = 60000): Promise<void> {
  logger.info("Starting queue worker in continuous mode", { intervalMs });

  // Run immediately
  await runQueueWorker();

  // Then run on interval
  setInterval(async () => {
    try {
      await runQueueWorker();
    } catch (error) {
      logger.error("Error in continuous worker loop", {}, error as Error);
    }
  }, intervalMs);
}
