"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConversationsList } from "./conversations-list";
import { ChatView } from "./chat-view";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  contact_name: string | null;
  external_id: string;
  status: "open" | "closed" | "archived";
  is_human_takeover: boolean;
  assigned_agent_id: string | null;
  created_at: string;
  updated_at: string;
  channel: {
    id: string;
    name: string;
    type: "whatsapp" | "instagram" | "facebook" | "tiktok";
  };
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  message_type: "text" | "image" | "video" | "audio" | "file";
  direction: "inbound" | "outbound";
  sent_by: string | null;
  is_bot_response: boolean;
  created_at: string;
}

interface ConversationsViewProps {
  conversations: Conversation[];
  organizationId: string;
  userId: string;
}

export function ConversationsView({
  conversations: initialConversations,
  organizationId,
  userId,
}: ConversationsViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
      setLoading(false);
    };

    loadMessages();
  }, [selectedConversationId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConversationId) return;

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  // Subscribe to conversation updates (for human takeover changes)
  useEffect(() => {
    const channel = supabase
      .channel(`conversations:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.new.id ? { ...c, ...(payload.new as any) } : c))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      // Call API to send message
      const response = await fetch(`/api/conversations/${selectedConversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTakeover = async () => {
    if (!selectedConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/takeover`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to take over conversation");
      }

      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, is_human_takeover: true, assigned_agent_id: userId }
            : c
        )
      );
    } catch (error) {
      console.error("Error taking over conversation:", error);
    }
  };

  const handleRelease = async () => {
    if (!selectedConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/takeover`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to release conversation");
      }

      // Update local state
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, is_human_takeover: false, assigned_agent_id: null }
            : c
        )
      );
    } catch (error) {
      console.error("Error releasing conversation:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0">
        <ConversationsList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Chat View */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatView
            conversation={selectedConversation}
            messages={messages}
            loading={loading}
            userId={userId}
            onSendMessage={handleSendMessage}
            onTakeover={handleTakeover}
            onRelease={handleRelease}
          />
        ) : (
          <Card className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                Selecciona una conversación
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Elige una conversación de la lista para ver los mensajes
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
