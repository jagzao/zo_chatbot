# Guía de Configuración de WhatsApp con Evolution API

Esta guía explica cómo configurar WhatsApp usando Evolution API para tu chatbot.

## 📱 ¿Qué es Evolution API?

Evolution API es una solución **gratuita y self-hosted** para integrar WhatsApp en tu aplicación. Es una alternativa NO oficial a WhatsApp Business API.

**Ventajas**:
- ✅ Completamente gratuito
- ✅ Multi-dispositivo (WhatsApp Web)
- ✅ Webhooks nativos
- ✅ Soporta media (imágenes, videos, documentos)
- ✅ API RESTful completa
- ✅ Activamente mantenido

**Desventajas**:
- ⚠️ NO es oficial (puede haber riesgo de ban)
- ⚠️ Requiere servidor 24/7
- ⚠️ Menos confiable que la API oficial

## 🚀 Paso 1: Deploy de Evolution API

### Opción A: Railway (Recomendado)

Railway ofrece $5 de crédito gratuito mensual, suficiente para Evolution API.

1. **Crear cuenta en Railway**: [railway.app](https://railway.app)

2. **Deploy Evolution API**:
   ```bash
   # Click en "New Project" > "Deploy from GitHub repo"
   # O usa el template directo:
   https://railway.app/template/evolution-api
   ```

3. **Configurar variables de entorno**:
   ```env
   AUTHENTICATION_API_KEY=tu-api-key-secreta
   ```

4. **Obtener URL**:
   - Railway generará una URL como: `https://tu-proyecto.up.railway.app`
   - Guarda esta URL, la necesitarás

### Opción B: Render.com

1. Ve a [render.com](https://render.com)
2. Create nuevo "Web Service"
3. Conecta el repositorio de Evolution API
4. Deploy (⚠️ se duerme después de 15min inactividad en free tier)

### Opción C: Docker local (desarrollo)

```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key \
  atendai/evolution-api:latest
```

---

## 🔧 Paso 2: Configurar en tu Aplicación

### 1. Agregar variables de entorno

En tu `.env.local`:

```env
# Evolution API Configuration
EVOLUTION_API_URL=https://tu-proyecto.up.railway.app
EVOLUTION_API_KEY=tu-api-key-secreta
```

### 2. Crear canal de WhatsApp en Supabase

```sql
INSERT INTO channels (
  organization_id,
  type,
  name,
  config,
  is_active
) VALUES (
  'your-org-id',
  'whatsapp',
  'WhatsApp Principal',
  '{"instanceName": "default"}'::jsonb,
  true
) RETURNING *;
```

Guarda el `id` del canal creado.

---

## 📲 Paso 3: Conectar WhatsApp

### Método 1: Usando la API

```bash
# 1. Crear instancia
curl -X POST https://tu-evolution-api.railway.app/instance/create/default \
  -H "apikey: tu-api-key" \
  -H "Content-Type: application/json"

# 2. Obtener QR Code
curl https://tu-evolution-api.railway.app/instance/qrcode/default \
  -H "apikey: tu-api-key"

# Devuelve: {"code": "...", "base64": "data:image/png;base64,..."}
```

### Método 2: Panel Web (próximamente)

Implementaremos una interfaz en el dashboard para:
- Ver QR code
- Conectar/desconectar
- Ver estado de conexión

### 3. Escanear QR Code

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** > **Dispositivos vinculados**
3. Toca **Vincular un dispositivo**
4. Escanea el QR code mostrado
5. ¡Listo! WhatsApp está conectado

---

## 🔗 Paso 4: Configurar Webhook

Evolution API necesita saber dónde enviar los mensajes entrantes.

```bash
curl -X POST https://tu-evolution-api.railway.app/webhook/set/default \
  -H "apikey: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-app.vercel.app/api/webhook/whatsapp",
    "webhook_by_events": true,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE"
    ]
  }'
```

**Importante**:
- En desarrollo local, usa **ngrok** para exponer tu puerto:
  ```bash
  ngrok http 3000
  # Usa la URL ngrok como webhook
  ```

---

## 🧪 Paso 5: Probar la Integración

### Test 1: Verificar Conexión

```bash
curl https://localhost:3000/api/channels/whatsapp/status?channelId=tu-channel-id \
  -H "Cookie: sb-access-token=..."
```

**Respuesta esperada**:
```json
{
  "connected": true,
  "state": "open"
}
```

### Test 2: Enviar Mensaje de Prueba

```bash
curl -X POST https://localhost:3000/api/channels/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{
    "channelId": "tu-channel-id",
    "phoneNumber": "+5511999999999",
    "message": "Hola, este es un mensaje de prueba!"
  }'
```

### Test 3: Recibir Mensaje

1. Envía un mensaje de WhatsApp al número conectado
2. Evolution API enviará webhook a `/api/webhook/whatsapp`
3. El sistema procesará automáticamente:
   - Crea/actualiza conversación
   - Guarda mensaje
   - Procesa bot flows
   - Responde si hay match

---

## 📊 Flujo Completo

```
Usuario → WhatsApp → Evolution API → Webhook
                                        ↓
                            /api/webhook/whatsapp
                                        ↓
                            processIncomingMessage()
                                        ↓
                              Bot procesa y responde
                                        ↓
                              Enqueue job de envío
                                        ↓
                            Queue Worker ejecuta
                                        ↓
                            sendWhatsAppMessage()
                                        ↓
                            Evolution API → WhatsApp → Usuario
```

---

## 🔐 Seguridad

### Validar Webhook

En producción, siempre valida que el webhook venga de Evolution API:

```typescript
const apiKey = request.headers.get("apikey");
if (apiKey !== process.env.EVOLUTION_API_KEY) {
  return Response(401);
}
```

### Headers Requeridos

Para asociar mensajes a la organización correcta:
- `X-Organization-ID`: ID de la organización
- `X-Channel-ID`: ID del canal

---

## 📱 Tipos de Mensajes Soportados

### Texto

```typescript
await sendWhatsAppMessage(
  channel,
  "+5511999999999",
  "Hola mundo!",
  "text"
);
```

### Imagen

```typescript
await sendWhatsAppMessage(
  channel,
  "+5511999999999",
  "Mira esta imagen",
  "image",
  "https://example.com/image.jpg"
);
```

### Video

```typescript
await sendWhatsAppMessage(
  channel,
  "+5511999999999",
  "Video tutorial",
  "video",
  "https://example.com/video.mp4"
);
```

### Documento

```typescript
await sendWhatsAppMessage(
  channel,
  "+5511999999999",
  "Adjunto PDF",
  "file", // Se convierte a 'document' internamente
  "https://example.com/doc.pdf"
);
```

---

## 🔄 Manejo de Desconexión

Si WhatsApp se desconecta:

1. **Detectar desconexión**:
   - Evolution API envía evento `connection.update`
   - Estado cambia a `close`

2. **Reconectar**:
   ```bash
   curl -X PUT https://tu-evolution-api.railway.app/instance/restart/default \
     -H "apikey: tu-api-key"
   ```

3. **Obtener nuevo QR** (si es necesario):
   ```bash
   curl https://tu-evolution-api.railway.app/instance/qrcode/default \
     -H "apikey: tu-api-key"
   ```

---

## 🚨 Troubleshooting

### "Instance not found"

**Solución**: Crear instancia primero
```bash
curl -X POST https://tu-evolution-api.railway.app/instance/create/default \
  -H "apikey: tu-api-key"
```

### "QR Code expired"

**Solución**: QR codes expiran en ~30 segundos. Obtén uno nuevo.

### "Message not delivered"

**Causas posibles**:
- Número de teléfono mal formateado (debe incluir código de país sin +)
- WhatsApp desconectado
- Número bloqueado

**Debug**:
```bash
# Ver logs de Evolution API
railway logs -f

# Verificar estado
curl https://tu-evolution-api.railway.app/instance/connectionState/default \
  -H "apikey: tu-api-key"
```

### "Webhook not receiving"

**Solución**:
1. Verifica que la URL del webhook sea accesible públicamente
2. En desarrollo, usa ngrok
3. Verifica que el webhook esté configurado:
   ```bash
   curl https://tu-evolution-api.railway.app/webhook/find/default \
     -H "apikey: tu-api-key"
   ```

---

## 📈 Monitoreo

### Ver Conversaciones Activas

```sql
SELECT
  c.id,
  c.external_id as phone,
  c.contact_name,
  c.status,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.channel_id = 'your-channel-id'
GROUP BY c.id
ORDER BY last_message DESC;
```

### Ver Mensajes Recientes

```sql
SELECT
  m.content,
  m.direction,
  m.is_bot_response,
  m.created_at,
  c.external_id as phone
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel_id = 'your-channel-id'
ORDER BY m.created_at DESC
LIMIT 50;
```

---

## ⚡ Optimizaciones

### 1. Caché de Estado de Conexión

En lugar de consultar Evolution API cada vez:

```typescript
// Cachear estado por 5 minutos
const cacheKey = `whatsapp:status:${instanceName}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const status = await client.getConnectionStatus();
await redis.setex(cacheKey, 300, JSON.stringify(status));
return status;
```

### 2. Batch de Mensajes

Para enviar múltiples mensajes:

```typescript
// Encolar todos juntos con delay
for (const msg of messages) {
  await enqueueJob({
    organizationId,
    payload: { action: "send_message", ...msg },
    scheduledFor: new Date(Date.now() + index * 2000), // 2s entre cada uno
  });
}
```

---

## 🔮 Próximos Pasos

1. **Dashboard UI**: Interfaz para conectar/desconectar WhatsApp
2. **Multi-instancia**: Soporte para múltiples números
3. **Mensajes de plantilla**: Templates pre-aprobados
4. **Botones y listas**: Mensajes interactivos
5. **Estado de lectura**: Saber cuándo leen mensajes

---

## 📚 Referencias

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Evolution API GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Railway Docs](https://docs.railway.app/)

---

## ⚠️ Advertencia Legal

Evolution API **NO es una solución oficial** de WhatsApp/Meta. Usar soluciones no oficiales puede resultar en:
- Suspensión de tu número de WhatsApp
- Ban temporal o permanente
- Violación de términos de servicio de WhatsApp

**Recomendaciones**:
- Úsalo solo con números de prueba
- No uses para SPAM
- Respeta los límites de mensajes
- Para uso comercial serio, considera WhatsApp Business API oficial

---

¿Preguntas? Revisa el código fuente en `/src/lib/integrations/whatsapp/` 🚀
