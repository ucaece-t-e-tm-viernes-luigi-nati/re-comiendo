import 'server-only'
import { q } from '../db'
import type { Aprendizaje, Categoria, Momento, Perfil } from '../tipos'
import { listarLocales, obtenerSeñales, patrocinadosActivos } from './locales'
import {
  aprender,
  mezclarPatrocinados,
  momentoActual,
  puntuar,
  recomendar,
  registrarPrincipal,
  type Recomendacion,
} from './recomendador'
import { registrarEvento } from './eventos'

const PERFIL_INVITADO: Pick<Perfil, 'categorias' | 'precio' | 'modo' | 'aprendizaje'> = {
  categorias: [],
  precio: 2,
  modo: 'descubrir',
  aprendizaje: { pesos: {}, historial: [], descartados: [] },
}

export interface OpcionesRecomendacion {
  momento?: Momento | null
  filtros?: string[]
  ubicacion?: { lat: number; lng: number } | null
  conPatrocinados?: boolean
}

/** Recomendaciones para un usuario (o un invitado), ordenadas por puntaje. */
export async function recomendacionesPara(perfil: Perfil | null, opciones: OpcionesRecomendacion = {}): Promise<Recomendacion[]> {
  const base = perfil ?? PERFIL_INVITADO
  const [locales, señales, patrocinios, propias] = await Promise.all([
    listarLocales(),
    obtenerSeñales(),
    opciones.conPatrocinados === false || perfil?.es_premium ? Promise.resolve([]) : patrocinadosActivos(),
    perfil ? interaccionesDe(perfil.id) : Promise.resolve({ visitados: [], favoritos: [] }),
  ])
  const ctx = {
    categorias: base.categorias,
    precio: base.precio,
    modo: base.modo,
    aprendizaje: base.aprendizaje,
    momento: opciones.momento === undefined ? momentoActual() : opciones.momento,
    filtros: opciones.filtros,
    ubicacion: opciones.ubicacion,
    visitados: propias.visitados,
    favoritos: propias.favoritos,
    señales,
  }
  const lista = recomendar(locales, ctx)
  const anuncios: Recomendacion[] = patrocinios
    .map((p) => {
      const local = locales.find((l) => l.id === p.local_id)
      if (!local) return null
      const { puntaje, motivo, distanciaKm } = puntuar(local, ctx)
      return { local, puntaje, motivo, distanciaKm, match: 0, patrocinado: p.beneficio }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
  return mezclarPatrocinados(lista, anuncios)
}

async function interaccionesDe(userId: string) {
  const [r, f] = await Promise.all([
    q<{ local_id: string }>(`SELECT DISTINCT local_id FROM resenas WHERE user_id = $1`, [userId]),
    q<{ local_id: string }>(`SELECT local_id FROM favoritos WHERE user_id = $1`, [userId]),
  ])
  return { visitados: r.map((x) => x.local_id), favoritos: f.map((x) => x.local_id) }
}

async function guardarAprendizaje(userId: string, aprendizaje: Aprendizaje) {
  await q(`UPDATE perfiles SET aprendizaje = $2::jsonb WHERE user_id = $1`, [userId, JSON.stringify(aprendizaje)])
}

/**
 * Feedback sobre la recomendación principal: "Me copa" (+1) u "Otra opción" (-1).
 * Actualiza lo que el algoritmo aprende del usuario.
 */
export async function darFeedback(perfil: Perfil, localId: string, categoria: Categoria, delta: 1 | -1) {
  let ap: Aprendizaje = aprender(perfil.aprendizaje, categoria, delta)
  ap = registrarPrincipal(ap, localId)
  await guardarAprendizaje(perfil.id, ap)
  await registrarEvento('recomendacion', { userId: perfil.id, localId, meta: { feedback: delta } })
}

export async function descartar(perfil: Perfil, localId: string) {
  const ap = perfil.aprendizaje
  await guardarAprendizaje(perfil.id, { ...ap, descartados: [...new Set([...ap.descartados, localId])] })
}

export async function reiniciarDescartados(perfil: Perfil) {
  await guardarAprendizaje(perfil.id, { ...perfil.aprendizaje, descartados: [], historial: [] })
}
