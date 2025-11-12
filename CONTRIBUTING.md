# Guía de Contribución

¡Gracias por tu interés en contribuir a ZO Chatbot! 🎉

## 📋 Código de Conducta

Este proyecto se adhiere a un código de conducta profesional y respetuoso. Por favor, mantén un ambiente positivo y constructivo.

## 🚀 Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/tu-usuario/zo_chatbot.git
cd zo_chatbot
```

### 2. Crear una Rama

```bash
git checkout -b feature/mi-nueva-funcionalidad
# o
git checkout -b fix/corregir-bug
```

### 3. Hacer Cambios

- Escribe código limpio y bien documentado
- Sigue las convenciones de estilo del proyecto
- Agrega tests si es aplicable
- Actualiza la documentación

### 4. Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: agregar integración con Telegram"
git commit -m "fix: corregir error en webhook de WhatsApp"
git commit -m "docs: actualizar guía de instalación"
```

Tipos de commit:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, punto y coma faltantes, etc
- `refactor`: Refactorización de código
- `test`: Agregar tests
- `chore`: Cambios en build, CI, etc

### 5. Push y Pull Request

```bash
git push origin feature/mi-nueva-funcionalidad
```

Luego crea un Pull Request en GitHub con:
- Descripción clara de los cambios
- Referencias a issues relacionados
- Screenshots si aplica

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 📝 Estilo de Código

- Usamos TypeScript con modo strict
- Prettier para formateo automático
- ESLint para linting
- Tailwind CSS para estilos

## 🔍 Revisión de Código

Todos los PRs serán revisados antes de ser merged. Esperamos:
- Código que pase todos los checks
- Tests para nuevas funcionalidades
- Documentación actualizada
- Sin conflictos con main

## 💡 Ideas y Sugerencias

¿Tienes una idea pero no estás seguro de cómo implementarla?
Abre un [GitHub Issue](https://github.com/tu-usuario/zo_chatbot/issues) para discutirla.

## 📞 Contacto

Si tienes preguntas, abre un issue o contacta a los maintainers.

¡Gracias por contribuir! 🙌
