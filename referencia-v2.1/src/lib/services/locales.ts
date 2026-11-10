import 'server-only'
import { crearClienteServidor } from '../db/server'
import { crearClienteAdmin } from '../db/admin'
import type { Categoria, Local, Patrocinio, Precio, Publicacion, Resena } from '../tipos'
import type { Señales } from './recomendador'

export interface FiltrosBusqueda {
  texto?: string
  categoria?: Categoria
  precio?: Precio
  tags?: string[]
  barrio?: string
}

/** Locales activos, con filtros opcionales. */
export async function listarLocales(filtros: FiltrosBusqueda = {}): Promise<Local[]> {
  const supabase = await crearClienteServidor()
  let q = supabase.from('locales').select('*').eq('estado', 'activo').order('nombre')
  if (filtros.categoria) q = q.eq('categoria', filtros.categoria)
  if (filtros.precio) q = q.eq('precio', filtros.precio)
  if (filtros.barrio) q = q.eq('barrio', filtros.barrio)
  if (filtros.tags?.length) q = q.contains('tags', filtros.tags)
  if (filtros.texto) {
    const t = filtros.texto.replace(/[%,()]/g, ' ').trim()
    q = q.or(`nombre.ilike.%${t}%,descripcion.ilike.%${t}%,barrio.ilike.%${t}%`)
  }
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Local[]
}

export async function obtenerLocal(id: string): Promise<Local | null> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('locales').select('*').eq('id', id).maybeSingle()
  return (data as Local) ?? null
}

/** Rating, cantidad de reseñas y popularidad de todos los locales (para el algoritmo y las tarjetas). */
export async function obtenerSeñales(): Promise<Record<string, Señales>> {
  const { data, error } = await crearClienteAdmin().rpc('senales_locales')
  if (error) throw error
  return Object.fromEntries(
    (data as { local_id: string; rating: number; cantidad_resenas: number; popularidad: number }[]).map((s) => [
      s.local_id,
      { rating: Number(s.rating), cantidadResenas: Number(s.cantidad_resenas), popularidad: Number(s.popularidad) },
    ]),
  )
}

export async function patrocinadosActivos(): Promise<Patrocinio[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('patrocinios').select('*')
  return (data ?? []) as Patrocinio[]
}

export async function resenasDeLocal(localId: string): Promise<Resena[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('resenas')
    .select('*')
    .eq('local_id', localId)
    .eq('oculta', false)
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []) as Resena[]
}

export async function publicacionesDeLocal(localId: string): Promise<Publicacion[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('publicaciones')
    .select('*')
    .eq('local_id', localId)
    .order('created_at', { ascending: false })
    .limit(12)
  return (data ?? []) as Publicacion[]
}

export async function barrios(): Promise<string[]> {
  const locales = await listarLocales()
  return [...new Set(locales.map((l) => l.barrio).filter(Boolean))].sort()
}

/** Turnos de media hora para reservar. Los ocupados se calculan con las reservas reales del día. */
export async function turnosDisponibles(localId: string, ahora = new Date()) {
  const fecha = fechaLocal(ahora)
  const { data } = await crearClienteAdmin()
    .from('reservas')
    .select('hora, personas')
    .eq('local_id', localId)
    .eq('fecha', fecha)
    .neq('estado', 'cancelada')
  const ocupados = new Map<string, number>()
  for (const r of data ?? []) ocupados.set(r.hora, (ocupados.get(r.hora) ?? 0) + r.personas)

  const base = new Date(ahora)
  base.setSeconds(0, 0)
  base.setMinutes(base.getMinutes() < 30 ? 30 : 60)
  const CAPACIDAD = 20
  return Array.from({ length: 6 }, (_, i) => {
    const t = new Date(base.getTime() + i * 30 * 60000)
    const hora = t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })
    const usados = ocupados.get(hora) ?? 0
    const estado = usados >= CAPACIDAD ? 'lleno' : usados >= CAPACIDAD * 0.7 ? 'pocos' : 'libre'
    return { hora, estado: estado as 'libre' | 'pocos' | 'lleno' }
  })
}

export function fechaLocal(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}
