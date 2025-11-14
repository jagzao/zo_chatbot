"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, User } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  contact_name: string | null;
  status: "open" | "closed" | "archived";
  is_human_takeover: boolean;
  updated_at: string;
  channel: {
    type: "whatsapp" | "instagram" | "facebook" | "tiktok";
    name: string;
  };
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const channelColors = {
  whatsapp: "bg-green-100 text-green-700",
  instagram: "bg-pink-100 text-pink-700",
  facebook: "bg-blue-100 text-blue-700",
  tiktok: "bg-gray-100 text-gray-700",
};

const statusColors = {
  open: "success",
  closed: "secondary",
  archived: "outline",
} as const;

export function ConversationsList({ conversations, selectedId, onSelect }: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contact_name?.toLowerCase().includes(query) ||
      conv.channel.name.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
        <p className="text-sm text-gray-500">{conversations.length} total</p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No hay conversaciones</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? "No se encontraron conversaciones"
                : "Espera a que lleguen mensajes"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors",
                  selectedId === conversation.id
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        channelColors[conversation.channel.type]
                      )}
                    >
                      {conversation.contact_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-gray-900">
                        {conversation.contact_name || "Sin nombre"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {conversation.channel.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(conversation.updated_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant={statusColors[conversation.status]} className="text-xs">
                    {conversation.status}
                  </Badge>
                  {conversation.is_human_takeover && (
                    <Badge variant="default" className="text-xs">
                      Agente
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {conversation.channel.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
