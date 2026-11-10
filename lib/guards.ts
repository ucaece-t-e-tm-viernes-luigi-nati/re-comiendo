import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, type SessionUser } from './auth'
import { q } from './db'
import { superadminEmails } from './env'
import { isReadOnlyStatus, isSuperadmin, localCan, type LocalPermission, type LocalRole } from './permissions'
import { localDeCliente } from './services/negocios'
import type { Local } from './tipos'

export const ACTIVE_CLIENT_COOKIE = 'recomiendo_local'

// ---------------- Superadmin / equipo (/plataforma) ----------------

/** Superadmin o admin del equipo, o 404 (no revela que la ruta existe). */
export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || !isSuperadmin(user, superadminEmails())) notFound()
  return user
}

/** Para route handlers: true si quien llama es del equipo (sin lanzar). */
export async function isSuperadminRequest() {
  try {
    const user = await getCurrentUser()
    return !!user && isSuperadmin(user, superadminEmails())
  } catch {
    return false
  }
}

// ---------------- Empresas: locales gastronómicos (/empresa) ----------------

export type LocalMembership = {
  clientId: string
  clientName: string
  clientSlug: string
  status: string
  role: LocalRole
}

export const getMemberships = cache(async (userId: string) => {
  return q<LocalMembership>(
    `SELECT c.id AS "clientId", c.name AS "clientName", c.slug AS "clientSlug", c.status, m.role
       FROM client_member m JOIN client c ON c.id = m.client_id
      WHERE m.user_id = $1
      ORDER BY m.created_at`,
    [userId],
  )
})

export type LocalContext = LocalMembership & {
  user: SessionUser
  readOnly: boolean
  memberships: LocalMembership[]
  /** El local (ficha pública) de la empresa. Siempre sale de client_id, nunca del navegador. */
  local: Local | null
}

/**
 * Contexto del local para el usuario logueado. El client_id SIEMPRE sale de acá
 * (sesión → membresía), nunca del formulario ni de la URL.
 * Sin sesión o sin membresía → 404.
 */
export const getLocalContext = cache(async (): Promise<LocalContext> => {
  const user = await getCurrentUser()
  if (!user) notFound()
  const memberships = await getMemberships(user.id)
  if (!memberships.length) notFound()
  const preferred = (await cookies()).get(ACTIVE_CLIENT_COOKIE)?.value
  const current = memberships.find((m) => m.clientId === preferred) ?? memberships[0]
  const local = await localDeCliente(current.clientId)
  return { ...current, user, readOnly: isReadOnlyStatus(current.status), memberships, local }
})

/** Para páginas del panel: exige permiso y que ya haya cambiado la contraseña temporal. */
export async function requireLocal(permission: LocalPermission = 'dashboard.view') {
  const ctx = await getLocalContext()
  if (ctx.user.mustChangePassword) redirect('/empresa/cambiar-clave')
  if (!localCan(ctx.role, permission)) notFound()
  return ctx
}

/** Igual que requireLocal, pero exige que la empresa tenga su local cargado. */
export async function requireLocalConFicha(permission: LocalPermission = 'dashboard.view') {
  const ctx = await requireLocal(permission)
  if (!ctx.local) notFound()
  return { ...ctx, local: ctx.local }
}

export type ActionState = { ok?: boolean; error?: string; message?: string } | null

/** Para server actions que escriben: además del permiso, bloquea si el local está pausado o dado de baja. */
export async function requireLocalWrite(permission: LocalPermission) {
  const ctx = await getLocalContext()
  if (ctx.user.mustChangePassword) return { ctx: null, error: 'Primero cambiá tu contraseña temporal.' }
  if (!localCan(ctx.role, permission)) return { ctx: null, error: 'No tenés permiso para hacer esto.' }
  if (ctx.readOnly) {
    return { ctx: null, error: 'Tu cuenta está en modo solo lectura (pausada o dada de baja). Escribinos para reactivarla.' }
  }
  if (!ctx.local) return { ctx: null, error: 'Tu empresa todavía no tiene un local cargado.' }
  return { ctx: { ...ctx, local: ctx.local }, error: null as string | null }
}
