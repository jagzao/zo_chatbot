# Guía de Configuración de Facebook Messenger

Esta guía explica cómo integrar Facebook Messenger con tu chatbot usando la Graph API de Meta.

## 📱 ¿Qué es Facebook Messenger Platform?

Facebook Messenger Platform es la **API oficial** de Meta para integrar chatbots con Facebook Messenger.

**Ventajas**:
- ✅ Oficial y confiable
- ✅ Completamente gratuito (sin límites razonables)
- ✅ Soporte completo de Meta
- ✅ Mensajes, botones, quick replies, templates
- ✅ Webhooks en tiempo real
- ✅ Perfiles de usuario accesibles

**Requisitos**:
- Una **Página de Facebook** (fan page)
- Una **App de Facebook** (en developers.facebook.com)
- Verificación de negocio para uso en producción (gratis)

---

## 🚀 Paso 1: Crear Página de Facebook

Si ya tienes una página, salta este paso.

1. Ve a [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. Elige una categoría (Empresa local, Marca, Comunidad, etc.)
3. Completa información básica
4. Publica la página

**Importante**: Guarda el **Page ID**. Lo encontrarás en:
- Configuración de la página → Acerca de → ID de la página

---

## 🛠️ Paso 2: Crear App de Facebook

### 1. Ir a Meta for Developers

Ve a [developers.facebook.com](https://developers.facebook.com) e inicia sesión.

### 2. Crear Nueva App

1. Click en **"Mis Apps"** → **"Crear App"**
2. Selecciona tipo: **"Empresa"** o **"Otro"**
3. Completa el formulario:
   ```
   Nombre: ZO Chatbot (o tu nombre)
   Email: tu-email@ejemplo.com
   Propósito: Chatbot para atención al cliente
   ```
4. Click **"Crear App"**

### 3. Agregar Producto "Messenger"

1. En el dashboard de tu app, busca **"Messenger"**
2. Click **"Configurar"**
3. Messenger ahora está habilitado

---

## 🔑 Paso 3: Generar Page Access Token

El **Page Access Token** permite que tu app envíe mensajes en nombre de tu página.

### Opción A: Token de Prueba (Desarrollo)

1. Ve a **Messenger** → **Configuración**
2. En la sección **"Tokens de acceso"**, selecciona tu página
3. Click **"Generar token"**
4. **Copia el token** (se ve como `EAAxxxxxxxxxxxxx`)

⚠️ **Este token expira en ~60 días**. Úsalo solo para desarrollo.

### Opción B: Token Permanente (Producción)

Para producción, necesitas un token de larga duración:

1. Ve a [developers.facebook.com/tools/accesstoken](https://developers.facebook.com/tools/accesstoken/)
2. Copia tu **User Access Token**
3. Usa esta API para convertirlo a Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_USER_ACCESS_TOKEN"
```

4. Busca tu página en el JSON y copia el `access_token`

Este token **NO expira** (a menos que cambies la contraseña de Facebook).

---

## 🔗 Paso 4: Configurar Webhook

Facebook necesita saber dónde enviar los mensajes entrantes.

### 1. Definir URL de Webhook

Tu webhook URL será:
```
https://tu-app.vercel.app/api/webhook/facebook
```

**En desarrollo local**, usa **ngrok**:
```bash
ngrok http 3000
# Usa la URL ngrok: https://xxxx.ngrok.io/api/webhook/facebook
```

### 2. Definir Verify Token

Elige un **token de verificación** secreto (cualquier string):
```
zo-chatbot-verify-2024
```

Agrégalo a tu `.env.local`:
```env
FACEBOOK_VERIFY_TOKEN=zo-chatbot-verify-2024
```

### 3. Configurar en Facebook

1. Ve a **Messenger** → **Configuración** → **Webhooks**
2. Click **"Agregar URL de devolución de llamada"**
3. Completa:
   ```
   URL de devolución de llamada: https://tu-app.vercel.app/api/webhook/facebook
   Verificar token: zo-chatbot-verify-2024
   ```
4. Click **"Verificar y guardar"**

Facebook enviará una petición GET para verificar:
```
GET /api/webhook/facebook?hub.mode=subscribe&hub.verify_token=zo-chatbot-verify-2024&hub.challenge=123456
```

Tu endpoint debe devolver `hub.challenge` si el token es correcto.

### 4. Suscribirse a Eventos

En la misma sección de **Webhooks**, selecciona:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `messaging_optins`
- ✅ `message_deliveries` (opcional)
- ✅ `message_reads` (opcional)

Click **"Guardar"**.

### 5. Suscribir Página al Webhook

Finalmente, suscribe tu página:

```bash
curl -X POST "https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=TU_PAGE_ACCESS_TOKEN"
```

✅ Si todo está bien, verás: `{ "success": true }`

---

## 🔧 Paso 5: Configurar en tu Aplicación

### 1. Variables de Entorno

En tu `.env.local`:

```env
# Facebook Messenger Configuration
FACEBOOK_APP_SECRET=tu-app-secret-aqui
FACEBOOK_VERIFY_TOKEN=zo-chatbot-verify-2024
```

**¿Dónde encontrar el App Secret?**
- Dashboard de tu app → Configuración → Básica → **Clave secreta de la app**

### 2. Crear Canal en Supabase

```sql
INSERT INTO channels (
  organization_id,
  type,
  name,
  config,
  is_active
) VALUES (
  'your-org-id',
  'facebook',
  'Facebook Messenger',
  '{
    "pageAccessToken": "EAAxxxxxxxxxxxxx",
    "pageId": "123456789"
  }'::jsonb,
  true
) RETURNING *;
```

Guarda el `id` del canal.

---

## 🧪 Paso 6: Probar la Integración

### Test 1: Webhook Verification

```bash
curl "http://localhost:3000/api/webhook/facebook?hub.mode=subscribe&hub.verify_token=zo-chatbot-verify-2024&hub.challenge=test123"
```

**Respuesta esperada**: `test123`

### Test 2: Enviar Mensaje de Prueba

```bash
curl -X POST http://localhost:3000/api/channels/facebook/send-test \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "channelId": "tu-channel-id",
    "recipientId": "USER_PSID",
    "message": "¡Hola desde el chatbot!"
  }'
```

**¿Cómo obtener un PSID de usuario?**
- Envía un mensaje a tu página desde tu cuenta personal de Facebook
- Mira los logs del webhook - el `sender.id` es el PSID

### Test 3: Recibir Mensaje

1. Abre Messenger en tu teléfono o web
2. Envía un mensaje a tu página
3. Facebook enviará webhook a `/api/webhook/facebook`
4. El sistema procesará y responderá automáticamente

---

## 📊 Flujo Completo

```
Usuario → Messenger → Facebook Servers → Webhook
                                            ↓
                              /api/webhook/facebook
                                            ↓
                              processIncomingMessage()
                                            ↓
                              Bot procesa y responde
                                            ↓
                              Enqueue job de envío
                                            ↓
                              Queue Worker ejecuta
                                            ↓
                              sendFacebookMessage()
                                            ↓
                              Graph API → Facebook → Usuario
```

---

## 🔐 Seguridad

### Validar Firma del Webhook

Facebook firma todas las peticiones con `x-hub-signature-256`. **Siempre valida la firma en producción**:

```typescript
const signature = request.headers.get("x-hub-signature-256");
const appSecret = process.env.FACEBOOK_APP_SECRET;

const isValid = FacebookGraphClient.verifyWebhookSignature(
  rawBody,
  signature,
  appSecret
);

if (!isValid) {
  return Response(401);
}
```

### Headers Requeridos

Para asociar mensajes a la organización correcta:
- `X-Organization-ID`: ID de la organización
- `X-Channel-ID`: ID del canal

En producción, consulta la base de datos:
```sql
SELECT organization_id, id
FROM channels
WHERE type = 'facebook'
  AND config->>'pageId' = 'TU_PAGE_ID';
```

---

## 💬 Tipos de Mensajes

### Texto

```typescript
await sendFacebookMessage(
  channel,
  recipientId,
  "¡Hola! ¿En qué puedo ayudarte?",
  "text"
);
```

### Imagen

```typescript
await sendFacebookMessage(
  channel,
  recipientId,
  "Mira esta imagen",
  "image",
  "https://example.com/image.jpg"
);
```

### Video

```typescript
await sendFacebookMessage(
  channel,
  recipientId,
  "Video tutorial",
  "video",
  "https://example.com/video.mp4"
);
```

### Audio

```typescript
await sendFacebookMessage(
  channel,
  recipientId,
  "Escucha esto",
  "audio",
  "https://example.com/audio.mp3"
);
```

### Archivo

```typescript
await sendFacebookMessage(
  channel,
  recipientId,
  "Documento adjunto",
  "file",
  "https://example.com/doc.pdf"
);
```

---

## 🎯 Funciones Avanzadas

### Indicador de Escritura

Muestra "escribiendo..." antes de enviar respuesta:

```typescript
import { sendFacebookTypingIndicator } from "@/lib/integrations/facebook";

await sendFacebookTypingIndicator(channel, recipientId, true);
await delay(2000); // Espera 2 segundos
await sendFacebookMessage(channel, recipientId, "Tu respuesta aquí");
await sendFacebookTypingIndicator(channel, recipientId, false);
```

### Marcar como Leído

```typescript
import { markFacebookMessageAsSeen } from "@/lib/integrations/facebook";

await markFacebookMessageAsSeen(channel, senderId);
```

### Obtener Perfil de Usuario

```typescript
import { getFacebookUserProfile } from "@/lib/integrations/facebook";

const profile = await getFacebookUserProfile(channel, userId);
console.log(profile.first_name, profile.last_name);
```

---

## 🚨 Troubleshooting

### "Invalid OAuth access token"

**Causa**: Token expirado o inválido

**Solución**:
1. Regenera el Page Access Token
2. Actualiza en tu base de datos (tabla `channels`)

### "This message is sent outside allowed window"

**Causa**: Intentas enviar mensaje después de 24h sin respuesta del usuario

**Solución**:
- Solo puedes enviar mensajes dentro de 24h de la última respuesta del usuario
- Para mensajes fuera de esa ventana, necesitas **Message Tags** (requiere revisión de Facebook)

### "Permission denied"

**Causa**: La app no tiene permisos sobre la página

**Solución**:
```bash
curl -X POST "https://graph.facebook.com/v18.0/me/subscribed_apps?access_token=TU_PAGE_ACCESS_TOKEN"
```

### Webhook no recibe eventos

**Causas posibles**:
1. URL no es pública (usa ngrok en desarrollo)
2. Página no está suscrita al webhook
3. Eventos no están seleccionados

**Debug**:
- Ve a **Messenger** → **Configuración** → **Webhooks** → **Probar**
- Facebook enviará un evento de prueba

---

## 📈 Monitoreo

### Ver Conversaciones de Facebook

```sql
SELECT
  c.id,
  c.external_id as psid,
  c.contact_name,
  c.status,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.channel_id = 'your-facebook-channel-id'
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
  c.external_id as psid
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel_id = 'your-facebook-channel-id'
ORDER BY m.created_at DESC
LIMIT 50;
```

---

## 🎨 Limitaciones del Plan Gratuito

| Límite | Valor | Suficiente para |
|--------|-------|-----------------|
| Mensajes/día | Sin límite | ∞ |
| API calls/hora | 200 | ~10K mensajes/mes |
| Páginas por app | 200 | Multi-tenant |

**Nota**: Los límites son muy generosos para chatbots pequeños/medianos.

---

## 🔮 Próximos Pasos (Avanzado)

1. **Botones y Quick Replies**: Mensajes interactivos
2. **Templates**: Mensajes estructurados (receipts, carousels)
3. **Persistent Menu**: Menú permanente en el chat
4. **Get Started Button**: Botón de inicio para nuevos usuarios
5. **Handover Protocol**: Transferir a humano

---

## 📚 Referencias

- [Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Webhooks Reference](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Send API Reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api)

---

## ⚠️ Notas Importantes

### Verificación de Negocio

Para producción a gran escala, Facebook puede requerir **Verificación de Negocio**:
- Necesario si usas funciones avanzadas
- Gratis pero toma 1-3 días
- Requiere documentos de la empresa

### Revisión de la App

Si quieres funciones avanzadas (message tags, sponsored messages), necesitas que Facebook **revise tu app**:
1. Completa App Review en developers.facebook.com
2. Proporciona demo en video
3. Espera 1-2 semanas

Para chatbot básico **NO necesitas revisión**.

---

¿Preguntas? Revisa el código fuente en `/src/lib/integrations/facebook/` 🚀
