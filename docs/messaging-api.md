# API Core de Mensajería

Este documento explica el funcionamiento del sistema de mensajería del chatbot.

## 🏗️ Arquitectura del Sistema de Mensajes

```
┌──────────────┐
│   Webhook    │ → Recibe mensaje de canal externo
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ processIncomingMessage│
└──────┬───────────────┘
       │
       ├─→ 1. getOrCreateConversation()
       ├─→ 2. createMessage() (inbound)
       ├─→ 3. getRecentMessages() (contexto)
       ├─→ 4. processBotFlows() (generar respuesta)
       └─→ 5. enqueueJob() (enviar respuesta)
```

---

## 📋 Flujo de Procesamiento de Mensajes

### 1. **Recepción de Mensaje**

Endpoint: `POST /api/webhook/receive`

```json
{
  "channelId": "uuid",
  "organizationId": "uuid",
  "externalId": "+1234567890",
  "content": "Hola, quiero información",
  "messageType": "text",
  "metadata": {},
  "contactName": "Juan Pérez",
  "timestamp": "2024-11-12T10:00:00Z"
}
```

### 2. **Crear o Obtener Conversación**

```typescript
const conversation = await getOrCreateConversation({
  organizationId: message.organizationId,
  channelId: message.channelId,
  externalId: message.externalId, // Phone, IG user ID, etc.
  contactName: message.contactName,
});
```

**Lógica**:
- Busca conversación existente por `(channel_id, external_id)`
- Si existe, actualiza `updated_at`
- Si no existe, crea nueva con `status='open'`

### 3. **Guardar Mensaje Entrante**

```typescript
const savedMessage = await createMessage({
  conversationId: conversation.id,
  content: message.content,
  messageType: "text",
  direction: "inbound",
  metadata: message.metadata,
});
```

### 4. **Procesar con Bot Flows**

```typescript
const botResponse = await processBotFlows({
  organizationId: message.organizationId,
  conversationId: conversation.id,
  message: savedMessage,
  history: recentMessages,
});
```

**Bot Flows** evalúan triggers en orden de prioridad:
- **keyword**: Coincide si el mensaje contiene palabras clave
- **regex**: Coincide con patrón regex
- **always**: Siempre coincide (ej: bienvenida)
- **fallback**: Si ninguno otro coincide

### 5. **Generar Respuesta**

Según `response_type` del flow:

- **text**: Respuesta de texto fijo
- **template**: Texto con variables (`{contact_name}`, `{date}`, etc.)
- **ai**: Generado por IA (Fase 9)

### 6. **Encolar para Envío**

```typescript
await enqueueJob({
  organizationId: message.organizationId,
  payload: {
    action: "send_message",
    conversationId: conversation.id,
    channelId: message.channelId,
    externalId: message.externalId,
    content: botResponse.response,
  },
});
```

---

## 🔌 API Endpoints

### POST /api/webhook/receive

Recibe mensajes de cualquier canal.

**Request**:
```json
{
  "channelId": "uuid",
  "organizationId": "uuid",
  "externalId": "sender_id",
  "content": "mensaje",
  "messageType": "text"
}
```

**Response**:
```json
{
  "success": true,
  "conversationId": "uuid",
  "messageId": "uuid",
  "responded": true,
  "response": "Respuesta del bot"
}
```

---

### POST /api/messages/send

Envía un mensaje manualmente (desde agente).

**Request**:
```json
{
  "conversationId": "uuid",
  "content": "Respuesta del agente",
  "messageType": "text"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "uuid"
}
```

**Auth**: Requiere usuario autenticado

---

### GET /api/messages

Obtiene mensajes de una conversación.

**Query Params**:
- `conversationId` (required)
- `limit` (default: 50)
- `offset` (default: 0)

**Response**:
```json
{
  "messages": [...],
  "count": 25,
  "hasMore": false
}
```

---

### GET /api/conversations

Obtiene conversaciones activas.

**Query Params**:
- `organizationId` (required)
- `limit` (default: 50)

**Response**:
```json
{
  "conversations": [...],
  "count": 10
}
```

---

## 🤖 Sistema de Bot Flows

Los Bot Flows definen cómo responde automáticamente el chatbot.

### Estructura de un Flow

```typescript
{
  id: "uuid",
  organization_id: "uuid",
  name: "Welcome Message",
  trigger_type: "keyword",
  trigger_value: "hola,hi,hello",
  response_type: "text",
  response_content: "¡Hola! ¿En qué puedo ayudarte?",
  priority: 100,
  is_active: true
}
```

### Tipos de Triggers

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `keyword` | Coincide si contiene palabra | `"hola,hello"` |
| `regex` | Patrón regex | `"^ayuda.*"` |
| `always` | Siempre coincide | `null` |
| `fallback` | Si ninguno otro | `null` |

### Tipos de Respuesta

| Tipo | Descripción |
|------|-------------|
| `text` | Texto fijo |
| `template` | Texto con variables |
| `ai` | Generado por IA (Fase 9) |

### Variables en Templates

- `{contact_name}`: Nombre del contacto
- `{date}`: Fecha actual
- `{time}`: Hora actual

**Ejemplo**:
```
"Hola {contact_name}, hoy es {date} y son las {time}"
```

---

## 📦 Sistema de Cola (Queue)

Gestiona el envío asíncrono de mensajes y tareas.

### Agregar Job a la Cola

```typescript
await enqueueJob({
  organizationId: "uuid",
  payload: {
    action: "send_message",
    content: "Hola",
    // ... otros datos
  },
  maxRetries: 3,
  scheduledFor: new Date(), // opcional
});
```

### Procesamiento de Jobs

Jobs pendientes se procesan automáticamente:

1. **getPendingJobs()** - Obtiene jobs listos
2. **markJobAsProcessing()** - Marca como en proceso
3. **Ejecutar acción** - Enviar mensaje, etc.
4. **markJobAsCompleted()** - Marca como completado

### Manejo de Errores

Si un job falla:
- Se reintenta hasta `max_retries` veces
- Con **backoff exponencial**: 2min, 4min, 8min...
- Si agota reintentos, se marca como `failed`

```typescript
// Si falla
await markJobAsFailed(jobId, "Error message");

// Automáticamente:
// - Reintento 1: en 2 minutos
// - Reintento 2: en 4 minutos
// - Reintento 3: en 8 minutos
// - Después: failed permanentemente
```

### Limpieza de Jobs

```typescript
// Eliminar jobs completados/fallados mayores a 7 días
await cleanupOldJobs(7);
```

---

## 💾 Funciones de Base de Datos

### Conversaciones

```typescript
// Crear o obtener conversación
const conversation = await getOrCreateConversation({
  organizationId: "uuid",
  channelId: "uuid",
  externalId: "+123456789",
  contactName: "Juan",
});

// Obtener conversaciones activas
const conversations = await getActiveConversations("orgId", 50);

// Actualizar estado
await updateConversationStatus("convId", "closed");

// Asignar a agente
await assignConversation("convId", "userId");
```

### Mensajes

```typescript
// Crear mensaje
const message = await createMessage({
  conversationId: "uuid",
  content: "Hola",
  messageType: "text",
  direction: "inbound", // o "outbound"
  sentBy: "userId", // opcional
  isBotResponse: false,
});

// Obtener mensajes con paginación
const messages = await getConversationMessages("convId", 50, 0);

// Obtener contexto reciente (para IA)
const recent = await getRecentMessages("convId", 10);
```

### Canales

```typescript
// Obtener canal
const channel = await getChannel("channelId");

// Obtener canales de organización
const channels = await getOrganizationChannels("orgId");
```

---

## 🔐 Seguridad

### Autenticación de Webhooks

Cada canal debe validar la firma del webhook:

```typescript
// Implementación específica por canal
const isValid = validateWebhookSignature(
  channelType,
  signature,
  payload,
  secret
);

if (!isValid) {
  return Response(401);
}
```

### RLS (Row Level Security)

Todas las operaciones están protegidas por RLS:
- Los usuarios solo ven conversaciones de sus organizaciones
- Los mensajes están filtrados automáticamente
- Canales están aislados por organización

---

## 📊 Métricas y Monitoreo

### Logs Estructurados

Todos los errores se loguean con contexto:

```typescript
console.error("Error processing message:", {
  conversationId,
  messageId,
  error: error.message,
  organizationId,
});
```

### Jobs Fallidos

Obtener jobs fallidos para debugging:

```typescript
const failedJobs = await getFailedJobs(50);

// Cada job tiene:
// - error: mensaje de error
// - retry_count: intentos realizados
// - payload: datos del job
```

---

## 🧪 Testing

### Test de Webhook

```bash
curl -X POST http://localhost:3000/api/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "your-channel-id",
    "organizationId": "your-org-id",
    "externalId": "+1234567890",
    "content": "Hola",
    "messageType": "text"
  }'
```

### Test de Bot Flow

```bash
# Crear bot flow en Supabase
INSERT INTO bot_flows (
  organization_id,
  name,
  trigger_type,
  trigger_value,
  response_type,
  response_content,
  priority
) VALUES (
  'your-org-id',
  'Test Flow',
  'keyword',
  'test',
  'text',
  'Este es un mensaje de prueba',
  100
);

# Enviar mensaje con "test"
curl -X POST http://localhost:3000/api/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{"content": "test", ...}'
```

---

## 🔄 Próximos Pasos

**Fase 5**: Integración de WhatsApp con Evolution API
- Webhook de WhatsApp → `/api/webhook/whatsapp`
- Envío de mensajes vía Evolution API
- Manejo de media (imágenes, videos)

**Fase 9**: Integración de IA
- Reemplazar response `"ai"` con LLM real
- Contexto de conversación
- Intent classification

---

## 📚 Código Fuente

- **Messages**: `/src/lib/messages/`
- **Queue**: `/src/lib/queue/`
- **Bot Processor**: `/src/lib/bot/processor.ts`
- **API Routes**: `/src/app/api/webhook/`, `/src/app/api/messages/`

---

## 🆘 Troubleshooting

### "Conversation not found"
- Verifica que el `channelId` sea válido
- Verifica que el usuario tenga acceso a la organización

### "Queue job keeps failing"
- Revisa logs con `getFailedJobs()`
- Verifica payload del job
- Comprueba que el canal esté activo

### "Bot no responde"
- Verifica que haya bot_flows activos
- Comprueba que el trigger coincida
- Revisa priority de los flows

---

¿Preguntas? Consulta el código o abre un issue! 🚀
