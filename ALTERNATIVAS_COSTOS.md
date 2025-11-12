# 💰 Alternativas y Estrategias de Costo 0

Este documento explora diferentes alternativas técnicas para mantener el chatbot con **costo $0** o lo más cercano posible.

---

## 🚨 Mayor Desafío: WhatsApp

WhatsApp es el canal **más problemático** para mantener costo 0.

### Opción 1: Evolution API ⭐ **RECOMENDADO**

**Pros**:
- ✅ Completamente gratuito
- ✅ API RESTful completa
- ✅ Soporta webhooks
- ✅ Multi-dispositivo
- ✅ Soporta media (imágenes, videos, documentos)
- ✅ Activamente mantenido
- ✅ Documentación completa

**Contras**:
- ⚠️ NO es oficial (puede haber riesgo de ban)
- ⚠️ Requiere servidor 24/7
- ⚠️ Necesita reconexión si se desconecta

**Deploy Gratuito**:
```bash
# Railway (Free tier: $5 crédito/mes, suficiente para Evolution API)
railway up

# O con Docker en Render.com (Free tier)
docker run -p 8080:8080 atendai/evolution-api
```

**Costo**: $0 (usando Railway free credits)

---

### Opción 2: WhatsApp Web.js

**Pros**:
- ✅ Gratuito
- ✅ Muy estable
- ✅ Comunidad grande

**Contras**:
- ⚠️ Requiere Puppeteer (consume más recursos)
- ⚠️ Más complejo de mantener 24/7
- ⚠️ Sesión puede expirar

**Mejor uso**: Proyectos pequeños con bajo volumen

---

### Opción 3: Baileys (WhatsApp Multi-Device)

**Pros**:
- ✅ Gratuito
- ✅ Implementa el protocolo de WhatsApp directamente
- ✅ No usa navegador (más eficiente)

**Contras**:
- ⚠️ Requiere conocimiento técnico avanzado
- ⚠️ Mantenimiento manual de sesiones
- ⚠️ Documentación limitada

---

### ⛔ EVITAR: WhatsApp Business API Oficial

**Por qué NO**:
- 💸 Cobra por conversación (~$0.005 - $0.05 por mensaje)
- 💸 Mínimo ~$50/mes en costos reales
- 📝 Proceso de aprobación complejo
- 🏢 Requiere Meta Business Manager

**Solo usar si**: Tienes presupuesto y necesitas garantías de Meta

---

## 📱 Hosting y Servicios

### Backend/API Hosting

#### Opción 1: Vercel ⭐ **RECOMENDADO**

**Free Tier**:
- 100GB bandwidth/mes
- 100 GB-hours serverless execution
- 6000 minutos build/mes
- Unlimited deployments

**Ideal para**: API routes de Next.js

**Límites**:
- Functions timeout: 10s (suficiente)
- Max function size: 50MB

**Costo**: $0

---

#### Opción 2: Cloudflare Workers

**Free Tier**:
- 100,000 requests/día
- 10ms CPU time por request
- Unlimited bandwidth (!)

**Ideal para**: Webhooks simples, edge functions

**Costo**: $0

---

#### Opción 3: Railway

**Free Tier**:
- $5 crédito/mes
- Suficiente para 1 servicio pequeño 24/7
- 500 horas ejecución/mes

**Ideal para**: Evolution API, workers, cronjobs

**Costo**: $0 (con créditos)

---

#### Opción 4: Render.com

**Free Tier**:
- 750 horas/mes (1 servicio 24/7)
- ⚠️ Se duerme después de 15min inactividad
- 100GB bandwidth/mes

**Ideal para**: Servicios que pueden tolerar cold starts

**Costo**: $0

---

### Base de Datos

#### Opción 1: Supabase ⭐ **RECOMENDADO**

**Free Tier**:
- 500MB database
- 1GB file storage
- 50,000 usuarios activos/mes
- 2GB bandwidth/mes
- Realtime incluido
- Auth incluido

**Suficiente para**: ~10,000 conversaciones, ~100,000 mensajes

**Costo**: $0

**Cuando escalar**:
- $25/mes (8GB DB + 100GB storage + 50GB bandwidth)

---

#### Opción 2: PlanetScale

**Free Tier**:
- 5GB storage
- 1 billion row reads/mes
- 10 million row writes/mes

**Contras**:
- ⚠️ No tiene features como Realtime o Auth
- ⚠️ Solo MySQL (no PostgreSQL)

**Costo**: $0

---

#### Opción 3: Neon (PostgreSQL)

**Free Tier**:
- 3GB storage
- Unlimited databases
- 1 branch

**Pros**:
- ✅ PostgreSQL serverless
- ✅ Escala a 0 (no consume cuando no se usa)

**Contras**:
- ⚠️ No incluye Auth ni Realtime (necesitas otro servicio)

**Costo**: $0

---

#### Comparación Rápida

| Característica | Supabase | PlanetScale | Neon |
|----------------|----------|-------------|------|
| Storage | 500MB | 5GB | 3GB |
| Realtime | ✅ | ❌ | ❌ |
| Auth | ✅ | ❌ | ❌ |
| File Storage | ✅ | ❌ | ❌ |
| Tipo | PostgreSQL | MySQL | PostgreSQL |
| **Recomendado** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

**Veredicto**: Supabase gana por ser all-in-one

---

## 🤖 IA / LLM

### Opción 1: Groq ⭐ **RECOMENDADO**

**Free Tier**:
- 30 requests/minuto
- Modelos: LLaMA 3 (8B, 70B), Mixtral, Gemma
- Velocidad: ~300 tokens/s (¡muy rápido!)

**Ideal para**: Respuestas en tiempo real

**Limitación**: 30 req/min (agregar caché para mitigar)

**Costo**: $0

```typescript
// Implementación con caché
const cacheKey = `response:${conversationId}:${messageHash}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const response = await groq.chat.completions.create({
  model: "llama-3.1-70b-versatile",
  messages: [{ role: "user", content: message }],
  max_tokens: 200
})

await redis.setex(cacheKey, 3600, response) // Cache 1 hora
```

---

### Opción 2: Cloudflare AI

**Free Tier**:
- 1,000 requests/día
- Modelos: LLaMA 2, Mistral, etc.

**Ideal para**: Fallback cuando Groq alcanza límite

**Costo**: $0

---

### Opción 3: Hugging Face Inference API

**Free Tier**:
- ~1000 requests/mes (depende del modelo)
- Miles de modelos disponibles

**Contras**:
- ⚠️ Lento (cold start ~20s)
- ⚠️ Rate limits agresivos

**Costo**: $0

---

### Opción 4: OpenAI (con límites)

**Free Tier**:
- $5 crédito inicial (solo nuevas cuentas)
- Después: ~$0.002/1K tokens (GPT-3.5)

**Solo usar si**:
- Groq y Cloudflare no son suficientes
- Tienes presupuesto ($10-20/mes es razonable para chat moderado)

---

### Estrategia de Fallback Multi-Tier

```typescript
async function generateResponse(message: string) {
  try {
    // Tier 1: Groq (más rápido)
    return await groqAPI(message)
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      // Tier 2: Cloudflare AI
      return await cloudflareAI(message)
    }
    // Tier 3: Respuesta de plantilla
    return fallbackResponse()
  }
}
```

---

## 🔄 Cola de Mensajes / Background Jobs

### Opción 1: PostgreSQL como Cola ⭐ **RECOMENDADO**

**Pros**:
- ✅ Sin servicios adicionales
- ✅ ACID guarantees
- ✅ Simple

**Implementación**:
```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker consulta cada minuto
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

**Worker**: Supabase Edge Function con cron trigger

**Costo**: $0

---

### Opción 2: Cloudflare Queues

**Free Tier**:
- 100,000 operaciones/día
- FIFO garantizado

**Ideal para**: Alta concurrencia

**Costo**: $0

---

### Opción 3: Upstash (Redis)

**Free Tier**:
- 10,000 comandos/día
- 256MB storage

**Ideal para**: Cache + simple queue

**Costo**: $0

---

## 📊 Monitoreo y Logs

### Opción 1: Vercel Analytics ⭐

**Incluido con Vercel**:
- Web Vitals
- Function metrics
- Real-time logs

**Costo**: $0

---

### Opción 2: Sentry

**Free Tier**:
- 5,000 eventos/mes
- 1 usuario
- Error tracking + Performance

**Costo**: $0

---

### Opción 3: Axiom

**Free Tier**:
- 500MB logs/mes
- 30 días retención

**Costo**: $0

---

### Opción 4: Better Stack (Logtail)

**Free Tier**:
- 1GB logs/mes
- 3 días retención

**Costo**: $0

---

## 📧 Notificaciones / Email

### Opción 1: Resend

**Free Tier**:
- 100 emails/día
- 1 dominio custom

**Ideal para**: Notificaciones, onboarding

**Costo**: $0

---

### Opción 2: Supabase Email (SMTP)

**Incluido con Supabase Auth**:
- Emails transaccionales ilimitados (en free tier)

**Costo**: $0

---

## 🔐 Auth

### Opción 1: Supabase Auth ⭐ **RECOMENDADO**

**Incluido en Supabase**:
- Email/password
- OAuth (Google, GitHub, etc.)
- Magic links
- JWT tokens

**Costo**: $0

---

### Opción 2: Clerk

**Free Tier**:
- 5,000 usuarios activos/mes
- Unlimited social connections

**Más features que Supabase Auth pero innecesario**

**Costo**: $0

---

## 📦 File Storage

### Opción 1: Supabase Storage ⭐

**Free Tier**:
- 1GB storage
- 2GB bandwidth/mes

**Costo**: $0

---

### Opción 2: Cloudflare R2

**Free Tier**:
- 10GB storage
- 0 egress fees (!)

**Mejor para**: Muchas descargas

**Costo**: $0

---

## 🎨 Frontend Hosting

### Opción 1: Vercel ⭐ **RECOMENDADO**

Ya cubierto arriba. Perfect para Next.js.

---

### Opción 2: Cloudflare Pages

**Free Tier**:
- Unlimited bandwidth (!)
- Unlimited requests
- 500 builds/mes

**Mejor opción si**: Excedes bandwidth de Vercel

**Costo**: $0

---

### Opción 3: Netlify

**Free Tier**:
- 100GB bandwidth/mes
- 300 build minutos/mes

**Similar a Vercel**

**Costo**: $0

---

## 🌍 CDN

### Opción 1: Cloudflare (incluido con Pages)

**Free Tier**:
- Unlimited bandwidth
- Global CDN

**Costo**: $0

---

## 📈 Analytics

### Opción 1: Vercel Analytics (incluido)

**Costo**: $0

---

### Opción 2: Plausible (self-hosted)

**Self-hosted**: Deploy en Railway

**Costo**: $0 (usa créditos Railway)

---

## 🎯 Resumen: Stack Recomendado para Costo $0

| Componente | Servicio | Límite Free | Escalabilidad |
|------------|----------|-------------|---------------|
| **Frontend** | Vercel | 100GB BW | → $20/mes (1TB) |
| **Backend API** | Vercel Functions | 100 GB-hours | → Incluido en Pro |
| **Database** | Supabase | 500MB | → $25/mes (8GB) |
| **WhatsApp** | Evolution API (Railway) | $5 crédito | → $10/mes |
| **AI** | Groq + Cloudflare | 30 req/min + 1K/día | → Cache + OpenAI |
| **Storage** | Supabase | 1GB | → Incluido en paid |
| **Monitoring** | Vercel + Sentry | 5K eventos | → $26/mes |
| **Email** | Resend | 100/día | → $20/mes (10K/día) |

**Costo total inicial**: **$0/mes**

**Costo al escalar** (10K mensajes/día, 100 orgs): **~$80/mes**

---

## 🚀 Cuándo Escalar (y a qué)

### Trigger 1: Base de Datos (~500MB usado)
**Acción**: Upgrade Supabase a $25/mes
**Obtienes**: 8GB DB + 100GB storage

---

### Trigger 2: Bandwidth >100GB/mes
**Opción A**: Upgrade Vercel Pro ($20/mes) → 1TB bandwidth
**Opción B**: Migrar frontend a Cloudflare Pages (unlimited)

---

### Trigger 3: AI requests >40K/día
**Acción**: Agregar OpenAI con presupuesto controlado
**Estrategia**: Groq first, OpenAI fallback

---

### Trigger 4: Railway credits agotados
**Acción**: $10/mes en Railway
**O**: Migrar Evolution API a Render con cold starts

---

## 💡 Tips para Maximizar Free Tiers

1. **Implementar caché agresivo**
   ```typescript
   // Redis con Upstash
   await cache.set(key, value, { ex: 3600 })
   ```

2. **Lazy load de recursos**
   - Imágenes: Next.js Image (optimización automática)
   - Componentes: React.lazy()

3. **Batching de operaciones**
   ```typescript
   // En lugar de 100 queries, 1 bulk insert
   await supabase.from('messages').insert(messagesBatch)
   ```

4. **Polling inteligente**
   ```typescript
   // Exponential backoff si no hay mensajes
   const delay = hasMessages ? 1000 : Math.min(delay * 2, 60000)
   ```

5. **Limpiar datos viejos**
   ```sql
   -- Borrar mensajes >6 meses
   DELETE FROM messages
   WHERE created_at < NOW() - INTERVAL '6 months';
   ```

6. **Comprimir respuestas**
   ```typescript
   // Middleware de Next.js
   export const config = {
     matcher: '/api/:path*',
   }
   // Gzip automático en Vercel
   ```

---

## ⚠️ Advertencias Importantes

### 1. Evolution API / Baileys
- **Riesgo de ban**: WhatsApp puede banear números que usen APIs no oficiales
- **Mitigación**: Usar número dedicado, no spam, respetar rate limits

### 2. Free Tiers pueden cambiar
- Servicios pueden reducir límites
- Siempre tener plan B

### 3. Escalabilidad != Sostenibilidad
- Costo 0 es para MVP y validación
- Planifica costos reales para escala

---

## 🎓 Recursos

- [Vercel Limits](https://vercel.com/docs/limits)
- [Supabase Pricing](https://supabase.com/pricing)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Groq Console](https://console.groq.com/)
- [Cloudflare Free Tier](https://www.cloudflare.com/plans/free/)

---

¿Preguntas sobre alguna alternativa? ¡Pregunta! 🚀
