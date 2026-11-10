import 'server-only'
import { q, q1, qd } from '../db'
import type { EstadoLocal } from '../tipos'

// Todas las métricas salen de la tabla events (y de perfiles / locales / patrocinios).
// Estas funciones NO chequean permisos: llamarlas SOLO después del guard (requireSuperadmin / requireLocal).

const TZ = 'America/Argentina/Buenos_Aires'

export interface Rango {
  desde: Date
  hasta: Date
}

export function rangoDesdeDias(dias: number): Rango {
  const hasta = new Date()
  return { desde: new Date(hasta.getTime() - dias * 86400000), hasta }
}

export interface KpisAdmin {
  usuarios_totales: number
  usuarios_nuevos: number
  usuarios_activos: number
  activos_hoy: number
  locales_activos: number
  locales_pendientes: number
  locales_suspendidos: number
  locales_clientes: number
  premium_total: number
  premium_nuevos: number
  mrr_usd: number
  patrocinios_activos: number
  ingresos_patrocinios_usd: number
  vistas: number
  clicks: number
  reservas: number
  resenas: number
  canjes: number
  impresiones_anuncios: number
  clicks_anuncios: number
}

export async function kpisAdmin(r: Rango): Promise<KpisAdmin> {
  const row = await q1<Record<keyof KpisAdmin, string | number>>(
    `SELECT
      (SELECT count(*) FROM perfiles)::int AS usuarios_totales,
      (SELECT count(*) FROM perfiles WHERE created_at BETWEEN $1 AND $2)::int AS usuarios_nuevos,
      (SELECT count(DISTINCT user_id) FROM events WHERE user_id IS NOT NULL AND created_at BETWEEN $1 AND $2)::int AS usuarios_activos,
      (SELECT count(DISTINCT user_id) FROM events WHERE user_id IS NOT NULL AND created_at > now() - interval '1 day')::int AS activos_hoy,
      (SELECT count(*) FROM locales WHERE estado = 'activo')::int AS locales_activos,
      (SELECT count(*) FROM locales WHERE estado = 'pendiente')::int AS locales_pendientes,
      (SELECT count(*) FROM locales WHERE estado = 'suspendido')::int AS locales_suspendidos,
      (SELECT count(*) FROM locales WHERE client_id IS NOT NULL)::int AS locales_clientes,
      (SELECT count(*) FROM perfiles WHERE es_premium)::int AS premium_total,
      (SELECT count(*) FROM events WHERE tipo = 'compra_premium' AND created_at BETWEEN $1 AND $2)::int AS premium_nuevos,
      (SELECT COALESCE(sum(monto_usd), 0) FROM suscripciones WHERE estado = 'activa')::float AS mrr_usd,
      (SELECT count(*) FROM patrocinios WHERE activo AND current_date BETWEEN inicio AND fin)::int AS patrocinios_activos,
      (SELECT COALESCE(sum(monto_usd), 0) FROM patrocinios WHERE activo AND current_date BETWEEN inicio AND fin)::float AS ingresos_patrocinios_usd,
      (SELECT count(*) FROM events WHERE tipo = 'view_local' AND created_at BETWEEN $1 AND $2)::int AS vistas,
      (SELECT count(*) FROM events WHERE tipo IN ('click_instagram','click_como_llegar','click_anuncio') AND created_at BETWEEN $1 AND $2)::int AS clicks,
      (SELECT count(*) FROM events WHERE tipo = 'reserva' AND created_at BETWEEN $1 AND $2)::int AS reservas,
      (SELECT count(*) FROM events WHERE tipo = 'resena' AND created_at BETWEEN $1 AND $2)::int AS resenas,
      (SELECT count(*) FROM events WHERE tipo = 'canje' AND created_at BETWEEN $1 AND $2)::int AS canjes,
      (SELECT count(*) FROM events WHERE tipo = 'impresion_anuncio' AND created_at BETWEEN $1 AND $2)::int AS impresiones_anuncios,
      (SELECT count(*) FROM events WHERE tipo = 'click_anuncio' AND created_at BETWEEN $1 AND $2)::int AS clicks_anuncios`,
    [r.desde, r.hasta],
  )
  return Object.fromEntries(Object.entries(row ?? {}).map(([k, v]) => [k, Number(v)])) as unknown as KpisAdmin
}

export async function activosPorDia(r: Rango) {
  const rows = await q<{ dia: string; activos: number; nuevos: number }>(
    `WITH dias AS (
       SELECT generate_series(($1::timestamptz AT TIME ZONE '${TZ}')::date, ($2::timestamptz AT TIME ZONE '${TZ}')::date, '1 day')::date AS dia
     )
     SELECT to_char(d.dia, 'YYYY-MM-DD') AS dia,
            (SELECT count(DISTINCT e.user_id) FROM events e
              WHERE e.user_id IS NOT NULL AND (e.created_at AT TIME ZONE '${TZ}')::date = d.dia)::int AS activos,
            (SELECT count(*) FROM perfiles p WHERE (p.created_at AT TIME ZONE '${TZ}')::date = d.dia)::int AS nuevos
       FROM dias d ORDER BY d.dia`,
    [r.desde, r.hasta],
  )
  return rows
}

/** Serie diaria con una columna por tipo de evento: [{ dia, view_local: 10, reserva: 2, … }] */
export async function serieEventos(r: Rango, localId: string | null = null) {
  const rows = await q<{ dia: string; tipo: string; cantidad: number }>(
    `SELECT to_char((created_at AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD') AS dia, tipo, count(*)::int AS cantidad
       FROM events
      WHERE created_at BETWEEN $1 AND $2 AND ($3::text IS NULL OR local_id = $3)
      GROUP BY 1, 2 ORDER BY 1`,
    [r.desde, r.hasta, localId],
  )
  const porDia = new Map<string, Record<string, number | string>>()
  for (const fila of rows) {
    const d = porDia.get(fila.dia) ?? { dia: fila.dia }
    d[fila.tipo] = fila.cantidad
    porDia.set(fila.dia, d)
  }
  return [...porDia.values()]
}

export async function rankingLocales(r: Rango, limite = 10) {
  return q<{ local_id: string; nombre: string; categoria: string; vistas: number; clicks: number; reservas: number; seguidores: number }>(
    `SELECT l.id AS local_id, l.nombre, l.categoria,
            count(e.id) FILTER (WHERE e.tipo = 'view_local')::int AS vistas,
            count(e.id) FILTER (WHERE e.tipo IN ('click_instagram','click_como_llegar'))::int AS clicks,
            count(e.id) FILTER (WHERE e.tipo = 'reserva')::int AS reservas,
            (SELECT count(*) FROM seguidores s WHERE s.local_id = l.id)::int AS seguidores
       FROM locales l
       LEFT JOIN events e ON e.local_id = l.id AND e.created_at BETWEEN $1 AND $2
      WHERE l.estado = 'activo'
      GROUP BY l.id
      ORDER BY 4 DESC, l.nombre
      LIMIT $3`,
    [r.desde, r.hasta, limite],
  )
}

export interface KpisLocal {
  vistas: number
  clicks_instagram: number
  clicks_como_llegar: number
  reservas: number
  recomendaciones: number
  impresiones_anuncio: number
  clicks_anuncio: number
  seguidores: number
  nuevos_seguidores: number
  rating: number
  cantidad_resenas: number
}

/** KPIs de UN local. El localId tiene que salir del guard (sesión → membresía → client_id → local). */
export async function kpisLocal(localId: string, r: Rango): Promise<KpisLocal> {
  const row = await q1<Record<keyof KpisLocal, string | number>>(
    `SELECT
      count(*) FILTER (WHERE tipo = 'view_local')::int AS vistas,
      count(*) FILTER (WHERE tipo = 'click_instagram')::int AS clicks_instagram,
      count(*) FILTER (WHERE tipo = 'click_como_llegar')::int AS clicks_como_llegar,
      count(*) FILTER (WHERE tipo = 'reserva')::int AS reservas,
      count(*) FILTER (WHERE tipo = 'recomendacion')::int AS recomendaciones,
      count(*) FILTER (WHERE tipo = 'impresion_anuncio')::int AS impresiones_anuncio,
      count(*) FILTER (WHERE tipo = 'click_anuncio')::int AS clicks_anuncio,
      (SELECT count(*) FROM seguidores WHERE local_id = $1)::int AS seguidores,
      (SELECT count(*) FROM seguidores WHERE local_id = $1 AND created_at BETWEEN $2 AND $3)::int AS nuevos_seguidores,
      (SELECT COALESCE(round(avg(estrellas)::numeric, 1), 0) FROM resenas WHERE local_id = $1 AND NOT oculta)::float AS rating,
      (SELECT count(*) FROM resenas WHERE local_id = $1 AND NOT oculta)::int AS cantidad_resenas
     FROM events
     WHERE local_id = $1 AND created_at BETWEEN $2 AND $3`,
    [localId, r.desde, r.hasta],
  )
  return Object.fromEntries(Object.entries(row ?? {}).map(([k, v]) => [k, Number(v)])) as unknown as KpisLocal
}

// ───────── Gestión del equipo (/plataforma) ─────────

export async function localesParaGestion() {
  return qd<{
    id: string
    nombre: string
    categoria: string
    barrio: string
    estado: EstadoLocal
    created_at: string
    client_id: string | null
    client_name: string | null
    client_status: string | null
  }>(
    `SELECT l.id, l.nombre, l.categoria, l.barrio, l.estado, l.created_at, l.client_id, c.name AS client_name, c.status AS client_status
       FROM locales l LEFT JOIN client c ON c.id = l.client_id
      ORDER BY (l.client_id IS NULL), l.estado, l.nombre`,
  )
}

export async function cambiarEstadoLocal(id: string, estado: EstadoLocal) {
  await q(`UPDATE locales SET estado = $2 WHERE id = $1`, [id, estado])
}

/** Comensales (usuarios finales con perfil). */
export async function usuariosParaGestion() {
  return qd<{ id: string; nombre: string; email: string; es_premium: boolean; puntos: number; created_at: string; resenas: number; demo: boolean }>(
    `SELECT p.user_id AS id, p.nombre, u.email, p.es_premium, p.puntos, p.created_at, p.is_demo AS demo,
            (SELECT count(*) FROM resenas r WHERE r.user_id = p.user_id)::int AS resenas
       FROM perfiles p JOIN "user" u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT 500`,
  )
}

export async function resenasParaModerar() {
  return qd<{ id: string; autor: string; estrellas: number; texto: string; oculta: boolean; created_at: string; local: { nombre: string } | null }>(
    `SELECT r.id, r.autor, r.estrellas::int AS estrellas, r.texto, r.oculta, r.created_at, json_build_object('nombre', l.nombre) AS local
       FROM resenas r JOIN locales l ON l.id = r.local_id
      ORDER BY r.created_at DESC LIMIT 100`,
  )
}

export async function moderarResena(id: string, oculta: boolean) {
  await q(`UPDATE resenas SET oculta = $2 WHERE id = $1`, [id, oculta])
}

export async function premiosParaGestion() {
  return qd<{ id: string; titulo: string; local_id: string; costo: number; activo: boolean; local: { nombre: string } | null }>(
    `SELECT p.id, p.titulo, p.local_id, p.costo, p.activo, json_build_object('nombre', l.nombre) AS local
       FROM premios p JOIN locales l ON l.id = p.local_id ORDER BY p.costo`,
  )
}

export async function guardarPremio(datos: { id: string; titulo: string; local_id: string; costo: number }) {
  await q(
    `INSERT INTO premios (id, titulo, local_id, costo, activo) VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, local_id = EXCLUDED.local_id, costo = EXCLUDED.costo, activo = true`,
    [datos.id, datos.titulo, datos.local_id, datos.costo],
  )
}

export async function alternarPremio(id: string, activo: boolean) {
  await q(`UPDATE premios SET activo = $2 WHERE id = $1`, [id, activo])
}
