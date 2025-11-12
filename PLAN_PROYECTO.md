# 🤖 Plan de Trabajo - Chatbot Multicanal y Multitenant

## 📋 Resumen Ejecutivo

**Objetivo**: Crear un chatbot capaz de responder en WhatsApp, Instagram, Facebook y TikTok con arquitectura multitenant y **costo $0**.

**Tecnologías Principales**:
- Backend: Node.js + TypeScript
- Frontend: Next.js 14+
- Base de datos: Supabase (PostgreSQL)
- Hosting: Vercel (frontend) + Vercel Functions (backend)
- Mensajería: Evolution API (WhatsApp), Meta Graph API (FB/IG)

---

## 🎯 Fase 1: Configuración Inicial del Proyecto

### Tareas:
1. ✅ Inicializar repositorio Git
2. Crear proyecto Next.js 14+ con TypeScript
3. Configurar estructura de carpetas:
   ```
   /src
     /app              # Next.js 14 App Router
     /components       # Componentes React
     /lib              # Utilidades y helpers
       /supabase       # Cliente Supabase
       /integrations   # Integraciones de mensajería
     /types            # TypeScript types
     /api              # API routes (Vercel Functions)
   /supabase
     /migrations       # SQL migrations
     /functions        # Edge Functions
   ```
4. Configurar ESLint, Prettier, y herramientas de desarrollo
5. Crear `.env.example` con variables necesarias

### Entregables:
- ✅ Repositorio configurado
- Proyecto Next.js funcional
- Documentación README.md

---

## 🗄️ Fase 2: Configuración de Supabase

### Tareas:
1. Crear cuenta en Supabase (Free Tier)
2. Crear proyecto en Supabase
3. Configurar autenticación:
   - Email/Password
   - OAuth (Google, GitHub)
4. Obtener credenciales:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Esquema de Base de Datos:

```sql
-- Tabla de organizaciones (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relación usuarios-organizaciones
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Canales de mensajería configurados
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'instagram', 'facebook', 'tiktok')),
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- Configuración específica del canal
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversaciones
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- ID del usuario en la plataforma externa
  contact_name TEXT,
  contact_metadata JSONB, -- Info adicional del contacto
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, external_id)
);

-- Mensajes
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  metadata JSONB, -- Datos adicionales (media URLs, etc)
  sent_by UUID REFERENCES users(id), -- NULL si es mensaje entrante
  is_bot_response BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas automáticas / Flujos de conversación
CREATE TABLE bot_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'regex', 'always', 'fallback')),
  trigger_value TEXT,
  response_type TEXT NOT NULL CHECK (response_type IN ('text', 'template', 'ai')),
  response_content TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_channel ON conversations(channel_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_channels_org ON channels(organization_id);
```

### Row Level Security (RLS):
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_flows ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (ejemplo para organizations)
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- (Similar para otras tablas...)
```

### Entregables:
- Base de datos configurada en Supabase
- Migraciones SQL documentadas
- RLS configurado y testeado

---

## 👥 Fase 3: Sistema Multitenant

### Tareas:
1. Crear middleware de Next.js para detectar tenant
2. Implementar contexto de organización en frontend
3. Configurar helpers para queries filtradas por `organization_id`
4. Sistema de onboarding para nuevas organizaciones
5. Página de configuración de organización

### Arquitectura:
- **Detección de tenant**: Por subdominio o por ruta (`/org/:slug`)
- **Aislamiento de datos**: RLS + queries filtradas
- **Invitación de usuarios**: Sistema de invites con tokens

### Entregables:
- Sistema multitenant funcional
- Documentación de uso

---

## 🔧 Fase 4: API Core del Chatbot

### Tareas:
1. Crear endpoint `/api/webhook/receive` para mensajes entrantes
2. Implementar procesador de mensajes:
   - Identificar canal y organización
   - Crear/actualizar conversación
   - Guardar mensaje en BD
   - Ejecutar lógica de respuesta
3. Crear endpoint `/api/messages/send` para enviar mensajes
4. Sistema de cola para mensajes (usar Supabase como cola)
5. Manejo de reintentos y errores

### Flujo de Mensaje:
```
1. Webhook recibe mensaje →
2. Validar y parsear →
3. Guardar en BD →
4. Procesar con bot_flows →
5. Generar respuesta →
6. Enviar respuesta →
7. Registrar respuesta en BD
```

### Entregables:
- API funcional para recibir/enviar mensajes
- Sistema de procesamiento robusto

---

## 📱 Fase 5: Integración WhatsApp (Evolution API)

### Por qué Evolution API:
- ✅ **100% Gratuito** (self-hosted)
- ✅ Multi-dispositivo
- ✅ Webhooks nativos
- ✅ Soporta media (imágenes, videos, documentos)
- ✅ API RESTful completa

### Setup:
1. **Opción 1: Self-hosted (Railway/Render)**
   - Deploy Evolution API en Railway (free tier)
   - Conectar con QR code
   - Configurar webhook a tu Vercel app

2. **Opción 2: WhatsApp Web.js (alternativa)**
   - Requiere servidor persistente (más complejo para costo 0)

### Tareas:
1. Deploy Evolution API (Railway)
2. Implementar `/api/webhook/whatsapp`
3. Manejar diferentes tipos de mensajes:
   - Texto
   - Imágenes/videos
   - Documentos
   - Audio
4. Implementar funciones de envío
5. Sistema de reconexión automática

### Entregables:
- WhatsApp conectado y funcional
- Documentación de configuración

---

## 📘 Fase 6: Integración Facebook Messenger

### Setup:
1. Crear Facebook App en developers.facebook.com
2. Activar Messenger Product
3. Configurar Webhook:
   - Endpoint: `/api/webhook/facebook`
   - Suscripciones: messages, messaging_postbacks
4. Obtener Page Access Token

### Tareas:
1. Implementar webhook de Facebook
2. Validación de webhook (challenge)
3. Procesar mensajes entrantes
4. Enviar mensajes via Graph API
5. Manejar plantillas de mensajes
6. Sistema de botones y quick replies

### Límites Free Tier:
- 1000 solicitudes/hora por app
- Suficiente para empezar

### Entregables:
- Facebook Messenger integrado
- Soporte para mensajes interactivos

---

## 📷 Fase 7: Integración Instagram Direct

### Setup:
1. Conectar Instagram Business Account a Facebook Page
2. Activar Instagram Graph API en Facebook App
3. Solicitar permisos:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`

### Tareas:
1. Implementar `/api/webhook/instagram`
2. Procesar mensajes directos
3. Procesar menciones en historias
4. Responder mensajes
5. Manejar media compartidos

### Limitaciones:
- Solo cuentas Instagram Business
- Requiere revisión de app por Meta (puede tardar)

### Entregables:
- Instagram Direct funcional
- Documentación de limitaciones

---

## 🎵 Fase 8: Integración TikTok

### ⚠️ Limitaciones Importantes:
- **NO existe API oficial de mensajería directa**
- Solo se pueden automatizar:
  - Respuestas a comentarios
  - Menciones
  - Analytics

### Setup:
1. Crear TikTok for Developers account
2. Crear aplicación
3. Obtener credenciales OAuth

### Tareas:
1. Implementar autenticación TikTok OAuth
2. Webhook para comentarios (si disponible)
3. Polling para nuevos comentarios (alternativa)
4. Responder comentarios via API
5. Sistema de moderación automática

### Entregables:
- Respuestas automáticas a comentarios TikTok
- Documentación de limitaciones

---

## 🧠 Fase 9: Lógica de IA/Respuestas Automáticas

### Opciones para Costo 0:
1. **OpenAI API Free Tier**:
   - $5 de crédito inicial
   - Luego hay que pagar

2. **Alternativas Gratuitas**:
   - **Hugging Face** (modelos open source)
   - **Cloudflare AI Workers** (1000 req/día gratis)
   - **Groq** (API gratuita, muy rápida)
   - **LocalAI** (self-hosted, requiere servidor)

### Recomendación: Usar **Groq** + **Cloudflare AI**
- Groq: 30 req/min gratis con modelos LLaMA
- Cloudflare: Embedding y modelos pequeños

### Tareas:
1. Integrar Groq API para respuestas inteligentes
2. Sistema de matching de keywords (fallback)
3. Plantillas de respuestas rápidas
4. Sistema de variables en plantillas (nombre, etc)
5. Flujos de conversación multi-paso
6. Integración con contexto de conversación
7. Sistema de entrenamiento con historial

### Entregables:
- Bot capaz de respuestas contextuales
- Sistema híbrido (keywords + IA)

---

## 🖥️ Fase 10: Dashboard Administrativo

### Funcionalidades:
1. **Autenticación**:
   - Login/registro con Supabase Auth
   - Gestión de sesiones

2. **Gestión de Canales**:
   - Conectar/desconectar WhatsApp
   - Configurar Facebook/Instagram
   - OAuth con TikTok

3. **Conversaciones en Tiempo Real**:
   - Lista de conversaciones activas
   - Chat interface para responder manualmente
   - Asignar conversaciones a agentes
   - Marcar como resuelto

4. **Configuración de Bot**:
   - Crear/editar flujos de respuesta
   - Keywords y triggers
   - Plantillas de mensajes
   - Horarios de atención

5. **Analytics**:
   - Mensajes por canal
   - Tiempo de respuesta
   - Tasa de resolución
   - Gráficas con Chart.js o Recharts

6. **Gestión de Equipo**:
   - Invitar usuarios
   - Roles y permisos
   - Actividad del equipo

### Stack:
- Next.js 14 (App Router)
- TailwindCSS + shadcn/ui
- Supabase Realtime (mensajes en vivo)
- React Hook Form + Zod (formularios)

### Entregables:
- Dashboard funcional y responsive
- Documentación de uso

---

## 🔔 Fase 11: Sistema de Webhooks y Colas

### Tareas:
1. **Queue System**:
   - Usar tabla PostgreSQL como cola
   - Worker con Edge Functions
   - Reintentos exponenciales
   - Dead letter queue

2. **Rate Limiting**:
   - Límites por canal
   - Prevenir spam
   - Throttling de envíos

3. **Monitoring**:
   - Logs estructurados
   - Alertas de errores
   - Health checks

4. **Webhooks Salientes**:
   - Notificar eventos a sistemas externos
   - Integraciones con Zapier/Make

### Entregables:
- Sistema de colas robusto
- Monitoring básico

---

## 🚀 Fase 12: Testing y Deployment

### Testing:
1. Tests unitarios (Jest/Vitest)
2. Tests de integración con Supabase local
3. Tests E2E con Playwright
4. Testing manual de flujos completos

### Deployment en Vercel:
1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push
4. Preview deployments para PRs

### Monitoreo:
1. Vercel Analytics (gratuito)
2. Supabase Dashboard
3. Error tracking con Sentry (free tier)

### Documentación Final:
1. README.md completo
2. Guía de instalación
3. Guía de uso
4. API documentation
5. Troubleshooting

### Entregables:
- ✅ Aplicación en producción
- ✅ Tests pasando
- ✅ Documentación completa

---

## 💰 Costos Proyectados (Objetivo: $0)

| Servicio | Plan | Límites | Costo |
|----------|------|---------|-------|
| Supabase | Free | 500MB DB, 50K usuarios | **$0** |
| Vercel | Hobby | 100GB bandwidth, 100 GB-hours | **$0** |
| Evolution API | Self-hosted | Ilimitado (en Railway free) | **$0** |
| Railway | Starter | $5 crédito mensual | **$0** |
| Facebook/Instagram API | Standard | 1000 req/hora | **$0** |
| Groq API | Free | 30 req/min | **$0** |
| Cloudflare Workers | Free | 100K req/día | **$0** |

### ⚠️ Consideraciones:
- WhatsApp Business API oficial NO es gratuito
- Límites de API pueden requerir upgrade con crecimiento
- Railway free tier puede requerir tarjeta (no cobra si no excedes)

---

## 📊 Cronograma Estimado

| Fase | Duración | Dependencias |
|------|----------|-------------|
| Fase 1 | 1 día | - |
| Fase 2 | 2 días | Fase 1 |
| Fase 3 | 2 días | Fase 2 |
| Fase 4 | 3 días | Fase 3 |
| Fase 5 | 3 días | Fase 4 |
| Fase 6 | 2 días | Fase 4 |
| Fase 7 | 2 días | Fase 4 |
| Fase 8 | 2 días | Fase 4 |
| Fase 9 | 4 días | Fase 4-8 |
| Fase 10 | 5 días | Fase 2-3 |
| Fase 11 | 3 días | Fase 4-9 |
| Fase 12 | 2 días | Todas |

**Total estimado**: ~30 días de desarrollo

---

## 🎓 Recursos y Documentación

### APIs y Servicios:
- [Supabase Docs](https://supabase.com/docs)
- [Evolution API](https://github.com/EvolutionAPI/evolution-api)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api)
- [TikTok for Developers](https://developers.tiktok.com/)
- [Groq API](https://console.groq.com/)

### Frameworks:
- [Next.js 14](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 🔄 Próximos Pasos

1. ¿Quieres que comience con la **Fase 1** ahora mismo?
2. ¿Necesitas clarificación sobre alguna fase específica?
3. ¿Prefieres modificar alguna decisión técnica?

**¿Procedemos con la implementación?** 🚀
