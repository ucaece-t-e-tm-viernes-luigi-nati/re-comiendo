import 'server-only'
import { q, qd, qd1 } from '../db'
import type { Categoria, Local, Patrocinio, Precio, Publicacion, Resena } from '../tipos'
import type { Señales } from './recomendador'

/**
 * Condición de visibilidad pública de un local (alias l):
 * - estado 'activo' (el equipo puede suspender cualquier listado), y
 * - si es cliente (client_id), que la empresa no esté pausada ni dada de baja.
 */
export const LOCAL_VISIBLE = `l.estado = 'activo' AND (l.client_id IS NULL OR EXISTS (
  SELECT 1 FROM client c WHERE c.id = l.client_id AND c.status IN ('trial','active','past_due')))`

export const LOCAL_COLS = `l.id, l.client_id, l.nombre, l.categoria, l.barrio, l.direccion, l.lat, l.lng, l.precio::int AS precio, l.momentos, l.tags,
  l.platos, l.descripcion, l.instagram, l.horarios, l.fotos, l.nicho, l.estado, l.created_at`

export interface FiltrosBusqueda {
  texto?: string
  categoria?: Categoria
  precio?: Precio
  tags?: string[]
  barrio?: string
}

/** Locales visibles, con filtros opcionales. */
export async function listarLocales(filtros: FiltrosBusqueda = {}): Promise<Local[]> {
  const where = [LOCAL_VISIBLE]
  const params: unknown[] = []
  const add = (sql: string, value: unknown) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }
  if (filtros.categoria) add('l.categoria = ?', filtros.categoria)
  if (filtros.precio) add('l.precio = ?', filtros.precio)
  if (filtros.barrio) add('l.barrio = ?', filtros.barrio)
  if (filtros.tags?.length) add('l.tags @> ?::text[]', filtros.tags)
  if (filtros.texto?.trim()) {
    params.push(`%${filtros.texto.trim().replace(/[%_\\]/g, ' ')}%`)
    const n = `$${params.length}`
    where.push(`(l.nombre ILIKE ${n} OR l.descripcion ILIKE ${n} OR l.barrio ILIKE ${n} OR array_to_string(l.platos, ' ') ILIKE ${n})`)
  }
  return qd<Local>(`SELECT ${LOCAL_COLS} FROM locales l WHERE ${where.join(' AND ')} ORDER BY l.nombre`, params)
}

/** Un local visible al público (o null). */
export async function obtenerLocal(id: string): Promise<Local | null> {
  return qd1<Local>(`SELECT ${LOCAL_COLS} FROM locales l WHERE l.id = $1 AND ${LOCAL_VISIBLE}`, [id])
}

/** Un local por id sin filtro de visibilidad (paneles internos, después del guard). */
export async function obtenerLocalInterno(id: string): Promise<Local | null> {
  return qd1<Local>(`SELECT ${LOCAL_COLS} FROM locales l WHERE l.id = $1`, [id])
}

/** Rating, cantidad de reseñas y popularidad (30 días) de todos los locales (para el algoritmo y las tarjetas). */
export async function obtenerSeñales(): Promise<Record<string, Señales>> {
  const rows = await q<{ local_id: string; rating: string; cantidad_resenas: number; popularidad: number }>(
    `SELECT l.id AS local_id,
            COALESCE(round(avg(r.estrellas)::numeric, 1), 0)::text AS rating,
            count(r.id)::int AS cantidad_resenas,
            (SELECT count(*) FROM events e
              WHERE e.local_id = l.id AND e.tipo IN ('view_local','reserva') AND e.created_at > now() - interval '30 days')::int AS popularidad
       FROM locales l
       LEFT JOIN resenas r ON r.local_id = l.id AND NOT r.oculta
      GROUP BY l.id`,
  )
  return Object.fromEntries(
    rows.map((s) => [s.local_id, { rating: Number(s.rating), cantidadResenas: s.cantidad_resenas, popularidad: s.popularidad }]),
  )
}

/** Patrocinios vigentes de locales visibles. */
export async function patrocinadosActivos(): Promise<Patrocinio[]> {
  return qd<Patrocinio>(
    `SELECT p.id, p.local_id, p.beneficio, p.monto_usd::float AS monto_usd, p.inicio, p.fin, p.activo
       FROM patrocinios p JOIN locales l ON l.id = p.local_id
      WHERE p.activo AND current_date BETWEEN p.inicio AND p.fin AND ${LOCAL_VISIBLE}`,
  )
}

export async function resenasDeLocal(localId: string): Promise<Resena[]> {
  return qd<Resena>(
    `SELECT id, local_id, user_id, autor, estrellas::int AS estrellas, etiquetas, texto, foto, respuesta, oculta, created_at
       FROM resenas WHERE local_id = $1 AND NOT oculta ORDER BY created_at DESC LIMIT 30`,
    [localId],
  )
}

export async function publicacionesDeLocal(localId: string): Promise<Publicacion[]> {
  return qd<Publicacion>(
    `SELECT id, local_id, tipo, texto, foto, vence, created_at FROM publicaciones
      WHERE local_id = $1 AND (vence IS NULL OR vence >= current_date)
      ORDER BY created_at DESC LIMIT 24`,
    [localId],
  )
}

export async function barrios(): Promise<string[]> {
  const rows = await q<{ barrio: string }>(`SELECT DISTINCT l.barrio FROM locales l WHERE ${LOCAL_VISIBLE} AND l.barrio <> '' ORDER BY 1`)
  return rows.map((r) => r.barrio)
}

/** Turnos de media hora para reservar. Los ocupados se calculan con las reservas reales del día. */
export async function turnosDisponibles(localId: string, ahora = new Date()) {
  const fecha = fechaLocal(ahora)
  const rows = await q<{ hora: string; personas: number }>(
    `SELECT hora, personas FROM reservas WHERE local_id = $1 AND fecha = $2::date AND estado <> 'cancelada'`,
    [localId, fecha],
  )
  const ocupados = new Map<string, number>()
  for (const r of rows) ocupados.set(r.hora, (ocupados.get(r.hora) ?? 0) + r.personas)

  const base = new Date(ahora)
  base.setSeconds(0, 0)
  base.setMinutes(base.getMinutes() < 30 ? 30 : 60)
  const CAPACIDAD = 20
  return Array.from({ length: 6 }, (_, i) => {
    const t = new Date(base.getTime() + i * 30 * 60000)
    const hora = t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })
    const usados = ocupados.get(hora) ?? 0
    const estado = usados >= CAPACIDAD ? 'lleno' : usados >= CAPACIDAD * 0.7 ? 'pocos' : 'libre'
    return { hora, estado: estado as 'libre' | 'pocos' | 'lleno' }
  })
}

export function fechaLocal(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}
