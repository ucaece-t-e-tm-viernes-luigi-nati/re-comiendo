// Crea las tablas en la base de Neon. Corre solo antes de cada build (ver "build" en package.json).
// Es idempotente: se puede correr muchas veces sin romper nada. Sumá acá las tablas nuevas.
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.log('[migrate] Sin DATABASE_URL: se saltea la migración.')
  process.exit(0)
}

const statements = [
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
]

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const sql of statements) await pool.query(sql)
  console.log(`[migrate] OK (${statements.length} sentencias).`)
} finally {
  await pool.end()
}
