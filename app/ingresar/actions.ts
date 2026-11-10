'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { FormState } from '@/components/forms'
import { auth } from '@/lib/auth'
import { q, q1 } from '@/lib/db'
import { isSuperadminEmail } from '@/lib/env'
import { registrarEvento } from '@/lib/services/eventos'
import { isValidEmail, normalizeEmail } from '@/lib/users'

// Login y registro de la superficie PÚBLICA (comensales). No da acceso a ningún panel interno:
// los locales entran por su propio ingreso y el equipo por el suyo.

const GENERIC = 'Correo o contraseña incorrectos.'
const str = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? '').trim().slice(0, max)

/** Solo rutas internas del área del comensal (nunca /empresa ni /plataforma). */
function destinoSeguro(value: string, porDefecto = '/inicio') {
  if (!value.startsWith('/') || value.startsWith('//')) return porDefecto
  if (/^\/(empresa|plataforma|api)(\/|$)/.test(value)) return porDefecto
  return value
}

/** Ingreso: solo cuentas con perfil de comensal. Ante cualquier fallo, mensaje genérico. */
export async function ingresarComensal(_: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(fd.get('email'))
  const password = String(fd.get('password') ?? '')
  if (!email || !password) return { error: GENERIC }

  const comensal = await q1(`SELECT 1 FROM "user" u JOIN perfiles p ON p.user_id = u.id WHERE lower(u.email) = $1`, [email])
  if (!comensal) return { error: GENERIC }
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
  } catch {
    return { error: GENERIC }
  }
  redirect(destinoSeguro(str(fd, 'volver')))
}

/** Registro de comensal: crea la cuenta (better-auth) y su perfil; después elige sus gustos. */
export async function registrarComensal(_: FormState, fd: FormData): Promise<FormState> {
  const nombre = str(fd, 'nombre', 40)
  const email = normalizeEmail(fd.get('email'))
  const password = String(fd.get('password') ?? '')

  if (nombre.length < 1) return { error: 'Decinos cómo te llamás.' }
  if (!isValidEmail(email)) return { error: 'Ingresá un correo válido.' }
  if (password.length < 8) return { error: 'La contraseña tiene que tener al menos 8 caracteres.' }
  // Los emails del equipo no pueden registrarse desde acá (además lo bloquea el hook de better-auth).
  if (isSuperadminEmail(email)) return { error: 'No pudimos crear la cuenta. ¿Ya existe ese correo?' }

  let userId: string
  try {
    const result = await auth.api.signUpEmail({ body: { name: nombre, email, password }, headers: await headers() })
    userId = result.user.id
  } catch {
    return { error: 'No pudimos crear la cuenta. ¿Ya existe ese correo?' }
  }

  try {
    await q(`INSERT INTO perfiles (user_id, nombre) VALUES ($1, $2)`, [userId, nombre])
    await registrarEvento('registro', { userId })
  } catch (error) {
    console.error('[registro] No se pudo crear el perfil', error)
    await q(`DELETE FROM "user" WHERE id = $1`, [userId]).catch(() => null)
    await auth.api.signOut({ headers: await headers() }).catch(() => null)
    return { error: 'No pudimos crear tu cuenta. Probá de nuevo en un momento.' }
  }
  redirect('/gustos')
}
