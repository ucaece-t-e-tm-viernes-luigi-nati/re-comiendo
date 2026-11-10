import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '../db/server'
import { crearClienteAdmin } from '../db/admin'
import type { Perfil, Rol } from '../tipos'
import { registrarEvento } from './eventos'

/** Perfil del usuario logueado, o null. Se cachea por pedido. */
export const obtenerPerfil = cache(async (): Promise<Perfil | null> => {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  if (!id) return null
  const { data: perfil } = await supabase.from('profiles').select('*').eq('id', id).single()
  return (perfil as Perfil) ?? null
})

/** Corta el render y manda a /login (o al inicio) si el usuario no tiene alguno de los roles. */
export async function requerirRol(...roles: Rol[]): Promise<Perfil> {
  const perfil = await obtenerPerfil()
  if (!perfil) redirect('/login')
  if (roles.length && !roles.includes(perfil.rol)) redirect('/inicio')
  return perfil
}

export async function iniciarSesion(email: string, password: string) {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email o contraseña incorrectos' }
  await registrarEvento('sesion', { userId: data.user.id })
  const { data: perfil } = await supabase.from('profiles').select('rol').eq('id', data.user.id).single()
  return { id: data.user.id, rol: (perfil?.rol ?? 'usuario') as Rol }
}

/**
 * Registro: se crea el usuario ya confirmado desde el back end (así no depende del envío
 * de mails) y después se inicia sesión.
 */
export async function registrarse(nombre: string, email: string, password: string) {
  if (password.length < 6) return { error: 'La contraseña tiene que tener al menos 6 caracteres' }
  const admin = crearClienteAdmin()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })
  if (error) {
    return { error: error.message.includes('already') ? 'Ya existe una cuenta con ese email' : 'No pudimos crear la cuenta' }
  }
  await registrarEvento('registro', { userId: data.user.id })
  return iniciarSesion(email, password)
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
}
