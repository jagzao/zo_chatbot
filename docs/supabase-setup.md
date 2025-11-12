# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para tu proyecto de chatbot.

## 📋 Requisitos Previos

- Cuenta de Supabase (gratuita): [supabase.com](https://supabase.com)
- Proyecto Next.js ya configurado (Fase 1 completada)

## 🚀 Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y haz login
2. Click en "New Project"
3. Selecciona tu organización (o crea una nueva)
4. Configura tu proyecto:
   - **Name**: zo-chatbot (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura y guárdala
   - **Region**: Selecciona la región más cercana a tus usuarios
   - **Pricing Plan**: Free (suficiente para empezar)
5. Click en "Create new project"
6. Espera 2-3 minutos mientras se crea el proyecto

## 🔑 Paso 2: Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia las siguientes credenciales:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. En tu proyecto local, crea `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Pega las credenciales en `.env.local`

## 🗄️ Paso 3: Ejecutar Migraciones

Hay dos formas de ejecutar las migraciones:

### Opción A: SQL Editor en Supabase Dashboard (Recomendado para empezar)

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Click en "New query"
3. Copia el contenido de cada archivo de migración en orden:

   **a) Ejecutar `00001_initial_schema.sql`:**
   ```bash
   # En tu terminal local, copia el contenido
   cat supabase/migrations/00001_initial_schema.sql
   ```
   - Pega el contenido en el SQL Editor
   - Click en "Run" (o Ctrl/Cmd + Enter)
   - Verifica que se ejecutó sin errores

   **b) Ejecutar `00002_row_level_security.sql`:**
   ```bash
   cat supabase/migrations/00002_row_level_security.sql
   ```
   - Pega el contenido en el SQL Editor
   - Click en "Run"

   **c) (Opcional) Ejecutar `00003_seed_data.sql`:**
   ```bash
   cat supabase/migrations/00003_seed_data.sql
   ```
   - Solo para desarrollo/testing
   - Pega el contenido en el SQL Editor
   - Click en "Run"

### Opción B: Supabase CLI (Para desarrollo avanzado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link con tu proyecto
supabase link --project-ref tu-proyecto-ref

# Ejecutar migraciones
supabase db push
```

## ✅ Paso 4: Verificar Base de Datos

1. Ve a **Table Editor** en Supabase Dashboard
2. Deberías ver las siguientes tablas:
   - ✅ organizations
   - ✅ users
   - ✅ organization_members
   - ✅ channels
   - ✅ conversations
   - ✅ messages
   - ✅ bot_flows
   - ✅ message_queue

3. Verifica que RLS esté habilitado:
   - Click en cualquier tabla
   - Ve a "RLS" tab
   - Deberías ver políticas configuradas

## 🔐 Paso 5: Configurar Autenticación

1. Ve a **Authentication** > **Providers**
2. Habilita los providers que necesites:

   **Email (obligatorio)**:
   - Ya está habilitado por defecto
   - Configura "Confirm email" si quieres verificación

   **Google OAuth (opcional)**:
   - Habilita "Google"
   - Agrega Client ID y Secret de Google Cloud Console
   - Configura redirect URL

   **GitHub OAuth (opcional)**:
   - Habilita "GitHub"
   - Agrega Client ID y Secret de GitHub OAuth App
   - Configura redirect URL

3. Configura Email Templates:
   - Ve a **Authentication** > **Email Templates**
   - Personaliza los emails de confirmación, reset password, etc.

## 🧪 Paso 6: Probar Conexión

1. En tu proyecto local:

   ```bash
   npm run dev
   ```

2. Crea un archivo de prueba `src/app/test-supabase/page.tsx`:

   ```typescript
   import { createClient } from "@/lib/supabase/client";

   export default async function TestSupabase() {
     const supabase = createClient();

     const { data, error } = await supabase
       .from("organizations")
       .select("*")
       .limit(5);

     if (error) {
       return <div>Error: {error.message}</div>;
     }

     return (
       <div>
         <h1>Supabase Connection Test</h1>
         <pre>{JSON.stringify(data, null, 2)}</pre>
       </div>
     );
   }
   ```

3. Visita [http://localhost:3000/test-supabase](http://localhost:3000/test-supabase)
4. Deberías ver datos (o un array vacío si no hay seed data)

## 📊 Paso 7: Configurar Realtime (Opcional)

Para mensajes en tiempo real:

1. Ve a **Database** > **Replication**
2. Habilita replicación para las tablas:
   - `messages`
   - `conversations`

## 🔒 Seguridad y Mejores Prácticas

### ⚠️ NUNCA expongas el Service Role Key

- `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en backend
- Nunca lo incluyas en código del cliente
- Nunca lo subas a git (usa `.env.local`, que está en `.gitignore`)

### RLS (Row Level Security)

- ✅ Todas las tablas tienen RLS habilitado
- ✅ Los usuarios solo pueden ver datos de sus organizaciones
- ✅ Los roles (owner, admin, member) controlan permisos

### Políticas de Seguridad

```sql
-- Ejemplo: Ver solo tus organizaciones
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT user_organizations(auth.uid())));
```

## 🐛 Troubleshooting

### Error: "relation does not exist"

- Las migraciones no se ejecutaron correctamente
- Ejecuta las migraciones nuevamente en orden

### Error: "JWT expired"

- El token de sesión expiró
- El middleware debe estar refrescando automáticamente
- Verifica que `middleware.ts` esté configurado

### Error: "permission denied for table"

- RLS está bloqueando el acceso
- Verifica que el usuario esté autenticado
- Verifica que el usuario pertenezca a la organización

### No puedo ver datos

- Verifica que RLS esté configurado correctamente
- Usa el admin client para debugging:
  ```typescript
  import { createAdminClient } from "@/lib/supabase/server";

  const supabase = createAdminClient();
  // Este cliente bypasea RLS (solo usar en debugging)
  ```

## 📚 Recursos Adicionales

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Verificación Final

Antes de continuar a la Fase 3, verifica que:

- [ ] Proyecto de Supabase creado
- [ ] Credenciales configuradas en `.env.local`
- [ ] Todas las migraciones ejecutadas
- [ ] Tablas visibles en Table Editor
- [ ] RLS habilitado en todas las tablas
- [ ] Autenticación con email habilitada
- [ ] Conexión funcionando (test-supabase)

¡Listo! Ahora puedes continuar con la **Fase 3: Sistema Multitenant** 🚀
