import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '../auth'
import { qd1 } from '../db'
import type { Perfil } from '../tipos'

// Perfil del comensal (usuario final). La sesión es de better-auth; el perfil vive en la tabla perfiles.
// Los usuarios de locales (/empresa) y del equipo (/plataforma) no tienen perfil de comensal.

export const PERFIL_SELECT = `user_id AS id, nombre, categorias, precio::int AS precio, modo, onboarding_ok, aprendizaje,
  es_premium, premium_desde, puntos, created_at`

/** Perfil del comensal logueado, o null. Se cachea por pedido. */
export const obtenerPerfil = cache(async (): Promise<Perfil | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  return qd1<Perfil>(`SELECT ${PERFIL_SELECT} FROM perfiles WHERE user_id = $1`, [user.id])
})

/** Corta el render y manda a /ingresar si no hay un comensal logueado. */
export async function requerirRol(): Promise<Perfil> {
  const perfil = await obtenerPerfil()
  if (!perfil) redirect('/ingresar')
  return perfil
}
