import { createEvolutionClient } from "@/lib/integrations/whatsapp/evolution-client";
import type { Database } from "@/types/database";

type Channel = Database["public"]["Tables"]["channels"]["Row"];

/**
 * Send WhatsApp message via Evolution API
 */
export async function sendWhatsAppMessage(
  channel: Channel,
  phoneNumber: string,
  content: string,
  messageType: "text" | "image" | "video" | "audio" | "file" | "document" = "text",
  mediaUrl?: string
): Promise<void> {
  // Get instance name from channel config
  const config = channel.config as any;
  const instanceName = config.instanceName || config.instance_name || "default";

  // Create Evolution API client
  const client = createEvolutionClient(instanceName);

  // Format phone number (remove + and ensure it has country code)
  const formattedNumber = phoneNumber.replace(/\+/g, "").replace(/\s/g, "");

  if (messageType === "text") {
    // Send text message
    await client.sendTextMessage({
      number: formattedNumber,
      text: content,
    });
  } else if (mediaUrl) {
    // Map 'file' to 'document' for Evolution API
    const evolutionType = messageType === "file" ? "document" : messageType;

    // Send media message
    await client.sendMediaMessage({
      number: formattedNumber,
      mediaUrl,
      caption: content,
      mediaType: evolutionType as "image" | "video" | "audio" | "document",
    });
  } else {
    throw new Error("Media URL required for non-text messages");
  }
}

/**
 * Check WhatsApp connection status
 */
export async function checkWhatsAppConnection(channel: Channel): Promise<{
  connected: boolean;
  state: string;
  error?: string;
}> {
  try {
    const config = channel.config as any;
    const instanceName = config.instanceName || config.instance_name || "default";

    const client = createEvolutionClient(instanceName);
    const status = await client.getConnectionStatus();

    return {
      connected: status.state === "open",
      state: status.state,
    };
  } catch (error) {
    return {
      connected: false,
      state: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get QR code for WhatsApp connection
 */
export async function getWhatsAppQRCode(instanceName: string): Promise<string> {
  const client = createEvolutionClient(instanceName);
  const qr = await client.getQRCode();
  return qr.base64; // Returns base64 encoded QR code image
}

/**
 * Disconnect WhatsApp instance
 */
export async function disconnectWhatsApp(channel: Channel): Promise<void> {
  const config = channel.config as any;
  const instanceName = config.instanceName || config.instance_name || "default";

  const client = createEvolutionClient(instanceName);
  await client.logout();
}

/**
 * Setup webhook for WhatsApp instance
 */
export async function setupWhatsAppWebhook(
  instanceName: string,
  webhookUrl: string
): Promise<void> {
  const client = createEvolutionClient(instanceName);
  await client.setWebhook(webhookUrl);
}
