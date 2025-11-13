/**
 * Queue worker that processes pending jobs
 * This should be run as a background process or cron job
 */

import { getPendingJobs, markJobAsProcessing, markJobAsCompleted, markJobAsFailed } from "@/lib/queue";
import { getChannel } from "@/lib/messages";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp";

/**
 * Process a single job from the queue
 */
async function processJob(job: any): Promise<void> {
  const payload = job.payload;

  switch (payload.action) {
    case "send_message":
      await processSendMessage(payload);
      break;

    default:
      console.warn(`Unknown job action: ${payload.action}`);
  }
}

/**
 * Process send_message job
 */
async function processSendMessage(payload: any): Promise<void> {
  const { channelId, externalId, content, messageType } = payload;

  // Get channel configuration
  const channel = await getChannel(channelId);
  if (!channel) {
    throw new Error(`Channel not found: ${channelId}`);
  }

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
      // TODO: Implement in Phase 6
      console.log("Facebook sending not yet implemented");
      break;

    case "instagram":
      // TODO: Implement in Phase 7
      console.log("Instagram sending not yet implemented");
      break;

    case "tiktok":
      // TODO: Implement in Phase 8
      console.log("TikTok sending not yet implemented");
      break;

    default:
      throw new Error(`Unknown channel type: ${channel.type}`);
  }
}

/**
 * Main worker function
 * This should be called periodically (e.g., every minute via cron)
 */
export async function runQueueWorker(): Promise<void> {
  console.log("Queue worker starting...");

  try {
    // Get pending jobs (limit 10 per run)
    const jobs = await getPendingJobs(10);

    console.log(`Processing ${jobs.length} pending jobs`);

    // Process each job
    for (const job of jobs) {
      try {
        // Mark as processing
        await markJobAsProcessing(job.id);

        // Process the job
        await processJob(job);

        // Mark as completed
        await markJobAsCompleted(job.id);

        console.log(`Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);

        // Mark as failed (will auto-retry with backoff)
        await markJobAsFailed(
          job.id,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    console.log("Queue worker finished");
  } catch (error) {
    console.error("Queue worker error:", error);
  }
}
