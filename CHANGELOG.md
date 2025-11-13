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

**Fase 8: Integración TikTok con Comments API (Completada)**
- Cliente completo de TikTok API v2 (api-client.ts)
  - Responder a comentarios en videos (método principal de interacción)
  - Obtener comentarios de videos para monitoreo
  - Obtención de información de usuario (limitada vs otras plataformas)
  - Obtención de información de videos
  - Parsing de comentarios desde formato TikTok a formato interno
  - Verificación de firma de webhooks para seguridad
  - Soporte para OAuth 2.0 con gestión de tokens
  - Soporte para comentarios padre (respuestas anidadas)
- Capa de integración TikTok (integrations/tiktok/index.ts)
  - sendTikTokComment(): Responde a comentarios (requiere videoId)
  - getTikTokVideoComments(): Monitorea comentarios en videos
  - getTikTokUserInfo(): Obtiene información básica de usuario
  - getTikTokVideoInfo(): Obtiene metadata de video
- Webhook handler (/api/webhook/tiktok/route.ts)
  - Procesa eventos comment.created (nuevos comentarios en videos)
  - Procesa eventos video.mention (menciones de cuenta)
  - Validación de firma de webhook
  - Endpoint GET para verificación de webhook por TikTok
  - Almacena videoId y commentId en metadata para respuestas
  - Manejo de contexto de comentarios públicos
- Queue Worker actualizado (queue/worker.ts)
  - Soporte agregado para respuestas a comentarios de TikTok
  - Valida videoId requerido para respuestas de TikTok
  - Routing a Comments API para canal tipo "tiktok"
- API endpoints:
  - POST /api/channels/tiktok/comment: Responder a un comentario
  - GET /api/channels/tiktok/comments: Obtener comentarios de un video
  - GET /api/webhook/tiktok: Verificación de webhook
  - POST /api/webhook/tiktok: Recepción de eventos
- Documentación completa (docs/tiktok-setup.md)
  - Sección IMPORTANTE sobre limitaciones (no mensajes directos)
  - Casos de uso válidos vs inválidos
  - Guía para crear TikTok Business Account
  - Crear app en TikTok for Developers
  - Implementación de flujo OAuth 2.0
  - Gestión de access token y refresh token (expira cada 24h)
  - Configuración de webhooks
  - Requisitos de App Review y proceso (1-4 semanas)
  - Mejores prácticas para interacciones en comentarios públicos
  - Guía de implementación de sistema de refresh de tokens
  - Documentación de rate limiting y límites de API
  - Tabla comparativa con otros canales
- ⚠️ **LIMITACIONES IMPORTANTES**:
  - NO soporta mensajes directos/privados
  - Solo comentarios públicos en videos
  - NO permite adjuntar media en comentarios
  - NO tiene typing indicators
  - NO se puede iniciar conversaciones
  - Tokens expiran cada 24 horas (requiere refresh)
  - Requiere App Review para producción
  - Límite de caracteres: 150 por comentario
  - Rate limit: ~100 requests/minuto

**Fase 9: Integración AI/ML con Groq y Cloudflare AI (Completada)**
- Cliente completo de Groq (groq-client.ts)
  - API REST para Groq Cloud
  - LLaMA 3.1 70B Versatile como modelo por defecto
  - Soporte para múltiples modelos (70B, 8B, Mixtral, Gemma)
  - Chat completion con historial de conversación
  - Control de temperatura y tokens
  - Inferencia ultra-rápida (300+ tokens/segundo)
  - Free tier: 30 req/min, 14,400 req/día
- Cliente completo de Cloudflare AI (cloudflare-client.ts)
  - API REST para Cloudflare Workers AI
  - LLaMA 3 8B Instruct como modelo por defecto
  - Soporte para múltiples modelos (LLaMA 2, Mistral, OpenChat)
  - Usado como fallback cuando Groq no está disponible
  - Free tier: 10,000 neurons/día
- Servicio de IA (service.ts)
  - Capa de abstracción de alto nivel con múltiples providers
  - Fallback automático entre Groq y Cloudflare
  - Gestión de contexto de conversación
  - Historial de mensajes previos (últimos 5 para contexto)
  - Personalización con nombre de organización y contacto
  - System prompts personalizados por conversación
  - Configuración de temperatura y max tokens
  - Soporte para preferencia de provider
  - Patrón singleton para instancia única
- Integración con Bot Processor
  - Actualización de bot/processor.ts para usar IA con response_type="ai"
  - Obtención de metadata de organización y conversación
  - Construcción de historial de conversación para contexto
  - Uso de system prompts personalizados desde bot flows
  - Fallback graceful en caso de errores de IA
  - Soporte para todos los canales (WhatsApp, Facebook, Instagram, TikTok)
  - Adaptación automática a TikTok (límite de 150 caracteres)
- API Endpoint (api/ai/generate/route.ts)
  - POST /api/ai/generate: Probar respuestas de IA directamente
  - GET /api/ai/generate: Verificar estado del servicio de IA
  - Soporte para system prompts personalizados
  - Inyección de contexto (nombre de contacto, org, historial)
  - Selección de provider (groq/cloudflare)
  - Control de temperatura y max tokens
- Documentación completa (docs/ai-setup.md)
  - Guía paso a paso para configurar cuenta Groq y API key
  - Guía para configurar Cloudflare AI
  - Configuración de ambos providers para redundancia
  - Creación de bot flows con IA
  - Ejemplos de system prompts para diferentes casos de uso:
    - E-commerce/retail
    - Soporte técnico
    - Restaurante/hospitalidad
  - Tablas comparativas de modelos
  - Información de rate limits y free tier
  - Guía de troubleshooting
  - Mejores prácticas y recomendaciones
  - Queries de monitoreo SQL
- 🤖 **Capacidades de IA**:
  - ✅ Comprensión de lenguaje natural
  - ✅ Conciencia de contexto (historial de conversación)
  - ✅ Personalización (nombre de contacto, nombre de org)
  - ✅ Adaptación por canal (comentarios públicos de TikTok)
  - ✅ Conversaciones multi-turno
  - ✅ Comportamiento personalizado por organización
  - ✅ Fallback graceful en caso de fallas
- 🆓 **Límites Free Tier**:
  - Groq: 30 req/min, 14,400 req/día (~43K mensajes/día)
  - Cloudflare: 10,000 neurons/día (~300-500 mensajes/día)
  - Combinados: Suficiente para chatbots pequeños-medianos

**Human Takeover (Transferencia a Agente Humano) (Completada)**
- Sistema completo de human takeover para conversaciones
- Migración de base de datos (00004_human_takeover.sql)
  - Campo is_human_takeover: Flag booleano para indicar control humano
  - Campo assigned_agent_id: UUID del agente asignado
  - Campo takeover_at: Timestamp de cuándo se tomó control
  - Campo last_agent_response_at: Última respuesta del agente
  - Índice para queries eficientes de conversaciones con takeover
- Message Processor actualizado
  - Verifica is_human_takeover antes de generar respuestas del bot
  - Bot NO responde cuando conversación tiene takeover activo
  - Early return previene cualquier automatización del bot
- API endpoints completos:
  - POST /api/conversations/:id/takeover: Tomar control de conversación
  - DELETE /api/conversations/:id/takeover: Liberar conversación
  - GET /api/conversations/:id/takeover: Consultar estado de takeover
  - POST /api/conversations/:id/reply: Agente envía respuesta manual
- Control de acceso y seguridad:
  - Solo miembros de la organización pueden tomar control
  - Prevención de conflictos (un agente a la vez)
  - Solo agente asignado o admin puede liberar
  - Validación de permisos RLS
- Documentación completa (docs/human-takeover.md)
  - Casos de uso y mejores prácticas
  - Flujo completo de takeover
  - Ejemplos de API con curl
  - Queries SQL para monitoreo
  - Guía de integración con dashboard
  - Troubleshooting y solución de problemas
  - Roadmap de mejoras futuras
- ✅ **Flujo Completo**:
  - Agente toma control → Bot deja de responder
  - Agente envía mensajes manuales
  - Mensajes se envían por canal apropiado
  - Agente libera → Bot vuelve a responder automáticamente
- 🎯 **Casos de Uso**:
  - Consultas complejas que requieren intervención humana
  - Problemas técnicos que el bot no puede resolver
  - Ventas grandes o negociaciones especiales
  - Usuario solicita explícitamente hablar con humano
  - Escalación cuando bot no puede ayudar

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
