import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// DATABASE_URL viene de Neon (en Vercel: Settings → Environment Variables; en tu PC: .env.local).
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
export const db = drizzle(pool, { schema })
