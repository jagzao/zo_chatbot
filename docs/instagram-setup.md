# Guía de Configuración de Instagram Direct

Esta guía explica cómo integrar Instagram Direct Messages con tu chatbot usando la Graph API de Meta.

## 📱 ¿Qué es Instagram Messaging API?

Instagram Messaging API es la **API oficial** de Meta para integrar chatbots con Instagram Direct Messages.

**Ventajas**:
- ✅ Oficial y confiable
- ✅ Completamente gratuito
- ✅ Integrado con Facebook Graph API
- ✅ Soporte de media y mensajes interactivos
- ✅ Webhooks en tiempo real

**Requisitos**:
- Una **cuenta de Instagram** convertida a **Instagram Business Account**
- Una **Página de Facebook** vinculada
- Una **App de Facebook** (en developers.facebook.com)
- **Puede requerir** verificación de negocio (gratis)

---

## 🚀 Paso 1: Convertir a Instagram Business Account

### 1. Tener una Página de Facebook

Instagram Business requiere estar vinculado a una Página de Facebook.

1. Si no tienes una, ve a [facebook.com/pages/create](https://www.facebook.com/pages/create)
2. Crea tu página de negocio

### 2. Convertir Instagram a Business

1. Abre Instagram en tu teléfono
2. Ve a **Configuración** → **Cuenta**
3. Toca **Cambiar tipo de cuenta**
4. Selecciona **Cambiar a cuenta profesional**
5. Elige **Empresa**
6. Completa la categoría

### 3. Vincular con Página de Facebook

1. En Instagram, ve a **Configuración** → **Cuenta**
2. Toca **Página vinculada**
3. Selecciona tu Página de Facebook
4. Autoriza la vinculación

✅ Ahora tienes Instagram Business Account vinculado a una página.

---

## 🛠️ Paso 2: Crear App de Facebook (si no la tienes)

Si ya creaste una app para Facebook Messenger, puedes usar la misma. Si no:

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Click **"Mis Apps"** → **"Crear App"**
3. Selecciona tipo: **"Empresa"**
4. Completa nombre y email
5. Click **"Crear App"**

---

## 🔑 Paso 3: Agregar Producto Instagram

### 1. Agregar Instagram al App

1. En el dashboard de tu app, busca **"Instagram"**
2. Click **"Configurar"**
3. Instagram Graph API ahora está habilitado

### 2. Conectar Instagram Business Account

1. Ve a **Instagram** → **Configuración**
2. En la sección **"Instagram Business Account"**, click **"Conectar cuenta"**
3. Inicia sesión con Instagram
4. Autoriza el acceso

### 3. Generar Page Access Token

El token es el mismo que para Facebook Messenger (compartido).

#### Opción A: Token de Prueba (Desarrollo)

1. Ve a **Messenger** o **Instagram** → **Configuración**
2. En **"Tokens de acceso"**, selecciona tu página
3. Click **"Generar token"**
4. Copia el token (`EAAxxxxxxxxxxxxx`)

⚠️ Este token expira en ~60 días.

#### Opción B: Token Permanente (Producción)

Para producción:

1. Ve a [developers.facebook.com/tools/accesstoken](https://developers.facebook.com/tools/accesstoken/)
2. Copia tu **User Access Token**
3. Conviértelo a Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_USER_ACCESS_TOKEN"
```

4. Busca tu página y copia el `access_token`

Este token **NO expira**.

---

## 🔗 Paso 4: Configurar Webhook

Instagram usa la misma infraestructura de webhooks que Facebook.

### 1. Definir URL de Webhook

Tu webhook URL será:
```
https://tu-app.vercel.app/api/webhook/instagram
```

En desarrollo, usa **ngrok**:
```bash
ngrok http 3000
# Usa: https://xxxx.ngrok.io/api/webhook/instagram
```

### 2. Definir Verify Token

Usa el mismo que Facebook, o uno diferente:
```
zo-chatbot-instagram-verify
```

En tu `.env.local`:
```env
INSTAGRAM_VERIFY_TOKEN=zo-chatbot-instagram-verify
# O usa el mismo que Facebook
FACEBOOK_VERIFY_TOKEN=zo-chatbot-verify-2024
```

### 3. Configurar en Facebook Developers

1. Ve a **Instagram** → **Configuración** → **Webhooks**
2. Click **"Agregar URL de devolución de llamada"**
3. Completa:
   ```
   URL: https://tu-app.vercel.app/api/webhook/instagram
   Verify token: zo-chatbot-instagram-verify
   ```
4. Click **"Verificar y guardar"**

### 4. Suscribirse a Eventos

Selecciona los eventos que quieres recibir:
- ✅ `messages` - Mensajes directos
- ✅ `messaging_postbacks` - Clicks en botones
- ✅ `message_deliveries` (opcional)
- ✅ `message_reads` (opcional)
- ✅ `messaging_optins` (opcional)

Click **"Guardar"**.

### 5. Suscribir Instagram Account

Finalmente, suscribe tu Instagram Business Account:

```bash
curl -X POST "https://graph.facebook.com/v18.0/<IG_BUSINESS_ACCOUNT_ID>/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=TU_PAGE_ACCESS_TOKEN"
```

**¿Cómo obtener el IG Business Account ID?**

```bash
curl "https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=TU_PAGE_ACCESS_TOKEN"
```

Busca `instagram_business_account.id`.

---

## 🔧 Paso 5: Configurar en tu Aplicación

### 1. Variables de Entorno

En tu `.env.local`:

```env
# Instagram Configuration
INSTAGRAM_APP_SECRET=tu-app-secret
INSTAGRAM_VERIFY_TOKEN=zo-chatbot-instagram-verify

# O usa variables compartidas con Facebook
FACEBOOK_APP_SECRET=tu-app-secret
FACEBOOK_VERIFY_TOKEN=zo-chatbot-verify-2024
```

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
  'instagram',
  'Instagram Direct',
  '{
    "pageAccessToken": "EAAxxxxxxxxxxxxx",
    "igBusinessAccountId": "123456789"
  }'::jsonb,
  true
) RETURNING *;
```

Guarda el `id` del canal.

---

## 🧪 Paso 6: Probar la Integración

### Test 1: Webhook Verification

```bash
curl "http://localhost:3000/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=zo-chatbot-instagram-verify&hub.challenge=test123"
```

**Respuesta esperada**: `test123`

### Test 2: Enviar Mensaje de Prueba

```bash
curl -X POST http://localhost:3000/api/channels/instagram/send-test \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "channelId": "tu-channel-id",
    "recipientId": "IG_SCOPED_ID",
    "message": "¡Hola desde Instagram!"
  }'
```

**¿Cómo obtener un Instagram-Scoped ID (IGSID)?**
- Envía un mensaje directo a tu cuenta de negocio desde otra cuenta
- Mira los logs del webhook - el `sender.id` es el IGSID

### Test 3: Recibir Mensaje

1. Abre Instagram en tu teléfono o web
2. Envía un mensaje directo a tu cuenta de negocio
3. Instagram enviará webhook a `/api/webhook/instagram`
4. El sistema procesará y responderá automáticamente

---

## 📊 Flujo Completo

```
Usuario → Instagram → Meta Servers → Webhook
                                        ↓
                          /api/webhook/instagram
                                        ↓
                          processIncomingMessage()
                                        ↓
                          Bot procesa y responde
                                        ↓
                          Enqueue job de envío
                                        ↓
                          Queue Worker ejecuta
                                        ↓
                          sendInstagramMessage()
                                        ↓
                          Graph API → Instagram → Usuario
```

---

## 🔐 Seguridad

### Validar Firma del Webhook

Instagram firma webhooks con `x-hub-signature-256` (igual que Facebook):

```typescript
const signature = request.headers.get("x-hub-signature-256");
const appSecret = process.env.INSTAGRAM_APP_SECRET;

const isValid = InstagramGraphClient.verifyWebhookSignature(
  rawBody,
  signature,
  appSecret
);

if (!isValid) {
  return Response(401);
}
```

### Headers Requeridos

Para asociar mensajes:
- `X-Organization-ID`: ID de la organización
- `X-Channel-ID`: ID del canal

En producción, consulta la base de datos:
```sql
SELECT organization_id, id
FROM channels
WHERE type = 'instagram'
  AND config->>'igBusinessAccountId' = 'TU_IG_BUSINESS_ACCOUNT_ID';
```

---

## 💬 Tipos de Mensajes

### Texto

```typescript
await sendInstagramMessage(
  channel,
  recipientId,
  "¡Hola! ¿Cómo estás?",
  "text"
);
```

### Imagen

```typescript
await sendInstagramMessage(
  channel,
  recipientId,
  "Mira esta foto",
  "image",
  "https://example.com/image.jpg"
);
```

### Video

```typescript
await sendInstagramMessage(
  channel,
  recipientId,
  "Video tutorial",
  "video",
  "https://example.com/video.mp4"
);
```

### Audio

```typescript
await sendInstagramMessage(
  channel,
  recipientId,
  "Escucha esto",
  "audio",
  "https://example.com/audio.mp3"
);
```

---

## 🎯 Funciones Avanzadas

### Indicador de Escritura

```typescript
import { sendInstagramTypingIndicator } from "@/lib/integrations/instagram";

await sendInstagramTypingIndicator(channel, recipientId, true);
await delay(2000);
await sendInstagramMessage(channel, recipientId, "Tu respuesta");
await sendInstagramTypingIndicator(channel, recipientId, false);
```

### Marcar como Leído

```typescript
import { markInstagramMessageAsSeen } from "@/lib/integrations/instagram";

await markInstagramMessageAsSeen(channel, senderId);
```

### Obtener Perfil de Usuario

```typescript
import { getInstagramUserProfile } from "@/lib/integrations/instagram";

const profile = await getInstagramUserProfile(channel, userId);
console.log(profile.name, profile.username);
```

---

## 🚨 Troubleshooting

### "Instagram account is not connected"

**Causa**: Instagram Business Account no está vinculado a la app

**Solución**:
1. Ve a **Instagram** → **Configuración** en developers.facebook.com
2. Reconecta tu Instagram Business Account

### "Permissions error"

**Causa**: Falta permiso `instagram_basic` o `instagram_manage_messages`

**Solución**:
1. Ve a **App Review** → **Permisos**
2. Solicita `instagram_manage_messages` (puede requerir review)

### "Cannot send message outside 24h window"

**Causa**: Intentas enviar mensaje después de 24h sin interacción

**Solución**:
- Solo puedes enviar mensajes dentro de 24h de la última respuesta del usuario
- Para mensajes fuera de esa ventana, necesitas **Message Tags** (requiere review de Meta)

### "This Instagram account is not a business account"

**Causa**: La cuenta no es Business Account

**Solución**:
1. Abre Instagram → Configuración → Cuenta
2. Cambiar a cuenta profesional
3. Vincular con Página de Facebook

---

## 📈 Monitoreo

### Ver Conversaciones de Instagram

```sql
SELECT
  c.id,
  c.external_id as igsid,
  c.contact_name,
  c.status,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.channel_id = 'your-instagram-channel-id'
GROUP BY c.id
ORDER BY last_message DESC;
```

---

## 🎨 Limitaciones

| Límite | Valor | Notas |
|--------|-------|-------|
| Mensajes/día | Sin límite oficial | Respeta 24h window |
| API calls/hora | 200 (compartido con FB) | Por app |
| Tamaño de archivo | 25 MB | Para media |
| Ventana de respuesta | 24 horas | Desde último mensaje del usuario |

---

## 📝 Diferencias con Facebook Messenger

| Feature | Facebook Messenger | Instagram Direct |
|---------|-------------------|------------------|
| Ventana de respuesta | 24 horas | 24 horas |
| Quick Replies | ✅ Sí | ✅ Sí |
| Botones | ✅ Sí | ✅ Sí |
| Templates | ✅ Sí | ⚠️ Limitado |
| Persistent Menu | ✅ Sí | ❌ No |
| Ice Breakers | ❌ No | ✅ Sí |
| Story Mentions | ❌ No | ✅ Sí |
| Story Replies | ❌ No | ✅ Sí |

---

## 🔮 Próximos Pasos (Avanzado)

1. **Ice Breakers**: Mensajes de inicio para nuevos usuarios
2. **Story Replies**: Responder a menciones en historias
3. **Quick Replies**: Respuestas rápidas con botones
4. **Generic Template**: Mensajes con imágenes y botones
5. **Handover Protocol**: Transferir conversación a humano

---

## 📚 Referencias

- [Instagram Messaging API Docs](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Webhooks Reference](https://developers.facebook.com/docs/messenger-platform/instagram/features/webhook)
- [Send API Reference](https://developers.facebook.com/docs/messenger-platform/instagram/features/send-messages)

---

## ⚠️ Notas Importantes

### Verificación de Negocio

Para producción, Instagram puede requerir **Verificación de Negocio**:
- Gratis pero toma 1-3 días
- Requiere documentos de la empresa
- Necesario para límites más altos

### App Review

Para funciones avanzadas necesitas que Meta **revise tu app**:
- `instagram_manage_messages` - Requerido para enviar mensajes
- `instagram_basic` - Información básica del perfil
- Proceso toma 1-2 semanas

Para chatbot básico en desarrollo, no necesitas review inmediatamente.

---

¿Preguntas? Revisa el código fuente en `/src/lib/integrations/instagram/` 🚀
