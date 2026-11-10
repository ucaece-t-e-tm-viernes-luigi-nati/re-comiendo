'use server'

// Server actions del panel del local (portadas de /clientes de la v2.1).
// Nunca confían en un localId que venga del navegador: el local SIEMPRE sale de requireLocalWrite
// (sesión → membresía → client_id → local). Para operar sobre un recurso puntual (publicación, reserva,
// reseña) el UPDATE/DELETE filtra además por ese local_id.
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { audit } from '@/lib/audit'
import { requireLocalWrite } from '@/lib/guards'
import { esquemaFoto } from '@/lib/fotos'
import {
  actualizarFicha,
  borrarPublicacion,
  cambiarEstadoReserva,
  contratarPatrocinio,
  crearPublicacion,
  PLANES_PATROCINIO,
  responderResena,
  validarCodigo,
} from '@/lib/services/negocios'
import { TAGS } from '@/lib/tipos'

const MOMENTOS = ['desayuno', 'almuerzo', 'merienda', 'cena', 'birra'] as const
type Resultado = { ok?: boolean; error?: string }

function revalidar(localId: string, ...rutas: string[]) {
  for (const r of rutas) revalidatePath(r)
  revalidatePath(`/local/${localId}`)
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
}): Promise<Resultado> {
  const { ctx, error } = await requireLocalWrite('local.edit')
  if (!ctx) return { error: error ?? 'No autorizado' }
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
      fotos: z.array(esquemaFoto).max(12),
    })
    .safeParse(datos)
  if (!d.success) return { error: 'Revisá los datos: nombre, dirección y al menos un momento del día son obligatorios.' }
  await actualizarFicha(ctx.local.id, d.data)
  await audit({ id: ctx.user.id, role: ctx.role }, 'local.update', { clientId: ctx.clientId, entity: 'local', entityId: ctx.local.id })
  revalidar(ctx.local.id, '/empresa', '/empresa/ficha')
  return { ok: true }
}

export async function accionCrearPublicacion(datos: { tipo: 'post' | 'promo' | 'menu'; texto: string; foto: string | null; vence: string | null }): Promise<Resultado> {
  const { ctx, error } = await requireLocalWrite('posts.manage')
  if (!ctx) return { error: error ?? 'No autorizado' }
  const d = z
    .object({
      tipo: z.enum(['post', 'promo', 'menu']),
      texto: z.string().trim().min(1).max(1000),
      foto: esquemaFoto.nullable(),
      vence: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    })
    .safeParse(datos)
  if (!d.success) return { error: 'Revisá el texto (máximo 1000 caracteres) y la fecha.' }
  await crearPublicacion(ctx.local.id, d.data)
  await audit({ id: ctx.user.id, role: ctx.role }, 'post.create', { clientId: ctx.clientId, entity: 'local', entityId: ctx.local.id, detail: { tipo: d.data.tipo } })
  revalidar(ctx.local.id, '/empresa/publicaciones')
  return { ok: true }
}

export async function accionBorrarPublicacion(id: string): Promise<Resultado> {
  const { ctx, error } = await requireLocalWrite('posts.manage')
  if (!ctx) return { error: error ?? 'No autorizado' }
  const pid = z.string().uuid().safeParse(id)
  if (!pid.success) return { error: 'Publicación inválida' }
  await borrarPublicacion(ctx.local.id, pid.data)
  revalidar(ctx.local.id, '/empresa/publicaciones')
  return { ok: true }
}

export async function accionValidarCodigo(codigo: string) {
  const { ctx, error } = await requireLocalWrite('reservations.manage')
  if (!ctx) return { ok: false, mensaje: error ?? 'No autorizado' }
  const c = z.string().trim().min(3).max(20).safeParse(codigo)
  if (!c.success) return { ok: false, mensaje: 'Código inválido' }
  const r = await validarCodigo(ctx.local.id, c.data)
  if (r.ok) await audit({ id: ctx.user.id, role: ctx.role }, 'code.validate', { clientId: ctx.clientId, entity: 'local', entityId: ctx.local.id })
  revalidatePath('/empresa/reservas')
  return r
}

const ESTADOS_RESERVA_PERMITIDOS = ['confirmada', 'cancelada', 'usada'] as const

export async function accionCambiarEstadoReserva(id: string, estado: string): Promise<Resultado> {
  const { ctx, error } = await requireLocalWrite('reservations.manage')
  if (!ctx) return { error: error ?? 'No autorizado' }
  const d = z.object({ id: z.string().uuid(), estado: z.enum(ESTADOS_RESERVA_PERMITIDOS) }).safeParse({ id, estado })
  if (!d.success) return { error: 'Datos inválidos' }
  await cambiarEstadoReserva(ctx.local.id, d.data.id, d.data.estado)
  revalidatePath('/empresa/reservas')
  return { ok: true }
}

export async function accionResponderResena(id: string, respuesta: string): Promise<Resultado> {
  const { ctx, error } = await requireLocalWrite('reviews.reply')
  if (!ctx) return { error: error ?? 'No autorizado' }
  const d = z.object({ id: z.string().uuid(), respuesta: z.string().trim().min(1).max(500) }).safeParse({ id, respuesta })
  if (!d.success) return { error: 'La respuesta tiene que tener entre 1 y 500 caracteres.' }
  await responderResena(ctx.local.id, d.data.id, d.data.respuesta)
  revalidar(ctx.local.id, '/empresa/resenas')
  return { ok: true }
}

const DIAS_VALIDOS = PLANES_PATROCINIO.map((p) => p.dias)

export async function accionContratarPatrocinio(datos: { beneficio: string; dias: number }) {
  const { ctx, error } = await requireLocalWrite('sponsorship.manage')
  if (!ctx) return { error: error ?? 'No autorizado' }
  const d = z
    .object({
      beneficio: z.string().trim().min(3).max(120),
      dias: z.number().refine((n) => (DIAS_VALIDOS as readonly number[]).includes(n), 'Plan inválido'),
    })
    .safeParse(datos)
  if (!d.success) return { error: 'Revisá el beneficio (3 a 120 caracteres) y el plan.' }
  const r = await contratarPatrocinio(ctx.local.id, d.data.beneficio, d.data.dias)
  if ('ok' in r) {
    await audit({ id: ctx.user.id, role: ctx.role }, 'sponsorship.create', {
      clientId: ctx.clientId,
      entity: 'local',
      entityId: ctx.local.id,
      detail: { dias: d.data.dias },
    })
  }
  revalidatePath('/empresa/patrocinio')
  return r
}
