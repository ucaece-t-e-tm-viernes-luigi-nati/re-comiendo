import 'server-only'
import { q } from '../db'
import type { TipoEvento } from '../tipos'

export const EVENTOS_DESDE_CLIENTE: TipoEvento[] = [
  'view_local',
  'click_instagram',
  'click_como_llegar',
  'impresion_anuncio',
  'click_anuncio',
  'recomendacion',
]

/** Registra un evento de analítica (tabla events). Nunca rompe el flujo si falla. */
export async function registrarEvento(
  tipo: TipoEvento,
  datos: { userId?: string | null; localId?: string | null; meta?: Record<string, unknown> } = {},
) {
  try {
    await q(
      `INSERT INTO events (tipo, user_id, local_id, meta)
       SELECT $1, $2, $3, $4::jsonb
        WHERE $3::text IS NULL OR EXISTS (SELECT 1 FROM locales WHERE id = $3)`,
      [tipo, datos.userId ?? null, datos.localId ?? null, JSON.stringify(datos.meta ?? {})],
    )
  } catch (e) {
    console.error('No se pudo registrar el evento', tipo, e)
  }
}

/** Ingreso de un comensal (lo llama el hook de sesión de better-auth). Locales y equipo no cuentan. */
export async function registrarSesion(userId: string) {
  try {
    await q(`INSERT INTO events (tipo, user_id) SELECT 'sesion', user_id FROM perfiles WHERE user_id = $1`, [userId])
  } catch (e) {
    console.error('No se pudo registrar la sesión', e)
  }
}
