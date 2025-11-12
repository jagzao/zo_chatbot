/**
 * Database types generated from Supabase schema
 * These types ensure type safety when working with the database
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      channels: {
        Row: {
          id: string;
          organization_id: string;
          type: "whatsapp" | "instagram" | "facebook" | "tiktok";
          name: string;
          config: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: "whatsapp" | "instagram" | "facebook" | "tiktok";
          name: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: "whatsapp" | "instagram" | "facebook" | "tiktok";
          name?: string;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          channel_id: string;
          external_id: string;
          contact_name: string | null;
          contact_metadata: Json | null;
          status: "open" | "closed" | "archived";
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          channel_id: string;
          external_id: string;
          contact_name?: string | null;
          contact_metadata?: Json | null;
          status?: "open" | "closed" | "archived";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          channel_id?: string;
          external_id?: string;
          contact_name?: string | null;
          contact_metadata?: Json | null;
          status?: "open" | "closed" | "archived";
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          content: string;
          message_type: "text" | "image" | "video" | "audio" | "file";
          direction: "inbound" | "outbound";
          metadata: Json | null;
          sent_by: string | null;
          is_bot_response: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          content: string;
          message_type?: "text" | "image" | "video" | "audio" | "file";
          direction: "inbound" | "outbound";
          metadata?: Json | null;
          sent_by?: string | null;
          is_bot_response?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          content?: string;
          message_type?: "text" | "image" | "video" | "audio" | "file";
          direction?: "inbound" | "outbound";
          metadata?: Json | null;
          sent_by?: string | null;
          is_bot_response?: boolean;
          created_at?: string;
        };
      };
      bot_flows: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trigger_type: "keyword" | "regex" | "always" | "fallback";
          trigger_value: string | null;
          response_type: "text" | "template" | "ai";
          response_content: string;
          priority: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          trigger_type: "keyword" | "regex" | "always" | "fallback";
          trigger_value?: string | null;
          response_type: "text" | "template" | "ai";
          response_content: string;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          trigger_type?: "keyword" | "regex" | "always" | "fallback";
          trigger_value?: string | null;
          response_type?: "text" | "template" | "ai";
          response_content?: string;
          priority?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_queue: {
        Row: {
          id: string;
          organization_id: string;
          payload: Json;
          status: "pending" | "processing" | "completed" | "failed";
          retry_count: number;
          max_retries: number;
          scheduled_for: string;
          processed_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          payload: Json;
          status?: "pending" | "processing" | "completed" | "failed";
          retry_count?: number;
          max_retries?: number;
          scheduled_for?: string;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          payload?: Json;
          status?: "pending" | "processing" | "completed" | "failed";
          retry_count?: number;
          max_retries?: number;
          scheduled_for?: string;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      user_organizations: {
        Args: {
          user_id: string;
        };
        Returns: string[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
