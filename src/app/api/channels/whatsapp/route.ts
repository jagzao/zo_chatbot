import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, checkWhatsAppConnection } from "@/lib/integrations/whatsapp";

/**
 * GET /api/channels/whatsapp/status?channelId=uuid
 * Check WhatsApp connection status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get channel ID from query
    const channelId = request.nextUrl.searchParams.get("channelId");
    if (!channelId) {
      return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
    }

    // Get channel
    const { data: channel, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .eq("type", "whatsapp")
      .single();

    if (error || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check connection status
    const status = await checkWhatsAppConnection(channel);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking WhatsApp status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/whatsapp/send-test
 * Send test message
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, phoneNumber, message } = body;

    if (!channelId || !phoneNumber || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get channel
    const { data: channel, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .eq("type", "whatsapp")
      .single();

    if (error || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Send message
    await sendWhatsAppMessage(channel, phoneNumber, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending test message:", error);
    return NextResponse.json(
      {
        error: "Failed to send message",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
