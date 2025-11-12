# Guía de Inicio Rápido

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- Cuenta de Vercel (opcional, para deployment)
- pnpm, npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/zo_chatbot.git
cd zo_chatbot
```

### 2. Instalar dependencias

```bash
# Con pnpm (recomendado)
pnpm install

# O con npm
npm install

# O con yarn
yarn install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` y configura las siguientes variables:

```env
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=tu-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Otras configuraciones se pueden dejar vacías por ahora
```

### 4. Ejecutar en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📚 Próximos Pasos

1. **Configurar Supabase**: Ver [supabase-setup.md](./supabase-setup.md)
2. **Integrar WhatsApp**: Ver [whatsapp-setup.md](./whatsapp-setup.md)
3. **Configurar Facebook/Instagram**: Ver [meta-setup.md](./meta-setup.md)

## 🔧 Scripts Disponibles

- `pnpm dev` - Ejecutar en modo desarrollo
- `pnpm build` - Construir para producción
- `pnpm start` - Ejecutar en producción
- `pnpm lint` - Ejecutar ESLint
- `pnpm type-check` - Verificar tipos de TypeScript

## 🆘 Problemas Comunes

### Error: "Module not found"

```bash
rm -rf node_modules .next
pnpm install
```

### Puerto 3000 en uso

```bash
# Cambiar puerto
PORT=3001 pnpm dev
```

## 📖 Documentación Adicional

- [Plan del Proyecto](../PLAN_PROYECTO.md)
- [Arquitectura](../ARQUITECTURA.md)
- [Alternativas de Costo](../ALTERNATIVAS_COSTOS.md)
