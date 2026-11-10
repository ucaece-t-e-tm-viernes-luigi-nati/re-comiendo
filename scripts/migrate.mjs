// Crea/actualiza las tablas en Neon. Corre antes de cada build (ver "build" en package.json).
// Es idempotente: se puede correr muchas veces sin romper ni duplicar nada.
//   - Sin DATABASE_URL: se saltea (build local sin base).
//   - Funciona sobre la "base común" (ya tiene user/session/account/verification): solo agrega lo que falta.
//   - Planes (Inicial / Pro / Destacado, en ARS): se cargan siempre si no existen.
//   - SEED_DEMO=true: carga los 59 locales reales de Mar del Plata (data/locales.json) con sus fotos,
//     4 de ellos como clientes aprobados con plan, comensales de ejemplo, reseñas, publicaciones, premios,
//     patrocinios y 60 días de actividad para las métricas.
//   - SEED_DEMO_PASSWORD (8+ caracteres): crea además local.demo@example.com (owner de Montecatini)
//     y comensal.demo@example.com con esa contraseña.
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.log('[migrate] Sin DATABASE_URL: se saltea la migración.')
  process.exit(0)
}

const TZ = 'America/Argentina/Buenos_Aires'
const CATEGORIAS = ['cafe', 'mariscos', 'pizza-pastas', 'parrilla', 'cerveza', 'hamburguesas', 'sushi', 'veggie']

const schema = [
  // ---------- better-auth (ya existen en la base común; se dejan por si la base está vacía) ----------
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS session_user_idx ON "session"("userId")`,
  `CREATE INDEX IF NOT EXISTS account_user_idx ON "account"("userId")`,
  `CREATE INDEX IF NOT EXISTS verification_identifier_idx ON "verification"("identifier")`,

  // ---------- roles ----------
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'member'`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tempPasswordExpiresAt" timestamp`,

  // ---------- planes y clientes (locales que contratan) ----------
  `CREATE TABLE IF NOT EXISTS plan (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    features jsonb NOT NULL DEFAULT '[]',
    monthly_price_cents bigint NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'ARS',
    trial_days int NOT NULL DEFAULT 14,
    limits jsonb NOT NULL DEFAULT '{}',
    sort int NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS client (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    legal_name text,
    tax_id text,
    city text,
    neighborhood text,
    address text,
    instagram text,
    website text,
    phone text,
    contact_email text,
    description text,
    data jsonb NOT NULL DEFAULT '{}',
    plan_id text REFERENCES plan(id),
    monthly_price_cents bigint NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'ARS',
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','paused','cancelled')),
    trial_ends_at date,
    billing_day int CHECK (billing_day BETWEEN 1 AND 28),
    next_due_date date,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS client_status_idx ON client(status, next_due_date)`,
  `CREATE TABLE IF NOT EXISTS client_member (
    client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','staff')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (client_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS client_member_user_idx ON client_member(user_id)`,

  // ---------- alta por link ----------
  `CREATE TABLE IF NOT EXISTS client_invite (
    token text PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('personal','campaign')),
    email text,
    label text,
    max_uses int,
    uses int NOT NULL DEFAULT 0,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_by text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS client_application (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_token text REFERENCES client_invite(token),
    resume_key text NOT NULL,
    email text NOT NULL,
    contact_name text,
    phone text,
    email_verified_at timestamptz,
    step int NOT NULL DEFAULT 1,
    data jsonb NOT NULL DEFAULT '{}',
    requested_plan_id text REFERENCES plan(id),
    terms_accepted_at timestamptz,
    status text NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','pending_review','changes_requested','approved','rejected')),
    review_reason text,
    reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    submitted_at timestamptz,
    client_id uuid REFERENCES client(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS client_application_status_idx ON client_application(status, submitted_at)`,
  `CREATE INDEX IF NOT EXISTS client_application_token_idx ON client_application(invite_token)`,

  // ---------- cobros ----------
  `CREATE TABLE IF NOT EXISTS payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount_cents bigint NOT NULL,
    currency text NOT NULL DEFAULT 'ARS',
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','void')),
    method text,
    due_date date NOT NULL,
    paid_at timestamptz,
    notes text,
    registered_by text REFERENCES "user"(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, period)
  )`,

  // ---------- mails y auditoría ----------
  `CREATE TABLE IF NOT EXISTS email_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email text NOT NULL,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    template text,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','outbox_only')),
    error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS email_outbox_created_idx ON email_outbox(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id bigserial PRIMARY KEY,
    actor_user_id text,
    actor_role text,
    client_id uuid,
    action text NOT NULL,
    entity text,
    entity_id text,
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS audit_log_client_idx ON audit_log(client_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC)`,

  // ---------- producto (v2.1 del equipo, ahora en Neon) ----------
  // Perfil del comensal (usuario final). Los usuarios de locales y del equipo no tienen perfil.
  `CREATE TABLE IF NOT EXISTS perfiles (
    user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    nombre text NOT NULL DEFAULT '',
    categorias text[] NOT NULL DEFAULT '{}',
    precio smallint NOT NULL DEFAULT 2 CHECK (precio BETWEEN 1 AND 3),
    modo text NOT NULL DEFAULT 'descubrir' CHECK (modo IN ('descubrir','seguro')),
    onboarding_ok boolean NOT NULL DEFAULT false,
    aprendizaje jsonb NOT NULL DEFAULT '{"pesos":{},"historial":[],"descartados":[]}',
    es_premium boolean NOT NULL DEFAULT false,
    premium_desde timestamptz,
    puntos integer NOT NULL DEFAULT 50 CHECK (puntos >= 0),
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Locales: listados públicos (client_id NULL) y locales clientes (client_id = empresa aprobada).
  `CREATE TABLE IF NOT EXISTS locales (
    id text PRIMARY KEY,
    client_id uuid UNIQUE REFERENCES client(id) ON DELETE SET NULL,
    nombre text NOT NULL,
    categoria text NOT NULL CHECK (categoria IN (${CATEGORIAS.map((c) => `'${c}'`).join(',')})),
    barrio text NOT NULL DEFAULT '',
    direccion text NOT NULL DEFAULT '',
    lat double precision,
    lng double precision,
    precio smallint NOT NULL DEFAULT 2 CHECK (precio BETWEEN 1 AND 3),
    momentos text[] NOT NULL DEFAULT '{}',
    tags text[] NOT NULL DEFAULT '{}',
    platos text[] NOT NULL DEFAULT '{}',
    descripcion text NOT NULL DEFAULT '',
    instagram text NOT NULL DEFAULT '',
    horarios text NOT NULL DEFAULT '',
    fotos text[] NOT NULL DEFAULT '{}',
    nicho boolean NOT NULL DEFAULT false,
    estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('pendiente','activo','suspendido')),
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS locales_estado_idx ON locales(estado, categoria)`,
  `CREATE TABLE IF NOT EXISTS publicaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    tipo text NOT NULL DEFAULT 'post' CHECK (tipo IN ('post','promo','menu')),
    texto text NOT NULL,
    foto text,
    vence date,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS publicaciones_local_idx ON publicaciones(local_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS resenas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    user_id text REFERENCES "user"(id) ON DELETE SET NULL,
    autor text NOT NULL DEFAULT '',
    estrellas smallint NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    etiquetas text[] NOT NULL DEFAULT '{}',
    texto text NOT NULL DEFAULT '',
    foto text,
    respuesta text,
    oculta boolean NOT NULL DEFAULT false,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS resenas_local_idx ON resenas(local_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS resenas_user_idx ON resenas(user_id)`,
  `CREATE TABLE IF NOT EXISTS seguidores (
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, local_id)
  )`,
  `CREATE INDEX IF NOT EXISTS seguidores_local_idx ON seguidores(local_id)`,
  `CREATE TABLE IF NOT EXISTS favoritos (
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, local_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reservas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    fecha date NOT NULL,
    hora text NOT NULL,
    personas smallint NOT NULL CHECK (personas BETWEEN 1 AND 20),
    codigo text NOT NULL UNIQUE,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','cancelada','usada')),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS reservas_local_idx ON reservas(local_id, fecha)`,
  `CREATE INDEX IF NOT EXISTS reservas_user_idx ON reservas(user_id)`,
  `CREATE TABLE IF NOT EXISTS premios (
    id text PRIMARY KEY,
    titulo text NOT NULL,
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    costo integer NOT NULL CHECK (costo > 0),
    activo boolean NOT NULL DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS canjes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    premio_id text NOT NULL REFERENCES premios(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    codigo text NOT NULL UNIQUE,
    usado boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS canjes_user_idx ON canjes(user_id)`,
  // Premium del comensal (pago simulado; proveedor queda listo para 'mercadopago').
  `CREATE TABLE IF NOT EXISTS suscripciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'premium-mensual',
    monto_usd numeric(10,2) NOT NULL DEFAULT 2,
    proveedor text NOT NULL DEFAULT 'simulado',
    estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('prueba','activa','cancelada')),
    inicio timestamptz NOT NULL DEFAULT now(),
    fin timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS suscripciones_user_idx ON suscripciones(user_id)`,
  `CREATE TABLE IF NOT EXISTS patrocinios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id text NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
    beneficio text NOT NULL,
    monto_usd numeric(10,2) NOT NULL DEFAULT 20,
    inicio date NOT NULL DEFAULT current_date,
    fin date NOT NULL DEFAULT (current_date + 30),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS patrocinios_local_idx ON patrocinios(local_id)`,
  // Analítica: fuente de todas las métricas. user_id sin FK a propósito (la actividad demo usa ids sintéticos).
  `CREATE TABLE IF NOT EXISTS events (
    id bigserial PRIMARY KEY,
    tipo text NOT NULL CHECK (tipo IN ('view_local','click_instagram','click_como_llegar','reserva','canje','compra_premium',
      'impresion_anuncio','click_anuncio','resena','seguir','recomendacion','registro','sesion')),
    user_id text,
    local_id text REFERENCES locales(id) ON DELETE SET NULL,
    meta jsonb NOT NULL DEFAULT '{}',
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS events_created_idx ON events(created_at)`,
  `CREATE INDEX IF NOT EXISTS events_local_idx ON events(local_id, tipo, created_at)`,
  `CREATE INDEX IF NOT EXISTS events_user_idx ON events(user_id)`,
  // Ajustes que solo maneja el equipo (ej.: API key de Claude para Refi). Nunca se mandan al navegador.
  `CREATE TABLE IF NOT EXISTS ajustes (
    clave text PRIMARY KEY,
    valor text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS refi_consultas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','audio')),
    texto text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS refi_consultas_user_idx ON refi_consultas(user_id, created_at DESC)`,
  // Fotos subidas (reemplaza Supabase Storage): se guardan comprimidas en WebP y se sirven en /api/fotos/[id].
  `CREATE TABLE IF NOT EXISTS media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
    client_id uuid REFERENCES client(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    bytes int NOT NULL,
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS media_owner_idx ON media(owner_user_id, created_at DESC)`,
]

// [id, nombre, descripción, beneficios, precio en centavos ARS, orden]
const plans = [
  ['inicial', 'Inicial', 'Para estar en las recomendaciones con tu ficha completa.', ['Ficha con fotos, horarios y ubicación en el mapa', 'Menú, novedades y promos', 'Métricas de visitas y recomendaciones'], 1200000, 1],
  ['pro', 'Pro', 'Para locales que quieren llenar mesas.', ['Todo lo de Inicial', 'Reservas desde la app con código', 'Respuesta a reseñas y equipo de staff'], 2500000, 2],
  ['destacado', 'Destacado', 'Para aparecer primero en tu zona.', ['Todo lo de Pro', 'Una semana de patrocinio por mes', 'Acompañamiento del equipo'], 4500000, 3],
]

// Locales demo como clientes aprobados: [id del local, plan, estado, slug del cliente]
const demoClients = [
  ['montecatini', 'pro', 'active'],
  ['antares', 'destacado', 'active'],
  ['la-fonte-doro', 'inicial', 'trial'],
  ['manolo', 'inicial', 'past_due'],
]

// ---------- Generador determinístico: los datos demo salen iguales en cada corrida ----------
let semilla = 42
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 2 ** 32
  return semilla / 2 ** 32
}
const entero = (min, max) => Math.floor(azar() * (max - min + 1)) + min
const elegir = (xs) => xs[Math.floor(azar() * xs.length)]
/** UUID determinístico a partir de un texto (para que el seed sea idempotente con ON CONFLICT (id)). */
const uuidDe = (texto) => {
  const h = createHash('md5').update(`recomiendo-demo:${texto}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

const NOMBRES = ['Sofi', 'Juli', 'Tomi', 'Cami', 'Nico', 'Agus', 'Male', 'Fran', 'Lucho', 'Mica', 'Santi', 'Flor', 'Joaco', 'Lu', 'Valen', 'Pili', 'Mati', 'Belu', 'Gonza', 'Ro', 'Facu', 'Delfi', 'Nacho', 'Euge', 'Lauti', 'Abril', 'Bauti', 'Caro', 'Tincho', 'Vicky']
const APELLIDOS = ['M.', 'R.', 'G.', 'P.', 'A.', 'L.', 'V.', 'S.', 'B.', 'D.']
const FRASES = {
  cafe: ['El café, impecable. Las medialunas recién hechas.', 'Ideal para merendar tranqui con amigas.', 'Buena atención y precios razonables.', 'El flat white es de lo mejor de Mardel.'],
  mariscos: ['Las rabas, lo mejor. Fuimos sin reserva y no esperamos nada.', 'Pescado fresquísimo, se nota que es del día.', 'Porciones enormes, para compartir.', 'La cazuela, un abrazo al alma.'],
  'pizza-pastas': ['La masa casera, un golazo.', 'Pedimos sorrentinos y volvería solo por eso.', 'Clásico de Mardel, nunca falla.', 'La fugazzeta rellena, tremenda.'],
  parrilla: ['Carne en su punto justo y la provoleta tremenda.', 'Para ir con la familia un domingo.', 'Buena relación precio-calidad.', 'El vacío se cortaba con cuchara.'],
  cerveza: ['Muchas canillas y la IPA buenísima.', 'Ambiente re lindo para after.', 'Las papas con cheddar, imperdibles.', 'Happy hour largo y buena música.'],
  hamburguesas: ['Hamburguesa jugosa y el pan riquísimo.', 'Las papas rústicas, de lo mejor.', 'Rápido y rico, ideal para antes de salir.', 'La smash doble es otra cosa.'],
  sushi: ['Piezas frescas y bien armadas.', 'Las combinaciones de autor, muy buenas.', 'Un poco caro pero lo vale.', 'El roll crispy, adictivo.'],
  veggie: ['Opciones veganas de verdad ricas.', 'Bowls abundantes y frescos.', 'Lindo lugar para almorzar liviano.', 'Hasta mi novio carnívoro quedó contento.'],
}
const ETIQUETAS = ['Rico', 'Buena atención', 'Buen precio', 'Lindo lugar', 'Rápido', 'Porciones grandes']
const POSTS = {
  cafe: ['Salieron las medialunas de la tarde 🥐', 'Nuevo blend de especialidad en barra ☕', 'Hoy: torta del día de frutos rojos'],
  mariscos: ['Llegó la pesca del día 🐟', 'Rabas recién salidas, ¿quién se suma?', 'Abrimos el salón del primer piso con vista al puerto'],
  'pizza-pastas': ['Masa madre de 48 h, la diferencia se nota 🍕', 'Sorrentinos de calabaza, edición limitada', 'Domingo de pastas en familia'],
  parrilla: ['El fuego ya está prendido 🔥', 'Vacío a la llama para compartir', 'Mesa larga para grupos, reservá con la app'],
  cerveza: ['Nueva IPA en canilla 🍺', 'Happy hour extendido hasta las 21', 'Esta noche música en vivo'],
  hamburguesas: ['Nueva burger del mes: doble cheddar y cebolla crispy 🍔', 'Papas rústicas con alioli, nuevo topping', 'Combo para dos al mejor precio'],
  sushi: ['Nuevos rolls de temporada 🍣', 'Combinado de 30 piezas para compartir', 'Probá el tiradito de salmón'],
  veggie: ['Bowl de estación con hummus casero 🥗', 'Nuevo brownie vegano', 'Menú del día 100% plant based'],
}
const PROMOS = {
  cafe: '2x1 en cafés de 8 a 10 h',
  mariscos: '15% off en la tabla de rabas los martes',
  'pizza-pastas': 'Pizza grande + fainá a precio especial',
  parrilla: 'Provoleta de regalo con la parrillada para 2',
  cerveza: '2x1 en pintas de 18 a 20 h',
  hamburguesas: 'Papas gratis con cualquier burger doble',
  sushi: '10 piezas de regalo con el combinado de 30',
  veggie: 'Postre vegano de regalo al mediodía',
}
const HORARIOS = {
  cafe: 'Todos los días de 8 a 20',
  cerveza: 'Martes a domingo de 18 a 2',
  hamburguesas: 'Todos los días de 12 a 16 y de 19 a 0',
}
const HORARIO_GENERAL = 'Todos los días de 12 a 16 y de 20 a 0'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const sql of schema) await pool.query(sql)

  for (const [id, name, description, features, cents, sort] of plans) {
    await pool.query(
      `INSERT INTO plan (id, name, description, features, monthly_price_cents, currency, trial_days, sort)
       VALUES ($1, $2, $3, $4::jsonb, $5, 'ARS', 14, $6) ON CONFLICT (id) DO NOTHING`,
      [id, name, description, JSON.stringify(features), cents, sort],
    )
  }

  // Superadmin: solo cuentas ya verificadas (creadas por el "primer ingreso" de la plataforma) cuyo email
  // está en SUPERADMIN_EMAILS. Nadie puede registrarse como superadmin desde el registro público.
  const superadmins = (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (superadmins.length) {
    await pool.query(
      `UPDATE "user" SET role = 'superadmin' WHERE lower(email) = ANY($1) AND "emailVerified" = true AND role <> 'superadmin'`,
      [superadmins],
    )
  }
  await pool.query(`UPDATE "user" SET role = 'member' WHERE role = 'superadmin' AND NOT (lower(email) = ANY($1))`, [superadmins])

  if (process.env.SEED_DEMO === 'true') {
    await seedDemo()
    console.log('[migrate] Datos de demo cargados (SEED_DEMO=true).')
  }

  console.log(`[migrate] OK (${schema.length} sentencias de esquema).`)
} finally {
  await pool.end()
}

/** Pasa 'fotos/x.jpg' (formato de data/locales.json) a la ruta pública optimizada '/fotos/x.webp'. */
function rutaFoto(f) {
  return '/' + f.replace(/\.(jpe?g|png)$/i, '.webp')
}

async function seedDemo() {
  const locales = JSON.parse(readFileSync(new URL('../data/locales.json', import.meta.url), 'utf8'))
  const ids = locales.map((l) => l.id)
  const categoriaDe = Object.fromEntries(locales.map((l) => [l.id, l.categoria]))
  const fotosDe = Object.fromEntries(locales.map((l) => [l.id, l.fotos.map(rutaFoto)]))

  // 1. Los 59 locales reales (listados públicos). Ubicaciones repetidas se separan un poco para no pisarse en el mapa.
  const vistos = new Map()
  for (const [i, l] of locales.entries()) {
    const clave = `${l.lat},${l.lng}`
    const n = vistos.get(clave) ?? 0
    vistos.set(clave, n + 1)
    const ang = n * 2.4
    const lat = l.lat + (n ? Math.sin(ang) * 0.0012 * Math.sqrt(n) : 0)
    const lng = l.lng + (n ? Math.cos(ang) * 0.0015 * Math.sqrt(n) : 0)
    await pool.query(
      `INSERT INTO locales (id, nombre, categoria, barrio, direccion, lat, lng, precio, momentos, tags, platos, descripcion, instagram,
                            horarios, fotos, nicho, estado, is_demo, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'activo',true, now() - make_interval(days => $17::int))
       ON CONFLICT (id) DO UPDATE SET fotos = EXCLUDED.fotos WHERE locales.is_demo AND locales.fotos <> EXCLUDED.fotos AND locales.client_id IS NULL`,
      [l.id, l.nombre, l.categoria, l.barrio, l.direccion, lat, lng, l.precio, l.momentos, l.tags, l.platos, l.descripcion, l.instagram ?? '',
        HORARIOS[l.categoria] ?? HORARIO_GENERAL, l.fotos.map(rutaFoto), l.nicho ?? false, 60 + (i % 60)],
    )
  }

  // 2. Algunos locales como clientes aprobados (con plan), el resto quedan como listados públicos.
  for (const [localId, planId, status] of demoClients) {
    const l = locales.find((x) => x.id === localId)
    await pool.query(
      `INSERT INTO client (slug, name, city, neighborhood, address, instagram, description, data, plan_id, monthly_price_cents, currency,
                           status, trial_ends_at, billing_day, next_due_date, is_demo, created_at)
       SELECT $1::text, $2::text, 'Mar del Plata', $3::text, $4::text, $5::text, $6::text, $7::jsonb, $8::text, p.monthly_price_cents, 'ARS', $9::text,
              CASE WHEN $9 = 'trial' THEN current_date + 10 END, 10,
              CASE WHEN $9 = 'past_due' THEN current_date - 3
                   WHEN $9 = 'trial' THEN current_date + 10
                   ELSE (date_trunc('month', current_date) + interval '1 month' + interval '9 days')::date END,
              true, now() - interval '70 days'
         FROM plan p WHERE p.id = $8
       ON CONFLICT (slug) DO NOTHING`,
      [localId, l.nombre, l.barrio, l.direccion, l.instagram ?? '', l.descripcion, JSON.stringify({ categoria: l.categoria }), planId, status],
    )
    await pool.query(`UPDATE locales SET client_id = (SELECT id FROM client WHERE slug = $1) WHERE id = $1 AND client_id IS NULL`, [localId])
    // Un pago registrado en el período anterior para que "Plan y pagos" no esté vacío (solo los activos).
    if (status === 'active') {
      await pool.query(
        `INSERT INTO payment (client_id, period, amount_cents, currency, status, method, due_date, paid_at)
         SELECT c.id, to_char(date_trunc('month', current_date), 'YYYY-MM'), c.monthly_price_cents, 'ARS', 'paid', 'transferencia',
                (date_trunc('month', current_date) + interval '9 days')::date, now() - interval '5 days'
           FROM client c WHERE c.slug = $1
         ON CONFLICT (client_id, period) DO NOTHING`,
        [localId],
      )
    }
  }

  // 3. Comensales demo (sin contraseña: no pueden ingresar). Ids fijos → idempotente.
  const usuarios = []
  for (let i = 0; i < 30; i++) {
    const id = `demo-comensal-${String(i + 1).padStart(2, '0')}`
    const nombre = `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7) % APELLIDOS.length]}`
    const dias = Math.floor(60 * Math.sqrt(((i * 37) % 30) / 30)) // más altas en las últimas semanas
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, 'member', now() - make_interval(days => $4::int), now())
       ON CONFLICT (id) DO NOTHING`,
      [id, nombre, `${id}@demo.example.com`, 60 - dias],
    )
    const cats = [...new Set([CATEGORIAS[i % 8], CATEGORIAS[(i * 3 + 1) % 8], CATEGORIAS[(i * 5 + 2) % 8]])]
    const premium = i % 4 === 0
    await pool.query(
      `INSERT INTO perfiles (user_id, nombre, categorias, precio, onboarding_ok, puntos, es_premium, premium_desde, is_demo, created_at)
       VALUES ($1, $2, $3, $4, true, $5, $6, CASE WHEN $6 THEN now() - make_interval(days => $7::int) END, true, now() - make_interval(days => $8::int))
       ON CONFLICT (user_id) DO NOTHING`,
      [id, nombre, cats, (i % 3) + 1, (i * 83) % 900, premium, 1 + (i % 40), 60 - dias],
    )
    if (premium) {
      await pool.query(
        `INSERT INTO suscripciones (id, user_id, monto_usd, estado, inicio) VALUES ($1, $2, 2, 'activa', now() - make_interval(days => $3::int))
         ON CONFLICT (id) DO NOTHING`,
        [uuidDe(`suscripcion-${id}`), id, 1 + (i % 40)],
      )
    }
    usuarios.push({ id, nombre })
  }

  // Popularidad tipo "long tail" (los clientes demo, un poco más arriba).
  const peso = Object.fromEntries(ids.map((id, i) => [id, 1 / (1 + ((i * 7) % 23)) + (demoClients.some((c) => c[0] === id) ? 0.5 : 0)]))
  const totalPeso = Object.values(peso).reduce((a, b) => a + b, 0)
  const localPopular = () => {
    let r = azar() * totalPeso
    for (const id of ids) {
      r -= peso[id]
      if (r <= 0) return id
    }
    return ids[0]
  }

  // 4. Reseñas (ids determinísticos).
  for (const id of ids) {
    const cant = entero(3, 6)
    for (let i = 0; i < cant; i++) {
      const u = elegir(usuarios)
      const conFoto = azar() < 0.25
      const estrellas = azar() < 0.7 ? 5 : azar() < 0.8 ? 4 : 3
      const etiquetas = [...new Set([elegir(ETIQUETAS), elegir(ETIQUETAS)])]
      const texto = elegir(FRASES[categoriaDe[id]])
      const foto = conFoto ? elegir(fotosDe[id]) : null
      const dias = entero(0, 55)
      await pool.query(
        `INSERT INTO resenas (id, local_id, user_id, autor, estrellas, etiquetas, texto, foto, is_demo, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now() - make_interval(days => $9::int, hours => $10::int))
         ON CONFLICT (id) DO NOTHING`,
        [uuidDe(`resena-${id}-${i}`), id, u.id, u.nombre, estrellas, etiquetas, texto, foto, dias, entero(0, 20)],
      )
    }
  }
  await pool.query(
    `UPDATE resenas SET respuesta = '¡Gracias por venir! Los esperamos de nuevo 🙌' WHERE local_id = 'montecatini' AND estrellas = 5 AND is_demo AND respuesta IS NULL`,
  )

  // 5. Publicaciones: novedades, promos y (en los clientes) el menú.
  for (const id of ids) {
    const cliente = demoClients.some((c) => c[0] === id)
    if (azar() < 0.35 && !cliente) continue
    const cat = categoriaDe[id]
    const cant = cliente ? 3 : entero(1, 2)
    for (let i = 0; i < cant; i++) {
      await pool.query(
        `INSERT INTO publicaciones (id, local_id, tipo, texto, foto, created_at)
         VALUES ($1, $2, 'post', $3, $4, now() - make_interval(days => $5::int, hours => $6::int)) ON CONFLICT (id) DO NOTHING`,
        [uuidDe(`post-${id}-${i}`), id, POSTS[cat][i % POSTS[cat].length], fotosDe[id][i % fotosDe[id].length], entero(0, 20), entero(0, 20)],
      )
    }
    if (azar() < 0.4 || cliente) {
      // La promo vence en 14 días; si ya venció, se renueva (sigue siendo una sola fila).
      await pool.query(
        `INSERT INTO publicaciones (id, local_id, tipo, texto, foto, vence, created_at)
         VALUES ($1, $2, 'promo', $3, $4, current_date + 14, now() - make_interval(days => $5::int))
         ON CONFLICT (id) DO UPDATE SET vence = current_date + 14 WHERE publicaciones.vence < current_date`,
        [uuidDe(`promo-${id}`), id, PROMOS[cat], fotosDe[id][0], entero(0, 10)],
      )
    }
    if (cliente) {
      const platos = locales.find((l) => l.id === id).platos
      await pool.query(
        `INSERT INTO publicaciones (id, local_id, tipo, texto, foto, created_at)
         VALUES ($1, $2, 'menu', $3, $4, now() - interval '30 days') ON CONFLICT (id) DO NOTHING`,
        [uuidDe(`menu-${id}`), id, `Nuestra carta: ${platos.join(' · ')}. Consultá por opciones sin TACC.`, fotosDe[id][1] ?? fotosDe[id][0]],
      )
    }
  }

  // 6. Premios y patrocinios (los patrocinios vencidos se renuevan para que la demo siempre muestre anuncios).
  await pool.query(`INSERT INTO premios (id, titulo, local_id, costo) VALUES
    ('cafe', 'Café con medialunas gratis', 'la-fonte-doro', 400),
    ('churros', 'Docena de churros', 'manolo', 600),
    ('pinta', 'Pinta de regalo', 'antares', 800),
    ('descuento', '15% off en la cuenta', 'montecatini', 1200)
    ON CONFLICT (id) DO NOTHING`)
  for (const [localId, beneficio] of [
    ['montecatini', '10% off pagando con la app'],
    ['antares', '2x1 en pintas de 18 a 20 h'],
  ]) {
    await pool.query(
      `INSERT INTO patrocinios (id, local_id, beneficio, monto_usd, inicio, fin) VALUES ($1, $2, $3, 20, current_date - 10, current_date + 20)
       ON CONFLICT (id) DO UPDATE SET inicio = EXCLUDED.inicio, fin = EXCLUDED.fin WHERE patrocinios.fin < current_date`,
      [uuidDe(`patrocinio-${localId}`), localId, beneficio],
    )
  }

  // 7. Seguidores (PK compuesta → idempotente).
  for (const u of usuarios) {
    const sigue = new Set(Array.from({ length: entero(1, 6) }, localPopular))
    for (const l of sigue) {
      await pool.query(
        `INSERT INTO seguidores (user_id, local_id, created_at) VALUES ($1, $2, now() - make_interval(days => $3::int)) ON CONFLICT DO NOTHING`,
        [u.id, l, entero(0, 50)],
      )
    }
  }

  // 8. Actividad de los últimos 60 días: solo los días que todavía no tienen eventos demo.
  const { rows: faltan } = await pool.query(
    `SELECT to_char(d::date, 'YYYY-MM-DD') AS dia, ((now() AT TIME ZONE '${TZ}')::date - d::date) AS hace
       FROM generate_series((now() AT TIME ZONE '${TZ}')::date - 59, (now() AT TIME ZONE '${TZ}')::date, interval '1 day') d
      WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.is_demo AND (e.created_at AT TIME ZONE '${TZ}')::date = d::date)`,
  )
  const filas = []
  for (const { dia, hace } of faltan) {
    const fecha = new Date(`${dia}T12:00:00-03:00`)
    const finde = [0, 5, 6].includes(fecha.getUTCDay())
    const sesiones = Math.round((25 + (60 - hace) * 1.2) * (finde ? 1.4 : 1) * (0.85 + azar() * 0.3))
    for (let s = 0; s < sesiones; s++) {
      const u = azar() < 0.7 ? elegir(usuarios).id : null
      const hora = entero(8, 23)
      const minuto = entero(0, 59)
      const cuando = `${dia} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-03`
      if (new Date(cuando.replace(' ', 'T') + ':00') > new Date()) continue
      const local = localPopular()
      const ev = (tipo, localId = local, meta = {}) => filas.push([tipo, u, localId, JSON.stringify(meta), cuando])
      if (u) ev('sesion', null)
      ev('recomendacion')
      ev('view_local')
      if (azar() < 0.35) ev('click_instagram')
      if (azar() < 0.3) ev('click_como_llegar')
      if (azar() < 0.5) ev('impresion_anuncio', azar() < 0.6 ? 'montecatini' : 'antares')
      if (azar() < 0.06) ev('click_anuncio', azar() < 0.6 ? 'montecatini' : 'antares')
      if (u && azar() < 0.05) ev('reserva', local, { personas: entero(2, 6) })
      if (u && azar() < 0.04) ev('resena')
      if (u && azar() < 0.015) ev('canje')
    }
  }
  for (let i = 0; i < filas.length; i += 1000) {
    const lote = filas.slice(i, i + 1000)
    const valores = lote.map((_, k) => `($${k * 5 + 1},$${k * 5 + 2},$${k * 5 + 3},$${k * 5 + 4}::jsonb,$${k * 5 + 5}::timestamptz,true)`).join(',')
    await pool.query(`INSERT INTO events (tipo, user_id, local_id, meta, created_at, is_demo) VALUES ${valores}`, lote.flat())
  }
  if (filas.length) console.log(`[migrate] ${filas.length} eventos demo para ${faltan.length} día(s).`)

  // 9. Reservas de hoy para el panel de Montecatini (si las de la demo ya pasaron, se mueven a hoy).
  const premium = usuarios.filter((_, i) => i % 4 === 0)
  for (let i = 0; i < 4; i++) {
    await pool.query(
      `INSERT INTO reservas (id, local_id, user_id, fecha, hora, personas, codigo, estado)
       VALUES ($1, 'montecatini', $2, (now() AT TIME ZONE '${TZ}')::date, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET fecha = EXCLUDED.fecha, estado = EXCLUDED.estado WHERE reservas.fecha < EXCLUDED.fecha`,
      [uuidDe(`reserva-${i}`), premium[i].id, ['20:30', '21:00', '21:30', '22:00'][i], 2 + i, `RES-DEMO${i}`, i === 0 ? 'confirmada' : 'pendiente'],
    )
  }

  // 10. Usuarios demo con contraseña (opcional): solo si hay SEED_DEMO_PASSWORD. Nunca se hardcodea una contraseña.
  const password = process.env.SEED_DEMO_PASSWORD
  if (password && password.length >= 8) {
    const { hashPassword } = await import('better-auth/crypto')
    const hash = await hashPassword(password)
    const asegurarUsuario = async (email, name) => {
      let id = (await pool.query(`SELECT id FROM "user" WHERE lower(email) = $1`, [email])).rows[0]?.id
      if (!id) {
        id = randomUUID()
        await pool.query(`INSERT INTO "user" (id, name, email, "emailVerified", role) VALUES ($1, $2, $3, true, 'member')`, [id, name, email])
      }
      const updated = await pool.query(`UPDATE account SET password = $2, "updatedAt" = now() WHERE "userId" = $1 AND "providerId" = 'credential'`, [id, hash])
      if (!updated.rowCount) {
        await pool.query(`INSERT INTO account (id, "accountId", "providerId", "userId", password) VALUES ($1, $2, 'credential', $2, $3)`, [randomUUID(), id, hash])
      }
      return id
    }
    // Owner del local demo (Montecatini).
    const owner = await asegurarUsuario('local.demo@example.com', 'Local demo (Montecatini)')
    await pool.query(
      `INSERT INTO client_member (client_id, user_id, role) SELECT id, $1, 'owner' FROM client WHERE slug = 'montecatini' ON CONFLICT DO NOTHING`,
      [owner],
    )
    // Comensal demo con gustos cargados.
    const comensal = await asegurarUsuario('comensal.demo@example.com', 'Comensal demo')
    await pool.query(
      `INSERT INTO perfiles (user_id, nombre, categorias, precio, onboarding_ok, puntos, is_demo)
       VALUES ($1, 'Sofi', '{cafe,sushi,cerveza}', 2, true, 320, true) ON CONFLICT (user_id) DO NOTHING`,
      [comensal],
    )
    await pool.query(
      `INSERT INTO favoritos (user_id, local_id) VALUES ($1, 'antares'), ($1, 'la-fonte-doro') ON CONFLICT DO NOTHING`,
      [comensal],
    )
    await pool.query(`INSERT INTO seguidores (user_id, local_id) VALUES ($1, 'montecatini'), ($1, 'antares') ON CONFLICT DO NOTHING`, [comensal])
    console.log('[migrate] Usuarios demo listos: local.demo@example.com y comensal.demo@example.com (contraseña = SEED_DEMO_PASSWORD).')
  }
}
