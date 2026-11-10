'use server'

// Server actions del panel de superadmin. Sólo validan la entrada y llaman a /lib/services.
// Todas exigen requerirRol('superadmin') antes de tocar nada.
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requerirRol } from '@/lib/services/auth'
import { alternarPremio, cambiarEstadoLocal, cambiarRol, guardarPremio, moderarResena } from '@/lib/services/metricas'
import { borrarApiKeyClaude, guardarApiKeyClaude } from '@/lib/services/refi'
import type { EstadoLocal, Rol } from '@/lib/tipos'

const ESTADOS: EstadoLocal[] = ['pendiente', 'activo', 'suspendido']
const ROLES: Rol[] = ['usuario', 'negocio', 'superadmin']

export async function accionCambiarEstadoLocal(id: string, estado: EstadoLocal) {
  await requerirRol('superadmin')
  const d = z.object({ id: z.string().trim().min(1), estado: z.enum(ESTADOS as [EstadoLocal, ...EstadoLocal[]]) }).parse({ id, estado })
  await cambiarEstadoLocal(d.id, d.estado)
  revalidatePath('/superadmin', 'layout')
}

export async function accionCambiarRolUsuario(id: string, rol: Rol) {
  const perfil = await requerirRol('superadmin')
  const d = z.object({ id: z.string().trim().min(1), rol: z.enum(ROLES as [Rol, ...Rol[]]) }).parse({ id, rol })
  if (d.id === perfil.id) return { error: 'No podés cambiar tu propio rol' }
  await cambiarRol(d.id, d.rol)
  revalidatePath('/superadmin/usuarios')
  return {}
}

export async function accionModerarResena(id: string, oculta: boolean) {
  await requerirRol('superadmin')
  const d = z.object({ id: z.string().trim().min(1), oculta: z.boolean() }).parse({ id, oculta })
  await moderarResena(d.id, d.oculta)
  revalidatePath('/superadmin/resenas')
}

export async function accionAlternarPremio(id: string, activo: boolean) {
  await requerirRol('superadmin')
  const d = z.object({ id: z.string().trim().min(1), activo: z.boolean() }).parse({ id, activo })
  await alternarPremio(d.id, d.activo)
  revalidatePath('/superadmin/premios')
}

export async function accionGuardarPremio(datos: { id: string; titulo: string; local_id: string; costo: number }) {
  await requerirRol('superadmin')
  const esquema = z.object({
    id: z
      .string()
      .trim()
      .min(2, 'Mínimo 2 caracteres')
      .max(40)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Usá minúsculas, números y guiones, sin espacios'),
    titulo: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
    local_id: z.string().trim().min(1, 'Elegí un local'),
    costo: z.number().int('Tiene que ser un número entero').min(1, 'Mínimo 1 punto').max(100000),
  })
  const parseo = esquema.safeParse(datos)
  if (!parseo.success) return { error: parseo.error.issues[0]?.message ?? 'Datos inválidos' }
  await guardarPremio(parseo.data)
  revalidatePath('/superadmin/premios')
  return {}
}

export async function accionGuardarApiKeyClaude(valor: string) {
  await requerirRol('superadmin')
  const d = z
    .string()
    .trim()
    .regex(/^sk-ant-[A-Za-z0-9_-]{20,}$/, 'La API key de Claude empieza con "sk-ant-"')
    .safeParse(valor)
  if (!d.success) return { error: d.error.issues[0]?.message ?? 'API key inválida' }
  await guardarApiKeyClaude(d.data)
  revalidatePath('/superadmin/ajustes')
  return {}
}

export async function accionBorrarApiKeyClaude() {
  await requerirRol('superadmin')
  await borrarApiKeyClaude()
  revalidatePath('/superadmin/ajustes')
}
