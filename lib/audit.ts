import 'server-only'
import { q } from './db'

type Actor = { id: string; role?: string | null } | null

/** Registra una acción en audit_log. Nunca guardar contraseñas ni tokens en detail. */
export async function audit(
  actor: Actor,
  action: string,
  opts: { clientId?: string | null; entity?: string; entityId?: string; detail?: Record<string, unknown>; actorRole?: string } = {},
) {
  try {
    await q(
      `INSERT INTO audit_log (actor_user_id, actor_role, client_id, action, entity, entity_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actor?.id ?? null, opts.actorRole ?? actor?.role ?? 'system', opts.clientId ?? null, action, opts.entity ?? null, opts.entityId ?? null, opts.detail ? JSON.stringify(opts.detail) : null],
    )
  } catch (error) {
    console.error('[audit] No se pudo registrar', action, error)
  }
}
