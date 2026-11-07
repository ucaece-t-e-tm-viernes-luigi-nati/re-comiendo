# Re-Comiendo

MVP de **Re-Comiendo** · Taller Emprendedor · Universidad CAECE (Mar del Plata) · comisión viernes · 2do cuatrimestre 2026.

- **App publicada:** (pendiente)
- **Landing del curso:** https://ucaece-t-e-tm-viernes-luigi-nati.github.io/landing/
- **Docentes:** Luis Miguel Orviz y Natalia Tonon García

## Cómo está armado

| Pieza | Qué es |
|---|---|
| [Next.js](https://nextjs.org) 16 | La app (páginas en `app/`) |
| [better-auth](https://better-auth.com) | Registro e ingreso con correo y contraseña |
| [Neon](https://neon.com) | Base de datos Postgres (gratis) |
| [Drizzle](https://orm.drizzle.team) | Para leer y escribir la base desde el código |
| [Vercel](https://vercel.com) | Publica la app sola cada vez que se sube algo a `main` |
| Tailwind CSS | Estilos |

```
app/
  page.tsx            → portada pública
  login/              → ingreso y registro
  panel/              → área privada (solo usuarios logueados): acá va el MVP
  api/auth/           → endpoints de better-auth (no tocar)
lib/
  site.ts             → nombre, frase y color de la startup
  auth.ts             → configuración del login + getCurrentUser()
  db.ts, schema.ts    → conexión a Neon y tablas
scripts/migrate.mjs   → crea las tablas en Neon (corre solo en cada deploy)
```

## Cómo se publica

1. Se sube un cambio a la rama `main` → Vercel lo publica en la URL de producción en 1-2 minutos.
2. Si se sube a otra rama (ej. `prueba-panel`) → Vercel arma una **preview** con una URL propia para probar sin tocar producción.
3. Antes de cada publicación corre `scripts/migrate.mjs`, que crea en Neon las tablas que falten.

Las variables `DATABASE_URL` y `BETTER_AUTH_SECRET` ya están cargadas en Vercel. **Nunca** se suben claves al repo: el repo es público.

## Trabajar en tu PC (opcional)

Necesitás [Node.js 20.9+](https://nodejs.org) y [Git](https://git-scm.com).

```bash
git clone https://github.com/ucaece-t-e-tm-viernes-luigi-nati/re-comiendo.git
cd re-comiendo
npm install
cp .env.example .env.local   # completá DATABASE_URL y BETTER_AUTH_SECRET (pedíselos a los docentes)
npm run db:migrate           # crea las tablas
npm run dev                  # abre http://localhost:3000
```

## Agregar una tabla nueva

1. Definila en `lib/schema.ts` (ver ejemplos de Drizzle).
2. Agregá su `CREATE TABLE IF NOT EXISTS ...` en `scripts/migrate.mjs`.
3. Subí el cambio: en el próximo deploy se crea sola en Neon.

## Equipo

Repo de la organización `ucaece-t-e-tm-viernes-luigi-nati`. El equipo `equipo-re-comiendo` tiene permiso de **admin** sobre este repo.

> Demo académica con datos de ejemplo, sin fines comerciales.
