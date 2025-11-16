# 🔐 Environment Variables Guide

Guía completa de todas las variables de entorno necesarias para ZO Chatbot.

## 📋 Variables Obligatorias

Estas variables son **REQUERIDAS** para que la aplicación funcione:

### Supabase (Base de Datos y Auth)

```bash
# URL del proyecto de Supabase
# Formato: https://xxx.supabase.co
# Dónde encontrarlo: Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Clave pública anónima (safe to expose)
# Dónde encontrarlo: Supabase Dashboard → Settings → API → anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ⚠️ Clave de servicio (NUNCA exponer al cliente)
# Dónde encontrarlo: Supabase Dashboard → Settings → API → service_role (revelar)
# IMPORTANTE: Solo usar en backend/server-side
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Connection string para database
# Formato: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true
# Dónde encontrarlo: Supabase Dashboard → Settings → Database → Connection string (URI, transaction pooling)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true
```

## 🤖 IA / ML (Opcional pero Recomendado)

### Groq (Recomendado - Ultra Fast AI)

```bash
# API Key de Groq
# Cómo obtenerlo:
# 1. Ir a https://console.groq.com
# 2. Crear cuenta (gratis)
# 3. API Keys → Create API Key
# Free Tier: 30 req/min, 14,400 req/día
GROQ_API_KEY=gsk_...
```

### Cloudflare AI (Fallback Recomendado)

```bash
# Account ID de Cloudflare
# Dónde encontrarlo: Cloudflare Dashboard → Workers & Pages → Account ID
CLOUDFLARE_ACCOUNT_ID=your-account-id

# API Token de Cloudflare
# Cómo obtenerlo:
# 1. Cloudflare Dashboard → My Profile → API Tokens
# 2. Create Token → Create Custom Token
# 3. Permissions: Account > Workers AI > Edit
CLOUDFLARE_API_TOKEN=your-api-token
```

## 📱 Canales de Mensajería (Opcionales)

### WhatsApp (Evolution API)

```bash
# URL base de tu instancia de Evolution API
# Ejemplo: https://your-evolution.railway.app
# Cómo deployar Evolution API:
# - Railway: https://railway.app (free tier)
# - Render: https://render.com (free tier)
# - Docker: auto-hosting
EVOLUTION_API_URL=https://your-evolution-api.com

# API Key global de Evolution API
# Configurado al deployar Evolution API
# Ver: docs/whatsapp-setup.md
EVOLUTION_API_KEY=your-global-api-key
```

### Facebook Messenger

```bash
# App ID de Facebook
# Dónde encontrarlo: Meta Developers → Your App → Settings → Basic → App ID
FACEBOOK_APP_ID=1234567890

# App Secret de Facebook (⚠️ SECRETO)
# Dónde encontrarlo: Meta Developers → Your App → Settings → Basic → App Secret
FACEBOOK_APP_SECRET=your-app-secret

# Verify Token para webhook (puedes usar cualquier string)
# Este es el token que usarás al configurar el webhook en Meta
# Ejemplo: "mi-token-super-secreto-123"
FACEBOOK_VERIFY_TOKEN=your-custom-verify-token

# Page Access Token (⚠️ SECRETO)
# Cómo obtenerlo: Ver docs/facebook-setup.md
# Nota: Se almacena por página en la tabla 'channels'
# Esta variable es opcional, se puede configurar por canal
FACEBOOK_PAGE_ACCESS_TOKEN=EAAx...
```

### Instagram Direct

```bash
# Usa las mismas variables que Facebook
# Instagram usa la misma app de Facebook

# Opcional: Instagram Business Account ID
# Dónde encontrarlo: Graph API Explorer
# GET /{page-id}?fields=instagram_business_account
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841...
```

### TikTok

```bash
# Client Key de TikTok
# Dónde encontrarlo: TikTok Developers → Your App → Basic Information
TIKTOK_CLIENT_KEY=your-client-key

# Client Secret de TikTok (⚠️ SECRETO)
# Dónde encontrarlo: TikTok Developers → Your App → Basic Information
TIKTOK_CLIENT_SECRET=your-client-secret

# Nota: Los access tokens se almacenan por canal en la tabla 'channels'
# debido a que expiran cada 24 horas y requieren refresh
```

## 🔧 Configuración (Opcionales)

### Node Environment

```bash
# Ambiente de ejecución
# Valores: development | production | test
# Vercel establece esto automáticamente
NODE_ENV=production
```

### Logging

```bash
# Nivel de log
# Valores: debug | info | warn | error
# Recomendado: info en producción, debug en desarrollo
LOG_LEVEL=info
```

### Queue Worker

```bash
# Tamaño de lote para procesamiento de cola
# Recomendado: 10-20
QUEUE_BATCH_SIZE=10

# Número de jobs procesados concurrentemente
# Recomendado: 5-10
QUEUE_CONCURRENCY=5
```

## 📝 Archivo .env.local (Desarrollo)

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Copiar .env.example
cp .env.example .env.local

# Editar con tus valores
nano .env.local
```

Ejemplo de `.env.local`:

```bash
# Supabase (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true

# Groq AI (Recomendado)
GROQ_API_KEY=gsk_...

# Cloudflare AI (Opcional)
# CLOUDFLARE_ACCOUNT_ID=
# CLOUDFLARE_API_TOKEN=

# WhatsApp (Opcional)
# EVOLUTION_API_URL=
# EVOLUTION_API_KEY=

# Facebook/Instagram (Opcional)
# FACEBOOK_APP_ID=
# FACEBOOK_APP_SECRET=
# FACEBOOK_VERIFY_TOKEN=

# TikTok (Opcional)
# TIKTOK_CLIENT_KEY=
# TIKTOK_CLIENT_SECRET=

# Config
NODE_ENV=development
LOG_LEVEL=debug
```

## 🔒 Seguridad

### ⚠️ NUNCA Commitees Estos Archivos

Asegúrate que `.env.local` esté en `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
.env.production
```

### ⚠️ Variables SECRETAS

Estas variables son **SECRETAS** y **NUNCA** deben exponerse al cliente:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `TIKTOK_CLIENT_SECRET`
- `EVOLUTION_API_KEY`
- `GROQ_API_KEY`
- `CLOUDFLARE_API_TOKEN`

### ✅ Variables PÚBLICAS

Estas variables son seguras para exponer al cliente (tienen prefijo `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚀 Configurar en Vercel

### Via Dashboard

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable:
   - **Key**: Nombre de la variable
   - **Value**: Valor de la variable
   - **Environment**: Production, Preview, Development (selecciona los que necesites)

### Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Establecer variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Listar variables
vercel env ls
```

### Via vercel.json (No recomendado para secretos)

```json
{
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🧪 Testing

Para testing, crea `.env.test`:

```bash
# .env.test
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
# ... más variables de test
```

## 📊 Validación

Verifica que todas las variables estén configuradas:

```typescript
// src/lib/env.ts (crear si no existe)
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

## 🔄 Actualizar Variables

Después de cambiar variables en Vercel:

1. Re-deploy desde Vercel Dashboard
2. O hacer un nuevo commit/push (auto-deploy)

⚠️ **Importante**: Los cambios en variables requieren re-deploy para tomar efecto.

## 📚 Referencias

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#env-vars)

---

¿Falta alguna variable? Abre un issue en GitHub o consulta la documentación específica del canal.
