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

**Fase 6: Integración Facebook Messenger con Graph API (Completada)**
- Cliente completo de Facebook Graph API (graph-client.ts)
  - Envío de mensajes de texto y attachments (imagen, video, audio, file)
  - Obtención de perfiles de usuario (nombre, foto, locale, timezone)
  - Typing indicators y mark as seen
  - Verificación de firma de webhooks (x-hub-signature-256)
  - Parsing de mensajes desde formato Facebook a formato interno
  - Soporte para postbacks (clicks en botones)
- Capa de integración Facebook (integrations/facebook/index.ts)
  - sendFacebookMessage(): Envía mensajes vía Graph API
  - getFacebookUserProfile(): Obtiene información del usuario
  - markFacebookMessageAsSeen(): Marca mensajes como leídos
  - sendFacebookTypingIndicator(): Muestra indicador de escritura
- Webhook handler (/api/webhook/facebook/route.ts)
  - Procesa mensajes entrantes de Messenger
  - Maneja postback events (clicks en botones)
  - Maneja delivery y read receipts
  - Validación de firma de webhook con app secret
  - Endpoint GET para verificación de webhook por Facebook
  - Soporte para múltiples eventos por webhook
- Queue Worker actualizado (queue/worker.ts)
  - Soporte agregado para envío de mensajes de Facebook
  - Routing a Graph API para canal tipo "facebook"
- API endpoints:
  - POST /api/channels/facebook/send-test: Envío de mensaje de prueba
  - GET /api/channels/facebook/profile: Obtener perfil de usuario
  - GET /api/webhook/facebook: Verificación de webhook
  - POST /api/webhook/facebook: Recepción de eventos
- Documentación completa (docs/facebook-setup.md)
  - Guía para crear Facebook Page y App
  - Generación de Page Access Token (temporal y permanente)
  - Configuración de webhooks con verify token
  - Suscripción de eventos y página
  - Guía de seguridad (firma de webhooks)
  - Tipos de mensajes soportados
  - Funciones avanzadas (typing, mark seen, profiles)
  - Troubleshooting común
  - Limitaciones y consideraciones de producción

**Fase 7: Integración Instagram Direct con Graph API (Completada)**
- Cliente completo de Instagram Graph API (graph-client.ts)
  - Envío de mensajes de texto y attachments (imagen, video, audio, file)
  - Obtención de perfiles de usuario (nombre, username, foto de perfil)
  - Typing indicators y mark as seen
  - Verificación de firma de webhooks (compartida con Facebook)
  - Parsing de mensajes desde formato Instagram a formato interno
  - Soporte para postbacks, story mentions y story replies
  - Manejo de Instagram-Scoped IDs (IGSID)
- Capa de integración Instagram (integrations/instagram/index.ts)
  - sendInstagramMessage(): Envía mensajes vía Graph API
  - getInstagramUserProfile(): Obtiene información del usuario con username
  - markInstagramMessageAsSeen(): Marca mensajes como leídos
  - sendInstagramTypingIndicator(): Muestra indicador de escritura
- Webhook handler (/api/webhook/instagram/route.ts)
  - Procesa Instagram Direct Messages entrantes
  - Maneja postback events (clicks en botones, ice breakers)
  - Maneja delivery y read receipts
  - Validación de firma de webhook con app secret
  - Endpoint GET para verificación de webhook por Instagram
  - Soporte para múltiples eventos por webhook
  - Detección de story mentions y story replies
- Queue Worker actualizado (queue/worker.ts)
  - Soporte agregado para envío de mensajes de Instagram
  - Routing a Graph API para canal tipo "instagram"
- API endpoints:
  - POST /api/channels/instagram/send-test: Envío de mensaje de prueba
  - GET /api/channels/instagram/profile: Obtener perfil de usuario
  - GET /api/webhook/instagram: Verificación de webhook
  - POST /api/webhook/instagram: Recepción de eventos
- Documentación completa (docs/instagram-setup.md)
  - Guía para convertir a Instagram Business Account
  - Vinculación con Facebook Page
  - Generación de Page Access Token (compartido con Facebook)
  - Configuración de webhooks y suscripciones
  - Obtención de Instagram Business Account ID
  - Guía de seguridad (firma de webhooks)
  - Tipos de mensajes soportados
  - Funciones avanzadas (ice breakers, story replies, quick replies)
  - Tabla comparativa: Facebook Messenger vs Instagram Direct
  - Troubleshooting específico de Instagram
  - Requisitos de App Review
  - Limitaciones de ventana de 24 horas

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
