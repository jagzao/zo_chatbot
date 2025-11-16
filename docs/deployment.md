# 🚀 Deployment Guide - Vercel

Esta guía te llevará paso a paso para desplegar ZO Chatbot en Vercel con costo $0.

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta de GitHub con el repositorio
- ✅ Cuenta de Vercel (gratis en [vercel.com](https://vercel.com))
- ✅ Cuenta de Supabase con proyecto configurado
- ✅ (Opcional) Cuenta de Groq para IA
- ✅ (Opcional) Cuenta de Cloudflare para IA fallback
- ✅ (Opcional) Evolution API para WhatsApp
- ✅ (Opcional) Meta Developer para Facebook/Instagram

## 🎯 Paso 1: Preparar Supabase

### 1.1 Ejecutar Migraciones

Conéctate a tu proyecto de Supabase y ejecuta las migraciones en orden:

```bash
# En el dashboard de Supabase -> SQL Editor
# Ejecutar cada migración en orden:
```

1. `00001_initial_schema.sql` - Esquema base de datos
2. `00002_rls_policies.sql` - Políticas de seguridad
3. `00003_seed_data.sql` - (Opcional) Datos de prueba
4. `00004_human_takeover.sql` - Sistema de takeover
5. `00005_dead_letter_queue.sql` - Queue DLQ

### 1.2 Obtener Credenciales

En tu dashboard de Supabase:

1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (⚠️ **SECRETO**) → `SUPABASE_SERVICE_ROLE_KEY`

3. Ve a **Settings** → **Database**
4. Copia:
   - `Connection string` (modo directo) → `DATABASE_URL`

## 🎯 Paso 2: Conectar con Vercel

### 2.1 Importar Repositorio

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click en **Import Git Repository**
3. Selecciona tu repositorio de GitHub
4. Click en **Import**

### 2.2 Configurar Proyecto

En la pantalla de configuración:

- **Project Name**: `zo-chatbot` (o el que prefieras)
- **Framework Preset**: Next.js (detectado automáticamente)
- **Root Directory**: `./` (dejar por defecto)
- **Build Command**: `npm run build` (dejar por defecto)
- **Output Directory**: `.next` (dejar por defecto)

### 2.3 Configurar Variables de Entorno

Click en **Environment Variables** y agrega las siguientes:

#### **Variables Obligatorias:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # ⚠️ SECRETO

# Database (para Supabase Admin Client)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true
```

#### **Variables Opcionales (según tus integraciones):**

```bash
# Groq AI (Recomendado)
GROQ_API_KEY=gsk_...

# Cloudflare AI (Fallback)
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key

# Facebook/Instagram
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_PAGE_ACCESS_TOKEN=xxx

# TikTok
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx
```

### 2.4 Deploy

1. Click en **Deploy**
2. Espera 2-3 minutos mientras Vercel construye y despliega
3. ¡Listo! Tu app estará disponible en `https://zo-chatbot.vercel.app`

## 🎯 Paso 3: Post-Deployment

### 3.1 Configurar Webhooks

Ahora que tu app está desplegada, configura los webhooks de cada canal:

#### **WhatsApp (Evolution API)**

```bash
# URL del webhook
https://your-domain.vercel.app/api/webhook/whatsapp

# Configurar en Evolution API dashboard o vía API
```

#### **Facebook Messenger**

```bash
# URL del webhook
https://your-domain.vercel.app/api/webhook/facebook

# Callback URL en Meta Developer Console
# Verify Token: cualquier string que quieras (guárdalo en .env como FACEBOOK_VERIFY_TOKEN)
```

#### **Instagram**

```bash
# URL del webhook
https://your-domain.vercel.app/api/webhook/instagram

# Mismo proceso que Facebook
```

#### **TikTok**

```bash
# URL del webhook
https://your-domain.vercel.app/api/webhook/tiktok

# Configurar en TikTok Developer Console
```

### 3.2 Configurar Queue Worker (Cron)

Vercel Free Tier no incluye cron jobs persistentes, pero tienes opciones:

#### **Opción A: Vercel Cron (Hobby/Pro plan)**

Crea `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/queue/trigger",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

#### **Opción B: External Cron (Free)**

Usa un servicio gratuito como [cron-job.org](https://cron-job.org):

1. Crea cuenta en cron-job.org
2. Crea nuevo cron job:
   - URL: `https://your-domain.vercel.app/api/queue/trigger`
   - Schedule: `*/1 * * * *` (cada minuto)
   - Método: POST
   - Headers: `Authorization: Bearer YOUR_ADMIN_TOKEN` (opcional)

#### **Opción C: Upstash QStash (Free Tier)**

1. Crea cuenta en [upstash.com](https://upstash.com)
2. Ve a QStash
3. Crea schedule:
   - URL: `https://your-domain.vercel.app/api/queue/trigger`
   - Cron: `*/1 * * * *`

### 3.3 Verificar Deployment

1. Visita `https://your-domain.vercel.app/api/health`
   - Deberías ver: `{"status":"healthy",...}`

2. Visita `https://your-domain.vercel.app/dashboard`
   - Deberías ver la página de login

3. Crea tu primera cuenta y organización

## 🔒 Paso 4: Seguridad en Producción

### 4.1 Variables de Entorno

⚠️ **NUNCA** commits las siguientes variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- API keys de canales
- Tokens de acceso
- Client secrets

### 4.2 RLS (Row Level Security)

Verifica que RLS esté habilitado en todas las tablas de Supabase:

```sql
-- Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Todas las tablas deben tener rowsecurity = true
```

### 4.3 Rate Limiting

Considera agregar rate limiting para APIs públicas (webhooks):

```typescript
// Opcional: instalar
npm install @upstash/ratelimit @upstash/redis
```

### 4.4 CORS

Los webhooks están configurados para aceptar solo POST requests. Si necesitas ajustar CORS, edita `next.config.js`.

## 📊 Paso 5: Monitoring

### 5.1 Vercel Analytics

Habilita analytics gratis en Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Analytics
3. Enable Analytics

### 5.2 Logs

Ver logs en tiempo real:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs
vercel logs
```

### 5.3 Queue Monitoring

Visita `/api/monitoring/queue` (requiere autenticación como admin) para ver:

- Jobs pendientes/procesando/completados/fallidos
- Métricas de performance
- DLQ status

## 🔄 Paso 6: Actualizaciones

### Git Push Auto-Deploy

Vercel auto-despliega cada push a `main`:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

### Preview Deployments

Cada PR crea un deployment de preview automáticamente.

### Rollback

Si algo sale mal:

1. Ve a Vercel Dashboard → Deployments
2. Encuentra el deployment anterior
3. Click en "..." → **Promote to Production**

## 💰 Costos y Límites

### Vercel Free Tier

- ✅ 100GB bandwidth/mes
- ✅ Serverless Functions ilimitadas
- ✅ Edge Functions ilimitadas
- ❌ Cron Jobs (requiere Hobby plan $20/mes)

### Supabase Free Tier

- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth

### Groq Free Tier

- ✅ 30 requests/min
- ✅ 14,400 requests/día
- ✅ Suficiente para ~40K mensajes/día

### Cloudflare AI Free Tier

- ✅ 10,000 neurons/día
- ✅ ~300-500 mensajes/día como fallback

## 🐛 Troubleshooting

### Build Failures

```bash
# Error: Type errors
# Solución: Ejecutar localmente
npm run type-check

# Error: Missing dependencies
# Solución: Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

1. Verifica variables de entorno en Vercel
2. Revisa logs: `vercel logs`
3. Verifica conexión a Supabase: `/api/health`

### Webhooks No Funcionan

1. Verifica que la URL esté bien configurada
2. Verifica que los secrets coincidan
3. Revisa logs de Vercel para ver si llegan requests
4. Verifica que RLS permita insertar mensajes

### Queue No Procesa

1. Verifica que tengas cron configurado
2. Trigger manual: `/api/queue/trigger`
3. Revisa `/api/monitoring/queue` para ver status

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Todas las migraciones ejecutadas en Supabase
- [ ] RLS habilitado en todas las tablas
- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhooks configurados para todos los canales
- [ ] Queue worker configurado (cron)
- [ ] Health check funciona (`/api/health`)
- [ ] Tests pasan (`npm test`)
- [ ] Type check pasa (`npm run type-check`)
- [ ] Build exitoso (`npm run build`)
- [ ] Dominio custom configurado (opcional)
- [ ] Analytics habilitado
- [ ] Backup strategy definida (Supabase auto-backups)

## 📚 Recursos Adicionales

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Meta Webhooks](https://developers.facebook.com/docs/graph-api/webhooks)

## 🆘 Soporte

¿Necesitas ayuda?

1. Revisa los logs: `vercel logs`
2. Verifica el health endpoint: `/api/health`
3. Revisa el monitoring: `/api/monitoring/queue`
4. Consulta la documentación en `/docs`

---

**¡Felicidades! Tu chatbot multi-canal está en producción con costo $0** 🎉
