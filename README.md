# 🤖 ZO Chatbot - Plataforma Multicanal y Multitenant

> Chatbot inteligente capaz de gestionar conversaciones en WhatsApp, Facebook, Instagram y TikTok con arquitectura multitenant y **costo $0**.

## 📚 Documentación

- **[Plan de Proyecto](./PLAN_PROYECTO.md)**: Plan completo de 12 fases con cronograma
- **[Arquitectura](./ARQUITECTURA.md)**: Diagramas y decisiones técnicas
- **[Alternativas de Costo](./ALTERNATIVAS_COSTOS.md)**: Estrategias para mantener costo $0

## 🎯 Características Principales

- ✅ **Multicanal**: WhatsApp, Facebook Messenger, Instagram Direct, TikTok
- ✅ **Multitenant**: Múltiples organizaciones en una sola instancia
- ✅ **IA Integrada**: Respuestas inteligentes con Groq (LLaMA 3)
- ✅ **Dashboard Web**: Gestión completa de conversaciones y configuración
- ✅ **Tiempo Real**: Actualizaciones instantáneas con Supabase Realtime
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

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/zo_chatbot.git
cd zo_chatbot

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
pnpm dev
```

## 📋 Estado del Proyecto

**Fase Actual**: Fase 8 - Integración TikTok 🚧

### Progreso:
1. [x] **Fase 1**: Configuración inicial del proyecto ✅
2. [x] **Fase 2**: Configurar Supabase ✅
3. [x] **Fase 3**: Sistema multitenant ✅
4. [x] **Fase 4**: API core del chatbot ✅
5. [x] **Fase 5**: Integración WhatsApp ✅
6. [x] **Fase 6**: Integración Facebook Messenger ✅
7. [x] **Fase 7**: Integración Instagram Direct ✅
8. [ ] **Fase 8**: Integración TikTok
9. [ ] **Fase 9**: Lógica de IA
10. [ ] **Fase 10**: Dashboard administrativo
11. [ ] **Fase 11**: Sistema de webhooks y colas
12. [ ] **Fase 12**: Testing y deployment

### Completado Recientemente:
- ✅ **Instagram Direct Integration** con Graph API
- ✅ Cliente completo de Instagram Graph API v18.0
- ✅ Webhook handler para Instagram Direct Messages
- ✅ Soporte para story mentions y story replies
- ✅ Typing indicators y mark as seen
- ✅ Instagram-Scoped ID (IGSID) handling
- ✅ User profile con username
- ✅ API endpoints para testing
- ✅ Documentación completa de setup de Instagram

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

### Conectar WhatsApp
Ver [docs/whatsapp-setup.md](docs/whatsapp-setup.md)

### Configurar Facebook Messenger
Ver [docs/facebook-setup.md](docs/facebook-setup.md)

### Configurar Instagram Direct
Ver [docs/instagram-setup.md](docs/instagram-setup.md)

### Crear Flujos de Bot
Ver [docs/bot-flows.md](docs/bot-flows.md)

## 🤝 Contribuir

(Pendiente de definir)

## 📄 Licencia

MIT

## 🆘 Soporte

- Issues: [GitHub Issues](https://github.com/tu-usuario/zo_chatbot/issues)
- Documentación: Ver carpeta `/docs`

---

**Desarrollado con ❤️ para crear chatbots accesibles y potentes**
