# Supabase Database Migrations

Este directorio contiene las migraciones SQL para la base de datos del chatbot.

## 📁 Estructura de Migraciones

Las migraciones se numeran secuencialmente y deben ejecutarse en orden:

### `00001_initial_schema.sql`
**Descripción**: Crea el esquema inicial de la base de datos

**Contenido**:
- Tablas principales: organizations, users, organization_members
- Tablas de mensajería: channels, conversations, messages
- Tabla de bot: bot_flows
- Tabla de cola: message_queue
- Índices para optimización
- Triggers para updated_at automático

**Tablas creadas**:
- `organizations` - Organizaciones (tenants)
- `users` - Usuarios de la aplicación
- `organization_members` - Relación usuarios-organizaciones con roles
- `channels` - Canales de mensajería (WhatsApp, FB, IG, TikTok)
- `conversations` - Conversaciones con contactos externos
- `messages` - Mensajes individuales
- `bot_flows` - Flujos de respuesta automática del bot
- `message_queue` - Cola de mensajes para procesamiento async

### `00002_row_level_security.sql`
**Descripción**: Configura Row Level Security (RLS) para aislamiento de datos

**Contenido**:
- Habilita RLS en todas las tablas
- Crea políticas de acceso basadas en organización
- Define permisos por rol (owner, admin, member)
- Función helper: `user_organizations()`

**Políticas clave**:
- Los usuarios solo ven datos de sus organizaciones
- Los owners/admins tienen permisos de gestión
- Los miembros tienen permisos de lectura/escritura limitados
- Message queue solo accesible por service role

### `00003_seed_data.sql`
**Descripción**: Datos de ejemplo para desarrollo (OPCIONAL)

**Contenido**:
- Organización de demo
- Bot flows de ejemplo (bienvenida, ayuda, horarios, etc.)
- Solo para desarrollo/testing

**⚠️ IMPORTANTE**: NO ejecutar en producción

## 🚀 Cómo Ejecutar las Migraciones

### Método 1: SQL Editor (Recomendado para empezar)

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre **SQL Editor**
3. Ejecuta cada archivo en orden:
   ```bash
   # Copia el contenido de cada archivo
   cat supabase/migrations/00001_initial_schema.sql
   ```
4. Pega en SQL Editor y ejecuta
5. Repite para cada migración

### Método 2: Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link con tu proyecto
supabase link --project-ref <tu-project-ref>

# Ejecutar todas las migraciones
supabase db push
```

## 🔍 Verificar que las Migraciones se Aplicaron

```sql
-- Ver todas las tablas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Ver políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Contar registros en organizaciones
SELECT COUNT(*) FROM organizations;
```

## 📊 Diagrama de Base de Datos

```
organizations (tenants)
    ↓
    ├─→ organization_members ←─ users
    ├─→ channels
    │       ↓
    │       └─→ conversations
    │               ↓
    │               └─→ messages
    ├─→ bot_flows
    └─→ message_queue
```

## 🔐 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado para garantizar:
- Aislamiento de datos entre organizaciones
- Solo usuarios autenticados pueden acceder
- Permisos basados en roles

Ejemplo de política:
```sql
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT user_organizations(auth.uid())));
```

## 🆕 Crear una Nueva Migración

```bash
# Crear archivo con timestamp
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Ejemplo:
# 20241112150000_add_tags_to_conversations.sql
```

Formato del archivo:
```sql
-- Description of the migration
-- Author: Your Name
-- Date: YYYY-MM-DD

-- Your SQL here
ALTER TABLE conversations ADD COLUMN tags TEXT[];

-- Create index if needed
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);
```

## 🔄 Rollback de Migraciones

Si necesitas revertir una migración:

```sql
-- Ejemplo: Eliminar una columna agregada
ALTER TABLE conversations DROP COLUMN IF EXISTS tags;
```

⚠️ **CUIDADO**: Los rollbacks pueden causar pérdida de datos. Siempre haz backup primero.

## 📝 Mejores Prácticas

1. **Nunca editar migraciones ya aplicadas** - Crear una nueva migración
2. **Probar en desarrollo primero** - Antes de aplicar en producción
3. **Incluir índices** - Para optimizar queries frecuentes
4. **Documentar cambios** - Comentarios en el SQL
5. **RLS siempre** - Nunca deshabilitar Row Level Security

## 🆘 Troubleshooting

### Error: "relation already exists"

- La migración ya fue ejecutada
- Verifica las tablas existentes
- Usa `IF NOT EXISTS` en CREATE statements

### Error: "permission denied"

- Verifica que tu usuario tenga permisos de super admin
- En Supabase Dashboard, usa el SQL Editor (ejecuta como postgres)

### Error: "foreign key constraint fails"

- Verifica el orden de las migraciones
- Las tablas referenciadas deben existir primero

## 📚 Recursos

- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

¿Preguntas? Revisa la [documentación completa](../docs/supabase-setup.md)
