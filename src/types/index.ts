// Database Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export type ChannelType = "whatsapp" | "instagram" | "facebook" | "tiktok";

export interface Channel {
  id: string;
  organization_id: string;
  type: ChannelType;
  name: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ConversationStatus = "open" | "closed" | "archived";

export interface Conversation {
  id: string;
  organization_id: string;
  channel_id: string;
  external_id: string;
  contact_name: string | null;
  contact_metadata: Record<string, any> | null;
  status: ConversationStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageType = "text" | "image" | "video" | "audio" | "file";
export type MessageDirection = "inbound" | "outbound";

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  message_type: MessageType;
  direction: MessageDirection;
  metadata: Record<string, any> | null;
  sent_by: string | null;
  is_bot_response: boolean;
  created_at: string;
}

export type BotFlowTriggerType = "keyword" | "regex" | "always" | "fallback";
export type BotFlowResponseType = "text" | "template" | "ai";

export interface BotFlow {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: BotFlowTriggerType;
  trigger_value: string | null;
  response_type: BotFlowResponseType;
  response_content: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Types
export interface WebhookPayload {
  channel: ChannelType;
  organization_id: string;
  sender_id: string;
  message: {
    type: MessageType;
    content: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
  metadata?: Record<string, any>;
}

export interface BotProcessingContext {
  conversation: Conversation;
  message: Message;
  channel: Channel;
  organization: Organization;
  history: Message[];
}
