import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Channel = Database["public"]["Tables"]["channels"]["Row"];

interface CreateMessageParams {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "video" | "audio" | "file";
  direction: "inbound" | "outbound";
  metadata?: Record<string, any>;
  sentBy?: string;
  isBotResponse?: boolean;
}

interface CreateConversationParams {
  organizationId: string;
  channelId: string;
  externalId: string;
  contactName?: string;
  contactMetadata?: Record<string, any>;
}

/**
 * Create or get existing conversation
 */
export async function getOrCreateConversation(
  params: CreateConversationParams
): Promise<Conversation> {
  const supabase = await createClient();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("channel_id", params.channelId)
    .eq("external_id", params.externalId)
    .single();

  if (existing) {
    // Update updated_at
    const { data: updated } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    return updated || existing;
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: params.organizationId,
      channel_id: params.channelId,
      external_id: params.externalId,
      contact_name: params.contactName || null,
      contact_metadata: params.contactMetadata || {},
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;
  return newConversation;
}

/**
 * Create a message in a conversation
 */
export async function createMessage(params: CreateMessageParams): Promise<Message> {
  const supabase = await createClient();

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      content: params.content,
      message_type: params.messageType || "text",
      direction: params.direction,
      metadata: params.metadata || {},
      sent_by: params.sentBy || null,
      is_bot_response: params.isBotResponse || false,
    })
    .select()
    .single();

  if (error) throw error;
  return message;
}

/**
 * Get conversation messages with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Get recent messages for context (for AI processing)
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 10
): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).reverse(); // Return in chronological order
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  conversationId: string,
  status: "open" | "closed" | "archived"
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) throw error;
}

/**
 * Assign conversation to a user
 */
export async function assignConversation(
  conversationId: string,
  userId: string | null
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_to: userId })
    .eq("id", conversationId);

  if (error) throw error;
}

/**
 * Get active conversations for an organization
 */
export async function getActiveConversations(
  organizationId: string,
  limit: number = 50
): Promise<Conversation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get channel by ID
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Get channels for organization
 */
export async function getOrganizationChannels(
  organizationId: string
): Promise<Channel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) throw error;
  return data || [];
}
