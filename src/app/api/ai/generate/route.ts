import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai/service";

/**
 * POST /api/ai/generate
 * Generate an AI response
 *
 * This endpoint allows testing AI responses directly
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      systemPrompt,
      context,
      temperature,
      maxTokens,
      preferredProvider,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Missing required field: message" },
        { status: 400 }
      );
    }

    // Get AI service
    const aiService = getAIService();

    if (!aiService.isAvailable()) {
      return NextResponse.json(
        {
          error: "AI service not available",
          message: "No AI providers are configured. Please set GROQ_API_KEY or CLOUDFLARE credentials.",
        },
        { status: 503 }
      );
    }

    // Generate response
    const result = await aiService.generateResponse(message, {
      systemPrompt,
      context,
      temperature,
      maxTokens,
      preferredProvider,
    });

    return NextResponse.json({
      success: true,
      response: result.response,
      provider: result.provider,
      availableProviders: aiService.getAvailableProviders(),
    });
  } catch (error) {
    console.error("Error generating AI response:", error);

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/generate
 * Check AI service status
 */
export async function GET() {
  const aiService = getAIService();

  return NextResponse.json({
    available: aiService.isAvailable(),
    providers: aiService.getAvailableProviders(),
  });
}
