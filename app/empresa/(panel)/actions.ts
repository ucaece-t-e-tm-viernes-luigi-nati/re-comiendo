'use server'

import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { refresh } from 'next/cache'
import type { FormState } from '@/components/forms'
import { audit } from '@/lib/audit'
import { pool, q1, tx } from '@/lib/db'
import { formatDateTime } from '@/lib/dates'
import { appUrl } from '@/lib/env'
import { ACTIVE_CLIENT_COOKIE, getLocalContext } from '@/lib/guards'
import { isReadOnlyStatus, localCan } from '@/lib/permissions'
import { sendMail } from '@/lib/mail'
import { mails } from '@/lib/mail-templates'
import { createCredentialUser, findUserByEmail, generateTempPassword, isValidEmail, normalizeEmail, TEMP_PASSWORD_HOURS } from '@/lib/users'

// Todas las actions resuelven la empresa desde la sesión (getLocalContext).
// Nunca se acepta un client_id que venga del formulario.

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? '').trim().slice(0, max)

/** Permiso de equipo + empresa no pausada. No exige tener el local cargado (a diferencia de requireLocalWrite). */
async function requireTeamWrite() {
  const ctx = await getLocalContext()
  if (ctx.user.mustChangePassword) return { ctx: null, error: 'Primero cambiá tu contraseña temporal.' }
  if (!localCan(ctx.role, 'team.manage')) return { ctx: null, error: 'No tenés permiso para gestionar el equipo.' }
  if (isReadOnlyStatus(ctx.status)) return { ctx: null, error: 'Tu cuenta está en modo solo lectura.' }
  return { ctx, error: null as string | null }
}

// ---------------- Equipo ----------------

export async function inviteMember(_: FormState, fd: FormData): Promise<FormState> {
  const { ctx, error } = await requireTeamWrite()
  if (!ctx) return { error: error ?? 'No autorizado' }
  const email = normalizeEmail(fd.get('email'))
  const name = str(fd, 'name', 80) || email.split('@')[0]
  const role = str(fd, 'role') === 'owner' ? 'owner' : 'staff'
  if (!isValidEmail(email)) return { error: 'Ingresá un correo válido.' }

  const existing = await findUserByEmail(email)
  if (existing) {
    if (existing.role === 'superadmin' || existing.role === 'admin') return { error: 'Ese correo no se puede sumar al equipo.' }
    const already = await q1(`SELECT 1 FROM client_member WHERE client_id = $1 AND user_id = $2`, [ctx.clientId, existing.id])
    if (already) return { error: 'Esa persona ya forma parte del equipo.' }
  }

  const password = existing ? null : generateTempPassword()
  const userId = await tx(async (db) => {
    let id = existing?.id
    if (!id && password) {
      id = await createCredentialUser(db, { email, name, password, temporary: true, emailVerified: true })
    }
    if (!id) throw new Error('usuario inexistente')
    await db.query(`INSERT INTO client_member (client_id, user_id, role) VALUES ($1, $2, $3)`, [ctx.clientId, id, role])
    return id
  })

  const venceClave = formatDateTime(new Date(Date.now() + TEMP_PASSWORD_HOURS * 3600 * 1000))
  await sendMail({
    to: email,
    ...mails.staffAccess({ empresa: ctx.clientName, link: `${appUrl()}/empresa/ingresar`, email, password, venceClave, nuevo: true }),
    secrets: password ? [password] : [],
  })
  await audit({ id: ctx.user.id, role: ctx.role }, 'member.add', { clientId: ctx.clientId, entity: 'user', entityId: userId, detail: { role, newUser: !existing } })
  refresh()
  return { ok: true, message: `Le enviamos un mail a ${email} con el acceso.` }
}

export async function removeMember(userId: string) {
  const { ctx } = await requireTeamWrite()
  if (!ctx || typeof userId !== 'string') return
  if (userId === ctx.user.id) return // no se puede quitar a sí mismo
  const owners = await q1<{ n: number }>(`SELECT count(*)::int AS n FROM client_member WHERE client_id = $1 AND role = 'owner' AND user_id <> $2`, [ctx.clientId, userId])
  if (!owners?.n) return // siempre queda al menos un propietario
  await pool.query(`DELETE FROM client_member WHERE client_id = $1 AND user_id = $2`, [ctx.clientId, userId])
  await audit({ id: ctx.user.id, role: ctx.role }, 'member.remove', { clientId: ctx.clientId, entity: 'user', entityId: userId })
  refresh()
}

/** Cambia el local activo (si el usuario pertenece a más de uno). Se valida contra sus membresías. */
export async function switchClient(fd: FormData) {
  const ctx = await getLocalContext()
  const target = String(fd.get('clientId') ?? '')
  if (!ctx.memberships.some((m) => m.clientId === target)) notFound()
  ;(await cookies()).set(ACTIVE_CLIENT_COOKIE, target, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/empresa' })
  redirect('/empresa')
}
