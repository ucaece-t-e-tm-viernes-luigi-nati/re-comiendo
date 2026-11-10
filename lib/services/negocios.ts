import 'server-only'
import { q, q1, qd, tx } from '../db'
import type { Local, Publicacion, Resena, Reserva, TipoPublicacion } from '../tipos'
import { LOCAL_COLS } from './locales'

// Panel del local (/empresa). TODAS las funciones reciben el localId que resolvió el guard
// (sesión → membresía → client_id → local) y filtran por él: nunca por un id que venga del navegador.

/** El local de una empresa (cliente). */
export async function localDeCliente(clientId: string): Promise<Local | null> {
  const rows = await qd<Local>(`SELECT ${LOCAL_COLS} FROM locales l WHERE l.client_id = $1 LIMIT 1`, [clientId])
  return rows[0] ?? null
}

export async function actualizarFicha(
  localId: string,
  datos: Pick<Local, 'nombre' | 'barrio' | 'direccion' | 'lat' | 'lng' | 'precio' | 'momentos' | 'tags' | 'platos' | 'descripcion' | 'instagram' | 'horarios' | 'fotos'>,
) {
  await q(
    `UPDATE locales SET nombre = $2, barrio = $3, direccion = $4, lat = $5, lng = $6, precio = $7, momentos = $8, tags = $9,
            platos = $10, descripcion = $11, instagram = $12, horarios = $13, fotos = $14
      WHERE id = $1`,
    [localId, datos.nombre, datos.barrio, datos.direccion, datos.lat, datos.lng, datos.precio, datos.momentos, datos.tags, datos.platos,
      datos.descripcion, datos.instagram, datos.horarios, datos.fotos],
  )
}

// ───────── Publicaciones (novedades, menú y promos) ─────────
export async function publicacionesDe(localId: string): Promise<Publicacion[]> {
  return qd<Publicacion>(`SELECT id, local_id, tipo, texto, foto, vence, created_at FROM publicaciones WHERE local_id = $1 ORDER BY created_at DESC`, [localId])
}

export async function crearPublicacion(localId: string, datos: { tipo: TipoPublicacion; texto: string; foto: string | null; vence: string | null }) {
  await q(`INSERT INTO publicaciones (local_id, tipo, texto, foto, vence) VALUES ($1, $2, $3, $4, $5)`, [
    localId,
    datos.tipo,
    datos.texto,
    datos.foto,
    datos.tipo === 'promo' ? datos.vence : null,
  ])
}

/** Borra una publicación SOLO si es de ese local. */
export async function borrarPublicacion(localId: string, id: string) {
  await q(`DELETE FROM publicaciones WHERE id = $1 AND local_id = $2`, [id, localId])
}

// ───────── Reservas ─────────
export async function reservasDe(localId: string): Promise<(Reserva & { cliente: string })[]> {
  return qd<Reserva & { cliente: string }>(
    `SELECT r.id, r.local_id, r.user_id, r.fecha, r.hora, r.personas::int AS personas, r.codigo, r.estado, r.created_at,
            COALESCE(p.nombre, 'Cliente') AS cliente
       FROM reservas r LEFT JOIN perfiles p ON p.user_id = r.user_id
      WHERE r.local_id = $1
      ORDER BY r.fecha DESC, r.hora
      LIMIT 100`,
    [localId],
  )
}

/** Cambia el estado de una reserva SOLO si es de ese local. */
export async function cambiarEstadoReserva(localId: string, id: string, estado: Reserva['estado']) {
  await q(`UPDATE reservas SET estado = $3 WHERE id = $1 AND local_id = $2`, [id, localId, estado])
}

/** Valida un código de reserva (RES-…) o de cupón (RC-…) presentado en el local. */
export async function validarCodigo(localId: string, codigo: string) {
  const c = codigo.trim().toUpperCase()
  return tx(async (db) => {
    const { rows: [reserva] } = await db.query<{ id: string; estado: string; personas: number; hora: string }>(
      `SELECT id, estado, personas, hora FROM reservas WHERE codigo = $1 AND local_id = $2 FOR UPDATE`,
      [c, localId],
    )
    if (reserva) {
      if (reserva.estado === 'cancelada') return { ok: false, mensaje: 'Esa reserva está cancelada' }
      if (reserva.estado === 'usada') return { ok: false, mensaje: 'Esa reserva ya se usó' }
      await db.query(`UPDATE reservas SET estado = 'usada' WHERE id = $1`, [reserva.id])
      return { ok: true, mensaje: `Reserva válida: ${reserva.personas} personas a las ${reserva.hora}` }
    }
    const { rows: [canje] } = await db.query<{ id: string; usado: boolean; titulo: string }>(
      `SELECT c.id, c.usado, p.titulo FROM canjes c JOIN premios p ON p.id = c.premio_id WHERE c.codigo = $1 AND p.local_id = $2 FOR UPDATE OF c`,
      [c, localId],
    )
    if (canje) {
      if (canje.usado) return { ok: false, mensaje: 'Ese cupón ya se usó' }
      await db.query(`UPDATE canjes SET usado = true WHERE id = $1`, [canje.id])
      return { ok: true, mensaje: `Cupón válido: ${canje.titulo}` }
    }
    return { ok: false, mensaje: 'No encontramos ese código para tu local' }
  })
}

// ───────── Reseñas ─────────
export async function resenasPara(localId: string): Promise<Resena[]> {
  return qd<Resena>(
    `SELECT id, local_id, user_id, autor, estrellas::int AS estrellas, etiquetas, texto, foto, respuesta, oculta, created_at
       FROM resenas WHERE local_id = $1 ORDER BY created_at DESC`,
    [localId],
  )
}

/** Responde una reseña SOLO si es de ese local. */
export async function responderResena(localId: string, id: string, respuesta: string) {
  await q(`UPDATE resenas SET respuesta = $3 WHERE id = $1 AND local_id = $2`, [id, localId, respuesta])
}

// ───────── Patrocinio (pago simulado) ─────────
export const PLANES_PATROCINIO = [
  { dias: 7, monto: 8 },
  { dias: 30, monto: 20 },
] as const

export async function patrociniosDe(localId: string) {
  return qd<{ id: string; local_id: string; beneficio: string; monto_usd: number; inicio: string; fin: string; activo: boolean; created_at: string }>(
    `SELECT id, local_id, beneficio, monto_usd::float AS monto_usd, inicio, fin, activo, created_at
       FROM patrocinios WHERE local_id = $1 ORDER BY created_at DESC`,
    [localId],
  )
}

export async function contratarPatrocinio(localId: string, beneficio: string, dias: number) {
  const plan = PLANES_PATROCINIO.find((p) => p.dias === dias)
  if (!plan) return { error: 'Plan inválido' }
  try {
    await q(
      `INSERT INTO patrocinios (local_id, beneficio, monto_usd, inicio, fin) VALUES ($1, $2, $3, current_date, current_date + $4::int)`,
      [localId, beneficio, plan.monto, dias],
    )
    return { ok: true }
  } catch {
    return { error: 'No pudimos contratar el espacio' }
  }
}

/** Para chequear que un recurso existe y es del local (por si hace falta antes de mutar). */
export async function esDelLocal(tabla: 'publicaciones' | 'reservas' | 'resenas', id: string, localId: string) {
  return !!(await q1(`SELECT 1 FROM ${tabla} WHERE id = $1 AND local_id = $2`, [id, localId]))
}
