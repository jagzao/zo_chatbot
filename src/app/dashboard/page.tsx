import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Radio, Users, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return null;
  }

  // Get statistics
  const [conversationsData, channelsData, messagesData, membersData] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, status")
      .eq("organization_id", membership.organization_id),
    supabase
      .from("channels")
      .select("id, is_active")
      .eq("organization_id", membership.organization_id),
    supabase
      .from("messages")
      .select("id, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", membership.organization_id),
  ]);

  const totalConversations = conversationsData.data?.length || 0;
  const openConversations = conversationsData.data?.filter((c) => c.status === "open").length || 0;
  const activeChannels = channelsData.data?.filter((c) => c.is_active).length || 0;
  const totalChannels = channelsData.data?.length || 0;
  const messagesToday = messagesData.data?.length || 0;
  const totalMembers = membersData.data?.length || 0;

  // Get recent conversations
  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("id, contact_name, status, created_at, channel:channels(name, type)")
    .eq("organization_id", membership.organization_id)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Resumen general de tu plataforma de chatbot
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-gray-500">
              <span className="font-medium text-green-600">{openConversations}</span> abiertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canales Activos</CardTitle>
            <Radio className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChannels}</div>
            <p className="text-xs text-gray-500">de {totalChannels} configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesToday}</div>
            <p className="text-xs text-gray-500">últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-gray-500">usuarios activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Conversaciones Recientes</CardTitle>
          <CardDescription>Las últimas conversaciones actualizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentConversations || recentConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No hay conversaciones
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configura un canal para comenzar a recibir mensajes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentConversations.map((conversation) => {
                const channel = conversation.channel as any;
                const statusColors: Record<string, "success" | "secondary" | "outline"> = {
                  open: "success",
                  closed: "secondary",
                  archived: "outline",
                };

                const statusVariant = statusColors[conversation.status] || "secondary";

                return (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                        {conversation.contact_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {conversation.contact_name || "Sin nombre"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {channel?.name || "Canal desconocido"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusVariant}>
                        {conversation.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {channel?.type || "unknown"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Primeros Pasos</CardTitle>
          <CardDescription>Configura tu chatbot en minutos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  totalChannels > 0 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                {totalChannels > 0 ? "✓" : "1"}
              </div>
              <p className={totalChannels > 0 ? "text-gray-500" : "text-gray-700"}>
                Configura tu primer canal de mensajería
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                2
              </div>
              <p className="text-gray-500">Crea flujos de respuestas automáticas</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                3
              </div>
              <p className="text-gray-500">Invita a tu equipo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
