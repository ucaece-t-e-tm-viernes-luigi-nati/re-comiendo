import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

/** Conexión directa a Postgres (sólo para scripts: migraciones y seed). */
export async function conectar() {
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
  if (!url) throw new Error('Falta POSTGRES_URL en .env.local (corré `vercel env pull .env.local`)')
  const client = new pg.Client({
    connectionString: url.replace(/[?&]sslmode=[^&]*/, ''),
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  await client.query('create schema if not exists private')
  return client
}
