import 'server-only'
import { crearClienteServidor } from '../db/server'
import { crearClienteAdmin } from '../db/admin'
import type { Canje, Categoria, Local, Modo, Perfil, Precio, Premio, Publicacion, Resena, Reserva } from '../tipos'
import { PUNTOS, PREMIUM_USD } from '../tipos'
import { registrarEvento } from './eventos'
import { fechaLocal } from './locales'

export function generarCodigo(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

// ───────── Gustos ─────────
export async function guardarGustos(
  perfil: Perfil,
  datos: { nombre: string; categorias: Categoria[]; precio: Precio; modo: Modo },
) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase
    .from('profiles')
    .update({ ...datos, onboarding_ok: true })
    .eq('id', perfil.id)
  if (error) throw error
}

// ───────── Reseñas (suman puntos) ─────────
export async function publicarResena(
  perfil: Perfil,
  datos: { localId: string; estrellas: number; etiquetas: string[]; texto: string; foto?: string | null },
) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('resenas').insert({
    local_id: datos.localId,
    user_id: perfil.id,
    autor: perfil.nombre,
    estrellas: datos.estrellas,
    etiquetas: datos.etiquetas,
    texto: datos.texto,
    foto: datos.foto ?? null,
  })
  if (error) throw error
  const ganados = PUNTOS.resena + (datos.foto ? PUNTOS.foto : 0)
  await crearClienteAdmin().rpc('mover_puntos', { usuario: perfil.id, cantidad: ganados })
  await registrarEvento('resena', { userId: perfil.id, localId: datos.localId, meta: { estrellas: datos.estrellas } })
  return ganados
}

export async function misResenas(userId: string): Promise<(Resena & { local: Pick<Local, 'nombre'> | null })[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('resenas')
    .select('*, local:locales(nombre)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as never
}

// ───────── Puntos y cupones ─────────
export async function listarPremios(): Promise<(Premio & { local: Pick<Local, 'nombre'> | null })[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('premios').select('*, local:locales(nombre)').order('costo')
  return (data ?? []) as never
}

export async function canjearPremio(perfil: Perfil, premioId: string) {
  const admin = crearClienteAdmin()
  const { data: premio } = await admin.from('premios').select('*').eq('id', premioId).eq('activo', true).single()
  if (!premio) return { error: 'Ese premio ya no está disponible' }
  const { error } = await admin.rpc('mover_puntos', { usuario: perfil.id, cantidad: -premio.costo })
  if (error) return { error: 'No te alcanzan los puntos' }
  const codigo = generarCodigo('RC')
  await admin.from('canjes').insert({ premio_id: premioId, user_id: perfil.id, codigo })
  await registrarEvento('canje', { userId: perfil.id, localId: premio.local_id, meta: { premio: premioId } })
  return { codigo }
}

export async function misCanjes(userId: string): Promise<(Canje & { premio: (Premio & { local: { nombre: string } | null }) | null })[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('canjes')
    .select('*, premio:premios(*, local:locales(nombre))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as never
}

// ───────── Premium (pago simulado) ─────────
/** Activa Premium. proveedor queda en 'simulado'; acá se conectaría Mercado Pago. */
export async function activarPremium(perfil: Perfil) {
  if (perfil.es_premium) return
  const admin = crearClienteAdmin()
  await admin.from('profiles').update({ es_premium: true, premium_desde: new Date().toISOString() }).eq('id', perfil.id)
  await admin.from('suscripciones').insert({ user_id: perfil.id, monto_usd: PREMIUM_USD, estado: 'activa' })
  await registrarEvento('compra_premium', { userId: perfil.id, meta: { monto_usd: PREMIUM_USD } })
}

export async function cancelarPremium(perfil: Perfil) {
  const admin = crearClienteAdmin()
  await admin.from('profiles').update({ es_premium: false }).eq('id', perfil.id)
  await admin
    .from('suscripciones')
    .update({ estado: 'cancelada', fin: new Date().toISOString() })
    .eq('user_id', perfil.id)
    .eq('estado', 'activa')
}

// ───────── Reservas (Premium) ─────────
export async function reservar(perfil: Perfil, datos: { localId: string; hora: string; personas: number }) {
  if (!perfil.es_premium) return { error: 'Las reservas son para usuarios Premium' }
  const codigo = generarCodigo('RES')
  const { error } = await crearClienteAdmin().from('reservas').insert({
    local_id: datos.localId,
    user_id: perfil.id,
    fecha: fechaLocal(),
    hora: datos.hora,
    personas: datos.personas,
    codigo,
  })
  if (error) return { error: 'No pudimos reservar, probá otro horario' }
  await registrarEvento('reserva', { userId: perfil.id, localId: datos.localId, meta: { personas: datos.personas } })
  return { codigo }
}

export async function misReservas(userId: string): Promise<(Reserva & { local: Pick<Local, 'nombre'> | null })[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('reservas')
    .select('*, local:locales(nombre)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as never
}

export async function cancelarReserva(userId: string, reservaId: string) {
  const supabase = await crearClienteServidor()
  await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaId).eq('user_id', userId)
}

// ───────── Social: seguir, favoritos y feed ─────────
export async function alternarSeguir(perfil: Perfil, localId: string) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('seguidores').select('local_id').eq('user_id', perfil.id).eq('local_id', localId).maybeSingle()
  if (data) {
    await supabase.from('seguidores').delete().eq('user_id', perfil.id).eq('local_id', localId)
    return false
  }
  await supabase.from('seguidores').insert({ user_id: perfil.id, local_id: localId })
  await registrarEvento('seguir', { userId: perfil.id, localId })
  return true
}

export async function alternarFavorito(perfil: Perfil, localId: string) {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('favoritos').select('local_id').eq('user_id', perfil.id).eq('local_id', localId).maybeSingle()
  if (data) {
    await supabase.from('favoritos').delete().eq('user_id', perfil.id).eq('local_id', localId)
    return false
  }
  await supabase.from('favoritos').insert({ user_id: perfil.id, local_id: localId })
  return true
}

export async function relacionCon(userId: string, localId: string) {
  const supabase = await crearClienteServidor()
  const [s, f] = await Promise.all([
    supabase.from('seguidores').select('local_id').eq('user_id', userId).eq('local_id', localId).maybeSingle(),
    supabase.from('favoritos').select('local_id').eq('user_id', userId).eq('local_id', localId).maybeSingle(),
  ])
  return { sigue: !!s.data, favorito: !!f.data }
}

export async function misFavoritos(userId: string): Promise<Local[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('favoritos').select('local:locales(*)').eq('user_id', userId)
  return (data ?? []).map((x) => x.local as unknown as Local).filter(Boolean)
}

export async function localesQueSigo(userId: string): Promise<string[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('seguidores').select('local_id').eq('user_id', userId)
  return (data ?? []).map((x) => x.local_id as string)
}

export type ItemFeed =
  | { tipo: 'publicacion'; fecha: string; publicacion: Publicacion; local: Local }
  | { tipo: 'resena'; fecha: string; resena: Resena; local: Local }

/**
 * Feed estilo Instagram: posts y promos de los locales que sigue + reseñas con foto de la
 * comunidad. Si no sigue a nadie, muestra lo más reciente de todos.
 */
export async function feed(userId: string | null): Promise<{ items: ItemFeed[]; sigueAlguno: boolean }> {
  const supabase = await crearClienteServidor()
  const sigo = userId ? await localesQueSigo(userId) : []
  let pubs = supabase.from('publicaciones').select('*, local:locales(*)').order('created_at', { ascending: false }).limit(30)
  if (sigo.length) pubs = pubs.in('local_id', sigo)
  const [p, r] = await Promise.all([
    pubs,
    supabase
      .from('resenas')
      .select('*, local:locales(*)')
      .eq('oculta', false)
      .not('foto', 'is', null)
      .order('created_at', { ascending: false })
      .limit(15),
  ])
  const items: ItemFeed[] = [
    ...(p.data ?? []).filter((x) => x.local).map((x) => ({ tipo: 'publicacion' as const, fecha: x.created_at, publicacion: x as Publicacion, local: x.local as Local })),
    ...(r.data ?? []).filter((x) => x.local).map((x) => ({ tipo: 'resena' as const, fecha: x.created_at, resena: x as Resena, local: x.local as Local })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))
  return { items, sigueAlguno: sigo.length > 0 }
}
