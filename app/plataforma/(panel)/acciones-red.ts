'use server'

// Server actions de la red (locales, reseñas, premios, IA) en /plataforma. Validan la entrada y llaman a /lib/services.
// Todas exigen requireSuperadmin() (equipo) antes de tocar nada.
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSuperadmin } from '@/lib/guards'
import { alternarPremio, cambiarEstadoLocal, guardarPremio, moderarResena } from '@/lib/services/metricas'
import { borrarApiKeyClaude, guardarApiKeyClaude } from '@/lib/services/refi'
import type { EstadoLocal } from '@/lib/tipos'

const ESTADOS: EstadoLocal[] = ['pendiente', 'activo', 'suspendido']

export async function accionCambiarEstadoLocal(id: string, estado: EstadoLocal) {
  await requireSuperadmin()
  const d = z.object({ id: z.string().trim().min(1), estado: z.enum(ESTADOS as [EstadoLocal, ...EstadoLocal[]]) }).parse({ id, estado })
  await cambiarEstadoLocal(d.id, d.estado)
  revalidatePath('/plataforma', 'layout')
}

export async function accionModerarResena(id: string, oculta: boolean) {
  await requireSuperadmin()
  const d = z.object({ id: z.string().trim().min(1), oculta: z.boolean() }).parse({ id, oculta })
  await moderarResena(d.id, d.oculta)
  revalidatePath('/plataforma/resenas')
}

export async function accionAlternarPremio(id: string, activo: boolean) {
  await requireSuperadmin()
  const d = z.object({ id: z.string().trim().min(1), activo: z.boolean() }).parse({ id, activo })
  await alternarPremio(d.id, d.activo)
  revalidatePath('/plataforma/premios')
}

export async function accionGuardarPremio(datos: { id: string; titulo: string; local_id: string; costo: number }) {
  await requireSuperadmin()
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
  revalidatePath('/plataforma/premios')
  return {}
}

export async function accionGuardarApiKeyClaude(valor: string) {
  await requireSuperadmin()
  const d = z
    .string()
    .trim()
    .regex(/^sk-ant-[A-Za-z0-9_-]{20,}$/, 'La API key de Claude empieza con "sk-ant-"')
    .safeParse(valor)
  if (!d.success) return { error: d.error.issues[0]?.message ?? 'API key inválida' }
  await guardarApiKeyClaude(d.data)
  revalidatePath('/plataforma/ajustes')
  return {}
}

export async function accionBorrarApiKeyClaude() {
  await requireSuperadmin()
  await borrarApiKeyClaude()
  revalidatePath('/plataforma/ajustes')
}
