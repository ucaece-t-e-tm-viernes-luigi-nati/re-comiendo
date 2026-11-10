'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { cerrarSesion, iniciarSesion, registrarse } from '@/lib/services/auth'

function destino(rol: string, volver: string | null) {
  if (volver && volver.startsWith('/') && !volver.startsWith('//')) return volver
  return rol === 'superadmin' ? '/superadmin' : rol === 'negocio' ? '/clientes' : '/inicio'
}

export async function accionLogin(_: unknown, form: FormData) {
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  const r = await iniciarSesion(email, password)
  if ('error' in r) return { error: r.error }
  redirect(destino(r.rol, form.get('volver') as string | null))
}

export async function accionRegistro(_: unknown, form: FormData) {
  const datos = z
    .object({ nombre: z.string().trim().min(1).max(40), email: z.string().trim().email(), password: z.string().min(6) })
    .safeParse({ nombre: form.get('nombre'), email: form.get('email'), password: form.get('password') })
  if (!datos.success) return { error: 'Revisá los datos: nombre, un email válido y una contraseña de 6+ caracteres' }
  const r = await registrarse(datos.data.nombre, datos.data.email, datos.data.password)
  if ('error' in r) return { error: r.error }
  redirect('/gustos')
}

export async function accionSalir() {
  await cerrarSesion()
  redirect('/')
}
