// Aplica las migraciones de supabase/migrations que todavía no corrieron.
// Uso: npm run db:migrar
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { conectar } from './db'

async function main() {
  const db = await conectar()
  await db.query('create table if not exists private.migraciones (nombre text primary key, aplicada timestamptz default now())')
  const { rows } = await db.query<{ nombre: string }>('select nombre from private.migraciones')
  const hechas = new Set(rows.map((r) => r.nombre))
  const dir = join(process.cwd(), 'supabase/migrations')
  for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (hechas.has(archivo)) continue
    console.log('Aplicando', archivo)
    await db.query('begin')
    try {
      await db.query(readFileSync(join(dir, archivo), 'utf8'))
      await db.query('insert into private.migraciones (nombre) values ($1)', [archivo])
      await db.query('commit')
    } catch (e) {
      await db.query('rollback')
      throw e
    }
  }
  await db.end()
  console.log('Migraciones al día')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
