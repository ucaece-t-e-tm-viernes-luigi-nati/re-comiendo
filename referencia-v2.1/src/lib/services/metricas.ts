import 'server-only'
import { crearClienteAdmin } from '../db/admin'
import type { EstadoLocal, Rol } from '../tipos'

// Todas las métricas salen de la tabla events (ver supabase/migrations/0002_metricas.sql).
// Estas funciones usan la clave de servicio: llamarlas SOLO después de requerirRol().

export interface Rango {
  desde: Date
  hasta: Date
}

export function rangoDesdeDias(dias: number): Rango {
  const hasta = new Date()
  return { desde: new Date(hasta.getTime() - dias * 86400000), hasta }
}

export interface KpisAdmin {
  usuarios_totales: number
  usuarios_nuevos: number
  usuarios_activos: number
  activos_hoy: number
  locales_activos: number
  locales_pendientes: number
  locales_suspendidos: number
  premium_total: number
  premium_nuevos: number
  mrr_usd: number
  patrocinios_activos: number
  ingresos_patrocinios_usd: number
  vistas: number
  clicks: number
  reservas: number
  resenas: number
  canjes: number
  impresiones_anuncios: number
  clicks_anuncios: number
}

const iso = (r: Rango) => ({ desde: r.desde.toISOString(), hasta: r.hasta.toISOString() })

export async function kpisAdmin(r: Rango): Promise<KpisAdmin> {
  const { data, error } = await crearClienteAdmin().rpc('metricas_admin', iso(r))
  if (error) throw error
  return data as KpisAdmin
}

export async function activosPorDia(r: Rango) {
  const { data, error } = await crearClienteAdmin().rpc('activos_por_dia', iso(r))
  if (error) throw error
  return (data as { dia: string; activos: number; nuevos: number }[]).map((d) => ({ ...d, activos: Number(d.activos), nuevos: Number(d.nuevos) }))
}

/** Serie diaria con una columna por tipo de evento: [{ dia, view_local: 10, reserva: 2, … }] */
export async function serieEventos(r: Rango, localId: string | null = null) {
  const { data, error } = await crearClienteAdmin().rpc('serie_eventos', { ...iso(r), local: localId })
  if (error) throw error
  const porDia = new Map<string, Record<string, number | string>>()
  for (const fila of data as { dia: string; tipo: string; cantidad: number }[]) {
    const d = porDia.get(fila.dia) ?? { dia: fila.dia }
    d[fila.tipo] = Number(fila.cantidad)
    porDia.set(fila.dia, d)
  }
  return [...porDia.values()]
}

export async function rankingLocales(r: Rango, limite = 10) {
  const { data, error } = await crearClienteAdmin().rpc('ranking_locales', iso(r))
  if (error) throw error
  return (data as { local_id: string; nombre: string; categoria: string; vistas: number; clicks: number; reservas: number; seguidores: number }[])
    .map((x) => ({ ...x, vistas: Number(x.vistas), clicks: Number(x.clicks), reservas: Number(x.reservas), seguidores: Number(x.seguidores) }))
    .slice(0, limite)
}

export interface KpisLocal {
  vistas: number
  clicks_instagram: number
  clicks_como_llegar: number
  reservas: number
  recomendaciones: number
  impresiones_anuncio: number
  clicks_anuncio: number
  seguidores: number
  nuevos_seguidores: number
  rating: number
  cantidad_resenas: number
}

export async function kpisLocal(localId: string, r: Rango): Promise<KpisLocal> {
  const { data, error } = await crearClienteAdmin().rpc('metricas_local', { local: localId, ...iso(r) })
  if (error) throw error
  return data as KpisLocal
}

// ───────── Gestión del superadmin ─────────

export async function localesParaGestion() {
  const { data } = await crearClienteAdmin()
    .from('locales')
    .select('id, nombre, categoria, barrio, estado, created_at, owner_id')
    .order('estado')
    .order('created_at', { ascending: false })
  return data ?? []
}

/** Solicitudes de alta: locales pendientes con todo lo que cargó el negocio para poder decidir. */
export async function solicitudesPendientes() {
  const admin = crearClienteAdmin()
  const { data: locales } = await admin
    .from('locales')
    .select('id, nombre, categoria, barrio, direccion, precio, descripcion, instagram, created_at, owner_id, contacto:contactos_negocio(responsable, telefono)')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })
  const { data: auth } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map(auth.users.map((u) => [u.id, u.email ?? '']))
  return (locales ?? []).map(({ contacto, ...l }) => {
    const c = (Array.isArray(contacto) ? contacto[0] : contacto) as { responsable: string; telefono: string } | null
    return { ...l, responsable: c?.responsable ?? '', telefono: c?.telefono ?? '', email: l.owner_id ? emails.get(l.owner_id) ?? '' : '' }
  })
}

export async function cambiarEstadoLocal(id: string, estado: EstadoLocal) {
  const { error } = await crearClienteAdmin().from('locales').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function usuariosParaGestion() {
  const admin = crearClienteAdmin()
  const { data: perfiles } = await admin
    .from('profiles')
    .select('id, nombre, rol, es_premium, puntos, created_at')
    .order('created_at', { ascending: false })
  const { data: auth } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map(auth.users.map((u) => [u.id, u.email ?? '']))
  return (perfiles ?? []).map((p) => ({ ...p, email: emails.get(p.id) ?? '' }))
}

export async function cambiarRol(id: string, rol: Rol) {
  const { error } = await crearClienteAdmin().from('profiles').update({ rol }).eq('id', id)
  if (error) throw error
}

export async function resenasParaModerar() {
  const { data } = await crearClienteAdmin()
    .from('resenas')
    .select('id, autor, estrellas, texto, oculta, created_at, local:locales(nombre)')
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as unknown as { id: string; autor: string; estrellas: number; texto: string; oculta: boolean; created_at: string; local: { nombre: string } | null }[]
}

export async function moderarResena(id: string, oculta: boolean) {
  const { error } = await crearClienteAdmin().from('resenas').update({ oculta }).eq('id', id)
  if (error) throw error
}

export async function premiosParaGestion() {
  const { data } = await crearClienteAdmin().from('premios').select('*, local:locales(nombre)').order('costo')
  return (data ?? []) as { id: string; titulo: string; local_id: string; costo: number; activo: boolean; local: { nombre: string } | null }[]
}

export async function guardarPremio(datos: { id: string; titulo: string; local_id: string; costo: number }) {
  const { error } = await crearClienteAdmin().from('premios').upsert({ ...datos, activo: true })
  if (error) throw error
}

export async function alternarPremio(id: string, activo: boolean) {
  await crearClienteAdmin().from('premios').update({ activo }).eq('id', id)
}
