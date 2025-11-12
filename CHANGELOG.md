# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**Fase 1: Configuración Inicial (Completada)**
- Configuración inicial del proyecto Next.js 14 con TypeScript
- Estructura de carpetas para arquitectura limpia
- Tipos TypeScript para base de datos y API
- Configuración de Tailwind CSS y herramientas de desarrollo
- Variables de entorno de ejemplo (.env.example)
- Documentación inicial del proyecto
- Middleware básico para seguridad

**Fase 2: Supabase Setup (Completada)**
- Esquema de base de datos completo con 8 tablas
- Migraciones SQL (schema, RLS, seed data)
- Row Level Security (RLS) para aislamiento multi-tenant
- Políticas de acceso basadas en roles (owner/admin/member)
- Clientes de Supabase (browser, server, admin)
- Tipos TypeScript completos para base de datos
- Middleware de autenticación con Supabase
- Documentación completa de setup de Supabase

### Changed
- Middleware actualizado para integrar autenticación con Supabase
- Rutas protegidas configuradas (/dashboard requiere auth)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Headers de seguridad básicos en middleware
- Row Level Security habilitado en todas las tablas
- Service role key solo accesible desde backend
- Políticas RLS previenen acceso no autorizado entre organizaciones
