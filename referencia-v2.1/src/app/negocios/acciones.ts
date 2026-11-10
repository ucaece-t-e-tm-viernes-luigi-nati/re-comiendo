'use server'

import { z } from 'zod'
import { obtenerPerfil, registrarse } from '@/lib/services/auth'
import { registrarNegocio } from '@/lib/services/negocios'

const CATEGORIAS = ['cafe', 'mariscos', 'pizza-pastas', 'parrilla', 'cerveza', 'hamburguesas', 'sushi', 'veggie'] as const

const LOCAL = z.object({
  nombre: z.string().trim().min(2).max(80),
  categoria: z.enum(CATEGORIAS),
  barrio: z.string().trim().max(60),
  direccion: z.string().trim().min(3).max(120),
  precio: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  descripcion: z.string().trim().max(400),
  instagram: z.string().trim().max(60),
  responsable: z.string().trim().min(1).max(60),
  telefono: z.string().trim().min(6).max(30),
})

const CUENTA = z.object({ email: z.string().trim().email(), password: z.string().min(6) })

/** Solicitud de alta de un negocio. Si no hay sesión, crea también la cuenta. */
export async function accionSolicitarAlta(datos: Record<string, unknown>) {
  const local = LOCAL.safeParse(datos)
  if (!local.success) return { error: 'Revisá los datos del local y del contacto' }

  const usuario = await obtenerPerfil()
  if (!usuario) {
    const cuenta = CUENTA.safeParse(datos)
    if (!cuenta.success) return { error: 'Revisá el email y que la contraseña tenga 6 caracteres o más' }
    const r = await registrarse(local.data.responsable, cuenta.data.email, cuenta.data.password)
    if ('error' in r) return { error: r.error }
    const r2 = await registrarNegocio(r, local.data)
    if ('error' in r2) return r2
  } else {
    const r = await registrarNegocio(usuario, local.data)
    if ('error' in r) return r
  }
  return { ok: true as const }
}
