'use server'

// Server actions de la app del usuario. Sólo validan la entrada y llaman a /lib/services.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requerirRol } from '@/lib/services/auth'
import { darFeedback, descartar, reiniciarDescartados } from '@/lib/services/recomendaciones'
import {
  activarPremium,
  alternarFavorito,
  alternarSeguir,
  canjearPremio,
  cancelarPremium,
  cancelarReserva,
  guardarGustos,
  publicarResena,
  reservar,
} from '@/lib/services/usuarios'
import { consultarRefi } from '@/lib/services/refi'
import type { Categoria } from '@/lib/tipos'

const CATEGORIAS = ['cafe', 'mariscos', 'pizza-pastas', 'parrilla', 'cerveza', 'hamburguesas', 'sushi', 'veggie'] as const

export async function accionGuardarGustos(datos: { nombre: string; categorias: string[]; precio: number; modo: string }) {
  const perfil = await requerirRol()
  const d = z
    .object({
      nombre: z.string().trim().min(1).max(40),
      categorias: z.array(z.enum(CATEGORIAS)).min(1),
      precio: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      modo: z.enum(['descubrir', 'seguro']),
    })
    .parse(datos)
  await guardarGustos(perfil, d)
  revalidatePath('/', 'layout')
}

export async function accionMeCopa(localId: string, categoria: Categoria) {
  const perfil = await requerirRol()
  await darFeedback(perfil, localId, categoria, 1)
  redirect(`/local/${localId}`)
}

export async function accionOtraOpcion(localId: string, categoria: Categoria) {
  const perfil = await requerirRol()
  await darFeedback(perfil, localId, categoria, -1)
  revalidatePath('/inicio')
}

export async function accionNoMeInteresa(localId: string) {
  const perfil = await requerirRol()
  await descartar(perfil, localId)
  revalidatePath('/inicio')
}

export async function accionVerDeNuevo() {
  const perfil = await requerirRol()
  await reiniciarDescartados(perfil)
  revalidatePath('/inicio')
}

export async function accionSeguir(localId: string) {
  const perfil = await requerirRol()
  const sigue = await alternarSeguir(perfil, localId)
  revalidatePath(`/local/${localId}`)
  return sigue
}

export async function accionFavorito(localId: string) {
  const perfil = await requerirRol()
  const favorito = await alternarFavorito(perfil, localId)
  revalidatePath(`/local/${localId}`)
  return favorito
}

export async function accionReservar(datos: { localId: string; hora: string; personas: number }) {
  const perfil = await requerirRol()
  const d = z
    .object({ localId: z.string(), hora: z.string().regex(/^\d{2}:\d{2}$/), personas: z.number().int().min(1).max(20) })
    .parse(datos)
  const r = await reservar(perfil, d)
  revalidatePath('/perfil')
  return r
}

export async function accionCancelarReserva(id: string) {
  const perfil = await requerirRol()
  await cancelarReserva(perfil.id, id)
  revalidatePath('/perfil')
}

export async function accionPublicarResena(datos: { localId: string; estrellas: number; etiquetas: string[]; texto: string; foto: string | null }) {
  const perfil = await requerirRol()
  const d = z
    .object({
      localId: z.string(),
      estrellas: z.number().int().min(1).max(5),
      etiquetas: z.array(z.string().max(30)).max(6),
      texto: z.string().trim().max(600),
      foto: z.string().url().nullable(),
    })
    .parse(datos)
  const ganados = await publicarResena(perfil, d)
  revalidatePath(`/local/${d.localId}`)
  revalidatePath('/', 'layout')
  return ganados
}

export async function accionCanjear(premioId: string) {
  const perfil = await requerirRol()
  const r = await canjearPremio(perfil, premioId)
  revalidatePath('/', 'layout')
  return r
}

export async function accionActivarPremium() {
  const perfil = await requerirRol()
  await activarPremium(perfil)
  revalidatePath('/', 'layout')
}

export async function accionCancelarPremium() {
  const perfil = await requerirRol()
  await cancelarPremium(perfil)
  revalidatePath('/', 'layout')
}

export async function accionConsultarRefi(datos: { tipo: 'texto' | 'audio'; texto: string }) {
  const perfil = await requerirRol()
  const d = z.object({ tipo: z.enum(['texto', 'audio']), texto: z.string().trim().max(600) }).parse(datos)
  if (d.tipo === 'texto' && !d.texto) return { error: 'Contame qué tenés ganas de comer' }
  return consultarRefi(perfil, d)
}
