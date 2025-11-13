# Guía de Configuración de IA

Esta guía explica cómo configurar la integración de IA para respuestas inteligentes usando Groq y Cloudflare AI.

## 🤖 ¿Qué es la Integración de IA?

El sistema de IA permite que tu chatbot genere **respuestas inteligentes y contextuales** automáticamente, sin necesidad de configurar flows específicos para cada pregunta.

**Ventajas:**
- ✅ Respuestas naturales y contextuales
- ✅ Entiende el historial de la conversación
- ✅ Se adapta al tono y contexto de la organización
- ✅ Fallback automático entre providers
- ✅ **Completamente gratuito** (en planes free tier)

**Providers Soportados:**
1. **Groq** (Principal) - LLaMA 3.1 70B, ultra-rápido
2. **Cloudflare AI** (Fallback) - LLaMA 3 8B, confiable

---

## 🚀 Opción 1: Groq (Recomendado)

### ¿Por Qué Groq?

- ⚡ **Ultra-rápido**: 300+ tokens/segundo
- 🆓 **Generoso free tier**: 30 req/min, 14,400 req/día
- 🧠 **LLaMA 3.1 70B**: Modelo de alta calidad
- ✅ **Sin tarjeta de crédito**: 100% gratuito

### Paso 1: Crear Cuenta en Groq

1. Ve a [console.groq.com](https://console.groq.com)
2. Click **"Sign Up"** o inicia sesión con Google/GitHub
3. Confirma tu email

### Paso 2: Obtener API Key

1. Una vez en el dashboard, ve a **"API Keys"**
2. Click **"Create API Key"**
3. Dale un nombre: `zo-chatbot-production`
4. **Copia la API key** (se muestra solo una vez)
   ```
   gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Paso 3: Configurar en tu Aplicación

En tu `.env.local`:

```env
# Groq AI Configuration
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

✅ **¡Listo!** Tu chatbot ahora puede generar respuestas con IA.

---

## 🌐 Opción 2: Cloudflare AI (Alternativa/Fallback)

### ¿Por Qué Cloudflare AI?

- 🌍 **Global y confiable**: Red de Cloudflare
- 🆓 **Free tier**: 10,000 neurons/día
- 🔄 **Buen fallback**: Si Groq falla o llega al límite
- 🚀 **Sin configuración compleja**

### Paso 1: Crear Cuenta en Cloudflare

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com/sign-up)
2. Crea una cuenta (gratis)
3. Verifica tu email

### Paso 2: Habilitar Workers AI

1. En el dashboard, ve a **"Workers & Pages"**
2. Click **"AI"** en el menú lateral
3. Click **"Enable Workers AI"**

### Paso 3: Obtener Credenciales

#### Account ID:
1. En el dashboard, ve a **"Workers & Pages"**
2. En la barra lateral derecha, verás **"Account ID"**
3. Cópialo:
   ```
   a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

#### API Token:
1. Ve a **"My Profile"** → **"API Tokens"**
2. Click **"Create Token"**
3. Usa el template **"Edit Cloudflare Workers"**
4. O crea un token personalizado con permisos:
   - Account → Workers AI → Read
5. Click **"Continue to summary"** → **"Create Token"**
6. **Copia el token** (se muestra solo una vez)

### Paso 4: Configurar en tu Aplicación

En tu `.env.local`:

```env
# Cloudflare AI Configuration
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
CLOUDFLARE_API_TOKEN=tu-api-token-aqui
```

---

## ⚙️ Opción 3: Ambos (Recomendado para Producción)

Configura **ambos providers** para máxima confiabilidad:

```env
# Groq (Principal)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudflare (Fallback)
CLOUDFLARE_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
CLOUDFLARE_API_TOKEN=tu-api-token-aqui
```

**Comportamiento:**
1. Intenta usar **Groq** primero (más rápido y mejor calidad)
2. Si Groq falla o no responde, usa **Cloudflare AI**
3. Si ambos fallan, devuelve un mensaje predeterminado

---

## 🧪 Probar la Integración

### Test 1: Verificar Estado

```bash
curl http://localhost:3000/api/ai/generate
```

**Respuesta esperada:**
```json
{
  "available": true,
  "providers": ["groq", "cloudflare"]
}
```

### Test 2: Generar Respuesta

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuál es el horario de atención?",
    "systemPrompt": "Eres un asistente de una tienda. El horario es de lunes a viernes de 9am a 6pm."
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "response": "Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM. ¿Hay algo más en lo que pueda ayudarte?",
  "provider": "groq",
  "availableProviders": ["groq", "cloudflare"]
}
```

### Test 3: Probar con Contexto

```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Gracias",
    "context": {
      "contactName": "María",
      "organizationName": "Tienda XYZ",
      "previousMessages": [
        {"role": "user", "content": "¿Cuál es el precio?"},
        {"role": "assistant", "content": "El precio es $50"}
      ]
    }
  }'
```

---

## 🔧 Configurar Bot Flows con IA

### Crear un Flow con IA en Supabase

```sql
INSERT INTO bot_flows (
  organization_id,
  name,
  trigger_type,
  trigger_value,
  response_type,
  response_content,
  priority,
  is_active
) VALUES (
  'your-org-id',
  'Asistente IA General',
  'always',  -- Se activa siempre (como fallback inteligente)
  null,
  'ai',      -- Tipo: IA
  'Eres un asistente amable de [Tu Empresa]. Ayudas a los clientes con información sobre productos, horarios y envíos. Siempre eres cortés y profesional.',  -- System prompt personalizado
  10,  -- Prioridad baja (fallback)
  true
) RETURNING *;
```

### System Prompts Recomendados

#### Para Tienda/E-commerce:
```
Eres un asistente de ventas de [Nombre de la Tienda].

Información clave:
- Horario: Lunes a Viernes, 9am - 6pm
- Envíos: A toda España, 3-5 días hábiles
- Devoluciones: 30 días sin preguntas
- Contacto: soporte@tienda.com

Siempre sé amable y ayuda al cliente a encontrar lo que busca.
Si no sabes algo, ofrece contactar a un agente humano.
```

#### Para Soporte Técnico:
```
Eres un asistente de soporte técnico de [Nombre de la Empresa].

Ayudas a resolver problemas técnicos básicos:
- Conexión
- Configuración
- Problemas comunes

Si el problema es complejo, escala a un técnico humano.
Siempre pregunta detalles específicos antes de dar soluciones.
```

#### Para Restaurante:
```
Eres el asistente del restaurante [Nombre].

Información:
- Horario: Martes a Domingo, 1pm - 11pm
- Especialidad: Cocina mediterránea
- Reservas: Llamar al 123-456-789
- Delivery: Sí, radio de 5km

Sé amigable y apetitoso al describir los platos.
```

---

## 🎯 Modelos Disponibles

### Groq

| Modelo | Descripción | Velocidad | Calidad | Uso Recomendado |
|--------|-------------|-----------|---------|-----------------|
| `llama-3.1-70b-versatile` | LLaMA 3.1 70B | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | **Default** - Mejor balance |
| `llama-3.1-8b-instant` | LLaMA 3.1 8B | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Respuestas rápidas |
| `mixtral-8x7b-32768` | Mixtral 8x7B | ⚡⚡⚡ | ⭐⭐⭐⭐ | Tareas estructuradas |
| `gemma-7b-it` | Gemma 7B | ⚡⚡⚡⚡ | ⭐⭐⭐ | Alternativa ligera |

### Cloudflare AI

| Modelo | Descripción | Velocidad | Calidad |
|--------|-------------|-----------|---------|
| `@cf/meta/llama-3-8b-instruct` | LLaMA 3 8B | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| `@cf/mistral/mistral-7b-instruct` | Mistral 7B | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| `@cf/meta/llama-2-7b-chat` | LLaMA 2 7B | ⚡⚡⚡⚡ | ⭐⭐⭐ |

---

## 📊 Límites y Costos

### Groq Free Tier

| Límite | Valor |
|--------|-------|
| Requests/minuto | 30 |
| Requests/día | 14,400 |
| Tokens/minuto | 6,000 |
| Costo | **$0** |

**Suficiente para:**
- ~43,000 mensajes/día (con 10 tokens por mensaje)
- ~500 usuarios activos/día
- Chatbot pequeño/mediano sin problemas

**Si excedes:**
- Error 429 (Rate Limit Exceeded)
- El sistema automáticamente usará Cloudflare como fallback

### Cloudflare Free Tier

| Límite | Valor |
|--------|-------|
| Neurons/día | 10,000 |
| Costo | **$0** |

**Suficiente para:**
- ~300-500 mensajes/día (depende del modelo)
- Buen complemento a Groq

---

## 🔐 Seguridad

### ⚠️ Nunca Expongas las API Keys

```env
# ✅ CORRECTO - En .env.local
GROQ_API_KEY=gsk_xxx

# ❌ INCORRECTO - En código
const apiKey = "gsk_xxx"; // ¡NO HAGAS ESTO!
```

### Gitignore

Asegúrate que `.env.local` esté en `.gitignore`:

```
.env.local
.env*.local
```

### Variables de Entorno en Vercel

Al deployar en Vercel:

1. Ve a tu proyecto → **"Settings"** → **"Environment Variables"**
2. Agrega:
   ```
   GROQ_API_KEY = gsk_xxx
   CLOUDFLARE_ACCOUNT_ID = xxx
   CLOUDFLARE_API_TOKEN = xxx
   ```
3. Click **"Save"**

---

## 🚨 Troubleshooting

### "No AI providers available"

**Causa**: No hay API keys configuradas

**Solución**:
```env
# Agrega al menos una:
GROQ_API_KEY=gsk_xxx
# O
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
```

### "Rate limit exceeded" (Error 429)

**Causa**: Superaste el límite de Groq (30 req/min)

**Solución**:
1. El sistema automáticamente usa Cloudflare como fallback
2. Si ambos fallan, considera:
   - Reducir el número de mensajes
   - Usar cache para respuestas comunes
   - Implementar rate limiting en tu lado

### "Groq API error: Invalid API key"

**Causa**: API key incorrecta o expirada

**Solución**:
1. Ve a [console.groq.com](https://console.groq.com)
2. Genera una nueva API key
3. Actualiza en `.env.local`

### Respuestas lentas

**Posibles causas:**
1. **Modelo muy grande**: Usa `llama-3.1-8b-instant` en vez de `70b`
2. **Demasiado contexto**: Limita `previousMessages` a 3-5
3. **maxTokens alto**: Reduce a 300-500

**Solución en código:**
```typescript
const result = await aiService.generateResponse(message, {
  maxTokens: 300,  // Respuestas más cortas
  temperature: 0.5,  // Menos creatividad, más rápido
});
```

---

## 📈 Monitoreo

### Ver Mensajes con IA

```sql
SELECT
  m.id,
  m.content as user_message,
  m.metadata->>'ai_response' as ai_response,
  m.metadata->>'ai_provider' as provider,
  m.created_at
FROM messages m
WHERE m.is_bot_response = true
  AND m.metadata->>'ai_provider' IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 50;
```

### Estadísticas de Uso

```sql
SELECT
  m.metadata->>'ai_provider' as provider,
  COUNT(*) as total_responses,
  DATE(m.created_at) as date
FROM messages m
WHERE m.is_bot_response = true
  AND m.metadata->>'ai_provider' IS NOT NULL
GROUP BY provider, DATE(m.created_at)
ORDER BY date DESC;
```

---

## 💡 Mejores Prácticas

### ✅ Hacer:

1. **System prompts específicos**: Personaliza el comportamiento para tu negocio
2. **Contexto relevante**: Incluye historial de conversación (últimos 3-5 mensajes)
3. **Fallback manual**: Ten flows de texto para preguntas muy comunes (FAQ)
4. **Monitorear uso**: Revisa respuestas para ajustar prompts
5. **Temperatura baja para soporte**: `0.5-0.7` para respuestas más consistentes

### ❌ Evitar:

1. ❌ System prompts muy largos (>500 palabras)
2. ❌ Incluir información sensible en prompts
3. ❌ Confiar 100% en IA sin flows de respaldo
4. ❌ maxTokens muy alto (>1000) - costo y lentitud
5. ❌ No revisar las respuestas generadas

---

## 🔮 Casos de Uso

### Caso 1: Atención al Cliente General

**Flow:**
- Trigger: `always` (prioridad baja)
- Response type: `ai`
- System prompt:
```
Eres el asistente de [Empresa].
Ayudas con información general, horarios, precios y productos.
Si no sabes algo, ofrece contactar a un agente humano.
```

### Caso 2: FAQ Inteligente

**Flow:**
- Trigger: keyword `ayuda, info, información`
- Response type: `ai`
- System prompt:
```
Responde preguntas frecuentes sobre [Empresa]:
- Horarios
- Ubicación
- Productos
- Precios
- Envíos

Sé breve y directo.
```

### Caso 3: Soporte Técnico

**Flow:**
- Trigger: keyword `problema, error, no funciona`
- Response type: `ai`
- System prompt:
```
Eres soporte técnico. Ayudas a diagnosticar problemas.
1. Pregunta detalles específicos
2. Da pasos de solución claros
3. Si es complejo, escala a humano
```

---

## 📚 Referencias

- [Groq Documentation](https://console.groq.com/docs)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [LLaMA 3.1 Model Card](https://ai.meta.com/llama/)

---

## 🎉 Conclusión

Con Groq y Cloudflare AI configurados, tu chatbot ahora puede:
- ✅ Generar respuestas inteligentes y naturales
- ✅ Entender contexto de conversación
- ✅ Adaptarse al tono de tu marca
- ✅ Escalar automáticamente con fallback
- ✅ **Todo gratis** en planes free tier

**Próximos pasos:**
- Configura system prompts específicos para tu negocio
- Crea flows de IA para diferentes tipos de consultas
- Monitorea y ajusta según feedback de usuarios

¿Preguntas? Revisa el código fuente en `/src/lib/ai/` 🚀
