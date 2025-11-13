import { NextRequest, NextResponse } from "next/server";
import { runQueueWorker } from "@/lib/queue/worker";

/**
 * API endpoint to manually trigger queue worker
 * POST /api/queue/process
 *
 * In production, you would:
 * 1. Use Vercel Cron Jobs (vercel.json)
 * 2. Or use a service like Supabase Edge Functions with pg_cron
 * 3. Or deploy a separate worker service
 *
 * For development/testing, you can call this endpoint manually
 */
export async function POST(request: NextRequest) {
  try {
    // Verify secret key to prevent unauthorized access
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.QUEUE_WORKER_SECRET || "dev-secret";

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the worker
    await runQueueWorker();

    return NextResponse.json({
      success: true,
      message: "Queue worker executed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error running queue worker:", error);

    return NextResponse.json(
      {
        error: "Failed to run queue worker",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "queue/process",
    note: "Use POST with Authorization header to process queue",
  });
}
