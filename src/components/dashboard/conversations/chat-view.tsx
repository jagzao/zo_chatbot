"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Send, User, Bot, UserCog, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  contact_name: string | null;
  status: "open" | "closed" | "archived";
  is_human_takeover: boolean;
  assigned_agent_id: string | null;
  channel: {
    type: "whatsapp" | "instagram" | "facebook" | "tiktok";
    name: string;
  };
}

interface Message {
  id: string;
  content: string;
  message_type: "text" | "image" | "video" | "audio" | "file";
  direction: "inbound" | "outbound";
  sent_by: string | null;
  is_bot_response: boolean;
  created_at: string;
}

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  loading: boolean;
  userId: string;
  onSendMessage: (content: string) => Promise<void>;
  onTakeover: () => Promise<void>;
  onRelease: () => Promise<void>;
}

const channelColors = {
  whatsapp: "bg-green-100 text-green-700",
  instagram: "bg-pink-100 text-pink-700",
  facebook: "bg-blue-100 text-blue-700",
  tiktok: "bg-gray-100 text-gray-700",
};

export function ChatView({
  conversation,
  messages,
  loading,
  userId,
  onSendMessage,
  onTakeover,
  onRelease,
}: ChatViewProps) {
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(messageInput);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAgentControlled = conversation.is_human_takeover;
  const isCurrentUserAgent = conversation.assigned_agent_id === userId;

  return (
    <Card className="flex h-full flex-col">
      {/* Header */}
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold",
                channelColors[conversation.channel.type]
              )}
            >
              {conversation.contact_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {conversation.contact_name || "Sin nombre"}
              </h3>
              <p className="text-sm text-gray-500">{conversation.channel.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {conversation.channel.type}
            </Badge>
            <Badge variant={conversation.status === "open" ? "success" : "secondary"}>
              {conversation.status}
            </Badge>

            {/* Takeover Controls */}
            {!isAgentControlled ? (
              <Button onClick={onTakeover} size="sm" variant="default">
                <UserCog className="mr-2 h-4 w-4" />
                Tomar control
              </Button>
            ) : isCurrentUserAgent ? (
              <Button onClick={onRelease} size="sm" variant="destructive">
                <X className="mr-2 h-4 w-4" />
                Liberar
              </Button>
            ) : (
              <Badge variant="default">Controlado por agente</Badge>
            )}
          </div>
        </div>

        {isAgentControlled && (
          <div className="mt-3 rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <UserCog className="mr-1 inline h-4 w-4" />
              {isCurrentUserAgent
                ? "Tienes el control de esta conversación. El bot no responderá automáticamente."
                : "Esta conversación está siendo controlada por un agente."}
            </p>
          </div>
        )}
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-2 text-sm text-gray-500">Cargando mensajes...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No hay mensajes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aún no hay mensajes en esta conversación
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isInbound = message.direction === "inbound";
              const isBot = message.is_bot_response;

              return (
                <div
                  key={message.id}
                  className={cn("flex items-start gap-3", !isInbound && "flex-row-reverse")}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      isInbound
                        ? channelColors[conversation.channel.type]
                        : isBot
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {isInbound ? (
                      <User className="h-4 w-4" />
                    ) : isBot ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <UserCog className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={cn("flex flex-col gap-1", !isInbound && "items-end")}>
                    <div
                      className={cn(
                        "max-w-lg rounded-lg px-4 py-2",
                        isInbound ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {!isInbound && (
                        <Badge variant="outline" className="text-xs">
                          {isBot ? "Bot" : "Agente"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {isAgentControlled && !isCurrentUserAgent ? (
          <div className="rounded-md bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">
              Esta conversación está controlada por otro agente.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAgentControlled
                  ? "Escribe una respuesta manual..."
                  : "El bot responderá automáticamente. Toma el control para enviar mensajes."
              }
              className="min-h-[80px] resize-none"
              disabled={!isAgentControlled || sending}
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || sending || !isAgentControlled}
              className="self-end"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
