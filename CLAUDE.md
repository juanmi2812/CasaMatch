# CasaMatch - Senior Developer Guidelines

## Stack & Arquitectura
- Frontend: React 18+ (TS), Vite, Tailwind v4, Framer Motion (Swipes).
- Backend: Supabase (Postgres), Row Level Security (RLS).
- Testing: Vitest para lógica, TypeScript estricto (`noImplicitAny: true`).

## Flujo de Git Obligatorio
- Ramas por feature: `feature/nombre-componente`
- Compilación previa obligatoria antes de cualquier merge.

## Comandos del Sistema
- Servidor local: `npm run dev`
- Ejecutar Pruebas: `npx vitest run`
- Validación de tipos: `npx tsc --noEmit`
- Compilación: `npm run build`