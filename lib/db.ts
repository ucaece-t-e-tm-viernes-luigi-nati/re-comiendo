import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, types, type PoolClient, type QueryResultRow } from 'pg'
import * as schema from './schema'

// Las columnas `date` (vence, fecha de reserva, trial_ends_at…) se leen como 'YYYY-MM-DD', sin corrimiento de zona horaria.
types.setTypeParser(1082, (value: string) => value)

// DATABASE_URL viene de Neon (en Vercel: Settings → Environment Variables; en tu PC: .env.local).
const globalForPool = globalThis as unknown as { recomiendoPool?: Pool }
export const pool = globalForPool.recomiendoPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
if (process.env.NODE_ENV !== 'production') globalForPool.recomiendoPool = pool

/** Drizzle con el esquema tipado (lib/schema.ts). Las consultas del MVP usan SQL parametrizado (q / q1 / tx). */
export const db = drizzle(pool, { schema })

/** Consulta SQL parametrizada. Devuelve las filas tipadas. */
export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  const result = await pool.query<T>(sql, params)
  return result.rows
}

export async function q1<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  const rows = await q<T>(sql, params)
  return rows[0] ?? null
}

function conFechasIso<T>(row: T): T {
  const out = { ...(row as Record<string, unknown>) }
  for (const [k, v] of Object.entries(out)) if (v instanceof Date) out[k] = v.toISOString()
  return out as T
}

/**
 * Como q(), pero los timestamps vuelven como string ISO (los tipos del dominio de la v2.1 usan string).
 * Además convierte numeric/bigint de agregados (que pg devuelve como texto) cuando se los castea con ::int / ::float en el SQL.
 */
export async function qd<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(sql, params)
  return result.rows.map((r) => conFechasIso(r) as T)
}

export async function qd1<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await qd<T>(sql, params)
  return rows[0] ?? null
}

/** Ejecuta varias sentencias en una transacción. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
