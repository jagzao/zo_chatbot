import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Plus, Settings, CheckCircle2, XCircle } from "lucide-react";

export default async function ChannelsPage() {
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

  // Get channels
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  const channelTypes = {
    whatsapp: {
      name: "WhatsApp",
      icon: "💬",
      color: "bg-green-100 text-green-700 border-green-200",
      description: "Conecta con Evolution API para mensajes de WhatsApp",
    },
    facebook: {
      name: "Facebook Messenger",
      icon: "📘",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      description: "Conecta con Meta Graph API para Facebook Messenger",
    },
    instagram: {
      name: "Instagram Direct",
      icon: "📸",
      color: "bg-pink-100 text-pink-700 border-pink-200",
      description: "Conecta con Meta Graph API para Instagram Direct",
    },
    tiktok: {
      name: "TikTok",
      icon: "🎵",
      color: "bg-gray-100 text-gray-700 border-gray-200",
      description: "Conecta con TikTok API para comentarios (no DM)",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Canales</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los canales de mensajería conectados
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Canal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Canales</CardTitle>
            <Radio className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels?.filter((c) => c.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels?.filter((c) => !c.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos</CardTitle>
            <Settings className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(channels?.map((c) => c.type)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Canales Configurados</CardTitle>
          <CardDescription>Administra tus canales de mensajería</CardDescription>
        </CardHeader>
        <CardContent>
          {!channels || channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Radio className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No hay canales configurados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando tu primer canal de mensajería
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Canal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {channels.map((channel) => {
                const typeInfo = channelTypes[channel.type as keyof typeof channelTypes];

                return (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-2xl ${typeInfo.color}`}
                      >
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{channel.name}</h3>
                          <Badge
                            variant={channel.is_active ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {channel.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{typeInfo.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canales Disponibles</CardTitle>
          <CardDescription>Agrega nuevos canales a tu plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(channelTypes).map(([type, info]) => {
              const isConfigured = channels?.some((c) => c.type === type);

              return (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl ${info.color}`}
                    >
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{info.name}</h3>
                      <p className="text-xs text-gray-500">{info.description}</p>
                    </div>
                  </div>

                  {isConfigured ? (
                    <Badge variant="success">Configurado</Badge>
                  ) : (
                    <Button size="sm">Conectar</Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
