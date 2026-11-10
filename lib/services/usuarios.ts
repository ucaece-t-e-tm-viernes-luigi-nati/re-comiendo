import 'server-only'
import { randomInt } from 'node:crypto'
import { q, q1, qd, tx } from '../db'
import type { Canje, Categoria, Local, Modo, Perfil, Precio, Premio, Publicacion, Resena, Reserva } from '../tipos'
import { PUNTOS, PREMIUM_USD } from '../tipos'
import { registrarEvento } from './eventos'
import { fechaLocal, LOCAL_COLS, LOCAL_VISIBLE } from './locales'

// Área del comensal. Todas las funciones reciben el perfil que resolvió requerirRol() (sesión del servidor).

export function generarCodigo(prefijo: string): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alfabeto[randomInt(alfabeto.length)]
  return `${prefijo}-${out}`
}

const localJson = (alias = 'l') => `json_build_object('nombre', ${alias}.nombre)`

// ───────── Gustos ─────────
export async function guardarGustos(perfil: Perfil, datos: { nombre: string; categorias: Categoria[]; precio: Precio; modo: Modo }) {
  await q(`UPDATE perfiles SET nombre = $2, categorias = $3, precio = $4, modo = $5, onboarding_ok = true WHERE user_id = $1`, [
    perfil.id,
    datos.nombre,
    datos.categorias,
    datos.precio,
    datos.modo,
  ])
  await q(`UPDATE "user" SET name = $2, "updatedAt" = now() WHERE id = $1`, [perfil.id, datos.nombre])
}

// ───────── Reseñas (suman puntos) ─────────
export async function publicarResena(
  perfil: Perfil,
  datos: { localId: string; estrellas: number; etiquetas: string[]; texto: string; foto?: string | null },
) {
  const ganados = PUNTOS.resena + (datos.foto ? PUNTOS.foto : 0)
  await tx(async (db) => {
    const { rowCount } = await db.query(
      `INSERT INTO resenas (local_id, user_id, autor, estrellas, etiquetas, texto, foto)
       SELECT l.id, $2, $3, $4, $5, $6, $7 FROM locales l WHERE l.id = $1 AND ${LOCAL_VISIBLE}`,
      [datos.localId, perfil.id, perfil.nombre, datos.estrellas, datos.etiquetas, datos.texto, datos.foto ?? null],
    )
    if (!rowCount) throw new Error('local_no_disponible')
    await db.query(`UPDATE perfiles SET puntos = puntos + $2 WHERE user_id = $1`, [perfil.id, ganados])
  })
  await registrarEvento('resena', { userId: perfil.id, localId: datos.localId, meta: { estrellas: datos.estrellas } })
  return ganados
}

export async function misResenas(userId: string): Promise<(Resena & { local: Pick<Local, 'nombre'> | null })[]> {
  return qd(
    `SELECT r.id, r.local_id, r.user_id, r.autor, r.estrellas::int AS estrellas, r.etiquetas, r.texto, r.foto, r.respuesta, r.oculta, r.created_at,
            ${localJson()} AS local
       FROM resenas r JOIN locales l ON l.id = r.local_id
      WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
    [userId],
  )
}

// ───────── Puntos y cupones ─────────
export async function listarPremios(): Promise<(Premio & { local: Pick<Local, 'nombre'> | null })[]> {
  return qd(
    `SELECT p.id, p.titulo, p.local_id, p.costo, p.activo, ${localJson()} AS local
       FROM premios p JOIN locales l ON l.id = p.local_id
      WHERE p.activo AND ${LOCAL_VISIBLE} ORDER BY p.costo`,
  )
}

export async function canjearPremio(perfil: Perfil, premioId: string) {
  try {
    return await tx(async (db) => {
      const { rows: [premio] } = await db.query<{ id: string; costo: number; local_id: string }>(
        `SELECT p.id, p.costo, p.local_id FROM premios p JOIN locales l ON l.id = p.local_id WHERE p.id = $1 AND p.activo AND ${LOCAL_VISIBLE}`,
        [premioId],
      )
      if (!premio) return { error: 'Ese premio ya no está disponible' }
      // Atómico: no permite saldo negativo.
      const { rowCount } = await db.query(`UPDATE perfiles SET puntos = puntos - $2 WHERE user_id = $1 AND puntos >= $2`, [perfil.id, premio.costo])
      if (!rowCount) return { error: 'No te alcanzan los puntos' }
      const codigo = generarCodigo('RC')
      await db.query(`INSERT INTO canjes (premio_id, user_id, codigo) VALUES ($1, $2, $3)`, [premioId, perfil.id, codigo])
      await registrarEvento('canje', { userId: perfil.id, localId: premio.local_id, meta: { premio: premioId } })
      return { codigo }
    })
  } catch {
    return { error: 'No pudimos hacer el canje, probá de nuevo' }
  }
}

export async function misCanjes(userId: string): Promise<(Canje & { premio: (Premio & { local: { nombre: string } | null }) | null })[]> {
  return qd(
    `SELECT c.id, c.premio_id, c.user_id, c.codigo, c.usado, c.created_at,
            json_build_object('id', p.id, 'titulo', p.titulo, 'local_id', p.local_id, 'costo', p.costo, 'activo', p.activo, 'local', ${localJson()}) AS premio
       FROM canjes c JOIN premios p ON p.id = c.premio_id JOIN locales l ON l.id = p.local_id
      WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
    [userId],
  )
}

// ───────── Premium (pago simulado) ─────────
/** Activa Premium. proveedor queda en 'simulado'; acá se conectaría Mercado Pago. */
export async function activarPremium(perfil: Perfil) {
  if (perfil.es_premium) return
  await tx(async (db) => {
    await db.query(`UPDATE perfiles SET es_premium = true, premium_desde = now() WHERE user_id = $1`, [perfil.id])
    await db.query(`INSERT INTO suscripciones (user_id, monto_usd, estado) VALUES ($1, $2, 'activa')`, [perfil.id, PREMIUM_USD])
  })
  await registrarEvento('compra_premium', { userId: perfil.id, meta: { monto_usd: PREMIUM_USD } })
}

export async function cancelarPremium(perfil: Perfil) {
  await tx(async (db) => {
    await db.query(`UPDATE perfiles SET es_premium = false WHERE user_id = $1`, [perfil.id])
    await db.query(`UPDATE suscripciones SET estado = 'cancelada', fin = now() WHERE user_id = $1 AND estado = 'activa'`, [perfil.id])
  })
}

// ───────── Reservas (Premium) ─────────
export async function reservar(perfil: Perfil, datos: { localId: string; hora: string; personas: number }) {
  if (!perfil.es_premium) return { error: 'Las reservas son para usuarios Premium' }
  const codigo = generarCodigo('RES')
  try {
    const { length } = await q(
      `INSERT INTO reservas (local_id, user_id, fecha, hora, personas, codigo)
       SELECT l.id, $2, $3::date, $4, $5, $6 FROM locales l WHERE l.id = $1 AND ${LOCAL_VISIBLE} RETURNING id`,
      [datos.localId, perfil.id, fechaLocal(), datos.hora, datos.personas, codigo],
    )
    if (!length) return { error: 'Ese local no toma reservas por ahora' }
  } catch {
    return { error: 'No pudimos reservar, probá otro horario' }
  }
  await registrarEvento('reserva', { userId: perfil.id, localId: datos.localId, meta: { personas: datos.personas } })
  return { codigo }
}

export async function misReservas(userId: string): Promise<(Reserva & { local: Pick<Local, 'nombre'> | null })[]> {
  return qd(
    `SELECT r.id, r.local_id, r.user_id, r.fecha, r.hora, r.personas::int AS personas, r.codigo, r.estado, r.created_at, ${localJson()} AS local
       FROM reservas r JOIN locales l ON l.id = r.local_id
      WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
    [userId],
  )
}

export async function cancelarReserva(userId: string, reservaId: string) {
  await q(`UPDATE reservas SET estado = 'cancelada' WHERE id = $1 AND user_id = $2 AND estado IN ('pendiente','confirmada')`, [reservaId, userId])
}

// ───────── Social: seguir, favoritos y feed ─────────
async function alternar(tabla: 'seguidores' | 'favoritos', userId: string, localId: string) {
  const borrado = await q(`DELETE FROM ${tabla} WHERE user_id = $1 AND local_id = $2 RETURNING local_id`, [userId, localId])
  if (borrado.length) return false
  await q(`INSERT INTO ${tabla} (user_id, local_id) SELECT $1, id FROM locales WHERE id = $2 ON CONFLICT DO NOTHING`, [userId, localId])
  return true
}

export async function alternarSeguir(perfil: Perfil, localId: string) {
  const sigue = await alternar('seguidores', perfil.id, localId)
  if (sigue) await registrarEvento('seguir', { userId: perfil.id, localId })
  return sigue
}

export async function alternarFavorito(perfil: Perfil, localId: string) {
  return alternar('favoritos', perfil.id, localId)
}

export async function relacionCon(userId: string, localId: string) {
  const row = await q1<{ sigue: boolean; favorito: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM seguidores WHERE user_id = $1 AND local_id = $2) AS sigue,
            EXISTS (SELECT 1 FROM favoritos WHERE user_id = $1 AND local_id = $2) AS favorito`,
    [userId, localId],
  )
  return { sigue: !!row?.sigue, favorito: !!row?.favorito }
}

export async function misFavoritos(userId: string): Promise<Local[]> {
  return qd<Local>(
    `SELECT ${LOCAL_COLS} FROM favoritos f JOIN locales l ON l.id = f.local_id WHERE f.user_id = $1 AND ${LOCAL_VISIBLE} ORDER BY f.created_at DESC`,
    [userId],
  )
}

export async function localesQueSigo(userId: string): Promise<string[]> {
  const rows = await q<{ local_id: string }>(`SELECT local_id FROM seguidores WHERE user_id = $1`, [userId])
  return rows.map((x) => x.local_id)
}

export type ItemFeed =
  | { tipo: 'publicacion'; fecha: string; publicacion: Publicacion; local: Local }
  | { tipo: 'resena'; fecha: string; resena: Resena; local: Local }

function separar<T>(row: Record<string, unknown>): { item: T; local: Local } {
  const local: Record<string, unknown> = {}
  const item: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith('l_')) local[k.slice(2)] = v
    else item[k] = v
  }
  return { item: item as T, local: local as unknown as Local }
}

const LOCAL_COLS_PREFIJO = LOCAL_COLS.split(',')
  .map((c) => c.trim())
  .map((c) => {
    const [expr, alias] = c.split(/ AS /i)
    const nombre = alias ?? expr.replace(/^l\./, '')
    return `${expr} AS l_${nombre}`
  })
  .join(', ')

/**
 * Feed estilo Instagram: posts y promos de los locales que sigue + reseñas con foto de la
 * comunidad. Si no sigue a nadie, muestra lo más reciente de todos.
 */
export async function feed(userId: string | null): Promise<{ items: ItemFeed[]; sigueAlguno: boolean }> {
  const sigo = userId ? await localesQueSigo(userId) : []
  const [pubs, resenas] = await Promise.all([
    qd<Record<string, unknown>>(
      `SELECT p.id, p.local_id, p.tipo, p.texto, p.foto, p.vence, p.created_at, ${LOCAL_COLS_PREFIJO}
         FROM publicaciones p JOIN locales l ON l.id = p.local_id
        WHERE ${LOCAL_VISIBLE} AND ($1::text[] IS NULL OR p.local_id = ANY($1))
        ORDER BY p.created_at DESC LIMIT 30`,
      [sigo.length ? sigo : null],
    ),
    qd<Record<string, unknown>>(
      `SELECT r.id, r.local_id, r.user_id, r.autor, r.estrellas::int AS estrellas, r.etiquetas, r.texto, r.foto, r.respuesta, r.oculta, r.created_at,
              ${LOCAL_COLS_PREFIJO}
         FROM resenas r JOIN locales l ON l.id = r.local_id
        WHERE ${LOCAL_VISIBLE} AND NOT r.oculta AND r.foto IS NOT NULL
        ORDER BY r.created_at DESC LIMIT 15`,
    ),
  ])
  const items: ItemFeed[] = [
    ...pubs.map((row) => {
      const { item, local } = separar<Publicacion>(row)
      return { tipo: 'publicacion' as const, fecha: item.created_at, publicacion: item, local }
    }),
    ...resenas.map((row) => {
      const { item, local } = separar<Resena>(row)
      return { tipo: 'resena' as const, fecha: item.created_at, resena: item, local }
    }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))
  return { items, sigueAlguno: sigo.length > 0 }
}
