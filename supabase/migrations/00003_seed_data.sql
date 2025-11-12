-- Seed data for development (optional)
-- This file contains sample data for testing

-- Note: In production, you should NOT run this migration
-- This is only for development/testing purposes

-- Example organization (you can delete this in production)
INSERT INTO organizations (id, name, slug)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo-org')
ON CONFLICT (id) DO NOTHING;

-- Example bot flows for demo organization
INSERT INTO bot_flows (organization_id, name, trigger_type, trigger_value, response_type, response_content, priority, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Welcome Message',
    'keyword',
    'hola,hi,hello,buenos dias',
    'text',
    '¡Hola! 👋 Bienvenido a nuestro chatbot. ¿En qué puedo ayudarte hoy?',
    100,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Help Command',
    'keyword',
    'ayuda,help,comandos',
    'text',
    'Estos son los comandos disponibles:
- hola: Mensaje de bienvenida
- ayuda: Muestra este mensaje
- horario: Ver nuestros horarios de atención
- contacto: Obtener información de contacto',
    90,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Business Hours',
    'keyword',
    'horario,horarios,hours',
    'text',
    '🕐 Nuestros horarios de atención:
Lunes a Viernes: 9:00 AM - 6:00 PM
Sábados: 10:00 AM - 2:00 PM
Domingos: Cerrado',
    80,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Contact Information',
    'keyword',
    'contacto,contact,email,telefono',
    'text',
    '📧 Email: contacto@ejemplo.com
📱 Teléfono: +1 234 567 8900
🌐 Web: www.ejemplo.com',
    80,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Fallback AI Response',
    'fallback',
    NULL,
    'ai',
    'Eres un asistente virtual amigable y profesional. Responde de manera útil y concisa a las preguntas de los usuarios. Si no sabes algo, sé honesto y ofrece alternativas como contactar con un agente humano.',
    0,
    true
  )
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE bot_flows IS 'Bot flows define automated responses. Priority determines order of evaluation (higher = first).';
