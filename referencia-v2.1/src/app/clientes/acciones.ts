'use server'

// Server actions del panel de negocio. Sólo validan con zod y llaman a /lib/services/negocios.
// Nunca confían en un localId que venga del cliente: siempre se resuelve con miLocal(perfil)
// y, para operar sobre un recurso puntual (publicación, reserva, reseña), se verifica que
// pertenezca a ese local antes de mutarlo.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requerirRol } from '@/lib/services/auth'
import {
  actualizarFicha,
  borrarPublicacion,
  cambiarEstadoReserva,
  contratarPatrocinio,
  crearPublicacion,
  miLocal,
  PLANES_PATROCINIO,
  publicacionesDe,
  reservasDe,
  resenasPara,
  responderResena,
  validarCodigo,
} from '@/lib/services/negocios'
import { TAGS } from '@/lib/tipos'

const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'birra'] as const

/** Trae el local del usuario o lo manda a registrarse si todavía no tiene uno. */
async function requerirMiLocal() {
  const perfil = await requerirRol('negocio')
  const local = await miLocal(perfil)
  if (!local) redirect('/negocios')
  return { perfil, local }
}

export async function accionActualizarFicha(datos: {
  nombre: string
  barrio: string
  direccion: string
  lat: number | null
  lng: number | null
  precio: number
  momentos: string[]
  tags: string[]
  platos: string[]
  descripcion: string
  instagram: string
  horarios: string
  fotos: string[]
}) {
  const { local } = await requerirMiLocal()
  const d = z
    .object({
      nombre: z.string().trim().min(2).max(80),
      barrio: z.string().trim().max(60),
      direccion: z.string().trim().min(3).max(120),
      lat: z.number().min(-90).max(90).nullable(),
      lng: z.number().min(-180).max(180).nullable(),
      precio: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      momentos: z.array(z.enum(MOMENTOS)).min(1),
      tags: z.array(z.enum(TAGS)).max(TAGS.length),
      platos: z.array(z.string().trim().min(1).max(80)).max(20),
      descripcion: z.string().trim().max(600),
      instagram: z.string().trim().max(60),
      horarios: z.string().trim().max(300),
      fotos: z.array(z.string().url()).max(12),
    })
    .parse(datos)
  await actualizarFicha(local.id, d)
  revalidatePath('/clientes')
  revalidatePath('/clientes/ficha')
  revalidatePath(`/local/${local.id}`)
}

export async function accionCrearPublicacion(datos: { tipo: 'post' | 'promo'; texto: string; foto: string | null; vence: string | null }) {
  const { local } = await requerirMiLocal()
  const d = z
    .object({
      tipo: z.enum(['post', 'promo']),
      texto: z.string().trim().min(1).max(500),
      foto: z.string().url().nullable(),
      vence: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    })
    .parse(datos)
  await crearPublicacion(local.id, d)
  revalidatePath('/clientes/publicaciones')
}

export async function accionBorrarPublicacion(id: string) {
  const { local } = await requerirMiLocal()
  const propias = await publicacionesDe(local.id)
  if (!propias.some((p) => p.id === id)) return
  await borrarPublicacion(id)
  revalidatePath('/clientes/publicaciones')
}

export async function accionValidarCodigo(codigo: string) {
  const { local } = await requerirMiLocal()
  const c = z.string().trim().min(3).max(20).parse(codigo)
  const r = await validarCodigo(local.id, c)
  revalidatePath('/clientes/reservas')
  return r
}

const ESTADOS_RESERVA_PERMITIDOS = ['confirmada', 'cancelada', 'usada'] as const

export async function accionCambiarEstadoReserva(id: string, estado: string) {
  const { local } = await requerirMiLocal()
  const e = z.enum(ESTADOS_RESERVA_PERMITIDOS).parse(estado)
  const propias = await reservasDe(local.id)
  if (!propias.some((r) => r.id === id)) return
  await cambiarEstadoReserva(id, e)
  revalidatePath('/clientes/reservas')
}

export async function accionResponderResena(id: string, respuesta: string) {
  const { local } = await requerirMiLocal()
  const r = z.string().trim().min(1).max(500).parse(respuesta)
  const propias = await resenasPara(local.id)
  if (!propias.some((x) => x.id === id)) return
  await responderResena(id, r)
  revalidatePath('/clientes/resenas')
}

const DIAS_VALIDOS = PLANES_PATROCINIO.map((p) => p.dias)

export async function accionContratarPatrocinio(datos: { beneficio: string; dias: number }) {
  const { local } = await requerirMiLocal()
  const d = z
    .object({
      beneficio: z.string().trim().min(3).max(120),
      dias: z.number().refine((n) => (DIAS_VALIDOS as readonly number[]).includes(n), 'Plan inválido'),
    })
    .parse(datos)
  const r = await contratarPatrocinio(local.id, d.beneficio, d.dias)
  revalidatePath('/clientes/patrocinio')
  return r
}
