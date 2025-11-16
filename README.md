# 🤖 ZO Chatbot - Plataforma Multicanal y Multitenant

> Chatbot inteligente capaz de gestionar conversaciones en WhatsApp, Facebook, Instagram y TikTok con arquitectura multitenant y **costo $0**.

## 📚 Documentación

### Planificación y Arquitectura
- **[Plan de Proyecto](./PLAN_PROYECTO.md)**: Plan completo de 12 fases con cronograma
- **[Arquitectura](./ARQUITECTURA.md)**: Diagramas y decisiones técnicas
- **[Alternativas de Costo](./ALTERNATIVAS_COSTOS.md)**: Estrategias para mantener costo $0

### Guías de Configuración y Deployment
- **[🚀 Deployment en Vercel](./docs/deployment.md)**: Guía completa de deployment
- **[🔐 Variables de Entorno](./docs/environment-variables.md)**: Todas las variables necesarias

## 🎯 Características Principales

- ✅ **Multicanal**: WhatsApp, Facebook Messenger, Instagram Direct, TikTok
- ✅ **Multitenant**: Múltiples organizaciones en una sola instancia
- ✅ **IA Integrada**: Respuestas inteligentes con Groq (LLaMA 3.1 70B) + fallback Cloudflare AI
- ✅ **Human Takeover**: Agentes pueden tomar control de conversaciones en tiempo real
- ✅ **Dashboard Web**: Gestión completa con chat en vivo, estadísticas y monitoreo
- ✅ **Tiempo Real**: Actualizaciones instantáneas con Supabase Realtime
- ✅ **Queue System**: Sistema de colas robusto con DLQ, métricas y retry inteligente
- ✅ **Monitoring**: Endpoints de health check y métricas de cola
- ✅ **Testing**: Suite de tests con Jest + React Testing Library
- ✅ **Costo $0**: Arquitectura optimizada para free tiers

## 🛠️ Stack Tecnológico

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- Supabase Client

### Backend
- Vercel Functions (Node.js)
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Evolution API (WhatsApp)
- Meta Graph API (Facebook/Instagram)

### IA/ML
- Groq (LLaMA 3)
- Cloudflare AI (fallback)

## 🚀 Quick Start

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/zo_chatbot.git
cd zo_chatbot

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (ver docs/environment-variables.md)

# Ejecutar migraciones de Supabase
# Ver docs/deployment.md para setup completo de Supabase

# Ejecutar en desarrollo
pnpm dev
```

### Testing

```bash
# Ejecutar tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Tests con coverage
pnpm test:coverage

# Verificar tipos TypeScript
pnpm type-check

# Build para producción
pnpm build
```

### Deployment

Ver la guía completa: **[docs/deployment.md](./docs/deployment.md)**

```bash
# Opción 1: Deploy con Vercel CLI
vercel

# Opción 2: Connect repo en vercel.com (recomendado)
# 1. Push a GitHub
# 2. Importar en vercel.com
# 3. Configurar variables de entorno
# 4. Deploy automático
```

## 📋 Estado del Proyecto

**Estado**: ✅ **PROYECTO COMPLETO** - Todas las 12 fases implementadas

### Progreso:
1. [x] **Fase 1**: Configuración inicial del proyecto ✅
2. [x] **Fase 2**: Configurar Supabase ✅
3. [x] **Fase 3**: Sistema multitenant ✅
4. [x] **Fase 4**: API core del chatbot ✅
5. [x] **Fase 5**: Integración WhatsApp ✅
6. [x] **Fase 6**: Integración Facebook Messenger ✅
7. [x] **Fase 7**: Integración Instagram Direct ✅
8. [x] **Fase 8**: Integración TikTok ✅
9. [x] **Fase 9**: Lógica de IA ✅
10. [x] **Fase 10**: Dashboard administrativo ✅
11. [x] **Fase 11**: Sistema de colas optimizado ✅
12. [x] **Fase 12**: Testing y deployment ✅

### Completado Recientemente:

**Fase 12: Testing y Deployment** ✅
- ✅ Suite de testing con Jest + React Testing Library
- ✅ Tests unitarios para utils y logger
- ✅ Guía completa de deployment en Vercel
- ✅ Documentación exhaustiva de variables de entorno
- ✅ Configuración de webhooks para todos los canales
- ✅ Opciones de queue worker (Vercel Cron, cron-job.org, QStash)

**Fase 11: Sistema de Colas Optimizado** ✅
- ✅ Logging estructurado con niveles (debug, info, warn, error)
- ✅ Sistema de métricas para queue (success rate, processing time)
- ✅ Dead Letter Queue (DLQ) para jobs permanentemente fallidos
- ✅ Retry inteligente con exponential backoff + jitter
- ✅ Procesamiento concurrente configurable
- ✅ Endpoints de monitoreo (/api/monitoring/queue, /api/health)
- ✅ API para trigger manual del queue worker

**Fase 10: Dashboard Administrativo** ✅
- ✅ Dashboard completo con sidebar navigation
- ✅ Vista de conversaciones con chat en tiempo real
- ✅ Integración de human takeover en el chat
- ✅ Estadísticas en tiempo real (mensajes, conversaciones, canales)
- ✅ Páginas de gestión (canales, flows, equipo, analytics)
- ✅ Componentes UI reutilizables (shadcn/ui style)
- ✅ Updates en tiempo real con Supabase Realtime

**Fases Anteriores:**
- ✅ **Human Takeover** - Transferencia a agente humano con control completo
- ✅ **AI/ML Integration** - Groq (LLaMA 3.1 70B) + Cloudflare AI fallback
- ✅ **4 Canales** - WhatsApp, Facebook, Instagram, TikTok
- ✅ **Multitenant** - Arquitectura completa con RLS
- 🆓 **100% gratuito** con free tiers

## 📊 Límites del Plan Gratuito

| Servicio | Límite Free | Suficiente para |
|----------|-------------|-----------------|
| Supabase | 500MB DB | ~100K mensajes |
| Vercel | 100GB BW/mes | ~10K usuarios/mes |
| Groq | 30 req/min | ~43K mensajes/día |
| Railway | $5 crédito/mes | Evolution API 24/7 |

## 🔧 Configuración Requerida

### 1. Supabase
- Crear proyecto en [supabase.com](https://supabase.com)
- Obtener `SUPABASE_URL` y `SUPABASE_ANON_KEY`

### 2. Evolution API (WhatsApp)
- Deploy en Railway: [evolution-api.com](https://evolution-api.com)
- Conectar con QR code

### 3. Meta Developer (Facebook/Instagram)
- Crear app en [developers.facebook.com](https://developers.facebook.com)
- Activar productos: Messenger, Instagram
- Obtener tokens de acceso

### 4. Groq
- Crear cuenta en [console.groq.com](https://console.groq.com)
- Obtener API key

### 5. Vercel
- Conectar repositorio en [vercel.com](https://vercel.com)
- Configurar variables de entorno

## 📖 Guías

### Deployment y Configuración
- **[🚀 Deployment en Vercel](docs/deployment.md)** - Guía completa paso a paso
- **[🔐 Variables de Entorno](docs/environment-variables.md)** - Todas las variables explicadas

### Canales de Mensajería
- **[WhatsApp Setup](docs/whatsapp-setup.md)** - Configurar Evolution API
- **[Facebook Messenger](docs/facebook-setup.md)** - Conectar con Meta Graph API
- **[Instagram Direct](docs/instagram-setup.md)** - Mensajes de Instagram
- **[TikTok](docs/tiktok-setup.md)** - Comentarios públicos (⚠️ NO DMs)

### Features Avanzadas
- **[🤖 AI Setup](docs/ai-setup.md)** - Groq + Cloudflare AI con fallback
- **[👤 Human Takeover](docs/human-takeover.md)** - Control manual de conversaciones
- **[🔄 Bot Flows](docs/bot-flows.md)** - Crear flujos automatizados

## 🔌 API Endpoints

### Webhooks (Recibir Mensajes)
- `POST /api/webhooks/whatsapp` - WhatsApp (Evolution API)
- `POST /api/webhooks/facebook` - Facebook Messenger
- `POST /api/webhooks/instagram` - Instagram Direct
- `POST /api/webhooks/tiktok` - TikTok Comments

### Health & Monitoring
- `GET /api/health` - Health check (database connectivity)
- `GET /api/monitoring/queue` - Queue statistics and metrics

### Queue Management (Admin Only)
- `POST /api/queue/trigger` - Trigger manual queue worker

### Human Takeover
- `POST /api/conversations/{id}/takeover` - Iniciar takeover
- `POST /api/conversations/{id}/release` - Liberar takeover
- `POST /api/conversations/{id}/send` - Enviar mensaje como agente

Ver documentación completa de API en `docs/api.md`

## 🤝 Contribuir

(Pendiente de definir)

## 📄 Licencia

MIT

## 🆘 Soporte

- Issues: [GitHub Issues](https://github.com/tu-usuario/zo_chatbot/issues)
- Documentación: Ver carpeta `/docs`

---

**Desarrollado con ❤️ para crear chatbots accesibles y potentes**
