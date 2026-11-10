import 'server-only'
import { crearClienteAdmin } from '../db/admin'
import type { TipoEvento } from '../tipos'

export const EVENTOS_DESDE_CLIENTE: TipoEvento[] = [
  'view_local',
  'click_instagram',
  'click_como_llegar',
  'impresion_anuncio',
  'click_anuncio',
  'recomendacion',
]

/** Registra un evento de analítica. Nunca rompe el flujo si falla. */
export async function registrarEvento(
  tipo: TipoEvento,
  datos: { userId?: string | null; localId?: string | null; meta?: Record<string, unknown> } = {},
) {
  try {
    await crearClienteAdmin()
      .from('events')
      .insert({ tipo, user_id: datos.userId ?? null, local_id: datos.localId ?? null, meta: datos.meta ?? {} })
  } catch (e) {
    console.error('No se pudo registrar el evento', tipo, e)
  }
}
