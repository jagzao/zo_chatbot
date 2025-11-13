# Guía de Configuración de TikTok

Esta guía explica cómo integrar TikTok con tu chatbot usando la TikTok API.

## ⚠️ IMPORTANTE: Limitaciones de TikTok

**TikTok NO soporta mensajería directa como WhatsApp, Facebook o Instagram.**

Esta integración solo permite:
- ✅ **Responder a comentarios** en tus videos
- ✅ **Detectar menciones** de tu cuenta en otros videos
- ✅ **Interacciones públicas** solamente

❌ **NO es posible:**
- Enviar mensajes directos privados
- Iniciar conversaciones con usuarios
- Conversaciones privadas 1-a-1

**Todos los comentarios son públicos** y aparecerán en el video.

---

## 🎯 Casos de Uso Válidos

### ✅ Casos de Uso Recomendados:

1. **Atención al Cliente en Comentarios**
   - Usuario comenta: "¿Cuál es el precio?"
   - Bot responde: "El precio es $50. ¡Envíanos DM en Instagram para más info!"

2. **Respuestas Automáticas a Preguntas Frecuentes**
   - Usuario: "¿Hacen envíos?"
   - Bot: "Sí, enviamos a toda España. Más info: [link]"

3. **Moderación de Comentarios**
   - Detectar spam o comentarios inapropiados
   - Responder automáticamente con reglas de la comunidad

4. **Engagement Automático**
   - Agradecer a usuarios por comentarios positivos
   - Invitar a seguir en otras redes sociales

### ❌ Casos de Uso NO Válidos:

1. ❌ Conversaciones privadas de soporte
2. ❌ Procesamiento de pedidos sensibles
3. ❌ Intercambio de información personal/financiera
4. ❌ Mensajes directos automáticos

---

## 📱 ¿Qué es TikTok for Developers?

TikTok for Developers es la **API oficial** de TikTok para integrar aplicaciones con la plataforma.

**Ventajas**:
- ✅ Oficial y confiable
- ✅ API gratuita (con límites)
- ✅ Acceso a comentarios y videos
- ✅ Webhooks para eventos en tiempo real

**Desventajas**:
- ⚠️ No soporta mensajes directos
- ⚠️ Requiere App Review (puede tardar semanas)
- ⚠️ Límites de API más restrictivos que Facebook/Instagram
- ⚠️ Menos documentación y soporte

**Requisitos**:
- Una **cuenta de TikTok** (preferiblemente Business Account)
- Crear una **App en TikTok for Developers**
- **App Review** aprobada (para producción)
- Videos públicos (no privados)

---

## 🚀 Paso 1: Crear Cuenta de TikTok Business (Recomendado)

### 1. Convertir a TikTok Business Account

1. Abre TikTok en tu teléfono
2. Ve a **Perfil** → **☰ Menú** → **Configuración y privacidad**
3. Toca **Administrar cuenta**
4. Selecciona **Cambiar a cuenta empresarial**
5. Elige tu categoría de negocio
6. Completa el proceso

✅ Business Account te da acceso a analytics y herramientas adicionales.

---

## 🛠️ Paso 2: Crear App en TikTok for Developers

### 1. Ir a TikTok for Developers

Ve a [developers.tiktok.com](https://developers.tiktok.com) e inicia sesión con tu cuenta de TikTok.

### 2. Crear Nueva App

1. Click en **"Manage Apps"** → **"Create New App"**
2. Completa el formulario:
   ```
   App Name: ZO Chatbot
   Description: Chatbot para responder comentarios
   Category: Social & Communication
   ```
3. Click **"Create"**

### 3. Configurar Permisos

En la configuración de tu app, solicita estos permisos:

**Permisos Requeridos:**
- ✅ `video.list` - Ver tus videos
- ✅ `comment.list` - Ver comentarios en tus videos
- ✅ `comment.create` - Responder a comentarios
- ✅ `user.info.basic` - Información básica de usuario

**Permisos Opcionales:**
- `video.publish` - Publicar videos (no necesario para chatbot)

⚠️ **Nota**: Algunos permisos requieren App Review para producción.

---

## 🔑 Paso 3: Obtener Credenciales

### 1. Client Key y Client Secret

1. Ve a tu app en el dashboard
2. En **"Basic Information"**, encontrarás:
   - **Client Key**: `aw1234567890`
   - **Client Secret**: `secret1234567890`

Guárdalos de forma segura.

### 2. Generar Access Token

TikTok usa OAuth 2.0 para autenticación. Tienes dos opciones:

#### Opción A: Access Token de Prueba (Desarrollo)

1. En tu app, ve a **"Tools"** → **"Access Token Manager"**
2. Click **"Generate Access Token"**
3. Autoriza los permisos
4. Copia el token

⚠️ Este token **expira en 24 horas**. Solo para desarrollo.

#### Opción B: OAuth 2.0 Flow (Producción)

Para producción, debes implementar el flujo OAuth completo:

1. **Redirigir al usuario** a la URL de autorización de TikTok:
```
https://www.tiktok.com/v2/auth/authorize?
  client_key=YOUR_CLIENT_KEY
  &scope=video.list,comment.list,comment.create,user.info.basic
  &response_type=code
  &redirect_uri=https://tu-app.com/callback
  &state=random_state_string
```

2. **Usuario autoriza** la aplicación

3. **Recibir código** en tu callback:
```
https://tu-app.com/callback?code=AUTH_CODE&state=random_state_string
```

4. **Intercambiar código por token**:
```bash
curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=YOUR_CLIENT_KEY" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTH_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=https://tu-app.com/callback"
```

Respuesta:
```json
{
  "access_token": "act.example12345",
  "expires_in": 86400,
  "refresh_token": "rft.example67890",
  "refresh_expires_in": 31536000,
  "token_type": "Bearer"
}
```

5. **Guardar tokens** en tu base de datos

### 3. Refresh Token

Los Access Tokens de TikTok **expiran en 24 horas**. Usa el refresh token para obtener uno nuevo:

```bash
curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=YOUR_CLIENT_KEY" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

⚠️ **Importante**: Implementa un sistema para refrescar tokens automáticamente.

---

## 🔗 Paso 4: Configurar Webhook

### 1. Definir URL de Webhook

Tu webhook URL será:
```
https://tu-app.vercel.app/api/webhook/tiktok
```

En desarrollo, usa **ngrok**:
```bash
ngrok http 3000
# Usa: https://xxxx.ngrok.io/api/webhook/tiktok
```

### 2. Configurar en TikTok

1. Ve a tu app → **"Webhooks"**
2. Click **"Add Webhook"**
3. Completa:
   ```
   Webhook URL: https://tu-app.vercel.app/api/webhook/tiktok
   Events: comment.created, video.mention
   ```
4. Click **"Verify"**

TikTok enviará un GET request con `challenge` parameter:
```
GET /api/webhook/tiktok?challenge=1234567890
```

Tu endpoint debe devolver el `challenge` tal cual.

### 3. Suscribirse a Eventos

Selecciona los eventos que quieres recibir:
- ✅ `comment.created` - Nuevo comentario en tu video
- ✅ `video.mention` - Tu cuenta fue mencionada
- `video.published` (opcional) - Nuevo video publicado

---

## 🔧 Paso 5: Configurar en tu Aplicación

### 1. Variables de Entorno

En tu `.env.local`:

```env
# TikTok Configuration
TIKTOK_CLIENT_KEY=aw1234567890
TIKTOK_CLIENT_SECRET=secret1234567890
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
  'tiktok',
  'TikTok Comments',
  '{
    "accessToken": "act.example12345",
    "refreshToken": "rft.example67890",
    "tiktokUserId": "123456789",
    "tokenExpiresAt": "2024-12-31T23:59:59Z"
  }'::jsonb,
  true
) RETURNING *;
```

⚠️ **Importante**: Debes implementar un sistema para refrescar el `accessToken` automáticamente antes de que expire.

---

## 🧪 Paso 6: Probar la Integración

### Test 1: Webhook Verification

```bash
curl "http://localhost:3000/api/webhook/tiktok?challenge=test123"
```

**Respuesta esperada**: `test123`

### Test 2: Obtener Comentarios de un Video

```bash
curl "http://localhost:3000/api/channels/tiktok/comments?channelId=tu-channel-id&videoId=7123456789"
```

**¿Cómo obtener un Video ID?**
- Ve a tu video en TikTok web
- La URL es: `https://www.tiktok.com/@usuario/video/7123456789`
- El Video ID es `7123456789`

### Test 3: Responder a un Comentario

```bash
curl -X POST http://localhost:3000/api/channels/tiktok/comment \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "tu-channel-id",
    "videoId": "7123456789",
    "message": "¡Gracias por tu comentario!",
    "parentCommentId": "comment-id-opcional"
  }'
```

### Test 4: Recibir Comentario

1. Abre TikTok y comenta en uno de tus videos
2. TikTok enviará webhook a `/api/webhook/tiktok`
3. El sistema procesará y responderá automáticamente
4. Verás la respuesta del bot en los comentarios del video

---

## 📊 Flujo Completo

```
Usuario → Comenta en TikTok → TikTok Servers → Webhook
                                                    ↓
                                      /api/webhook/tiktok
                                                    ↓
                                      processIncomingMessage()
                                                    ↓
                                      Bot procesa y genera respuesta
                                                    ↓
                                      Enqueue job con videoId + content
                                                    ↓
                                      Queue Worker ejecuta
                                                    ↓
                                      sendTikTokComment()
                                                    ↓
                                      TikTok API → Comentario publicado → Usuario ve respuesta
```

---

## 🔐 Seguridad

### Validar Firma del Webhook

TikTok firma todas las peticiones con `x-tiktok-signature`:

```typescript
const signature = request.headers.get("x-tiktok-signature");
const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

const isValid = TikTokAPIClient.verifyWebhookSignature(
  rawBody,
  signature,
  clientSecret
);

if (!isValid) {
  return Response(401);
}
```

### Gestión de Tokens

```typescript
// Verificar si el token está por expirar
const config = channel.config as any;
const expiresAt = new Date(config.tokenExpiresAt);
const now = new Date();

// Si expira en menos de 1 hora, renovar
if (expiresAt.getTime() - now.getTime() < 3600000) {
  const newToken = await refreshTikTokToken(config.refreshToken);
  // Actualizar en base de datos
}
```

---

## 💬 Estructura de Comentarios

### Comentario Simple

```typescript
await sendTikTokComment(
  channel,
  "7123456789", // videoId
  "¡Gracias por tu comentario!"
);
```

### Responder a Comentario Específico

```typescript
await sendTikTokComment(
  channel,
  "7123456789", // videoId
  "@usuario ¡Claro! Te envío info por DM",
  "comment-id-123" // parentCommentId
);
```

---

## 🎯 Mejores Prácticas

### ✅ Hacer:

1. **Responder rápido**: TikTok premia la interacción rápida
2. **Ser amable y humano**: Aunque sea bot, usa tono natural
3. **Redirigir a privado**: Para info sensible, invita a DM en otra plataforma
4. **Mencionar al usuario**: Usa `@usuario` para notificarles
5. **Limitar respuestas**: No respondas a TODOS los comentarios (parece spam)

### ❌ Evitar:

1. ❌ Enviar links a cada comentario (TikTok lo marca como spam)
2. ❌ Respuestas genéricas sin contexto
3. ❌ Solicitar información personal en comentarios públicos
4. ❌ Responder a trolls o comentarios negativos agresivamente
5. ❌ Comentarios muy largos (TikTok tiene límite de caracteres)

---

## 🚨 Troubleshooting

### "Invalid access token"

**Causa**: Token expirado (tokens TikTok duran 24h)

**Solución**:
```typescript
const newToken = await refreshTikTokToken(oldRefreshToken);
// Actualizar en base de datos
```

### "Permission denied"

**Causa**: Falta permiso en el Access Token

**Solución**:
1. Regenera el token con los permisos correctos
2. Asegúrate de incluir `comment.create` scope

### "Rate limit exceeded"

**Causa**: Demasiadas peticiones a la API

**Solución**:
- TikTok tiene límite de ~100 requests/minuto
- Implementa rate limiting en tu código
- Usa cache para datos que no cambian frecuentemente

### "App not approved"

**Causa**: Tu app necesita pasar App Review

**Solución**:
1. Ve a tu app → **"App Review"**
2. Proporciona información sobre tu caso de uso
3. Puede tardar 1-4 semanas
4. Mientras tanto, usa el modo desarrollo (limitado a tu cuenta)

---

## 📈 Monitoreo

### Ver Comentarios de TikTok

```sql
SELECT
  c.id,
  c.external_id as tiktok_user,
  c.contact_name,
  m.content as comment,
  m.metadata->>'videoId' as video_id,
  m.metadata->>'commentId' as comment_id,
  m.created_at
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.channel_id = 'your-tiktok-channel-id'
ORDER BY m.created_at DESC;
```

---

## 🎨 Limitaciones de la API

| Límite | Valor | Notas |
|--------|-------|-------|
| Requests/minuto | ~100 | Por app |
| Access Token válido | 24 horas | Usar refresh token |
| Refresh Token válido | 365 días | Debe renovarse antes |
| Comentarios/día | Sin límite oficial | Puede haber throttling |
| Longitud de comentario | 150 caracteres | Límite de TikTok |

---

## 🔮 Diferencias con Otros Canales

| Feature | WhatsApp | Facebook | Instagram | **TikTok** |
|---------|----------|----------|-----------|------------|
| Mensajes directos privados | ✅ | ✅ | ✅ | ❌ |
| Comentarios públicos | ❌ | ✅ | ✅ | ✅ |
| Media en mensajes | ✅ | ✅ | ✅ | ❌ |
| Webhooks en tiempo real | ✅ | ✅ | ✅ | ✅ |
| Typing indicators | ✅ | ✅ | ✅ | ❌ |
| Iniciar conversación | ✅ | ⚠️ 24h | ⚠️ 24h | ❌ |
| Perfiles de usuario | ✅ | ✅ | ✅ | ⚠️ Limitado |
| App Review requerido | ❌ | ✅ | ✅ | ✅ |

---

## ⚠️ Consideraciones Importantes

### App Review

**Para desarrollo:**
- Puedes probar con tu propia cuenta sin review
- Acceso limitado a 10 usuarios de prueba

**Para producción:**
- DEBES pasar App Review
- Proceso toma 1-4 semanas
- Debes explicar claramente tu caso de uso
- TikTok puede rechazar si el uso no es apropiado

### Privacidad

**Recuerda:**
- ⚠️ **Todos los comentarios son públicos**
- Nunca solicites información sensible en comentarios
- Cumple con GDPR/CCPA si aplica
- Informa a usuarios que están interactuando con un bot

### Moderación

Considera implementar:
- Filtros de spam
- Límite de respuestas por usuario
- Lista negra de palabras
- Aprobación manual para comentarios sensibles

---

## 📚 Referencias

- [TikTok for Developers](https://developers.tiktok.com/)
- [TikTok API Documentation](https://developers.tiktok.com/doc/)
- [OAuth 2.0 Guide](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- [Comment API Reference](https://developers.tiktok.com/doc/comment-api-overview)
- [Webhooks Reference](https://developers.tiktok.com/doc/webhooks-overview)

---

## 📝 Conclusión

La integración de TikTok es **fundamentalmente diferente** a WhatsApp, Facebook e Instagram porque:

1. ❌ **No hay mensajes directos privados**
2. ✅ **Solo comentarios públicos** en videos
3. ⚠️ **Requiere App Review** para producción
4. ⚠️ **Tokens expiran cada 24 horas** (requiere sistema de refresh)
5. ⚠️ **Límites de API más restrictivos**

**Úsalo para:**
- Engagement público en videos
- Respuestas automáticas a FAQs
- Redirigir a otros canales (Instagram DM, WhatsApp, etc.)

**NO lo uses para:**
- Conversaciones privadas
- Soporte sensible
- Procesamiento de pedidos/pagos

---

¿Preguntas? Revisa el código fuente en `/src/lib/integrations/tiktok/` 🚀
