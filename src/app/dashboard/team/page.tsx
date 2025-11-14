import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Crown, Shield, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function TeamPage() {
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
    .select("organization_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return null;
  }

  // Get team members
  const { data: members } = await supabase
    .from("organization_members")
    .select(`
      id,
      role,
      created_at,
      user:users(id, email, full_name)
    `)
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: true });

  const roleInfo = {
    owner: {
      label: "Propietario",
      icon: Crown,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      badgeVariant: "default" as const,
    },
    admin: {
      label: "Administrador",
      icon: Shield,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      badgeVariant: "default" as const,
    },
    member: {
      label: "Miembro",
      icon: User,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      badgeVariant: "secondary" as const,
    },
  };

  const canManageTeam = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipo</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona los miembros de tu organización
          </p>
        </div>
        {canManageTeam && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invitar Miembro
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members?.filter((m) => m.role === "owner").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members?.filter((m) => m.role === "admin").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members?.filter((m) => m.role === "member").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>Personas con acceso a esta organización</CardDescription>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                No hay miembros
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Invita a tu equipo para colaborar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const userInfo = member.user as any;
                const roleDetails = roleInfo[member.role as keyof typeof roleInfo];
                const RoleIcon = roleDetails.icon;
                const isCurrentUser = userInfo.id === user.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 ${roleDetails.color}`}
                      >
                        <RoleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {userInfo.full_name || userInfo.email}
                          </h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{userInfo.email}</p>
                        <p className="text-xs text-gray-400">
                          Miembro desde{" "}
                          {formatDistanceToNow(new Date(member.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={roleDetails.badgeVariant}>
                        {roleDetails.label}
                      </Badge>
                      {canManageTeam && !isCurrentUser && (
                        <Button variant="outline" size="sm">
                          Gestionar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles Description */}
      <Card>
        <CardHeader>
          <CardTitle>Roles y Permisos</CardTitle>
          <CardDescription>Entiende los diferentes niveles de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 bg-yellow-100 text-yellow-700 border-yellow-200">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Propietario</p>
                <p className="text-sm text-gray-500">
                  Control total sobre la organización, incluyendo facturación y eliminación
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 bg-blue-100 text-blue-700 border-blue-200">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Administrador</p>
                <p className="text-sm text-gray-500">
                  Puede gestionar canales, bot flows, miembros del equipo y configuraciones
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 bg-gray-100 text-gray-700 border-gray-200">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Miembro</p>
                <p className="text-sm text-gray-500">
                  Puede ver conversaciones, tomar control (human takeover) y responder mensajes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
