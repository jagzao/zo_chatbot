import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 * Simple health check endpoint
 */
export async function GET() {
  try {
    // Check database connectivity
    const supabase = createAdminClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "error",
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
