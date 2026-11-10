import { bigint, bigserial, boolean, customType, date, doublePrecision, integer, jsonb, numeric, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' })

// Esquema de la base (referencia tipada). Las tablas las crea scripts/migrate.mjs (idempotente).
// Si agregás una columna, sumala en los dos lugares.

// ---------- better-auth ----------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('member'), // superadmin | member
  mustChangePassword: boolean('mustChangePassword').notNull().default(false),
  tempPasswordExpiresAt: timestamp('tempPasswordExpiresAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// ---------- planes y clientes (locales gastronómicos que contratan) ----------
export const plan = pgTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  features: jsonb('features').notNull().default([]),
  monthlyPriceCents: bigint('monthly_price_cents', { mode: 'number' }).notNull().default(0),
  currency: text('currency').notNull().default('ARS'),
  trialDays: integer('trial_days').notNull().default(14),
  limits: jsonb('limits').notNull().default({}),
  sort: integer('sort').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const client = pgTable('client', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  taxId: text('tax_id'),
  city: text('city'),
  neighborhood: text('neighborhood'),
  address: text('address'),
  instagram: text('instagram'),
  website: text('website'),
  phone: text('phone'),
  contactEmail: text('contact_email'),
  description: text('description'),
  data: jsonb('data').notNull().default({}),
  planId: text('plan_id').references(() => plan.id),
  monthlyPriceCents: bigint('monthly_price_cents', { mode: 'number' }).notNull().default(0),
  currency: text('currency').notNull().default('ARS'),
  status: text('status').notNull().default('trial'), // trial | active | past_due | paused | cancelled
  trialEndsAt: date('trial_ends_at'),
  billingDay: integer('billing_day'),
  nextDueDate: date('next_due_date'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const clientMember = pgTable(
  'client_member',
  {
    clientId: uuid('client_id').notNull().references(() => client.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('staff'), // owner | staff
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.clientId, t.userId] })],
)

export const clientInvite = pgTable('client_invite', {
  token: text('token').primaryKey(),
  kind: text('kind').notNull(), // personal | campaign
  email: text('email'),
  label: text('label'),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const clientApplication = pgTable('client_application', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviteToken: text('invite_token').references(() => clientInvite.token),
  resumeKey: text('resume_key').notNull(),
  email: text('email').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  step: integer('step').notNull().default(1),
  data: jsonb('data').notNull().default({}),
  requestedPlanId: text('requested_plan_id').references(() => plan.id),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  status: text('status').notNull().default('draft'), // draft | pending_review | changes_requested | approved | rejected
  reviewReason: text('review_reason'),
  reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  clientId: uuid('client_id').references(() => client.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => client.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull().default('ARS'),
  status: text('status').notNull().default('pending'), // pending | paid | overdue | void
  method: text('method'),
  dueDate: date('due_date').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  registeredBy: text('registered_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const emailOutbox = pgTable('email_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  template: text('template'),
  status: text('status').notNull().default('queued'), // queued | sent | failed | outbox_only
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
})

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorUserId: text('actor_user_id'),
  actorRole: text('actor_role'),
  clientId: uuid('client_id'),
  action: text('action').notNull(),
  entity: text('entity'),
  entityId: text('entity_id'),
  detail: jsonb('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------- producto: comensales, locales y actividad ----------
// Perfil del comensal (usuario final). user_id = user.id de better-auth.
export const perfiles = pgTable('perfiles', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull().default(''),
  categorias: text('categorias').array().notNull().default([]),
  precio: smallint('precio').notNull().default(2),
  modo: text('modo').notNull().default('descubrir'),
  onboardingOk: boolean('onboarding_ok').notNull().default(false),
  aprendizaje: jsonb('aprendizaje').notNull(),
  esPremium: boolean('es_premium').notNull().default(false),
  premiumDesde: timestamp('premium_desde', { withTimezone: true }),
  puntos: integer('puntos').notNull().default(50),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Locales: los listados públicos + los que contratan (client_id = empresa aprobada).
export const locales = pgTable('locales', {
  id: text('id').primaryKey(),
  clientId: uuid('client_id').unique().references(() => client.id, { onDelete: 'set null' }),
  nombre: text('nombre').notNull(),
  categoria: text('categoria').notNull(),
  barrio: text('barrio').notNull().default(''),
  direccion: text('direccion').notNull().default(''),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  precio: smallint('precio').notNull().default(2),
  momentos: text('momentos').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  platos: text('platos').array().notNull().default([]),
  descripcion: text('descripcion').notNull().default(''),
  instagram: text('instagram').notNull().default(''),
  horarios: text('horarios').notNull().default(''),
  fotos: text('fotos').array().notNull().default([]),
  nicho: boolean('nicho').notNull().default(false),
  estado: text('estado').notNull().default('activo'), // pendiente | activo | suspendido
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const publicaciones = pgTable('publicaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull().default('post'), // post | promo | menu
  texto: text('texto').notNull(),
  foto: text('foto'),
  vence: date('vence'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const resenas = pgTable('resenas', {
  id: uuid('id').primaryKey().defaultRandom(),
  localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  autor: text('autor').notNull().default(''),
  estrellas: smallint('estrellas').notNull(),
  etiquetas: text('etiquetas').array().notNull().default([]),
  texto: text('texto').notNull().default(''),
  foto: text('foto'),
  respuesta: text('respuesta'),
  oculta: boolean('oculta').notNull().default(false),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const seguidores = pgTable(
  'seguidores',
  {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.localId] })],
)

export const favoritos = pgTable(
  'favoritos',
  {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.localId] })],
)

export const reservas = pgTable('reservas', {
  id: uuid('id').primaryKey().defaultRandom(),
  localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  fecha: date('fecha').notNull(),
  hora: text('hora').notNull(),
  personas: smallint('personas').notNull(),
  codigo: text('codigo').notNull().unique(),
  estado: text('estado').notNull().default('pendiente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const premios = pgTable('premios', {
  id: text('id').primaryKey(),
  titulo: text('titulo').notNull(),
  localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
  costo: integer('costo').notNull(),
  activo: boolean('activo').notNull().default(true),
})

export const canjes = pgTable('canjes', {
  id: uuid('id').primaryKey().defaultRandom(),
  premioId: text('premio_id').notNull().references(() => premios.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull().unique(),
  usado: boolean('usado').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const suscripciones = pgTable('suscripciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull().default('premium-mensual'),
  montoUsd: numeric('monto_usd', { precision: 10, scale: 2 }).notNull(),
  proveedor: text('proveedor').notNull().default('simulado'),
  estado: text('estado').notNull().default('activa'),
  inicio: timestamp('inicio', { withTimezone: true }).notNull().defaultNow(),
  fin: timestamp('fin', { withTimezone: true }),
})

export const patrocinios = pgTable('patrocinios', {
  id: uuid('id').primaryKey().defaultRandom(),
  localId: text('local_id').notNull().references(() => locales.id, { onDelete: 'cascade' }),
  beneficio: text('beneficio').notNull(),
  montoUsd: numeric('monto_usd', { precision: 10, scale: 2 }).notNull(),
  inicio: date('inicio').notNull(),
  fin: date('fin').notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Analítica: fuente de todas las métricas. user_id sin FK a propósito (la actividad demo usa ids sintéticos).
export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tipo: text('tipo').notNull(),
  userId: text('user_id'),
  localId: text('local_id'),
  meta: jsonb('meta').notNull().default({}),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const ajustes = pgTable('ajustes', {
  clave: text('clave').primaryKey(),
  valor: text('valor').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const refiConsultas = pgTable('refi_consultas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull().default('texto'),
  texto: text('texto').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Fotos subidas por locales y comensales (reemplaza Supabase Storage). Se sirven en /api/fotos/[id].
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => client.id, { onDelete: 'cascade' }),
  contentType: text('content_type').notNull(),
  bytes: integer('bytes').notNull(),
  data: bytea('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
