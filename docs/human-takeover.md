# Guía de Human Takeover (Transferencia a Agente Humano)

Esta guía explica cómo funciona el sistema de **Human Takeover**, que permite que agentes humanos tomen control de conversaciones y desactiven las respuestas automáticas del bot.

## 🎯 ¿Qué es Human Takeover?

**Human Takeover** (también llamado "handoff" o "transferencia a humano") es cuando un agente humano **toma control** de una conversación con un usuario.

**Cuando está activo:**
- ❌ El bot **NO responde automáticamente**
- ✅ Solo el agente humano puede enviar mensajes
- ✅ El agente ve todos los mensajes del usuario en tiempo real
- ✅ El usuario recibe respuestas personalizadas del humano

**Cuando está inactivo:**
- ✅ El bot responde automáticamente (IA, flows, etc.)
- ✅ Sin intervención humana necesaria

---

## 🚀 Casos de Uso

### ✅ Cuándo Usar Human Takeover

1. **Consultas complejas**
   - Usuario: "Necesito hacer un pedido personalizado con varios productos"
   - → Agente toma control y maneja todo el proceso

2. **Problemas técnicos**
   - Usuario: "Mi pedido no llegó y dice que fue entregado"
   - → Agente investiga y resuelve el problema

3. **Ventas complejas**
   - Usuario: "Quiero comprar 100 unidades para mi empresa"
   - → Agente negocia precio, términos, envío

4. **Usuario solicita hablar con humano**
   - Usuario: "Quiero hablar con una persona real"
   - → Agente toma control

5. **Bot no puede ayudar**
   - Bot ha intentado responder pero el usuario sigue confundido
   - → Agente interviene

### ❌ Cuándo NO Usar Human Takeover

1. ❌ Preguntas simples que el bot puede responder (horarios, precios, FAQ)
2. ❌ Mensajes de bienvenida iniciales
3. ❌ Conversaciones que solo requieren respuestas automatizadas

---

## 📊 Flujo Completo

```
Usuario envía mensaje
        ↓
Bot recibe mensaje
        ↓
¿Hay Human Takeover activo?
    ├─ SÍ → Bot NO responde
    │         ↓
    │    Agente ve mensaje en dashboard
    │         ↓
    │    Agente responde manualmente
    │         ↓
    │    Usuario recibe respuesta del agente
    │
    └─ NO → Bot responde automáticamente (IA/flows)
             ↓
        Usuario recibe respuesta del bot
```

---

## 🔧 API Endpoints

### 1. Tomar Control de una Conversación

```bash
POST /api/conversations/{conversation_id}/takeover
```

**Headers:**
```
Authorization: Bearer {supabase_token}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Conversation taken over successfully",
  "conversation_id": "uuid",
  "assigned_agent_id": "uuid"
}
```

**Respuesta si ya está asignada:**
```json
{
  "error": "Conversation already assigned to another agent",
  "assigned_to": "agent@example.com"
}
```

### 2. Liberar una Conversación

```bash
DELETE /api/conversations/{conversation_id}/takeover
```

**Headers:**
```
Authorization: Bearer {supabase_token}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Conversation released successfully. Bot will resume responding.",
  "conversation_id": "uuid"
}
```

### 3. Ver Estado de Takeover

```bash
GET /api/conversations/{conversation_id}/takeover
```

**Respuesta:**
```json
{
  "success": true,
  "conversation_id": "uuid",
  "is_human_takeover": true,
  "assigned_agent": {
    "id": "uuid",
    "email": "agent@example.com"
  },
  "takeover_at": "2024-01-15T10:30:00Z",
  "last_agent_response_at": "2024-01-15T10:45:00Z"
}
```

### 4. Enviar Respuesta como Agente

```bash
POST /api/conversations/{conversation_id}/reply
```

**Body:**
```json
{
  "content": "Hola, soy María y te voy a ayudar personalmente",
  "messageType": "text"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "message_id": "uuid",
  "conversation_id": "uuid"
}
```

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Agente Toma Control

```bash
# 1. Ver conversaciones activas
curl http://localhost:3000/api/conversations \
  -H "Authorization: Bearer ${TOKEN}"

# 2. Tomar control de una conversación
curl -X POST http://localhost:3000/api/conversations/conv-123/takeover \
  -H "Authorization: Bearer ${TOKEN}"

# 3. Enviar respuesta
curl -X POST http://localhost:3000/api/conversations/conv-123/reply \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hola, soy un agente humano. ¿En qué puedo ayudarte?"
  }'
```

### Ejemplo 2: Agente Libera Conversación

```bash
# Liberar conversación (bot vuelve a responder automáticamente)
curl -X DELETE http://localhost:3000/api/conversations/conv-123/takeover \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 🗄️ Estructura de Base de Datos

### Campos Agregados a `conversations`

```sql
-- Campo principal: indica si hay takeover activo
is_human_takeover BOOLEAN DEFAULT false

-- ID del agente asignado
assigned_agent_id UUID REFERENCES users(id)

-- Timestamp de cuándo se tomó control
takeover_at TIMESTAMPTZ

-- Último mensaje del agente (para auto-release por inactividad)
last_agent_response_at TIMESTAMPTZ
```

### Consulta: Ver Conversaciones con Takeover Activo

```sql
SELECT
  c.id,
  c.external_id,
  c.contact_name,
  c.is_human_takeover,
  c.assigned_agent_id,
  u.email as agent_email,
  c.takeover_at,
  c.last_agent_response_at,
  COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN users u ON u.id = c.assigned_agent_id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.is_human_takeover = true
GROUP BY c.id, u.email
ORDER BY c.takeover_at DESC;
```

### Consulta: Conversaciones Asignadas a un Agente

```sql
SELECT
  c.id,
  c.contact_name,
  c.status,
  c.channel_id,
  ch.name as channel_name,
  c.takeover_at,
  c.last_agent_response_at
FROM conversations c
JOIN channels ch ON ch.id = c.channel_id
WHERE c.assigned_agent_id = 'agent-user-id'
  AND c.is_human_takeover = true
ORDER BY c.last_agent_response_at DESC;
```

---

## 🔐 Permisos y Seguridad

### Quién Puede Tomar Control

✅ **Cualquier miembro de la organización** puede tomar control de una conversación
- Owner
- Admin
- Member (agente)

### Quién Puede Liberar

✅ **El agente asignado** puede liberar su propia conversación
✅ **Admins y Owners** pueden liberar cualquier conversación

❌ **Otros agentes** NO pueden liberar conversaciones de otros

### Prevención de Conflictos

Si un agente intenta tomar control de una conversación ya asignada:
```json
{
  "error": "Conversation already assigned to another agent",
  "assigned_to": "other.agent@example.com"
}
```

El agente debe esperar a que el otro libere la conversación, o un admin puede forzar la liberación.

---

## ⚙️ Configuración Avanzada

### Auto-Release por Inactividad (TODO)

Puedes implementar un cron job que libere automáticamente conversaciones si el agente no responde en X tiempo:

```sql
-- Liberar conversaciones sin actividad del agente en 2 horas
UPDATE conversations
SET
  is_human_takeover = false,
  assigned_agent_id = NULL
WHERE is_human_takeover = true
  AND last_agent_response_at < NOW() - INTERVAL '2 hours';
```

### Notificar a Agentes de Nuevos Mensajes

Cuando un usuario envía un mensaje en una conversación con takeover:

```typescript
// En el webhook handler, después de guardar el mensaje:
if (conversation.is_human_takeover) {
  // Enviar notificación al agente asignado
  await notifyAgent(conversation.assigned_agent_id, {
    conversation_id: conversation.id,
    contact_name: conversation.contact_name,
    message: incomingMessage.content,
  });
}
```

### Bot Flow para Solicitar Humano

Puedes crear un bot flow que detecte cuando el usuario pide hablar con humano:

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
  'Solicitar Agente Humano',
  'keyword',
  'hablar con persona, agente humano, quiero hablar con alguien, necesito ayuda real',
  'text',
  'Entiendo que necesitas hablar con un agente. Voy a transferirte con uno de nuestro equipo. Por favor espera un momento.',
  100,  -- Alta prioridad
  true
);
```

Luego, en el dashboard, los agentes ven esta solicitud y toman control.

---

## 🎨 Integración con Dashboard (Próxima Fase)

En la Fase 10 (Dashboard), implementaremos:

### Panel de Conversaciones Activas
```
┌─────────────────────────────────────────┐
│ Conversaciones con Humanos (3)         │
├─────────────────────────────────────────┤
│ 👤 María García                  [Bot]  │
│ 📱 WhatsApp                             │
│ 🕐 Hace 5 minutos                       │
│ "Necesito ayuda con mi pedido"         │
│ [Tomar Control]                         │
├─────────────────────────────────────────┤
│ 👤 Juan Pérez                   [TÚ]   │
│ 📘 Facebook                             │
│ 🕐 Activo ahora                         │
│ "¿Cuándo llega mi envío?"              │
│ [Ver Chat] [Liberar]                   │
└─────────────────────────────────────────┘
```

### Vista de Chat con Takeover
```
┌─────────────────────────────────────────┐
│ 👤 María García - WhatsApp              │
│ Estado: [Bot Activo] [Tomar Control]   │
├─────────────────────────────────────────┤
│ María: Hola, necesito ayuda             │
│ Bot: ¡Hola María! ¿En qué te ayudo?    │
│ María: Es sobre mi pedido #1234         │
│                                         │
│ [Tomar Control y Responder]            │
└─────────────────────────────────────────┘
```

Después de tomar control:
```
┌─────────────────────────────────────────┐
│ 👤 María García - WhatsApp              │
│ Estado: [Tú tienes el control] ✅       │
├─────────────────────────────────────────┤
│ María: Hola, necesito ayuda             │
│ Bot: ¡Hola María! ¿En qué te ayudo?    │
│ María: Es sobre mi pedido #1234         │
│                                         │
│ 💬 [Escribe tu mensaje aquí...]        │
│ [Enviar] [Liberar Conversación]        │
└─────────────────────────────────────────┘
```

---

## 📈 Estadísticas y Métricas

### Consultas Útiles

**Conversaciones manejadas por humanos hoy:**
```sql
SELECT COUNT(*)
FROM conversations
WHERE takeover_at >= CURRENT_DATE
  AND organization_id = 'your-org-id';
```

**Promedio de tiempo de respuesta de agentes:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (m.created_at - prev_message.created_at))) / 60 as avg_minutes
FROM messages m
JOIN messages prev_message ON prev_message.conversation_id = m.conversation_id
WHERE m.direction = 'outbound'
  AND m.is_bot_response = false
  AND m.created_at > prev_message.created_at
  AND m.created_at >= CURRENT_DATE;
```

**Top agentes por conversaciones manejadas:**
```sql
SELECT
  u.email,
  COUNT(DISTINCT c.id) as conversations_handled
FROM conversations c
JOIN users u ON u.id = c.assigned_agent_id
WHERE c.takeover_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.email
ORDER BY conversations_handled DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Bot Sigue Respondiendo Después de Takeover

**Causa**: El campo `is_human_takeover` no se actualizó correctamente

**Solución**:
```sql
-- Verificar estado de la conversación
SELECT id, is_human_takeover, assigned_agent_id
FROM conversations
WHERE id = 'conversation-id';

-- Si está mal, corregir manualmente
UPDATE conversations
SET is_human_takeover = true,
    assigned_agent_id = 'agent-id'
WHERE id = 'conversation-id';
```

### Conversación No Se Libera

**Causa**: Posible error en el endpoint DELETE

**Solución manual**:
```sql
UPDATE conversations
SET is_human_takeover = false,
    assigned_agent_id = NULL
WHERE id = 'conversation-id';
```

### Agente No Puede Enviar Mensajes

**Causa**: Permisos incorrectos o canal no configurado

**Verificar**:
1. ¿El agente es miembro de la organización?
2. ¿El canal está activo y configurado?
3. ¿El external_id es correcto?

---

## 💡 Mejores Prácticas

### ✅ Hacer:

1. **Identificarse como humano**
   ```
   "Hola, soy María del equipo de soporte. Te voy a ayudar personalmente."
   ```

2. **Liberar conversaciones cuando termines**
   - No dejes conversaciones asignadas indefinidamente
   - El bot puede ayudar cuando no estás disponible

3. **Usar takeover para casos complejos**
   - Problemas técnicos
   - Ventas grandes
   - Usuarios frustrados

4. **Responder rápido**
   - Usuario esperando respuesta de humano
   - No los hagas esperar más de 2-3 minutos

### ❌ Evitar:

1. ❌ Tomar control de todas las conversaciones
2. ❌ Dejar conversaciones asignadas sin responder
3. ❌ Competir con otros agentes por la misma conversación
4. ❌ Usar takeover para preguntas simples que el bot puede resolver

---

## 🔮 Futuras Mejoras

- [ ] Auto-release por inactividad (configurable)
- [ ] Notificaciones push para agentes
- [ ] Cola de conversaciones pendientes
- [ ] Asignación automática round-robin
- [ ] Analytics de performance de agentes
- [ ] Templates de respuestas rápidas
- [ ] Notas internas entre agentes
- [ ] Historial de transferencias

---

## 📚 Referencias

- [Message Processor](../src/lib/messages/processor.ts) - Lógica de verificación de takeover
- [Takeover API](../src/app/api/conversations/[id]/takeover/route.ts) - Endpoints de takeover
- [Reply API](../src/app/api/conversations/[id]/reply/route.ts) - Envío de mensajes de agentes

---

¿Preguntas? Revisa el código fuente en `/src/app/api/conversations/` 🚀
