# 🏗️ Arquitectura del Sistema - Chatbot Multicanal

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTES/USUARIOS                           │
│  WhatsApp │ Facebook │ Instagram │ TikTok │ Dashboard Web       │
└────┬──────────┬──────────┬────────────┬──────────┬──────────────┘
     │          │          │            │          │
     ▼          ▼          ▼            ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js App)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Frontend (Next.js 14)                   │   │
│  │  - Dashboard Admin                                       │   │
│  │  - Chat Interface                                        │   │
│  │  - Configuración                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Routes (Vercel Functions)               │   │
│  │                                                          │   │
│  │  /api/webhook/whatsapp      ◄── Evolution API           │   │
│  │  /api/webhook/facebook      ◄── Meta Graph API          │   │
│  │  /api/webhook/instagram     ◄── Meta Graph API          │   │
│  │  /api/webhook/tiktok        ◄── TikTok API              │   │
│  │  /api/messages/send         ──► Envío de mensajes       │   │
│  │  /api/bot/process           ──► Procesamiento IA        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┬───────────────┘
                   │                              │
                   ▼                              ▼
┌──────────────────────────────────┐  ┌─────────────────────────┐
│      SUPABASE (PostgreSQL)       │  │    GROQ / Cloudflare AI │
│  - Organizations (tenants)       │  │  - LLM Processing       │
│  - Users & Auth                  │  │  - Response Generation  │
│  - Channels                      │  │  - Intent Classification│
│  - Conversations                 │  └─────────────────────────┘
│  - Messages                      │
│  - Bot Flows                     │
│  - Realtime Subscriptions        │
│  - Storage (media files)         │
└──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              EVOLUTION API (Railway/Render)                       │
│  - WhatsApp Web Connection                                       │
│  - Multi-device support                                          │
│  - Webhook to Vercel                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Mensaje Entrante

```
1. RECEPCIÓN
   Usuario (WhatsApp/FB/IG) envía mensaje
   ↓
   Plataforma → Webhook → /api/webhook/{platform}

2. VALIDACIÓN
   ↓
   Verificar signature/token
   Verificar tenant/canal activo

3. PARSEO
   ↓
   Extraer: sender_id, content, message_type, metadata

4. PERSISTENCIA
   ↓
   Guardar en Supabase:
   - Crear/actualizar conversation
   - Insertar message (direction: 'inbound')

5. PROCESAMIENTO
   ↓
   Bot Engine:
   - Buscar bot_flows aplicables
   - Evaluar triggers (keyword/regex/always)
   - Ordenar por prioridad

6. GENERACIÓN DE RESPUESTA
   ↓
   Si response_type = 'ai':
     → Groq API (contexto + historial)
   Si response_type = 'template':
     → Reemplazar variables
   Si response_type = 'text':
     → Respuesta fija

7. ENVÍO
   ↓
   POST /api/messages/send
   - Guardar en DB (direction: 'outbound')
   - Enviar via plataforma
   - Actualizar estado

8. NOTIFICACIÓN
   ↓
   Supabase Realtime → Dashboard (actualización en vivo)
```

---

## Arquitectura Multitenant

### Estrategia: Row Level Security (RLS)

Cada request incluye identificador de organización:
- Header: `X-Organization-ID`
- JWT claim: `organization_id`
- Subdominio: `{org}.tuapp.com`

```typescript
// Middleware de Next.js
export async function middleware(request: NextRequest) {
  const { supabase, user } = await createClient(request)

  // Extraer organization del subdominio o path
  const org = extractOrganization(request)

  // Validar que user pertenece a org
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.redirect('/unauthorized')
  }

  // Agregar org al request
  request.headers.set('X-Organization-ID', org.id)
  return NextResponse.next()
}
```

### RLS en Acción

Todas las queries automáticamente filtran por `organization_id`:

```sql
-- Política para conversations
CREATE POLICY "Users see only their org's conversations"
  ON conversations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## Sistema de Colas

### Opción 1: PostgreSQL como Cola (Recomendado para costo 0)

```sql
CREATE TABLE message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_queue_pending ON message_queue(scheduled_for)
  WHERE status = 'pending';
```

**Worker** (Supabase Edge Function con cron):
```typescript
// Ejecutar cada minuto
Deno.serve(async () => {
  const { data: jobs } = await supabase
    .from('message_queue')
    .select()
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10)

  for (const job of jobs) {
    await processJob(job)
  }
})
```

### Opción 2: Cloudflare Queues (100K operaciones/día gratis)

---

## Seguridad

### 1. Validación de Webhooks

**Facebook/Instagram**:
```typescript
function verifyFacebookSignature(payload: string, signature: string) {
  const hmac = crypto.createHmac('sha256', FB_APP_SECRET)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${digest}`)
  )
}
```

**Evolution API**:
```typescript
// Token secreto en header
if (request.headers.get('apikey') !== EVOLUTION_API_KEY) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 2. Rate Limiting

Usar Vercel Edge Config + middleware:
```typescript
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: kv, // Vercel KV (gratuito hasta cierto límite)
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

const { success } = await ratelimit.limit(ip)
if (!success) return new Response('Too Many Requests', { status: 429 })
```

### 3. Sanitización de Input

```typescript
import DOMPurify from 'isomorphic-dompurify'

function sanitizeMessage(content: string) {
  // Prevenir XSS
  const clean = DOMPurify.sanitize(content)
  // Limitar longitud
  return clean.substring(0, 10000)
}
```

---

## Escalabilidad

### Límites del Plan Gratuito

| Recurso | Límite Gratis | Cuando escalar |
|---------|---------------|----------------|
| Supabase DB | 500MB | Al llegar a 400MB → $25/mes (8GB) |
| Vercel Bandwidth | 100GB/mes | Al llegar a 80GB → $20/mes (1TB) |
| Vercel Function Executions | 100K/mes | Al llegar a 80K → Pro plan |
| Railway | $5 crédito | Al agotarse → $10/mes |
| Groq API | 30 req/min | Caché + fallback a Cloudflare AI |

### Optimizaciones para Mantenerse en Free Tier

1. **Caché agresivo**:
   ```typescript
   // Vercel Edge Config para respuestas frecuentes
   const cached = await get(`response:${keyword}`)
   if (cached) return cached
   ```

2. **Lazy loading de media**:
   - Guardar URLs en lugar de archivos completos
   - Usar Cloudflare Images (Transform on-demand)

3. **Webhook batching**:
   - Acumular eventos no críticos
   - Procesar en batch cada X minutos

4. **Realtime selectivo**:
   - Solo suscribirse a conversaciones abiertas
   - Desuscribirse de conversaciones inactivas

---

## Monitoreo (Gratuito)

### Vercel Analytics
- Automático con deployment
- Web Vitals
- Function metrics

### Supabase Dashboard
- Query performance
- Storage usage
- Realtime connections

### Sentry (Free tier)
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // Muestrear 10% para mantenerse en free tier
})
```

### Custom Logging
```sql
CREATE TABLE system_logs (
  id BIGSERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retener solo últimos 7 días
CREATE POLICY "Auto-delete old logs" ON system_logs
  FOR SELECT USING (created_at > NOW() - INTERVAL '7 days');
```

---

## Backup y Disaster Recovery

### Supabase Backups
- Plan Free: Daily backups (7 días retención)
- Alternativa: pg_dump manual semanal

```bash
# Backup manual
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql

# Restaurar
psql "postgresql://..." < backup.sql
```

### Code Repository
- GitHub como source of truth
- Tags para releases estables
- Documentar cambios en CHANGELOG.md

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Costo: $0** (GitHub Actions free tier: 2000 min/mes)

---

## Performance Targets

| Métrica | Target | Herramienta |
|---------|--------|-------------|
| Latencia Webhook | < 500ms | Vercel Logs |
| Respuesta Bot (keyword) | < 1s | Custom metrics |
| Respuesta Bot (AI) | < 3s | Groq latency |
| Dashboard Load | < 2s | Lighthouse |
| Realtime Delay | < 100ms | Supabase Realtime |

---

## Tech Stack Completo

### Frontend
- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3.4+
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand (opcional, para estado global)
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 20+ (Vercel Functions)
- **Database**: Supabase (PostgreSQL 15)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### APIs Externas
- **WhatsApp**: Evolution API (self-hosted)
- **Facebook/Instagram**: Meta Graph API
- **TikTok**: TikTok for Developers API
- **AI**: Groq (LLaMA 3) + Cloudflare AI (fallback)

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Sentry
- **Version Control**: Git + GitHub

### Herramientas de Desarrollo
- **Package Manager**: pnpm (más rápido que npm)
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Playwright
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged

---

## ¿Siguiente Paso?

Ahora que tienes la arquitectura completa, ¿quieres que:
1. Comencemos con la **Fase 1** (setup inicial)?
2. Expliquemos alguna parte de la arquitectura en más detalle?
3. Creemos un diagrama de base de datos más detallado?

Dime y procedemos! 🚀
