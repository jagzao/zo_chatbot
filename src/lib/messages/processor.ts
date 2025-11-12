import type { Database } from "@/types/database";
import { getOrCreateConversation, createMessage, getRecentMessages } from "@/lib/messages";
import { processBotFlows } from "@/lib/bot/processor";
import { enqueueJob } from "@/lib/queue";

type ChannelType = Database["public"]["Tables"]["channels"]["Row"]["type"];

export interface IncomingMessage {
  channelId: string;
  organizationId: string;
  externalId: string; // External user ID (e.g., phone number, IG user ID)
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  metadata?: Record<string, any>;
  contactName?: string;
  contactMetadata?: Record<string, any>;
  timestamp: string;
}

export interface ProcessedMessage {
  conversationId: string;
  messageId: string;
  shouldRespond: boolean;
  response?: string;
  error?: string;
}

/**
 * Process an incoming message from any channel
 * This is the main entry point for all incoming messages
 */
export async function processIncomingMessage(
  message: IncomingMessage
): Promise<ProcessedMessage> {
  try {
    // Step 1: Get or create conversation
    const conversation = await getOrCreateConversation({
      organizationId: message.organizationId,
      channelId: message.channelId,
      externalId: message.externalId,
      contactName: message.contactName,
      contactMetadata: message.contactMetadata,
    });

    // Step 2: Save incoming message
    const savedMessage = await createMessage({
      conversationId: conversation.id,
      content: message.content,
      messageType: message.messageType,
      direction: "inbound",
      metadata: message.metadata,
      isBotResponse: false,
    });

    // Step 3: Get conversation history for context
    const history = await getRecentMessages(conversation.id, 10);

    // Step 4: Process with bot flows to determine response
    const botResponse = await processBotFlows({
      organizationId: message.organizationId,
      conversationId: conversation.id,
      message: savedMessage,
      history,
    });

    // Step 5: If we have a response, enqueue it for sending
    if (botResponse.shouldRespond && botResponse.response) {
      // Save bot response to database
      const responseMessage = await createMessage({
        conversationId: conversation.id,
        content: botResponse.response,
        messageType: "text",
        direction: "outbound",
        isBotResponse: true,
      });

      // Enqueue job to send the message via the appropriate channel
      await enqueueJob({
        organizationId: message.organizationId,
        payload: {
          action: "send_message",
          conversationId: conversation.id,
          messageId: responseMessage.id,
          channelId: message.channelId,
          externalId: message.externalId,
          content: botResponse.response,
          messageType: "text",
        },
      });

      return {
        conversationId: conversation.id,
        messageId: savedMessage.id,
        shouldRespond: true,
        response: botResponse.response,
      };
    }

    return {
      conversationId: conversation.id,
      messageId: savedMessage.id,
      shouldRespond: false,
    };
  } catch (error) {
    console.error("Error processing incoming message:", error);
    return {
      conversationId: "",
      messageId: "",
      shouldRespond: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an outgoing message (from agent/manual reply)
 */
export async function sendOutgoingMessage(
  conversationId: string,
  content: string,
  sentBy: string,
  messageType: "text" | "image" | "video" | "audio" | "file" = "text"
): Promise<string> {
  // Save message to database
  const message = await createMessage({
    conversationId,
    content,
    messageType,
    direction: "outbound",
    sentBy,
    isBotResponse: false,
  });

  // TODO: Get conversation and channel info to send via appropriate channel
  // This will be implemented when we add specific channel integrations

  return message.id;
}

/**
 * Validate incoming webhook signature
 * Each channel will have its own validation logic
 */
export function validateWebhookSignature(
  channelType: ChannelType,
  signature: string,
  payload: string,
  secret: string
): boolean {
  // Each channel implementation will override this
  // For now, basic implementation
  switch (channelType) {
    case "facebook":
    case "instagram":
      // Validate Facebook/Instagram webhook signature
      // Implementation will be in the specific channel module
      return true;

    case "whatsapp":
      // Validate Evolution API signature
      return true;

    case "tiktok":
      // Validate TikTok signature
      return true;

    default:
      return false;
  }
}
