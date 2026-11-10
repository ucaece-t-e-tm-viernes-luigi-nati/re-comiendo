# ReComiendo

App responsive que fusiona Instagram y Google Maps para encontrar rápido dónde comer o tomar algo en Mar del Plata, con un algoritmo que recomienda según tus gustos.

Tiene 3 partes:

| Parte | Ruta | Quién la usa |
|---|---|---|
| Landing + app del usuario | `/` → `/inicio` | Consumidores: recomendaciones, mapa, feed, fichas, reseñas, puntos, Premium |
| Panel de negocios | `/clientes` | Cafés, bares y restaurantes: ficha, publicaciones, reservas, reseñas, métricas, patrocinio |
| Panel superadmin | `/superadmin` | El equipo: dashboards (alcance, Premium, clicks, reservas), aprobación de locales, moderación |

## Cuentas de prueba (contraseña `recomiendo123`)

- Usuario: `usuario@recomiendo.app`
- Negocio (Montecatini): `negocio@recomiendo.app`
- Superadmin: `admin@recomiendo.app`

## Arquitectura

```
src/
  app/
    (usuario)/        Front end de la app del consumidor
    (auth)/           Login y registro
    page.tsx          Landing
    clientes/         Panel de negocios
    superadmin/       Panel superadmin
    api/              Back end REST: /api/locales, /api/recomendaciones, /api/eventos, /api/mcp
  lib/
    services/         Lógica de negocio. La UI, la API y el MCP llaman SOLO a esta capa
      recomendador.ts   Algoritmo de recomendación (función pura, con tests)
    db/               Clientes de Supabase (servidor, navegador, admin)
    tipos.ts          Tipos del dominio
  mcp/                Herramientas MCP (reusan /lib/services)
  proxy.ts            Refresca la sesión y protege rutas privadas
supabase/migrations/  Esquema SQL, RLS y funciones de métricas
scripts/              Migraciones y datos de prueba
data/locales.json     59 locales reales de Mar del Plata
```

- **Front end:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. Mapa con Leaflet + OpenStreetMap.
- **Back end:** Server Actions y Route Handlers de Next.js sobre la capa de servicios.
- **Base de datos:** Supabase (Postgres + Auth + Storage), con Row Level Security por rol. Las columnas sensibles (rol, puntos, Premium) sólo las escribe el back end.
- **Analítica:** cada interacción se guarda en la tabla `events` (vista de local, clicks a Instagram y Cómo llegar, reservas, canjes, compras Premium, impresiones y clicks de anuncios). Todos los dashboards salen de ahí.
- **Pagos:** simulados. La tabla `suscripciones` tiene la columna `proveedor` lista para Mercado Pago.

## Algoritmo de recomendación

`src/lib/services/recomendador.ts` calcula un puntaje por local con: gustos declarados, lo que aprende con "Me copa" / "Otra opción", presupuesto, momento del día, distancia, rating, popularidad de los últimos 30 días y novedad (no repite lo que ya mostró). Los patrocinados se intercalan aparte con la etiqueta "Patrocinado". Es una función pura y testeada, así que se puede reemplazar por un modelo con IA sin tocar la UI.

## MCP

`/api/mcp` expone herramientas para asistentes de IA (Claude, Cursor…): `buscar_locales`, `recomendar`, `ver_local` y, con `Authorization: Bearer $MCP_ADMIN_TOKEN`, `metricas_admin` (sólo lectura).

## Desarrollo

```bash
vercel env pull .env.local   # variables de Supabase
npm install
npm run db:migrar            # aplica supabase/migrations
npm run db:seed              # carga datos de prueba (borra y recarga los demo)
npm run dev
npm test                     # tests del algoritmo
```
