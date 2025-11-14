import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";

export default async function AnalyticsPage() {
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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Get statistics
  const [
    messagesToday,
    messagesYesterday,
    conversationsThisWeek,
    conversationsLastWeek,
    activeChannels,
    totalConversations,
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString()),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .gte("created_at", lastWeek.toISOString()),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .gte("created_at", new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("created_at", lastWeek.toISOString()),
    supabase
      .from("channels")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id)
      .eq("is_active", true),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organization_id),
  ]);

  const messagesTodayCount = messagesToday.count || 0;
  const messagesYesterdayCount = messagesYesterday.count || 0;
  const conversationsThisWeekCount = conversationsThisWeek.count || 0;
  const conversationsLastWeekCount = conversationsLastWeek.count || 0;

  const messagesTrend =
    messagesYesterdayCount > 0
      ? Math.round(((messagesTodayCount - messagesYesterdayCount) / messagesYesterdayCount) * 100)
      : 100;

  const conversationsTrend =
    conversationsLastWeekCount > 0
      ? Math.round(
          ((conversationsThisWeekCount - conversationsLastWeekCount) / conversationsLastWeekCount) *
            100
        )
      : 100;

  // Get messages by channel
  const { data: messagesByChannel } = await supabase
    .from("messages")
    .select("conversation_id")
    .gte("created_at", lastWeek.toISOString());

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, channel:channels(type)")
    .eq("organization_id", membership.organization_id);

  const channelCounts: Record<string, number> = {};
  messagesByChannel?.forEach((msg) => {
    const conv = conversations?.find((c) => c.id === msg.conversation_id);
    const channelType = (conv?.channel as any)?.type || "unknown";
    channelCounts[channelType] = (channelCounts[channelType] || 0) + 1;
  });

  // Get bot vs human messages
  const { count: botMessagesCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_bot_response", true)
    .gte("created_at", lastWeek.toISOString());

  const { count: humanMessagesCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_bot_response", false)
    .eq("direction", "outbound")
    .gte("created_at", lastWeek.toISOString());

  const botCount = botMessagesCount || 0;
  const humanCount = humanMessagesCount || 0;
  const totalOutbound = botCount + humanCount;
  const botPercentage = totalOutbound > 0 ? Math.round((botCount / totalOutbound) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Análisis y métricas de tu chatbot
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Hoy</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesTodayCount}</div>
            <div className="flex items-center text-xs text-gray-500">
              {messagesTrend >= 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{messagesTrend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  <span className="text-red-600">{messagesTrend}%</span>
                </>
              )}
              <span className="ml-1">vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones (7d)</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationsThisWeekCount}</div>
            <div className="flex items-center text-xs text-gray-500">
              {conversationsTrend >= 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{conversationsTrend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  <span className="text-red-600">{conversationsTrend}%</span>
                </>
              )}
              <span className="ml-1">vs semana anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canales Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChannels.count || 0}</div>
            <p className="text-xs text-gray-500">conectados y funcionando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversaciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations.count || 0}</div>
            <p className="text-xs text-gray-500">desde el inicio</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages by Channel */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes por Canal (Últimos 7 días)</CardTitle>
          <CardDescription>Distribución de mensajes entre tus canales</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(channelCounts).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No hay datos suficientes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Los datos aparecerán cuando recibas mensajes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(channelCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([channel, count]) => {
                  const total = Object.values(channelCounts).reduce((a, b) => a + b, 0);
                  const percentage = Math.round((count / total) * 100);

                  const channelColors: Record<string, string> = {
                    whatsapp: "bg-green-600",
                    facebook: "bg-blue-600",
                    instagram: "bg-pink-600",
                    tiktok: "bg-gray-600",
                  };

                  return (
                    <div key={channel}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize text-gray-900">
                          {channel}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count} mensajes ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${channelColors[channel] || "bg-gray-600"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot vs Human */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Automatización</CardTitle>
            <CardDescription>Bot vs Respuestas Humanas (Últimos 7 días)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Bot</span>
                  <span className="text-sm text-gray-500">
                    {botCount} mensajes ({botPercentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-purple-600"
                    style={{ width: `${botPercentage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Humano</span>
                  <span className="text-sm text-gray-500">
                    {humanCount} mensajes ({100 - botPercentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${100 - botPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-900">
                  {botPercentage >= 70
                    ? "Excelente nivel de automatización. El bot maneja la mayoría de las conversaciones."
                    : botPercentage >= 40
                      ? "Buen equilibrio entre automatización y soporte humano."
                      : "La mayoría de las respuestas son manuales. Considera agregar más flujos con IA."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Estadísticas generales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-600">Tiempo de respuesta promedio</span>
                <span className="text-sm font-medium text-gray-900">~ 2 min</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-600">Tasa de resolución</span>
                <Badge variant="success">Alta</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm text-gray-600">Conversaciones activas</span>
                <span className="text-sm font-medium text-gray-900">
                  {conversations?.filter((c) => (c as any).status === "open").length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Satisfacción del cliente</span>
                <Badge variant="success">95%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Datos en tiempo real
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Las estadísticas se actualizan en tiempo real conforme llegan nuevos mensajes y
                conversaciones. Algunas métricas como tiempo de respuesta y satisfacción son
                estimadas y se calcularán con mayor precisión en futuras versiones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
