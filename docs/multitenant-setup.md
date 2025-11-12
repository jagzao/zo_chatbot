# Guía del Sistema Multitenant

Este documento explica cómo funciona el sistema multitenant en ZO Chatbot y cómo usarlo.

## 🏗️ Arquitectura Multitenant

El sistema permite que múltiples organizaciones (tenants) compartan la misma aplicación mientras mantienen sus datos completamente aislados.

### Componentes Principales:

1. **Organizaciones**: Entidad principal que agrupa usuarios, canales y conversaciones
2. **Miembros**: Usuarios con roles específicos dentro de una organización
3. **RLS (Row Level Security)**: Aislamiento de datos a nivel de base de datos

## 🔑 Roles y Permisos

### Owner (Propietario)
- Control total de la organización
- Puede agregar/eliminar miembros
- Puede cambiar configuraciones
- Puede eliminar la organización

### Admin (Administrador)
- Puede agregar/eliminar miembros (excepto owners)
- Puede configurar canales y bot flows
- No puede eliminar la organización

### Member (Miembro)
- Puede ver conversaciones
- Puede responder mensajes
- Permisos de solo lectura en configuraciones

## 📝 Uso Básico

### 1. Crear una Organización

```typescript
import { createOrganization } from "@/lib/organizations";

// En un Server Action o API Route
const organization = await createOrganization(
  "Mi Empresa",  // nombre
  "mi-empresa",  // slug (URL-friendly)
  userId         // ID del usuario que será owner
);
```

### 2. Usar el Context de Organización

```tsx
"use client";

import { useOrganization } from "@/contexts/organization-context";

export function MyComponent() {
  const {
    organization,     // Organización actual
    organizations,    // Todas las organizaciones del usuario
    user,             // Usuario actual
    isLoading,        // Estado de carga
    switchOrganization, // Cambiar de organización
    refreshOrganizations // Recargar lista
  } = useOrganization();

  if (isLoading) return <div>Loading...</div>;
  if (!organization) return <div>No organization selected</div>;

  return (
    <div>
      <h1>{organization.name}</h1>
      {/* Tu contenido aquí */}
    </div>
  );
}
```

### 3. Verificar Roles

```typescript
import { useOrganizationRole } from "@/hooks/use-organization-role";

export function AdminPanel() {
  const { isOwner, isAdmin, isMember } = useOrganizationRole();

  if (!isAdmin) {
    return <div>No tienes permisos para ver esto</div>;
  }

  return <div>Panel de administración</div>;
}
```

### 4. Queries Filtradas por Organización

Gracias a RLS, las queries automáticamente se filtran por organización:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function getConversations() {
  const supabase = await createClient();

  // Solo verás conversaciones de tu organización
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("status", "open");

  return data;
}
```

## 🔍 Detección de Organización

El sistema soporta múltiples estrategias para detectar la organización activa:

### Opción 1: Por Path (Recomendado)
```
https://app.example.com/org/mi-empresa/dashboard
```

### Opción 2: Por Subdomain
```
https://mi-empresa.example.com/dashboard
```

### Opción 3: Por Header (APIs)
```http
X-Organization-Slug: mi-empresa
```

### Opción 4: Por Query Parameter
```
https://app.example.com/dashboard?org=mi-empresa
```

## 🚀 Flujo de Onboarding

1. Usuario se registra (`/auth/login`)
2. Sistema verifica si tiene organizaciones
3. Si no tiene, redirige a `/onboarding`
4. Usuario crea su primera organización
5. Sistema lo agrega como Owner
6. Redirige al dashboard

## 👥 Gestión de Miembros

### Agregar Miembro

```typescript
import { addOrganizationMember } from "@/lib/organizations";

await addOrganizationMember(
  organizationId,
  userId,
  "member" // o "admin"
);
```

### Eliminar Miembro

```typescript
import { removeOrganizationMember } from "@/lib/organizations";

await removeOrganizationMember(organizationId, userId);
```

### Cambiar Rol

```typescript
import { updateMemberRole } from "@/lib/organizations";

await updateMemberRole(organizationId, userId, "admin");
```

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS que:
- Solo permiten acceso a datos de organizaciones del usuario
- Respetan los roles para operaciones de escritura
- Previenen fugas de datos entre organizaciones

### Verificación de Permisos

```typescript
import { getUserRoleInOrganization } from "@/lib/organizations";

const role = await getUserRoleInOrganization(userId, organizationId);

if (role !== "owner" && role !== "admin") {
  throw new Error("No tienes permisos");
}
```

## 📊 Estructura de Base de Datos

```sql
organizations
  ├─ id (UUID)
  ├─ name (TEXT)
  ├─ slug (TEXT, UNIQUE)
  └─ created_at

organization_members
  ├─ organization_id -> organizations
  ├─ user_id -> users
  ├─ role (owner/admin/member)
  └─ UNIQUE(organization_id, user_id)

-- Todas las demás tablas tienen organization_id
channels, conversations, messages, bot_flows
  └─ organization_id -> organizations
```

## 🎨 Componentes UI

### OrganizationProvider

Envuelve tu aplicación para proporcionar contexto de organización:

```tsx
// app/layout.tsx
import { OrganizationProvider } from "@/contexts/organization-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </body>
    </html>
  );
}
```

### Selector de Organización

```tsx
"use client";

import { useOrganization } from "@/contexts/organization-context";

export function OrganizationSelector() {
  const { organization, organizations, switchOrganization } = useOrganization();

  return (
    <select
      value={organization?.id}
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
```

## 🧪 Testing

### Crear Organización de Prueba

```typescript
// En tu seed o test setup
const testOrg = await createOrganization(
  "Test Org",
  "test-org",
  testUserId
);
```

### Verificar Aislamiento

```typescript
// Usuario 1 crea datos en Org A
const convA = await createConversation({ org: orgA });

// Usuario 2 en Org B NO debería ver convA
const { data } = await supabase
  .from("conversations")
  .select()
  .eq("id", convA.id);

expect(data).toBeNull(); // RLS bloquea el acceso
```

## 🚨 Problemas Comunes

### "No organization selected"

**Solución**: Asegúrate de que el usuario esté en al menos una organización. Redirige a `/onboarding` si es necesario.

### "RLS policy violation"

**Solución**: El usuario no pertenece a la organización que intenta acceder. Verifica membresía primero.

### Múltiples organizaciones pero no se puede cambiar

**Solución**: Implementa un selector de organización en tu UI usando `switchOrganization()`.

## 📚 Próximos Pasos

1. **Sistema de Invitaciones**: Implementar tabla de invitations para invitar usuarios por email
2. **Billing por Organización**: Agregar planes y límites por organización
3. **Audit Log**: Rastrear cambios y acciones dentro de cada organización
4. **Custom Domains**: Permitir subdominios personalizados por organización

## 🔗 Referencias

- [RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- Código fuente: `/src/lib/organizations/` y `/src/contexts/organization-context.tsx`
