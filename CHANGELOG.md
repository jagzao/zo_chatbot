# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**Fase 1: Configuración Inicial (Completada)**
- Configuración inicial del proyecto Next.js 14 con TypeScript
- Estructura de carpetas para arquitectura limpia
- Tipos TypeScript para base de datos y API
- Configuración de Tailwind CSS y herramientas de desarrollo
- Variables de entorno de ejemplo (.env.example)
- Documentación inicial del proyecto
- Middleware básico para seguridad

**Fase 2: Supabase Setup (Completada)**
- Esquema de base de datos completo con 8 tablas
- Migraciones SQL (schema, RLS, seed data)
- Row Level Security (RLS) para aislamiento multi-tenant
- Políticas de acceso basadas en roles (owner/admin/member)
- Clientes de Supabase (browser, server, admin)
- Tipos TypeScript completos para base de datos
- Middleware de autenticación con Supabase
- Documentación completa de setup de Supabase

**Fase 3: Sistema Multitenant (Completada)**
- Gestión completa de organizaciones (crear, listar, actualizar)
- Sistema de miembros con roles (Owner/Admin/Member)
- Context React para estado global de organización
- Hook useOrganization() para acceso a organización actual
- Hook useOrganizationRole() para verificación de permisos
- Detección de organización (subdomain/path/header/query)
- API REST para organizaciones (/api/organizations)
- Páginas: /auth/login, /onboarding, /dashboard
- Sistema de invitaciones (estructura base)
- Documentación completa de multitenant

**Fase 4: API Core y Procesamiento de Mensajes (Completada)**
- Sistema completo de gestión de mensajes y conversaciones
- Procesador de mensajes entrantes con flujo completo
- Bot flows con triggers (keyword/regex/always/fallback)
- Generación de respuestas (text/template/ai placeholder)
- Sistema de cola con retry exponencial
- API endpoints: /api/webhook/receive, /api/messages, /api/conversations
- Manejo de errores y reintentos automáticos
- Variables en templates ({contact_name}, {date}, {time})
- Documentación completa de API (messaging-api.md)

**Fase 5: Integración WhatsApp con Evolution API (Completada)**
- Cliente completo de Evolution API (evolution-client.ts)
  - Envío de mensajes de texto y media (imagen, video, audio, documento)
  - Verificación de estado de conexión
  - Obtención de QR code para vinculación
  - Configuración de webhooks
  - Retry logic con exponential backoff
- Capa de integración WhatsApp (integrations/whatsapp/index.ts)
  - sendWhatsAppMessage(): Envía mensajes vía Evolution API
  - checkWhatsAppConnection(): Monitorea estado de conexión
  - getWhatsAppQRCode(): Obtiene QR para vinculación de dispositivo
  - disconnectWhatsApp(): Cierra sesión de instancia
  - setupWhatsAppWebhook(): Configura URL de webhook
- Webhook handler (/api/webhook/whatsapp/route.ts)
  - Procesa eventos messages.upsert de Evolution API
  - Maneja eventos connection.update para monitoreo
  - Validación de API key para seguridad
  - Parsing automático de mensajes de WhatsApp
  - Filtro de mensajes enviados (fromMe)
- Queue Worker (queue/worker.ts)
  - Procesa jobs pendientes de message_queue
  - Enruta mensajes al canal apropiado
  - Implementa WhatsApp sending (otros canales TODO)
  - Retry logic con exponential backoff
- API endpoints:
  - POST /api/channels/whatsapp/send-test: Envío de mensaje de prueba
  - GET /api/channels/whatsapp/status: Verificar estado de conexión
  - POST /api/queue/process: Trigger manual de procesamiento de cola
- Documentación completa (docs/whatsapp-setup.md)
  - Guía de deployment en Railway/Render/Docker
  - Instrucciones de configuración de webhook
  - Troubleshooting y solución de problemas
  - Advertencias legales sobre uso no oficial

### Changed
- Middleware actualizado para integrar autenticación con Supabase
- Rutas protegidas configuradas (/dashboard requiere auth)
- Dashboard redirige a onboarding si no hay organización

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Headers de seguridad básicos en middleware
- Row Level Security habilitado en todas las tablas
- Service role key solo accesible desde backend
- Políticas RLS previenen acceso no autorizado entre organizaciones
