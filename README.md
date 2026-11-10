# ReComiendo

App responsive que mezcla Instagram y Google Maps para encontrar rápido dónde comer o tomar algo en Mar del Plata, con un recomendador que aprende de tus gustos y un asistente con IA ("Refi").

MVP del Taller Emprendedor — Universidad CAECE, Mar del Plata (comisión viernes, 2.º cuatrimestre 2026). Versión **2.2**.

- **App publicada:** https://re-comiendo.vercel.app
- **Landing del curso:** https://ucaece-t-e-tm-viernes-luigi-nati.github.io/landing/
- **Docentes:** Luis Miguel Orviz y Natalia Tonon García
- La entrega original del equipo (v2.1, sobre Supabase) está en [`referencia-v2.1/`](referencia-v2.1/).

## Modelo (B2B2C) y roles

| Quién | Qué hace | Paga |
|---|---|---|
| **Comensales** (usuarios) | Reciben recomendaciones según sus gustos y el momento del día, usan el mapa, el feed y las fichas, reservan, dejan reseñas, suman puntos y los canjean por premios. | Gratis, con plan **Premium** opcional. |
| **Locales** (clientes / empresas) | Cafés, bares y restaurantes: editan su ficha, publican novedades, gestionan reservas (validan el código del comensal), responden reseñas, ven sus métricas y contratan patrocinios. | Abono mensual en ARS (con 14 días de prueba) + patrocinios. |
| **Equipo de ReComiendo** (superadmin y admins) | Invita y aprueba locales, registra pagos, gestiona planes, modera reseñas y premios, ve las métricas de la red y configura la IA. | — |

- `user.role`: `superadmin` (email en `SUPERADMIN_EMAILS`, no se puede quitar) · `admin` (equipo, se suma desde Plataforma → Equipo) · `member`.
- `client_member.role`: `owner` · `staff`. Cada cliente tiene su local (`locales.client_id`) y todo se filtra por el `client_id` resuelto en el servidor.
- Matriz de permisos en `lib/permissions.ts`, chequeada siempre en el servidor (`lib/guards.ts`).

## Superficies

Las tres superficies **nunca se muestran juntas** y cada una tiene su propio login:

- **Pública (comensales)** — `/` (landing), `/ingresar` (registro e ingreso), `/inicio`, `/explorar`, `/mapa`, `/feed`, `/eventos`, `/local/[id]`, `/refi`, `/puntos`, `/premium`, `/perfil`.
- **Panel del local** — `/empresa/...`. Se llega con el link del mail de aprobación: resumen con métricas, ficha, publicaciones, reservas, reseñas, patrocinio, equipo y plan.
- **Plataforma del equipo** — `/plataforma/...`: resumen, métricas de la red, solicitudes, clientes, locales, comensales, reseñas, premios, invitaciones, planes, mails, equipo, auditoría y ajustes (API key de Claude para Refi).

Las secciones internas no se linkean desde la parte pública, no se indexan (`robots.txt`, `noindex`, `X-Robots-Tag`) y responden **404** a quien no tenga sesión con el rol correspondiente (`proxy.ts` como primera barrera y guards en cada página, layout y server action).

## Alta de locales (por link + aprobación)

1. El equipo crea en **Plataforma → Invitaciones** una invitación personal (un solo uso, 14 días, por mail) o un link de campaña (reutilizable, con vigencia y cupo).
2. El local completa el wizard de 5 pasos en `/empresa/alta/<token>`: cuenta → datos de la empresa → características (tipo de cocina, precios, momentos del día, horarios, opciones, platos, barrio y ubicación en el mapa) → plan y día de pago → revisión y envío.
3. Llegan los mails "Recibimos tu solicitud" (al local) y "Nueva solicitud" (al equipo).
4. El equipo aprueba (plan, abono, prueba y día de pago), pide cambios o rechaza con motivo. Al aprobar se crea el cliente, su local visible en la app y el usuario dueño con contraseña temporal, y sale el mail con usuario, contraseña, link, costo, fin de la prueba y día de pago.
5. Un cron diario (`/api/cron/vencimientos`) avisa antes del vencimiento, marca "pago vencido" y pausa la cuenta pasados `PAUSE_AFTER_DAYS` días. Al registrar el pago se reactiva.

## Stack

Next.js 16 (App Router, `cacheComponents`) · React 19 · Tailwind 4 · better-auth · Neon Postgres (`pg` + drizzle) · Vercel (con cron) · nodemailer (SMTP de Google Workspace) · Leaflet (mapa) · recharts.

## Correr en tu PC

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL (Neon) y BETTER_AUTH_SECRET
npm run db:migrate           # crea el esquema y, con SEED_DEMO=true, los datos de demo
npm run dev
```

- Con `SEED_DEMO_PASSWORD` cargada: `local.demo@example.com` entra por `/empresa/ingresar` y `comensal.demo@example.com` por `/ingresar`.
- Equipo: el email de `SUPERADMIN_EMAILS` entra por `/plataforma/ingresar` → "Primer ingreso u olvidé mi contraseña" (sin SMTP, el link queda en la consola del servidor y en Plataforma → Mails).
- `scripts/migrate.mjs` es idempotente y corre solo antes de cada build en Vercel.

Todas las variables están explicadas en [`.env.example`](.env.example).

> Demo académica con datos de ejemplo, sin fines comerciales.
