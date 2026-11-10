import 'server-only'
import { crearClienteServidor } from '../db/server'
import { crearClienteAdmin } from '../db/admin'
import type { Categoria, Local, Perfil, Precio, Publicacion, Resena, Reserva } from '../tipos'

/** El local del usuario negocio (o null si todavía no registró uno). */
export async function miLocal(perfil: Perfil): Promise<Local | null> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('locales').select('*').eq('owner_id', perfil.id).order('created_at').limit(1).maybeSingle()
  return (data as Local) ?? null
}

function slug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Alta de negocio: crea el local en estado "pendiente", guarda el contacto y pasa la cuenta a rol negocio.
 * El superadmin lo aprueba desde su panel.
 */
export async function registrarNegocio(
  usuario: { id: string; rol: Perfil['rol'] },
  datos: {
    nombre: string
    categoria: Categoria
    barrio: string
    direccion: string
    precio: Precio
    descripcion: string
    instagram: string
    responsable: string
    telefono: string
  },
) {
  if (usuario.rol === 'superadmin') return { error: 'El superadmin no puede registrar locales' }
  const admin = crearClienteAdmin()
  const { data: previo } = await admin.from('locales').select('id').eq('owner_id', usuario.id).limit(1).maybeSingle()
  if (previo) return { error: 'Ya tenés un local registrado' }
  const { responsable, telefono, ...local } = datos
  let id = slug(local.nombre) || 'local'
  const { data: existe } = await admin.from('locales').select('id').eq('id', id).maybeSingle()
  if (existe) id = `${id}-${Math.random().toString(36).slice(2, 6)}`
  const { error } = await admin.from('locales').insert({
    id,
    owner_id: usuario.id,
    ...local,
    momentos: local.categoria === 'cafe' ? ['desayuno', 'merienda'] : ['almuerzo', 'cena'],
    estado: 'pendiente',
  })
  if (error) return { error: 'No pudimos registrar el local' }
  await admin.from('contactos_negocio').insert({ local_id: id, responsable, telefono })
  await admin.from('profiles').update({ rol: 'negocio' }).eq('id', usuario.id)
  return { id }
}

export async function actualizarFicha(
  localId: string,
  datos: Partial<Pick<Local, 'nombre' | 'barrio' | 'direccion' | 'lat' | 'lng' | 'precio' | 'momentos' | 'tags' | 'platos' | 'descripcion' | 'instagram' | 'horarios' | 'fotos'>>,
) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('locales').update(datos).eq('id', localId)
  if (error) throw error
}

// ───────── Publicaciones ─────────
export async function publicacionesDe(localId: string): Promise<Publicacion[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('publicaciones').select('*').eq('local_id', localId).order('created_at', { ascending: false })
  return (data ?? []) as Publicacion[]
}

export async function crearPublicacion(localId: string, datos: { tipo: 'post' | 'promo'; texto: string; foto: string | null; vence: string | null }) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('publicaciones').insert({ local_id: localId, ...datos })
  if (error) throw error
}

export async function borrarPublicacion(id: string) {
  const supabase = await crearClienteServidor()
  await supabase.from('publicaciones').delete().eq('id', id)
}

// ───────── Reservas ─────────
export async function reservasDe(localId: string): Promise<(Reserva & { cliente: string })[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('reservas')
    .select('*')
    .eq('local_id', localId)
    .order('fecha', { ascending: false })
    .order('hora')
    .limit(100)
  const reservas = (data ?? []) as Reserva[]
  // El nombre del cliente lo resuelve el back end (el negocio no puede leer perfiles ajenos)
  const ids = [...new Set(reservas.map((r) => r.user_id))]
  const { data: perfiles } = ids.length
    ? await crearClienteAdmin().from('profiles').select('id, nombre').in('id', ids)
    : { data: [] }
  const nombres = new Map((perfiles ?? []).map((p) => [p.id, p.nombre as string]))
  return reservas.map((r) => ({ ...r, cliente: nombres.get(r.user_id) ?? 'Cliente' }))
}

export async function cambiarEstadoReserva(id: string, estado: Reserva['estado']) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('reservas').update({ estado }).eq('id', id)
  if (error) throw error
}

/** Valida un código de reserva (RES-…) o de cupón (RC-…) presentado en el local. */
export async function validarCodigo(localId: string, codigo: string) {
  const admin = crearClienteAdmin()
  const c = codigo.trim().toUpperCase()
  const { data: reserva } = await admin.from('reservas').select('*').eq('codigo', c).eq('local_id', localId).maybeSingle()
  if (reserva) {
    if (reserva.estado === 'cancelada') return { ok: false, mensaje: 'Esa reserva está cancelada' }
    if (reserva.estado === 'usada') return { ok: false, mensaje: 'Esa reserva ya se usó' }
    await admin.from('reservas').update({ estado: 'usada' }).eq('id', reserva.id)
    return { ok: true, mensaje: `Reserva válida: ${reserva.personas} personas a las ${reserva.hora}` }
  }
  const { data: canje } = await admin.from('canjes').select('*, premio:premios(titulo, local_id)').eq('codigo', c).maybeSingle()
  if (canje && canje.premio?.local_id === localId) {
    if (canje.usado) return { ok: false, mensaje: 'Ese cupón ya se usó' }
    await admin.from('canjes').update({ usado: true }).eq('id', canje.id)
    return { ok: true, mensaje: `Cupón válido: ${canje.premio.titulo}` }
  }
  return { ok: false, mensaje: 'No encontramos ese código para tu local' }
}

// ───────── Reseñas ─────────
export async function resenasPara(localId: string): Promise<Resena[]> {
  const supabase = await crearClienteServidor()
  const { data } = await supabase.from('resenas').select('*').eq('local_id', localId).order('created_at', { ascending: false })
  return (data ?? []) as Resena[]
}

export async function responderResena(id: string, respuesta: string) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('resenas').update({ respuesta }).eq('id', id)
  if (error) throw error
}

// ───────── Patrocinio (pago simulado) ─────────
export const PLANES_PATROCINIO = [
  { dias: 7, monto: 8 },
  { dias: 30, monto: 20 },
] as const

export async function patrociniosDe(localId: string) {
  const { data } = await crearClienteAdmin().from('patrocinios').select('*').eq('local_id', localId).order('created_at', { ascending: false })
  return data ?? []
}

export async function contratarPatrocinio(localId: string, beneficio: string, dias: number) {
  const plan = PLANES_PATROCINIO.find((p) => p.dias === dias)
  if (!plan) return { error: 'Plan inválido' }
  const fin = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10)
  const { error } = await crearClienteAdmin()
    .from('patrocinios')
    .insert({ local_id: localId, beneficio, monto_usd: plan.monto, fin })
  return error ? { error: 'No pudimos contratar el espacio' } : { ok: true }
}
