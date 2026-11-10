'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

/** Cierra la sesión y vuelve a la pantalla indicada (solo rutas internas). */
export async function signOutAction(to: string) {
  try {
    await auth.api.signOut({ headers: await headers() })
  } catch {
    // ya no había sesión
  }
  redirect(to.startsWith('/') && !to.startsWith('//') ? to : '/')
}
