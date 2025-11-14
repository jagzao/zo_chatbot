import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Workflow, Plus, Settings, CheckCircle2, Bot, Sparkles } from "lucide-react";

export default async function BotFlowsPage() {
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

  // Get bot flows
  const { data: flows } = await supabase
    .from("bot_flows")
    .select("*")
    .eq("organization_id", membership.organization_id)
    .order("priority", { ascending: true });

  const triggerTypeLabels: Record<string, string> = {
    keyword: "Palabra clave",
    regex: "Expresión regular",
    always: "Siempre",
    fallback: "Fallback",
  };

  const responseTypeLabels: Record<string, string> = {
    text: "Texto",
    template: "Plantilla",
    ai: "IA",
  };

  const triggerTypeColors: Record<string, "default" | "secondary" | "success" | "warning"> = {
    keyword: "default",
    regex: "secondary",
    always: "success",
    fallback: "warning",
  };

  const responseTypeColors: Record<string, "default" | "secondary" | "success"> = {
    text: "secondary",
    template: "default",
    ai: "success",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bot Flows</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configura las respuestas automáticas de tu chatbot
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Flow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
            <Workflow className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flows?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows?.filter((f) => f.is_active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con IA</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows?.filter((f) => f.response_type === "ai").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallbacks</CardTitle>
            <Bot className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows?.filter((f) => f.trigger_type === "fallback").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flows List */}
      <Card>
        <CardHeader>
          <CardTitle>Flujos Configurados</CardTitle>
          <CardDescription>
            Los flujos se ejecutan en orden de prioridad (menor número = mayor prioridad)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!flows || flows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Workflow className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No hay flujos configurados
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Crea tu primer flujo para que el bot comience a responder
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Crear Flow
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-start justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{flow.name}</h3>
                      <Badge variant={flow.is_active ? "success" : "secondary"} className="text-xs">
                        {flow.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge
                        variant={triggerTypeColors[flow.trigger_type]}
                        className="text-xs"
                      >
                        {triggerTypeLabels[flow.trigger_type]}
                      </Badge>
                      <Badge
                        variant={responseTypeColors[flow.response_type]}
                        className="text-xs"
                      >
                        {responseTypeLabels[flow.response_type]}
                      </Badge>
                      <span className="text-xs text-gray-400">Prioridad: {flow.priority}</span>
                    </div>

                    {flow.trigger_value && (
                      <p className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Trigger:</span> {flow.trigger_value}
                      </p>
                    )}

                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {flow.response_content.substring(0, 150)}
                      {flow.response_content.length > 150 && "..."}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guía Rápida</CardTitle>
          <CardDescription>Aprende a crear flujos efectivos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Triggers por palabra clave</p>
                <p className="text-sm text-gray-500">
                  Usa "keyword" para responder cuando el usuario mencione palabras específicas
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Respuestas con IA</p>
                <p className="text-sm text-gray-500">
                  Selecciona "ai" como tipo de respuesta para usar Groq/Cloudflare AI
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Fallback</p>
                <p className="text-sm text-gray-500">
                  Crea un flow "fallback" para responder cuando ningún otro flow coincida
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 font-semibold text-sm">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Variables en plantillas</p>
                <p className="text-sm text-gray-500">
                  Usa {"{"} contact_name {"}"}, {"{"}date{"}"}, {"{"}time{"}"} en tus respuestas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
